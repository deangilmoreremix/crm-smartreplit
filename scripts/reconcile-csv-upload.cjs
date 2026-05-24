const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://bzxohkrxcwodllketcpz.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6eG9oa3J4Y3dvZGxsa2V0Y3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzg2NjM4NSwiZXhwIjoyMDg5NDQyMzg1fQ.S5HmTONnamT169WYF0riSphXij-Mwtk7D3pphfSrCFE';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const csvPath = '/Users/shasheemoore/Downloads/CRM REPLIT/crm-smartreplit/attached_assets/Users_Not_in_New_SmartCRM_1764606814141.csv';

function shouldBeSmartmarketer(campaign) {
  if (!campaign) return false;
  const c = campaign.toLowerCase();
  return c.includes('smart marketer') || c.includes('smartmarketer');
}

async function reconcile() {
  console.log('Reading CSV...');
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.trim().split('\n');
  
  // Skip header
  const dataLines = lines.slice(1);
  
  let processed = 0;
  let updated = 0;
  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const line of dataLines) {
    if (!line.trim()) continue;
    
    // Simple CSV split (handles the extra commas)
    const cols = line.split(',');
    const firstName = cols[0]?.trim();
    const lastName = cols[1]?.trim();
    const email = cols[2]?.trim().toLowerCase();
    const campaign = cols[3]?.trim();

    if (!email || !email.includes('@')) {
      skipped++;
      continue;
    }

    if (!shouldBeSmartmarketer(campaign)) {
      // These were set to regular or other during import — user may want them as regular
      skipped++;
      continue;
    }

    processed++;

    const source = `CSV Upload - ${campaign || 'Smart Marketer'}`;
    const notes = `Reconciled from Users_Not_in_New_SmartCRM CSV - ${campaign || ''} - proper access granted`;

    const { data: existing, error: fetchErr } = await supabase
      .from('user_entitlements')
      .select('id, package')
      .eq('email', email)
      .single();

    if (fetchErr && fetchErr.code !== 'PGRST116') {
      console.error(`Error fetching ${email}:`, fetchErr.message);
      errors++;
      continue;
    }

    const payload = {
      email,
      package: 'smartmarketer',
      openclaw_enabled: false,
      admin_enabled: false,
      source,
      notes,
      updated_at: new Date().toISOString()
    };

    if (existing) {
      if (existing.package !== 'smartmarketer' && existing.package !== 'whitelabel' && existing.package !== 'super_admin') {
        const { error: upErr } = await supabase
          .from('user_entitlements')
          .update(payload)
          .eq('email', email);
        
        if (upErr) {
          console.error(`Update failed for ${email}:`, upErr.message);
          errors++;
        } else {
          updated++;
          console.log(`Updated: ${email} (${existing.package} → smartmarketer) [${campaign}]`);
        }
      } else {
        skipped++;
      }
    } else {
      // Need user_id — try to find in auth
      const { data: users } = await supabase.auth.admin.listUsers();
      const user = (users?.users || []).find(u => u.email?.toLowerCase() === email);
      
      if (user) payload.user_id = user.id;

      const { error: insErr } = await supabase
        .from('user_entitlements')
        .insert(payload);

      if (insErr) {
        console.error(`Insert failed for ${email}:`, insErr.message);
        errors++;
      } else {
        created++;
        console.log(`Created: ${email} → smartmarketer [${campaign}]`);
      }
    }
  }

  console.log('\n=== RECONCILIATION COMPLETE ===');
  console.log(`Processed (Smart Marketer campaigns): ${processed}`);
  console.log(`Updated: ${updated}`);
  console.log(`Created new: ${created}`);
  console.log(`Skipped (already correct or non-paying): ${skipped}`);
  console.log(`Errors: ${errors}`);
}

reconcile().catch(console.error);

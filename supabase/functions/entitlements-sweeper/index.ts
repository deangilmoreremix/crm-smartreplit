import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req: Request) => {
  try {
    const now = new Date().toISOString();

    console.log(`Running entitlements sweeper at ${now}`);

    // Any entitlement whose revoke_at has passed but still says active/past_due -> flip to inactive
    const { data, error } = await supabase
      .from('entitlements')
      .select('user_id, status, revoke_at')
      .not('revoke_at', 'is', null)
      .lte('revoke_at', now);

    if (error) {
      console.error('Error fetching entitlements:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let updatedCount = 0;

    if (data && data.length > 0) {
      console.log(`Found ${data.length} entitlements to check`);

      for (const row of data) {
        if (row.status !== 'inactive') {
          const { error: updateError } = await supabase
            .from('entitlements')
            .update({ 
              status: 'inactive', 
              updated_at: now 
            })
            .eq('user_id', row.user_id);

          if (updateError) {
            console.error(`Failed to update entitlement for user ${row.user_id}:`, updateError);
          } else {
            console.log(`Revoked access for user ${row.user_id} (revoke_at: ${row.revoke_at})`);
            updatedCount++;
          }
        }
      }
    }

    const result = {
      timestamp: now,
      checked: data?.length || 0,
      updated: updatedCount,
      message: `Entitlements sweeper completed successfully`
    };

    console.log('Sweeper result:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Entitlements sweeper error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
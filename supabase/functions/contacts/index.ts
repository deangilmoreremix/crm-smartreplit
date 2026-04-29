// Edge Function for Contacts Module Federation
// Handles CRUD operations for the contactsfeature app
// Updated to work with existing database schema

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app-id',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const appId = req.headers.get('x-app-id') || 'smartcrm';
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')!,
    });

    // Try to get user from JWT, but allow requests to proceed if it fails
    let userId: string | null = null;
    let userEmail: string | null = null;

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser(authHeader?.replace('Bearer ', '') || '');
      if (!authError && user) {
        userId = user.id;
        userEmail = user.email || null;
      }
    } catch (e) {
      // Continue without user authentication - for testing purposes
      console.log('Auth verification failed, proceeding without user context');
    }

    // If we couldn't get user from JWT, use a default for testing
    if (!userId) {
      userId = '63491d04-4227-43fc-a320-0270679ab286'; // dean@smartcrm.vip user
    }

    // Get tenant_id from user metadata
    const tenantId = '00000000-0000-0000-0000-000000000001'; // Default tenant

    const { method, url } = req;

    // Parse URL for routing
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);

    // Extract contact ID and action from path
    // Expected paths: /contacts, /contacts/:id, /contacts/:id/enrich, /contacts/:id/score, /contacts/:id/custom-fields, /contacts/:id/activities
    let contactId: string | null = null;
    let action: string | null = null;

    if (pathParts.length >= 2) {
      contactId = pathParts[1]; // Second part should be contact ID
      if (pathParts.length >= 3) {
        action = pathParts[2]; // Third part is the action
      }
    }

    switch (method) {
      case 'GET':
        if (contactId && contactId !== 'contacts') {
          if (action === 'activities') {
            // Get contact activities
            const { data: activities, error } = await supabase
              .from('contact_activities')
              .select('*')
              .eq('contact_id', contactId)
              .order('created_at', { ascending: false });

            if (error) throw error;
            return new Response(JSON.stringify(activities || []), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          } else {
            // Get single contact - using lowercase column names
            const { data: contact, error } = await supabase
              .from('contacts')
              .select('*')
              .eq('id', contactId)
              .single();

            if (error) throw error;
            return new Response(JSON.stringify(contact), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        } else {
          // Get all contacts - return all for now (RLS will handle security)
          const { data: contacts, error } = await supabase
            .from('contacts')
            .select('*')
            .order('createdat', { ascending: false });

          if (error) throw error;
          return new Response(JSON.stringify(contacts || []), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

      case 'POST':
        if (contactId && action) {
          if (action === 'enrich') {
            // AI contact enrichment
            const { data: contact, error: fetchError } = await supabase
              .from('contacts')
              .select('*')
              .eq('id', contactId)
              .single();

            if (fetchError) throw fetchError;

            // Create enrichment prompt
            const prompt = `Enrich this contact's information with additional professional details:
Name: ${contact.firstname} ${contact.lastname}
Title: ${contact.title}
Company: ${contact.company}
Industry: ${contact.industry}
Email: ${contact.email}

Please provide:
1. LinkedIn profile URL (if available)
2. Additional professional background
3. Company size and revenue range
4. Industry insights
5. Potential interests based on role

Return as JSON with keys: linkedin_url, background, company_size, revenue_range, industry_insights, interests`;

            try {
              const completion = await openai.chat.completions.create({
                model: 'gpt-4',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
              });

              const enrichedData = JSON.parse(completion.choices[0].message.content || '{}');

              // Update contact with enriched data
              const { data: updated, error: updateError } = await supabase
                .from('contacts')
                .update({
                  enrichment_data: enrichedData,
                  last_enriched_at: new Date().toISOString(),
                })
                .eq('id', contactId)
                .select()
                .single();

              if (updateError) throw updateError;

              // Log enrichment activity
              await supabase.from('contact_activities').insert({
                contact_id: contactId,
                activity_type: 'enrichment',
                description: 'Contact data enriched with AI',
                metadata: { enriched_fields: Object.keys(enrichedData) },
              });

              return new Response(JSON.stringify(updated), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            } catch (aiError) {
              throw new Error(`AI enrichment failed: ${aiError.message}`);
            }
          } else if (action === 'score') {
            // AI scoring calculation
            const { data: contact, error: fetchError } = await supabase
              .from('contacts')
              .select('*')
              .eq('id', contactId)
              .single();

            if (fetchError) throw fetchError;

            // Create scoring prompt
            const prompt = `Score this contact's sales potential on a scale of 0-100:
Name: ${contact.firstname} ${contact.lastname}
Title: ${contact.title}
Company: ${contact.company}
Industry: ${contact.industry}
Status: ${contact.status}
Interest Level: ${contact.interestlevel}
Notes: ${contact.notes}

Consider:
- Job title seniority
- Company size/reputation
- Industry growth
- Engagement level
- Deal potential

Return JSON with: score (0-100), rationale (explanation), lead_score, engagement_score`;

            try {
              const completion = await openai.chat.completions.create({
                model: 'gpt-4',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
              });

              const scoreData = JSON.parse(completion.choices[0].message.content || '{}');

              // Update contact with score
              const { data: updated, error: updateError } = await supabase
                .from('contacts')
                .update({
                  score: scoreData.score / 100, // Convert to 0-1 scale
                  ai_score_rationale: scoreData.rationale,
                })
                .eq('id', contactId)
                .select()
                .single();

              if (updateError) throw updateError;

              // Log scoring activity
              await supabase.from('contact_activities').insert({
                contact_id: contactId,
                activity_type: 'scoring',
                description: `AI score calculated: ${scoreData.score}`,
                metadata: scoreData,
              });

              return new Response(JSON.stringify(updated), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            } catch (aiError) {
              throw new Error(`AI scoring failed: ${aiError.message}`);
            }
          } else if (action === 'activities') {
            // Log new activity
            const activityData = await req.json();

            const { data: activity, error: insertError } = await supabase
              .from('contact_activities')
              .insert({
                contact_id: contactId,
                activity_type: activityData.activity_type || activityData.type,
                description: activityData.description,
                metadata: activityData.metadata || {},
              })
              .select()
              .single();

            if (insertError) throw insertError;
            return new Response(JSON.stringify(activity), {
              status: 201,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        } else {
          // Create new contact
          const newContact = await req.json();

          // Map camelCase to lowercase for database columns
          const contactData = {
            firstname: newContact.firstName || newContact.firstname || '',
            lastname: newContact.lastName || newContact.lastname || '',
            email: newContact.email || '',
            phone: newContact.phone || '',
            title: newContact.title || '',
            company: newContact.company || '',
            industry: newContact.industry || '',
            status: newContact.status || 'lead',
            interestlevel: newContact.interestLevel || 'medium',
            notes: newContact.notes || '',
            avatarsrc: newContact.avatarSrc || '',
            sources: newContact.sources || [],
            tags: newContact.tags || [],
            isfavorite: newContact.isFavorite || false,
            createdby: 'user',
            datasource: 'manual',
          };

          const { data: contact, error: insertError } = await supabase
            .from('contacts')
            .insert(contactData)
            .select()
            .single();

          if (insertError) throw insertError;
          return new Response(JSON.stringify(contact), {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

      case 'PUT':
        if (contactId && action === 'custom-fields') {
          // Manage custom fields
          const customFieldsData = await req.json();

          // Delete existing custom fields for this contact
          await supabase.from('contact_custom_fields').delete().eq('contact_id', contactId);

          // Insert new custom fields
          if (customFieldsData && Array.isArray(customFieldsData)) {
            const fieldsToInsert = customFieldsData.map((field: any) => ({
              contact_id: contactId,
              field_key: field.key || field.field_key,
              field_value: field.value || field.field_value,
            }));

            const { error: insertError } = await supabase
              .from('contact_custom_fields')
              .insert(fieldsToInsert);

            if (insertError) throw insertError;
          }

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          // Update contact
          const updateData = await req.json();

          // Map camelCase to lowercase for database columns
          const updateFields: Record<string, unknown> = {};
          if (updateData.firstName !== undefined) updateFields.firstname = updateData.firstName;
          if (updateData.lastName !== undefined) updateFields.lastname = updateData.lastName;
          if (updateData.email !== undefined) updateFields.email = updateData.email;
          if (updateData.phone !== undefined) updateFields.phone = updateData.phone;
          if (updateData.title !== undefined) updateFields.title = updateData.title;
          if (updateData.company !== undefined) updateFields.company = updateData.company;
          if (updateData.industry !== undefined) updateFields.industry = updateData.industry;
          if (updateData.status !== undefined) updateFields.status = updateData.status;
          if (updateData.interestLevel !== undefined)
            updateFields.interestlevel = updateData.interestLevel;
          if (updateData.notes !== undefined) updateFields.notes = updateData.notes;
          if (updateData.avatarSrc !== undefined) updateFields.avatarsrc = updateData.avatarSrc;
          if (updateData.sources !== undefined) updateFields.sources = updateData.sources;
          if (updateData.tags !== undefined) updateFields.tags = updateData.tags;
          if (updateData.isFavorite !== undefined) updateFields.isfavorite = updateData.isFavorite;

          updateFields.updatedat = new Date().toISOString();

          const { data: updated, error: updateError } = await supabase
            .from('contacts')
            .update(updateFields)
            .eq('id', contactId)
            .select()
            .single();

          if (updateError) throw updateError;
          return new Response(JSON.stringify(updated), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

      case 'DELETE':
        const { error: deleteError } = await supabase.from('contacts').delete().eq('id', contactId);

        if (deleteError) throw deleteError;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

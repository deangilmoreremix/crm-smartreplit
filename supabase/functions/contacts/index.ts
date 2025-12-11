import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { method } = req
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(part => part !== '')
    const contactId = pathParts[pathParts.length - 1]

    switch (method) {
      case 'GET':
        // Get single contact or list contacts
        if (contactId && contactId !== 'contacts') {
          const { data, error } = await supabaseClient
            .from('contacts')
            .select('*')
            .eq('id', contactId)
            .single()
            
          if (error) throw error
          
          return new Response(
            JSON.stringify({ contact: data }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200 
            }
          )
        } else {
          // List contacts with optional filtering
          const search = url.searchParams.get('search')
          const status = url.searchParams.get('status')
          const limit = parseInt(url.searchParams.get('limit') || '50')
          const offset = parseInt(url.searchParams.get('offset') || '0')
          
          let query = supabaseClient
            .from('contacts')
            .select('*', { count: 'exact' })
            .range(offset, offset + limit - 1)
            .order('updated_at', { ascending: false })
          
          if (search) {
            query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`)
          }
          
          if (status && status !== 'all') {
            query = query.eq('status', status)
          }
          
          const { data, error, count } = await query
          
          if (error) throw error
          
          return new Response(
            JSON.stringify({ 
              contacts: data,
              total: count,
              limit,
              offset,
              hasMore: offset + data.length < count
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200 
            }
          )
        }

      case 'POST':
        // Create new contact
        const contactData = await req.json()
        
        // Map frontend fields to database fields
        const dbContact = {
          first_name: contactData.firstName,
          last_name: contactData.lastName,
          email: contactData.email,
          phone: contactData.phone,
          company: contactData.company,
          position: contactData.title,
          status: contactData.status || 'lead',
          source: Array.isArray(contactData.sources) ? contactData.sources[0] : contactData.sources || 'Website',
          lead_score: contactData.aiScore || 0,
          engagement_score: contactData.aiScore || 0,
          tags: contactData.tags || [],
          notes: contactData.notes || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        const { data: newContact, error: createError } = await supabaseClient
          .from('contacts')
          .insert([dbContact])
          .select()
          .single()
          
        if (createError) throw createError
        
        // Map back to frontend format
        const responseContact = {
          id: newContact.id,
          firstName: newContact.first_name,
          lastName: newContact.last_name,
          name: `${newContact.first_name || ''} ${newContact.last_name || ''}`.trim(),
          email: newContact.email,
          phone: newContact.phone,
          title: newContact.position,
          company: newContact.company,
          status: newContact.status,
          sources: [newContact.source].filter(Boolean),
          aiScore: newContact.lead_score,
          tags: newContact.tags || [],
          createdAt: newContact.created_at,
          updatedAt: newContact.updated_at
        }
        
        return new Response(
          JSON.stringify({ contact: responseContact }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 201 
          }
        )

      case 'PATCH':
        // Update contact
        const updates = await req.json()
        
        // Map frontend updates to database format
        const dbUpdates = {
          ...(updates.firstName && { first_name: updates.firstName }),
          ...(updates.lastName && { last_name: updates.lastName }),
          ...(updates.email && { email: updates.email }),
          ...(updates.phone && { phone: updates.phone }),
          ...(updates.company && { company: updates.company }),
          ...(updates.title && { position: updates.title }),
          ...(updates.status && { status: updates.status }),
          ...(updates.sources && { source: Array.isArray(updates.sources) ? updates.sources[0] : updates.sources }),
          ...(updates.aiScore !== undefined && { lead_score: updates.aiScore, engagement_score: updates.aiScore }),
          ...(updates.tags && { tags: updates.tags }),
          ...(updates.notes && { notes: updates.notes }),
          updated_at: new Date().toISOString()
        }
        
        const { data: updatedContact, error: updateError } = await supabaseClient
          .from('contacts')
          .update(dbUpdates)
          .eq('id', contactId)
          .select()
          .single()
          
        if (updateError) throw updateError
        
        // Map back to frontend format
        const responseUpdated = {
          id: updatedContact.id,
          firstName: updatedContact.first_name,
          lastName: updatedContact.last_name,
          name: `${updatedContact.first_name || ''} ${updatedContact.last_name || ''}`.trim(),
          email: updatedContact.email,
          phone: updatedContact.phone,
          title: updatedContact.position,
          company: updatedContact.company,
          status: updatedContact.status,
          sources: [updatedContact.source].filter(Boolean),
          aiScore: updatedContact.lead_score,
          tags: updatedContact.tags || [],
          createdAt: updatedContact.created_at,
          updatedAt: updatedContact.updated_at
        }
        
        return new Response(
          JSON.stringify({ contact: responseUpdated }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      case 'DELETE':
        // Delete contact
        const { error: deleteError } = await supabaseClient
          .from('contacts')
          .delete()
          .eq('id', contactId)
          
        if (deleteError) throw deleteError
        
        return new Response(
          JSON.stringify({ success: true }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 405 
          }
        )
    }
  } catch (error) {
    console.error('Contact function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.details || null 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.status || 500 
      }
    )
  }
})
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
    const dealId = pathParts[pathParts.length - 1]

    switch (method) {
      case 'GET':
        // Get single deal or list deals
        if (dealId && dealId !== 'deals') {
          const { data, error } = await supabaseClient
            .from('deals')
            .select('*')
            .eq('id', dealId)
            .single()
            
          if (error) throw error
          
          return new Response(
            JSON.stringify({ deal: data }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200 
            }
          )
        } else {
          // List deals with optional filtering
          const search = url.searchParams.get('search')
          const stage = url.searchParams.get('stage')
          const status = url.searchParams.get('status')
          const limit = parseInt(url.searchParams.get('limit') || '50')
          const offset = parseInt(url.searchParams.get('offset') || '0')
          
          let query = supabaseClient
            .from('deals')
            .select('*', { count: 'exact' })
            .range(offset, offset + limit - 1)
            .order('updated_at', { ascending: false })
          
          if (search) {
            query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,company.ilike.%${search}%`)
          }
          
          if (stage && stage !== 'all') {
            query = query.eq('stage', stage)
          }
          
          if (status && status !== 'all') {
            query = query.eq('status', status)
          }
          
          const { data, error, count } = await query
          
          if (error) throw error
          
          return new Response(
            JSON.stringify({ 
              deals: data,
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
        // Create new deal
        const dealData = await req.json()
        
        // Map frontend fields to database fields
        const dbDeal = {
          title: dealData.title,
          description: dealData.description || '',
          value: dealData.value || 0,
          stage: dealData.stage || 'discovery',
          status: dealData.status || 'active',
          priority: dealData.priority || 'medium',
          contact_id: dealData.contactId,
          contact_name: dealData.contactName,
          company: dealData.company,
          assignee_id: dealData.assigneeId,
          assignee_name: dealData.assigneeName,
          expected_close_date: dealData.expectedCloseDate,
          probability: dealData.probability || 0,
          ai_score: dealData.aiScore,
          tags: dealData.tags || [],
          activities: dealData.activities || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        const { data: newDeal, error: createError } = await supabaseClient
          .from('deals')
          .insert([dbDeal])
          .select()
          .single()
          
        if (createError) throw createError
        
        // Map back to frontend format
        const responseDeal = {
          id: newDeal.id,
          title: newDeal.title,
          description: newDeal.description,
          value: newDeal.value,
          stage: newDeal.stage,
          status: newDeal.status,
          priority: newDeal.priority,
          contactId: newDeal.contact_id,
          contactName: newDeal.contact_name,
          company: newDeal.company,
          assigneeId: newDeal.assignee_id,
          assigneeName: newDeal.assignee_name,
          expectedCloseDate: newDeal.expected_close_date,
          probability: newDeal.probability,
          aiScore: newDeal.ai_score,
          tags: newDeal.tags || [],
          activities: newDeal.activities || [],
          createdAt: newDeal.created_at,
          updatedAt: newDeal.updated_at
        }
        
        return new Response(
          JSON.stringify({ deal: responseDeal }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 201 
          }
        )

      case 'PATCH':
        // Update deal
        const updates = await req.json()
        
        // Map frontend updates to database format
        const dbUpdates = {
          ...(updates.title && { title: updates.title }),
          ...(updates.description !== undefined && { description: updates.description }),
          ...(updates.value !== undefined && { value: updates.value }),
          ...(updates.stage && { stage: updates.stage }),
          ...(updates.status && { status: updates.status }),
          ...(updates.priority && { priority: updates.priority }),
          ...(updates.contactId && { contact_id: updates.contactId }),
          ...(updates.contactName && { contact_name: updates.contactName }),
          ...(updates.company && { company: updates.company }),
          ...(updates.assigneeId && { assignee_id: updates.assigneeId }),
          ...(updates.assigneeName && { assignee_name: updates.assigneeName }),
          ...(updates.expectedCloseDate && { expected_close_date: updates.expectedCloseDate }),
          ...(updates.probability !== undefined && { probability: updates.probability }),
          ...(updates.aiScore !== undefined && { ai_score: updates.aiScore }),
          ...(updates.tags && { tags: updates.tags }),
          ...(updates.activities && { activities: updates.activities }),
          updated_at: new Date().toISOString()
        }
        
        const { data: updatedDeal, error: updateError } = await supabaseClient
          .from('deals')
          .update(dbUpdates)
          .eq('id', dealId)
          .select()
          .single()
          
        if (updateError) throw updateError
        
        // Map back to frontend format
        const responseUpdated = {
          id: updatedDeal.id,
          title: updatedDeal.title,
          description: updatedDeal.description,
          value: updatedDeal.value,
          stage: updatedDeal.stage,
          status: updatedDeal.status,
          priority: updatedDeal.priority,
          contactId: updatedDeal.contact_id,
          contactName: updatedDeal.contact_name,
          company: updatedDeal.company,
          assigneeId: updatedDeal.assignee_id,
          assigneeName: updatedDeal.assignee_name,
          expectedCloseDate: updatedDeal.expected_close_date,
          probability: updatedDeal.probability,
          aiScore: updatedDeal.ai_score,
          tags: updatedDeal.tags || [],
          activities: updatedDeal.activities || [],
          createdAt: updatedDeal.created_at,
          updatedAt: updatedDeal.updated_at
        }
        
        return new Response(
          JSON.stringify({ deal: responseUpdated }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      case 'DELETE':
        // Delete deal
        const { error: deleteError } = await supabaseClient
          .from('deals')
          .delete()
          .eq('id', dealId)
          
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
    console.error('Deal function error:', error)
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
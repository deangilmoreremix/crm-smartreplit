// Edge Function for Deals/Pipeline Module Federation
// Handles CRUD operations for the enhancedpipelinedeals app

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app-id',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const appId = req.headers.get('x-app-id') || 'smartcrm'
    const authHeader = req.headers.get('Authorization')
    
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const tenantId = user.user_metadata?.tenant_id || user.id
    const { method, url } = req

    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/').filter(Boolean)
    const dealId = pathParts[pathParts.length - 1]

    // Pipeline stages management
    if (url.includes('/stages')) {
      switch (method) {
        case 'GET':
          const { data: stages } = await supabase
            .from('pipeline_stages')
            .select('*')
            .eq('app_id', appId)
            .eq('tenant_id', tenantId)
            .order('position')
          return new Response(JSON.stringify(stages || []), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })

        case 'POST':
          const newStage = await req.json()
          const { data: stage } = await supabase
            .from('pipeline_stages')
            .insert({ ...newStage, app_id: appId, tenant_id: tenantId })
            .select()
            .single()
          return new Response(JSON.stringify(stage), { 
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          })
      }
    }

    // Pipeline management
    if (url.includes('/pipelines')) {
      switch (method) {
        case 'GET':
          const { data: pipelines } = await supabase
            .from('pipelines')
            .select('*')
            .eq('app_id', appId)
            .eq('tenant_id', tenantId)
          return new Response(JSON.stringify(pipelines || []), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })

        case 'POST':
          const newPipeline = await req.json()
          const { data: pipeline } = await supabase
            .from('pipelines')
            .insert({ ...newPipeline, app_id: appId, tenant_id: tenantId })
            .select()
            .single()
          return new Response(JSON.stringify(pipeline), { 
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          })
      }
    }

    // Stage transition
    if (method === 'POST' && url.includes('/stage-transition')) {
      const { deal_id, new_stage_id } = await req.json()
      
      const { data: deal } = await supabase
        .from('deals')
        .update({ stage_id: new_stage_id })
        .eq('id', deal_id)
        .eq('profile_id', user.id)
        .select()
        .single()

      return new Response(JSON.stringify(deal), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Deals CRUD
    switch (method) {
      case 'GET':
        if (dealId && dealId !== 'deals') {
          const { data: deal } = await supabase
            .from('deals')
            .select('*, pipeline_stages(*), contacts(*)')
            .eq('id', dealId)
            .eq('profile_id', user.id)
            .single()
          return new Response(JSON.stringify(deal), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        } else {
          const { data: deals } = await supabase
            .from('deals')
            .select('*, pipeline_stages(*), contacts(*)')
            .eq('profile_id', user.id)
            .order('created_at', { ascending: false })
          return new Response(JSON.stringify(deals || []), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

      case 'POST':
        const newDeal = await req.json()
        const { data: deal, error: insertError } = await supabase
          .from('deals')
          .insert({
            ...newDeal,
            profile_id: user.id,
            app_id: appId,
            tenant_id: tenantId
          })
          .select()
          .single()

        if (insertError) throw insertError
        return new Response(JSON.stringify(deal), { 
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })

      case 'PUT':
        const updateData = await req.json()
        const { data: updated, error: updateError } = await supabase
          .from('deals')
          .update(updateData)
          .eq('id', dealId)
          .eq('profile_id', user.id)
          .select()
          .single()

        if (updateError) throw updateError
        return new Response(JSON.stringify(updated), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'DELETE':
        const { error: deleteError } = await supabase
          .from('deals')
          .delete()
          .eq('id', dealId)
          .eq('profile_id', user.id)

        if (deleteError) throw deleteError
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      default:
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})

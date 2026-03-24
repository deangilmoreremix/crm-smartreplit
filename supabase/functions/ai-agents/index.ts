// Edge Function for AI Agents Module Federation
// Handles AI agent operations for the aiagentsuite2 app

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

    // Agent executions
    if (url.includes('/execute')) {
      if (method === 'POST') {
        const { agent_id, input_data } = await req.json()
        
        // Create execution record
        const { data: execution, error } = await supabase
          .from('agent_executions')
          .insert({
            agent_id,
            app_id: appId,
            tenant_id: tenantId,
            user_id: user.id,
            input_data,
            status: 'running',
            started_at: new Date().toISOString()
          })
          .select()
          .single()

        if (error) throw error

        // Get agent configuration
        const { data: configs } = await supabase
          .from('agent_configurations')
          .select('config_key, config_value')
          .eq('agent_id', agent_id)
          .eq('app_id', appId)

        // Execute agent (placeholder - integrate with your AI service)
        // In production, this would call your AI service
        const result = await executeAgent(agent_id, input_data, configs || [])

        // Update execution with result
        const { data: updated } = await supabase
          .from('agent_executions')
          .update({
            status: result.success ? 'completed' : 'failed',
            output_data: result.output,
            error_message: result.error,
            completed_at: new Date().toISOString()
          })
          .eq('id', execution.id)
          .select()
          .single()

        return new Response(JSON.stringify({ execution: updated, result }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // Agent schedules
    if (url.includes('/schedules')) {
      switch (method) {
        case 'GET':
          const { data: schedules } = await supabase
            .from('agent_schedules')
            .select('*')
            .eq('app_id', appId)
            .eq('tenant_id', tenantId)
          return new Response(JSON.stringify(schedules || []), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })

        case 'POST':
          const newSchedule = await req.json()
          const { data: schedule } = await supabase
            .from('agent_schedules')
            .insert({ ...newSchedule, app_id: appId, tenant_id: tenantId })
            .select()
            .single()
          return new Response(JSON.stringify(schedule), { 
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          })
      }
    }

    // Agent configurations
    if (url.includes('/configurations')) {
      switch (method) {
        case 'GET':
          const agentId = urlObj.searchParams.get('agent_id')
          let query = supabase
            .from('agent_configurations')
            .select('*')
            .eq('app_id', appId)
            .eq('tenant_id', tenantId)
          
          if (agentId) {
            query = query.eq('agent_id', agentId)
          }
          
          const { data: configs } = await query
          return new Response(JSON.stringify(configs || []), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })

        case 'POST':
          const newConfig = await req.json()
          const { data: config } = await supabase
            .from('agent_configurations')
            .insert({ ...newConfig, app_id: appId, tenant_id: tenantId })
            .select()
            .single()
          return new Response(JSON.stringify(config), { 
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          })
      }
    }

    // Agent executions history
    if (url.includes('/executions')) {
      switch (method) {
        case 'GET':
          const execAgentId = urlObj.searchParams.get('agent_id')
          let query = supabase
            .from('agent_executions')
            .select('*')
            .eq('app_id', appId)
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
          
          if (execAgentId) {
            query = query.eq('agent_id', execAgentId)
          }
          
          const { data: executions } = await query
          return new Response(JSON.stringify(executions || []), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
      }
    }

    // Get all agents (from existing ai_agents table)
    if (method === 'GET' && !url.includes('/execute') && !url.includes('/schedules') && !url.includes('/configurations') && !url.includes('/executions')) {
      const { data: agents } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('app_id', appId)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
      
      return new Response(JSON.stringify(agents || []), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { 
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})

// Placeholder function - replace with actual AI execution logic
async function executeAgent(agentId: string, inputData: any, configs: any[]) {
  try {
    // This is where you would integrate with your AI service
    // For now, return a mock response
    return {
      success: true,
      output: { message: 'Agent executed successfully', agentId },
      error: null
    }
  } catch (error) {
    return {
      success: false,
      output: null,
      error: error.message
    }
  }
}

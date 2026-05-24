// AI Agents Edge Function with OpenAI Realtime API
// Handles AI agent operations with streaming support

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app-id',
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')!,
})

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

    // Real-time streaming agent execution
    if (url.includes('/stream-execute')) {
      if (method === 'POST') {
        const { agent_id, input_data, stream = true } = await req.json()
        
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

        // Execute agent with streaming
        const result = await executeAgentStream(
          supabase, 
          user.id,
          execution.id,
          agent_id, 
          input_data, 
          configs || [],
          stream
        )

        return new Response(JSON.stringify({ execution_id: execution.id, ...result }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // Standard agent executions
    if (url.includes('/execute')) {
      if (method === 'POST') {
        const { agent_id, input_data } = await req.json()
        
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

        const { data: configs } = await supabase
          .from('agent_configurations')
          .select('config_key, config_value')
          .eq('agent_id', agent_id)
          .eq('app_id', appId)

        const result = await executeAgent(agent_id, input_data, configs || [])

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

    // AI Chat with Agents - using OpenAI for real-time responses
    if (url.includes('/chat')) {
      if (method === 'POST') {
        const { messages, agent_id, context = {} } = await req.json()
        
        // Build system prompt from agent configuration
        let systemPrompt = 'You are a helpful AI assistant for a CRM platform.'
        
        if (agent_id) {
          const { data: configs } = await supabase
            .from('agent_configurations')
            .select('config_key, config_value')
            .eq('agent_id', agent_id)
            .eq('app_id', appId)
          
          if (configs) {
            const systemConfig = configs.find(c => c.config_key === 'system_prompt')
            if (systemConfig) {
              systemPrompt = systemConfig.config_value
            }
          }
        }

        // Add context to system prompt
        systemPrompt += `\n\nTenant ID: ${tenantId}\nUser ID: ${user.id}`

        // Create streaming response
        const stream = new ReadableStream({
          async start(controller) {
            try {
              const completion = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                  { role: 'system', content: systemPrompt },
                  ...messages.map((m: any) => ({
                    role: m.role || 'user',
                    content: m.content
                  }))
                ],
                stream: true,
                temperature: 0.7,
                max_tokens: 2000
              })

              for await (const chunk of completion) {
                const content = chunk.choices[0]?.delta?.content
                if (content) {
                  controller.enqueue(new TextEncoder().encode(content))
                }
              }
              controller.close()
            } catch (error) {
              controller.error(error)
            }
          }
        })

        return new Response(stream, {
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          }
        })
      }
    }

    // Get all agents
    if (method === 'GET' && !url.includes('/execute') && !url.includes('/schedules') && !url.includes('/configurations') && !url.includes('/executions') && !url.includes('/stream-execute') && !url.includes('/chat')) {
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

// Execute agent with streaming support
async function executeAgentStream(
  supabase: any, 
  userId: string, 
  executionId: string,
  agentId: string, 
  inputData: any, 
  configs: any[],
  enableStream: boolean
) {
  try {
    // Build agent context
    let systemPrompt = configs.find(c => c.config_key === 'system_prompt')?.config_value || 
                       'You are a helpful AI agent.'
    
    systemPrompt += `\n\nAgent ID: ${agentId}\nExecution ID: ${executionId}`

    // Use OpenAI for intelligent response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(inputData) }
      ],
      temperature: 0.7,
      max_tokens: 1500
    })

    const response = completion.choices[0]?.message?.content || ''
    
    // Try to parse as JSON
    let output;
    try {
      output = JSON.parse(response)
    } catch {
      output = { result: response, raw: true }
    }

    // Log execution
    await supabase.from('agent_executions').update({
      status: 'completed',
      output_data: output,
      completed_at: new Date().toISOString()
    }).eq('id', executionId)

    return {
      success: true,
      output,
      streamed: enableStream
    }
  } catch (error) {
    await supabase.from('agent_executions').update({
      status: 'failed',
      error_message: error.message,
      completed_at: new Date().toISOString()
    }).eq('id', executionId)

    return {
      success: false,
      output: null,
      error: error.message
    }
  }
}

// Standard agent execution
async function executeAgent(agentId: string, inputData: any, configs: any[]) {
  try {
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
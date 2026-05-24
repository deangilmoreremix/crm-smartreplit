// Edge Function for Deals/Pipeline Module Federation with OpenAI Realtime
// Handles CRUD operations with AI-powered deal intelligence and predictions

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
    const dealId = pathParts[pathParts.length - 1]

    // AI-powered deal prediction and next best action
    if (url.includes('/ai-predict')) {
      if (method === 'POST') {
        const { deal_id, include_next_actions = true } = await req.json()
        
        // Get deal details
        const { data: deal } = await supabase
          .from('deals')
          .select('*, pipeline_stages(*), contacts(*)')
          .eq('id', deal_id)
          .single()

        if (!deal) {
          return new Response(JSON.stringify({ error: 'Deal not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Get similar closed-won deals for comparison
        const { data: similarDeals } = await supabase
          .from('deals')
          .select('*')
          .eq('stage_id', deal.stage_id)
          .eq('is_won', true)
          .limit(10)

        const predictionPrompt = `Predict this deal's outcome and suggest next actions:
          
          Deal: ${deal.name}
          Value: ${deal.value || 0}
          Stage: ${deal.pipeline_stages?.name || 'Unknown'}
          Contact: ${deal.contacts?.firstname} ${deal.contacts?.lastname}
          Company: ${deal.contacts?.company || 'Unknown'}
          Created: ${deal.created_at}
          
          Similar successful deals: ${JSON.stringify(similarDeals?.map(d => ({ name: d.name, value: d.value })) || [])}
          
          Return JSON with:
          - win_probability (0-1)
          - predicted_close_date
          - risk_factors (array)
          - next_best_actions (array of {action, reason, urgency})
          - competitive_advantages (array)
          - deal_health_score (0-100)`

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: predictionPrompt }],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        })

        const prediction = JSON.parse(completion.choices[0].message.content || '{}')

        // Log the prediction
        await supabase.from('contact_activities').insert({
          contact_id: deal.contact_id,
          activity_type: 'ai_deal_prediction',
          description: `AI predicted ${Math.round(prediction.win_probability * 100)}% win probability`,
          metadata: prediction
        })

        return new Response(JSON.stringify({
          success: true,
          deal_id: deal_id,
          prediction
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // AI-powered deal summary generation
    if (url.includes('/ai-summary')) {
      if (method === 'POST') {
        const { deal_ids } = await req.json()
        
        const { data: deals } = await supabase
          .from('deals')
          .select('*, pipeline_stages(*), contacts(*)')
          .in('id', deal_ids)

        const summaryPrompt = `Generate a comprehensive pipeline summary:
          
          Deals: ${JSON.stringify(deals?.map(d => ({
            name: d.name,
            value: d.value,
            stage: d.pipeline_stages?.name,
            contact: d.contacts ? `${d.contacts.firstname} ${d.contacts.lastname}` : 'Unknown'
          })) || [])}
          
          Return JSON with:
          - total_value
          - weighted_pipeline_value (accounting for win probability)
          - stage_breakdown (array of {stage, count, value})
          - at_risk_deals (array)
          - recommended_focus_areas (array)
          - momentum_analysis (improving/declining/stable)
          - key_stakeholders (array of contact names)`

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: summaryPrompt }],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        })

        const summary = JSON.parse(completion.choices[0].message.content || '{}')

        return new Response(JSON.stringify({
          success: true,
          summary
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // Real-time deal assistant chat
    if (url.includes('/chat')) {
      if (method === 'POST') {
        const { messages, deal_id } = await req.json()
        
        let dealContext = ''
        if (deal_id) {
          const { data: deal } = await supabase
            .from('deals')
            .select('*, pipeline_stages(*), contacts(*)')
            .eq('id', deal_id)
            .single()
          
          if (deal) {
            dealContext = `Current Deal: ${deal.name}
              Value: ${deal.value || 0}
              Stage: ${deal.pipeline_stages?.name || 'Unknown'}
              Contact: ${deal.contacts ? `${deal.contacts.firstname} ${deal.contacts.lastname}` : 'Unknown'}
              Company: ${deal.contacts?.company || 'Unknown'}
              Notes: ${deal.notes || 'None'}`
          }
        }

        const systemPrompt = `You are a deal intelligence assistant for a CRM pipeline.
          You help analyze deals, suggest next actions, and provide insights.
          
          ${dealContext ? `Context:\n${dealContext}` : 'No specific deal context - answering general pipeline questions.'}`

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
                temperature: 0.5,
                max_tokens: 1500
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

    // Stage transition with AI analysis
    if (method === 'POST' && url.includes('/stage-transition')) {
      const { deal_id, new_stage_id } = await req.json()
      
      // Get current deal state for AI analysis
      const { data: deal } = await supabase
        .from('deals')
        .select('*, pipeline_stages(*)')
        .eq('id', deal_id)
        .single()

      // Get new stage
      const { data: newStage } = await supabase
        .from('pipeline_stages')
        .select('*')
        .eq('id', new_stage_id)
        .single()

      // AI analysis of transition
      if (deal && newStage) {
        const transitionPrompt = `Analyze this deal stage transition:
          Deal: ${deal.name}
          Current Stage: ${deal.pipeline_stages?.name}
          New Stage: ${newStage.name}
          Value: ${deal.value || 0}
          
          Return JSON with:
          - is_recommended (boolean)
          - risk_level (low/medium/high)
          - warnings (array)
          - success_factors (array)`

        try {
          const analysisCompletion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: transitionPrompt }],
            response_format: { type: 'json_object' },
            temperature: 0.2,
          })

          const analysis = JSON.parse(analysisCompletion.choices[0].message.content || '{}')

          // Log transition analysis
          await supabase.from('contact_activities').insert({
            contact_id: deal.contact_id,
            activity_type: 'stage_transition_ai_analysis',
            description: `Moving to ${newStage.name} - AI recommendation: ${analysis.is_recommended ? 'Approved' : 'Review needed'}`,
            metadata: analysis
          })
        } catch (aiError) {
          console.log('AI analysis failed:', aiError)
        }
      }

      // Perform the transition
      const { data: updatedDeal } = await supabase
        .from('deals')
        .update({ stage_id: new_stage_id })
        .eq('id', deal_id)
        .eq('profile_id', user.id)
        .select()
        .single()

      return new Response(JSON.stringify(updatedDeal), {
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

        // AI-generated deal insights
        const insightsPrompt = `Generate initial insights for new deal:
          Name: ${newDeal.name || 'Unknown'}
          Contact: ${newDeal.contact_id || 'Unknown'}
          
          Return JSON with: recommended_actions (array), risk_factors (array), best_practices (array)`

        try {
          const insightsCompletion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: insightsPrompt }],
            response_format: { type: 'json_object' },
            temperature: 0.3,
          })

          const insights = JSON.parse(insightsCompletion.choices[0].message.content || '{}')

          await supabase.from('contact_activities').insert({
            contact_id: newDeal.contact_id,
            activity_type: 'deal_created_ai_insights',
            description: `New deal created with AI insights generated`,
            metadata: insights
          })
        } catch (aiError) {
          console.log('AI insights generation failed:', aiError)
        }

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
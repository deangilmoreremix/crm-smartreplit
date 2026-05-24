// Edge Function for Calendar Module Federation with OpenAI Realtime
// Handles calendar operations with intelligent scheduling assistance

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
    const eventId = pathParts[pathParts.length - 1]

    // AI-powered smart scheduling - find optimal meeting times
    if (url.includes('/ai-schedule')) {
      if (method === 'POST') {
        const { participants, duration_minutes, preferred_dates, meeting_type } = await req.json()
        
        // Get all participants' availability
        const { data: availabilities } = await supabase
          .from('calendar_availability')
          .select('*')
          .eq('app_id', appId)
          .in('user_id', participants)

        // Use OpenAI to find optimal times
        const prompt = `Find the best meeting times given:
          - Duration needed: ${duration_minutes} minutes
          - Preferred dates: ${JSON.stringify(preferred_dates)}
          - Meeting type: ${meeting_type || 'general'}
          - Participant availabilities: ${JSON.stringify(availabilities || [])}
          
          Return JSON with optimal_time_slots (array of {start, end, score}) and reasoning.`

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        })

        const suggestions = JSON.parse(completion.choices[0].message.content || '{}')
        
        // Store scheduling session
        const { data: session } = await supabase
          .from('agent_executions')
          .insert({
            agent_id: 'smart-scheduler',
            app_id: appId,
            tenant_id: tenantId,
            user_id: user.id,
            input_data: { participants, duration_minutes, preferred_dates, meeting_type },
            output_data: suggestions,
            status: 'completed'
          })
          .select()
          .single()

        return new Response(JSON.stringify({ 
          success: true, 
          suggestions: suggestions.optimal_time_slots || [],
          reasoning: suggestions.reasoning,
          session_id: session?.id
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // AI-powered event description generation
    if (url.includes('/ai-describe')) {
      if (method === 'POST') {
        const { event_type, participants, topic, duration_minutes } = await req.json()
        
        const prompt = `Generate a professional event description for:
          - Event type: ${event_type}
          - Topic: ${topic}
          - Participants: ${participants?.join(', ') || 'TBD'}
          - Duration: ${duration_minutes || 60} minutes
          
          Return JSON with: title, description, agenda_items (array), preparation_notes`

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.5,
        })

        const generated = JSON.parse(completion.choices[0].message.content || '{}')

        return new Response(JSON.stringify({ 
          success: true, 
          ...generated
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // Real-time availability check with conflict detection
    if (url.includes('/check-availability')) {
      if (method === 'POST') {
        const { start_time, end_time, exclude_user_ids = [] } = await req.json()
        
        // Check for conflicting events
        const { data: conflicts } = await supabase
          .from('calendar_events')
          .select('*')
          .eq('app_id', appId)
          .or(`user_id.eq.${user.id}`)
          .not('status', 'eq', 'cancelled')
          .lte('start_time', end_time)
          .gte('end_time', start_time)

        // Get user availability settings
        const { data: availability } = await supabase
          .from('calendar_availability')
          .select('*')
          .eq('app_id', appId)
          .eq('user_id', user.id)
          .eq('day_of_week', new Date(start_time).getDay().toString())
          .single()

        // Use AI to analyze and provide recommendation
        const prompt = `Analyze this time slot:
          - Requested: ${start_time} to ${end_time}
          - Conflicts found: ${conflicts?.length || 0}
          - User availability: ${JSON.stringify(availability)}
          
          Return JSON with: is_available (boolean), conflict_severity (low/medium/high), 
          alternative_suggestions (array of {start, end}), reason`

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        })

        const analysis = JSON.parse(completion.choices[0].message.content || '{}')

        return new Response(JSON.stringify({
          success: true,
          is_available: analysis.is_available ?? (conflicts?.length === 0),
          conflicts: conflicts || [],
          analysis,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // Get events in date range
    if (method === 'GET' && url.includes('/events')) {
      const startDate = urlObj.searchParams.get('start')
      const endDate = urlObj.searchParams.get('end')
      
      let query = supabase
        .from('calendar_events')
        .select('*, contacts(*), deals(*), ai_agents(*)')
        .eq('app_id', appId)
        .order('start_time')

      if (startDate && endDate) {
        query = query.gte('start_time', startDate).lte('end_time', endDate)
      }

      const filter = urlObj.searchParams.get('filter')
      if (filter === 'mine') {
        query = query.eq('user_id', user.id)
      } else {
        query = query.or(`tenant_id.eq.${tenantId},visibility.eq.public,user_id.eq.${user.id}`)
      }

      const { data: events } = await query
      return new Response(JSON.stringify(events || []), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Calendar integrations
    if (url.includes('/integrations')) {
      switch (method) {
        case 'GET':
          const { data: integrations } = await supabase
            .from('calendar_integrations')
            .select('*')
            .eq('app_id', appId)
            .eq('user_id', user.id)
          return new Response(JSON.stringify(integrations || []), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })

        case 'POST':
          const newIntegration = await req.json()
          const { data: integration } = await supabase
            .from('calendar_integrations')
            .insert({ 
              ...newIntegration, 
              app_id: appId, 
              tenant_id: tenantId,
              user_id: user.id 
            })
            .select()
            .single()
          return new Response(JSON.stringify(integration), { 
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          })

        case 'DELETE':
          const integrationId = urlObj.searchParams.get('id')
          if (integrationId) {
            await supabase
              .from('calendar_integrations')
              .delete()
              .eq('id', integrationId)
              .eq('user_id', user.id)
          }
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
      }
    }

    // Calendar availability
    if (url.includes('/availability')) {
      switch (method) {
        case 'GET':
          const { data: availability } = await supabase
            .from('calendar_availability')
            .select('*')
            .eq('app_id', appId)
            .eq('user_id', user.id)
          return new Response(JSON.stringify(availability || []), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })

        case 'POST':
          const newAvailability = await req.json()
          const { data: avail } = await supabase
            .from('calendar_availability')
            .insert({ 
              ...newAvailability, 
              app_id: appId, 
              tenant_id: tenantId,
              user_id: user.id 
            })
            .select()
            .single()
          return new Response(JSON.stringify(avail), { 
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          })
      }
    }

    // Calendar sync
    if (method === 'POST' && url.includes('/sync')) {
      const { integration_id } = await req.json()
      
      const { data: integration } = await supabase
        .from('calendar_integrations')
        .select('*')
        .eq('id', integration_id)
        .eq('user_id', user.id)
        .single()

      if (!integration) {
        return new Response(JSON.stringify({ error: 'Integration not found' }), { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      const syncedEvents = await syncCalendarEvents(integration)

      await supabase
        .from('calendar_integrations')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', integration_id)

      return new Response(JSON.stringify({ 
        success: true, 
        synced: syncedEvents.length,
        events: syncedEvents 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Calendar events CRUD
    switch (method) {
      case 'GET':
        if (eventId && eventId !== 'calendar' && eventId !== 'events') {
          const { data: event } = await supabase
            .from('calendar_events')
            .select('*, contacts(*), deals(*)')
            .eq('id', eventId)
            .single()
          return new Response(JSON.stringify(event), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        break

      case 'POST':
        const newEvent = await req.json()
        const { data: event, error: insertError } = await supabase
          .from('calendar_events')
          .insert({
            ...newEvent,
            app_id: appId,
            tenant_id: tenantId,
            user_id: user.id
          })
          .select()
          .single()

        if (insertError) throw insertError

        // AI-generated reminder
        if (newEvent.ai_reminder !== false) {
          const reminderPrompt = `Generate a reminder message for this event:
            Title: ${newEvent.title}
            Start: ${newEvent.start_time}
            Description: ${newEvent.description || 'None'}
            
            Return JSON with: reminder_text, reminder_time (30 min before), notification_channel`

          try {
            const reminderCompletion = await openai.chat.completions.create({
              model: 'gpt-4o-mini',
              messages: [{ role: 'user', content: reminderPrompt }],
              response_format: { type: 'json_object' },
              temperature: 0.3,
            })
            
            const reminderData = JSON.parse(reminderCompletion.choices[0].message.content || '{}')
            
            await supabase
              .from('contact_activities')
              .insert({
                contact_id: null,
                activity_type: 'calendar_reminder_scheduled',
                description: reminderData.reminder_text,
                metadata: { event_id: event.id, ...reminderData }
              })
          } catch (aiError) {
            console.log('AI reminder generation failed:', aiError)
          }
        }

        return new Response(JSON.stringify(event), { 
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })

      case 'PUT':
        if (eventId) {
          const updateData = await req.json()
          const { data: updated, error: updateError } = await supabase
            .from('calendar_events')
            .update(updateData)
            .eq('id', eventId)
            .eq('app_id', appId)
            .eq('user_id', user.id)
            .select()
            .single()

          if (updateError) throw updateError
          return new Response(JSON.stringify(updated), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        break

      case 'DELETE':
        if (eventId) {
          const { error: deleteError } = await supabase
            .from('calendar_events')
            .delete()
            .eq('id', eventId)
            .eq('app_id', appId)
            .eq('user_id', user.id)

          if (deleteError) throw deleteError
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        break
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

// Placeholder for calendar sync
async function syncCalendarEvents(integration: any) {
  return []
}
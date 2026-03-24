// Edge Function for Calendar Module Federation
// Handles calendar operations for the aicalendarapp

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
    const eventId = urlObj.pathname.split('/').filter(Boolean).pop()

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

      // Also filter by user if they want their own events
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
      
      // Get calendar integration
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

      // Sync events based on provider
      // This is a placeholder - implement actual sync logic
      const syncedEvents = await syncCalendarEvents(integration)

      // Update last sync time
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
  // This would integrate with Google Calendar, Outlook, etc.
  // For now, return empty array
  return []
}

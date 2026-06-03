import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface LinkedInWebhookPayload {
  subscriptionId: string;
  subscriptionOwnerId: string;
  eventType: string; // e.g., 'profile', 'share', 'organizationUpdate'
  eventTimestamp: string;
  resource: string; // URN of the resource that changed
  resourceVersion: string;
  changer: {
    id: string; // LinkedIn ID of the user who made the change
  };
  // Additional data may be included depending on event type
  [key: string]: unknown;
}

interface LinkedInProfileData {
  id: string;
  firstName: {
    localized: { [key: string]: string };
    preferredLocale: { country: string; language: string };
  };
  lastName: {
    localized: { [key: string]: string };
    preferredLocale: { country: string; language: string };
  };
  profilePicture: {
    displayImage: string; // URL to profile picture
  };
  headline: {
    localized: { [key: string]: string };
  };
  location: {
    localized: { [key: string]: string };
  };
  industryName: {
    localized: { [key: string]: string };
  };
}

function createResponse(data: unknown, statusCode = 200) {
  return new Response(JSON.stringify(data), {
    status: statusCode,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getUserFromToken(token: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error('Invalid token');
  return user;
}

async function extractLinkedInIdFromUrn(urn: string): string {
  // LinkedIn URNs look like: urn:li:person:AbCdEfGhIjKlMnOpQrStUvWxYz
  // or urn:li:organization:123456
  const parts = urn.split(':');
  return parts.length >= 4 ? parts[3] : '';
}

async function fetchLinkedInProfile(accessToken: string, linkedinId: string): Promise<LinkedInProfileData | null> {
  try {
    const response = await fetch(`https://api.linkedin.com/v2/me?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams),headline,location,industryName)`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });

    if (!response.ok) {
      // If we can't fetch with /me, try with specific ID
      const idResponse = await fetch(`https://api.linkedin.com/v2/people/${linkedinId}?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams),headline,location,industryName)`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      });

      if (!idResponse.ok) {
        throw new Error(`Failed to fetch LinkedIn profile: ${idResponse.status}`);
      }
      return await idResponse.json();
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching LinkedIn profile:', error);
    return null;
  }
}

async function getLinkedInAccessToken(supabase: ReturnType<typeof createClient>, userId: string): Promise<string> {
  const { data } = await supabase
    .from('user_api_keys')
    .select('linkedin_access_token')
    .eq('user_id', userId)
    .single();
  
  if (!data || !data.linkedin_access_token) {
    throw new Error('LinkedIn access token not configured');
  }
  return data.linkedin_access_token;
}

async function updateContactLinkedInData(
  supabase: ReturnType<typeof createClient>,
  contactId: number,
  profileData: LinkedInProfileData
) {
  // Extract localized strings (prefer English, fallback to first available)
  const getLocalizedString = (localizedObj: { [key: string]: string } | undefined): string | null => {
    if (!localizedObj) return null;
    // Try English first
    if (localizedObj['en_US'] || localizedObj['en']) {
      return localizedObj['en_US'] || localizedObj['en'];
    }
    // Fallback to first available
    const firstValue = Object.values(localizedObj)[0];
    return firstValue || null;
  };

  const firstName = getLocalizedString(profileData.firstName?.localized);
  const lastName = getLocalizedString(profileData.lastName?.localized);
  const headline = getLocalizedString(profileData.headline?.localized);
  const location = getLocalizedString(profileData.location?.localized);
  const industryName = getLocalizedString(profileData.industryName?.localized);

  // Construct full name
  const fullName = [firstName, lastName].filter(Boolean).join(' ');

  const updates: any = {
    linkedinUrl: `https://www.linkedin.com/in/${profileData.id}`,
    linkedinData: profileData,
    linkedinSyncedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Update contact fields if available from LinkedIn
  if (firstName) updates.firstName = firstName;
  if (lastName) updates.lastName = lastName;
  if (fullName) updates.name = fullName;
  if (headline) {
    // Store headline in notes or a custom field for now
    updates.notes = `Headline: ${headline}\n${updates.notes || ''}`.trim();
  }
  if (location) updates.state = location; // Simplified - could parse city/state/country
  if (industryName) updates.industry = industryName;

  const { data, error } = await supabase
    .from('contacts')
    .update(updates)
    .eq('id', contactId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function createLinkedInActivity(
  supabase: ReturnType<typeof createClient>,
  contactId: number,
  payload: LinkedInWebhookPayload
) {
  const workspaceMemberRes = await supabase
    .from('workspace_members')
    .select('id')
    .limit(1)
    .single();
  
  const workspaceMemberId = workspaceMemberRes.data?.id;

  let activityName = 'LinkedIn Profile Updated';
  let activityType = 'linkedin_profile_update';
  let properties: any = {
    linkedinEventType: payload.eventType,
    linkedinResource: payload.resource,
    resourceVersion: payload.resourceVersion,
    changerId: payload.changer.id,
    rawPayload: payload,
  };

  // Customize based on event type
  if (payload.eventType === 'share') {
    activityName = 'Shared Content on LinkedIn';
    activityType = 'linkedin_share';
  } else if (payload.eventType === 'organizationUpdate') {
    activityName = 'LinkedIn Company Page Updated';
    activityType = 'linkedin_organization_update';
  }

  const activityData = {
    contact_id: contactId,
    workspace_member_id: workspaceMemberId,
    activity_type: activityType,
    name: activityName,
    properties: properties,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('contact_activities')
    .insert(activityData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return createResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createResponse({ error: 'Missing or invalid authorization header' }, 401);
    }
    const token = authHeader.replace('Bearer ', '');

    let body: LinkedInWebhookPayload;
    try {
      body = await req.json();
    } catch {
      return createResponse({ error: 'Invalid JSON in request body' }, 400);
    }

    if (!body.resource) {
      return createResponse({ error: 'Resource is required in webhook payload' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const user = await getUserFromToken(token);
    
    // Extract LinkedIn ID from resource URN
    const linkedinId = await extractLinkedInIdFromUrn(body.resource);
    if (!linkedinId) {
      return createResponse({ error: 'Could not extract LinkedIn ID from resource' }, 400);
    }

    // Find contact by LinkedIn ID
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id')
      .like('linkedinUrl', `%${linkedinId}`)
      .limit(1);

    if (!contacts || contacts.length === 0) {
      return createResponse({ error: 'Contact not found for LinkedIn ID: ' + linkedinId }, 404);
    }

    const contactId = contacts[0].id;

    // Update contact with LinkedIn data if this is a profile event
    if (body.eventType === 'profile') {
      try {
        const accessToken = await getLinkedInAccessToken(supabase, user.id);
        const profileData = await fetchLinkedInProfile(accessToken, linkedinId);
        if (profileData) {
          await updateContactLinkedInData(supabase, contactId, profileData);
        }
      } catch (profileError) {
        console.warn('Could not fetch LinkedIn profile data:', profileError);
        // Continue anyway - we'll still create the activity
      }
    }

    // Create activity record
    const activity = await createLinkedInActivity(supabase, contactId, body);

    return createResponse({
      success: true,
      contact_id: contactId,
      activity_id: activity?.id,
      message: 'LinkedIn webhook processed successfully',
    });

  } catch (error) {
    console.error('LinkedIn webhook error:', error);
    return createResponse({
      error: error instanceof Error ? error.message : 'Internal server error',
    }, 500);
  }
});
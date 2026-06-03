import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface StripeWebhookPayload {
  type: string;
  data: {
    object: {
      id: string;
      customer?: string;
      subscription?: string;
      amount?: number;
      currency?: string;
      status?: string;
      metadata?: Record<string, string>;
      [key: string]: unknown;
    };
  };
}

function createResponse(data: unknown, statusCode = 200) {
  return new Response(JSON.stringify(data), {
    status: statusCode,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function findContactByStripeCustomerId(
  supabase: ReturnType<typeof createClient>,
  stripeCustomerId: string
) {
  const { data } = await supabase
    .from('contacts')
    .select('id, email, full_name')
    .eq('stripe_customer_id', stripeCustomerId)
    .single();
  
  return data;
}

async function findCompanyByStripeCustomerId(
  supabase: ReturnType<typeof createClient>,
  stripeCustomerId: string
) {
  const { data } = await supabase
    .from('companies')
    .select('id, name')
    .eq('stripe_customer_id', stripeCustomerId)
    .single();
  
  return data;
}

async function createStripeActivity(
  supabase: ReturnType<typeof createClient>,
  eventType: string,
  stripeData: StripeWebhookPayload['data']['object'],
  contactId?: string,
  companyId?: string
) {
  const workspaceMemberRes = await supabase
    .from('workspace_members')
    .select('id')
    .limit(1)
    .single();
  
  const workspaceMemberId = workspaceMemberRes.data?.id;

  const eventLabels: Record<string, string> = {
    'customer.subscription.created': 'Subscription Created',
    'customer.subscription.updated': 'Subscription Updated',
    'customer.subscription.deleted': 'Subscription Cancelled',
    'invoice.paid': 'Invoice Paid',
    'invoice.payment_failed': 'Payment Failed',
    'checkout.session.completed': 'Checkout Completed',
    'payment_intent.succeeded': 'Payment Succeeded',
    'payment_intent.failed': 'Payment Failed',
  };

  const activityData = {
    contact_id: contactId || null,
    company_id: companyId || null,
    workspace_member_id: workspaceMemberId,
    activity_type: 'billing_event',
    name: eventLabels[eventType] || `Stripe: ${eventType}`,
    properties: {
      stripe_event_type: eventType,
      stripe_object_id: stripeData.id,
      stripe_customer_id: stripeData.customer,
      amount: stripeData.amount ? stripeData.amount / 100 : null,
      currency: stripeData.currency?.toUpperCase(),
      status: stripeData.status,
      metadata: stripeData.metadata,
      raw_data: stripeData,
    },
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

async function updateDealFromStripe(
  supabase: ReturnType<typeof createClient>,
  stripeData: StripeWebhookPayload['data']['object'],
  companyId?: string
) {
  if (!companyId || !stripeData.amount) return;

  const amount = stripeData.amount / 100;
  
  const { error } = await supabase.rpc('update_deal_from_payment', {
    p_company_id: companyId,
    p_amount: amount,
    p_currency: stripeData.currency?.toUpperCase() || 'USD',
    p_stripe_event: stripeData.id,
  });

  if (error && error.code !== 'PGRST116') {
    console.error('Failed to update deal from Stripe payment:', error);
  }
}

async function handleStripeEvent(
  supabase: ReturnType<typeof createClient>,
  payload: StripeWebhookPayload
) {
  const eventType = payload.type;
  const stripeData = payload.data.object;

  if (!stripeData.customer) {
    return { success: true, message: 'No customer association, skipping' };
  }

  let contactId: string | undefined;
  let companyId: string | undefined;

  const contact = await findContactByStripeCustomerId(supabase, stripeData.customer);
  if (contact) contactId = contact.id;

  const company = await findCompanyByStripeCustomerId(supabase, stripeData.customer);
  if (company) companyId = company.id;

  const activity = await createStripeActivity(
    supabase,
    eventType,
    stripeData,
    contactId,
    companyId
  );

  if (['invoice.paid', 'checkout.session.completed', 'payment_intent.succeeded'].includes(eventType)) {
    await updateDealFromStripe(supabase, stripeData, companyId);
  }

  return {
    success: true,
    activity_id: activity?.id,
    contact_id: contactId,
    company_id: companyId,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return createResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let body: StripeWebhookPayload;
    try {
      body = await req.json();
    } catch {
      return createResponse({ error: 'Invalid JSON in request body' }, 400);
    }

    if (!body.type || !body.data?.object?.id) {
      return createResponse({ error: 'Invalid Stripe webhook payload' }, 400);
    }

    console.log(`Processing Stripe webhook: ${body.type}`);

    const result = await handleStripeEvent(supabase, body);

    return createResponse(result);

  } catch (error) {
    console.error('Stripe webhook error:', error);
    return createResponse({
      error: error instanceof Error ? error.message : 'Internal server error',
    }, 500);
  }
});
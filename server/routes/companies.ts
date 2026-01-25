import { Router } from 'express';
import { supabase } from '../supabase';
import crypto from 'crypto';

const router = Router();

// Create a new company
router.post('/', async (req, res) => {
  const userId = req.session?.userId;

  try {
    const { name, domain, description, industry } = req.body;
    

    // Check if user already owns a company
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('owner_user_id', userId)
      .single();

    if (existingCompany) {
      return res.status(400).json({ error: 'User already owns a company' });
    }

    // Create company
    const { data: company, error } = await supabase
      .from('companies')
      .insert({
        name,
        domain,
        description,
        industry,
        owner_user_id: userId
      })
      .select()
      .single();

    if (error) throw error;

    // Add owner to company_users
    await supabase
      .from('company_users')
      .insert({
        company_id: company.id,
        user_id: userId,
        role: 'owner',
        status: 'active'
      });

    // Create default whitelabel config
    await supabase
      .from('company_whitelabel_configs')
      .insert({
        company_id: company.id,
        company_name: name
      });

    res.json(company);
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ error: 'Failed to create company' });
});

// Get user's companies
router.get('/', async (req, res) => {
  const userId = req.session?.userId;
  try {
    const { data: companies, error } = await supabase
      .from('companies')
      .select(`
        *,
        company_users!inner(role, status)
      `)
      .eq('company_users.user_id', userId)
      .eq('company_users.status', 'active');

    if (error) throw error;
    res.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
});

// Get company details
router.get('/:companyId', async (req, res) => {
  const userId = req.session?.userId;
  try {
    const { companyId } = req.params;

    // Check if user is member of company
    const { data: membership } = await supabase
      .from('company_users')
      .select('role')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: company, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (error) throw error;
    res.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ error: 'Failed to fetch company' });
});

// Update company
router.put('/:companyId', async (req, res) => {
  const userId = req.session?.userId;
  try {
    const { companyId } = req.params;
    const updates = req.body;

    // Check if user is admin/owner of company
    const { data: membership } = await supabase
      .from('company_users')
      .select('role')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { data: company, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', companyId)
      .select()
      .single();

    if (error) throw error;
    res.json(company);
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ error: 'Failed to update company' });
});

// Get company users
router.get('/:companyId/users', async (req, res) => {
  const userId = req.session?.userId;
  try {
    const { companyId } = req.params;

    // Check if user is member of company
    const { data: membership } = await supabase
      .from('company_users')
      .select('role')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: users, error } = await supabase
      .from('company_users')
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          first_name,
          last_name,
          email,
          avatar_url
        )
      `)
      .eq('company_id', companyId)
      .eq('status', 'active');

    if (error) throw error;
    res.json(users);
  } catch (error) {
    console.error('Error fetching company users:', error);
    res.status(500).json({ error: 'Failed to fetch company users' });
});

// Invite user to company
router.post('/:companyId/invitations', async (req, res) => {
  const userId = req.session?.userId;
  try {
    const { companyId } = req.params;
    const { email, role } = req.body;

    // Check if user is admin/owner of company
    const { data: membership } = await supabase
      .from('company_users')
      .select('role')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Check if user is already in company
    const { data: existingUser } = await supabase
      .from('company_users')
      .select('id')
      .eq('company_id', companyId)
      .eq('user_id', email) // This needs to be user_id, not email
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'User already in company' });
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');

    // Create invitation
    const { data: invitation, error } = await supabase
      .from('company_invitations')
      .insert({
        company_id: companyId,
        email,
        role,
        token,
        invited_by: userId
      })
      .select()
      .single();

    if (error) throw error;

    // Send invitation email
    try {
      if (process.env.SENDGRID_API_KEY) {
        const sgMail = (await import('@sendgrid/mail')).default;
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        // Fetch company and inviter details
        const { data: company } = await supabase
          .from('companies')
          .select('name')
          .eq('id', companyId)
          .single();

        const { data: inviter } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', userId)
          .single();

        const inviteUrl = `${process.env.FRONTEND_URL || 'https://smart-crm.videoremix.io'}/accept-invitation?token=${invitation.token}`;

        await sgMail.send({
          to: email,
          from: {
            email: process.env.FROM_EMAIL || 'noreply@smartcrm.vip',
            name: 'SmartCRM Team'
          },
          subject: `You're invited to join ${company?.name || 'the company'} on SmartCRM`,
          templateId: process.env.SENDGRID_INVITE_TEMPLATE_ID || 'd-invite-template',
          dynamicTemplateData: {
            company_name: company?.name || 'the company',
            inviter_name: inviter?.first_name || 'Team Member',
            invite_url: inviteUrl,
            expiry_days: 7
          }
        });

        console.log(`✅ Invitation email sent to ${email} for company ${company?.name || 'unknown'}`);
      } else {
        console.warn('SendGrid not configured, invitation email not sent');
      }
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Don't fail the invitation creation if email fails
    }

    res.json(invitation);
  } catch (error) {
    console.error('Error creating invitation:', error);
    res.status(500).json({ error: 'Failed to create invitation' });
});

// Accept invitation
router.post('/invitations/:token/accept', async (req, res) => {
  const userId = req.session?.userId;
  try {
    const { token } = req.params;

    // Find invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('company_invitations')
      .select('*, companies(*)')
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (inviteError || !invitation) {
      return res.status(404).json({ error: 'Invalid invitation' });
    }

    // Check if user email matches invitation
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (userProfile.email !== invitation.email) {
      return res.status(403).json({ error: 'Email mismatch' });
    }

    // Add user to company
    await supabase
      .from('company_users')
      .insert({
        company_id: invitation.company_id,
        user_id: userId,
        role: invitation.role,
        status: 'active',
        invited_by: invitation.invited_by,
        invited_at: invitation.created_at,
        joined_at: new Date().toISOString()
      });

    // Update invitation status
    await supabase
      .from('company_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id);

    res.json({ message: 'Successfully joined company', company: invitation.companies });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ error: 'Failed to accept invitation' });
});

// Get company whitelabel config
router.get('/:companyId/whitelabel', async (req, res) => {
  const userId = req.session?.userId;
  try {
    const { companyId } = req.params;

    // Check if user is member of company
    const { data: membership } = await supabase
      .from('company_users')
      .select('role')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: config, error } = await supabase
      .from('company_whitelabel_configs')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (error) throw error;
    res.json(config);
  } catch (error) {
    console.error('Error fetching whitelabel config:', error);
    res.status(500).json({ error: 'Failed to fetch whitelabel config' });
});

// Update company whitelabel config
router.put('/:companyId/whitelabel', async (req, res) => {
  const userId = req.session?.userId;
  try {
    const { companyId } = req.params;
    const updates = req.body;

    // Check if user is admin/owner of company
    const { data: membership } = await supabase
      .from('company_users')
      .select('role')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { data: config, error } = await supabase
      .from('company_whitelabel_configs')
      .upsert({
        company_id: companyId,
        ...updates
      })
      .select()
      .single();

    if (error) throw error;
    res.json(config);
  } catch (error) {
    console.error('Error updating whitelabel config:', error);
    res.status(500).json({ error: 'Failed to update whitelabel config' });
});

export default router;

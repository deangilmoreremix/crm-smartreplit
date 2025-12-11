import { Request, Response } from "express";
import crypto from "crypto";
import { supabase } from "./supabase";
import { ProductTier } from "../shared/schema";
import { handleSuccessfulPurchase, upsertEntitlement, type ProductType } from "./entitlements-utils";

interface JVZooWebhookPayload {
  ccustname: string;       // Customer name
  ccustemail: string;      // Customer email
  ctransaction: string;    // Transaction type (SALE, RFND, CGBK, INSF, etc.)
  cproditem: string;       // Product item number
  cprodtitle: string;      // Product title
  ctransaffiliate: string; // Affiliate username
  ctransamount: string;    // Transaction amount
  ctransreceipt: string;   // Receipt/Transaction ID
  cverify: string;         // Verification hash
  ctransvendor: string;    // Vendor username
  [key: string]: any;
}

// Map JVZoo product IDs to product tiers (7-tier system)
const PRODUCT_TIER_MAP: Record<string, ProductTier> = {
  // Add your actual JVZoo product IDs here
  'super_admin': 'super_admin',
  'whitelabel': 'whitelabel',
  'smartcrm': 'smartcrm',
  'sales_maximizer': 'sales_maximizer',
  'ai_boost_unlimited': 'ai_boost_unlimited',
  'ai_communication': 'ai_communication',
  'smartcrm_bundle': 'smartcrm_bundle',
};

export async function handleJVZooWebhook(req: Request, res: Response) {
  const payload = req.body as JVZooWebhookPayload;
  
  console.log('📥 Received JVZoo webhook:', {
    email: payload.ccustemail,
    name: payload.ccustname,
    transaction: payload.ctransaction,
    product: payload.cprodtitle
  });

  // Verify webhook authenticity using JVZoo's verification hash
  const secretKey = process.env.JVZOO_SECRET_KEY || process.env.JVZOO_IPNSECRET;
  if (!secretKey) {
    console.error('❌ JVZoo secret key not configured');
    return res.status(400).send('Secret key not configured');
  }

  // Verify the hash
  const verificationString = `${secretKey}:${payload.ctransreceipt}:${payload.ctransaction}`;
  const calculatedHash = crypto
    .createHash('sha1')
    .update(verificationString)
    .digest('hex')
    .toUpperCase();

  if (calculatedHash !== payload.cverify) {
    console.error('❌ JVZoo webhook verification failed');
    return res.status(401).send('Verification failed');
  }

  try {
    const { ctransaction, ccustemail, ccustname, cproditem, cprodtitle } = payload;

    // Determine product tier from product ID or title (7-tier system)
    let productTier: ProductTier = 'smartcrm'; // default fallback
    
    // Try to map from product item first
    if (PRODUCT_TIER_MAP[cproditem]) {
      productTier = PRODUCT_TIER_MAP[cproditem];
    } else {
      // Fallback: detect from product title
      const titleLower = cprodtitle.toLowerCase();
      if (titleLower.includes('super admin')) {
        productTier = 'super_admin';
      } else if (titleLower.includes('whitelabel') || titleLower.includes('white label')) {
        productTier = 'whitelabel';
      } else if (titleLower.includes('smartcrm bundle')) {
        productTier = 'smartcrm_bundle';
      } else if (titleLower.includes('ai communication')) {
        productTier = 'ai_communication';
      } else if (titleLower.includes('ai boost unlimited')) {
        productTier = 'ai_boost_unlimited';
      } else if (titleLower.includes('sales maximizer')) {
        productTier = 'sales_maximizer';
      } else if (titleLower.includes('smartcrm')) {
        productTier = 'smartcrm';
      } else {
        // Log warning if no tier match found
        console.warn(`⚠️ Unknown product detected, defaulting to 'smartcrm': ${cproditem} - ${cprodtitle}`);
      }
    }

    switch (ctransaction) {
      case 'SALE': {
        // New sale - create user account with magic link
        const [firstName, ...lastNameParts] = ccustname.split(' ');
        const lastName = lastNameParts.join(' ') || '';

        console.log('💳 Processing new sale:', { email: ccustemail, productTier });

        // Determine role based on product tier
        let userRole: 'super_admin' | 'wl_user' | 'regular_user' = 'regular_user';
        if (productTier === 'super_admin') {
          userRole = 'super_admin';
        } else if (productTier === 'whitelabel' || productTier === 'smartcrm_bundle') {
          userRole = 'wl_user';
        }

        // Check if user already exists
        if (!supabase) {
          throw new Error('Supabase not configured');
        }
        
        const { data: usersData } = await supabase.auth.admin.listUsers();
        const existingUser = usersData?.users?.find(u => u.email?.toLowerCase() === ccustemail.toLowerCase());

        if (existingUser) {
          // Update existing user's product tier AND role
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              product_tier: productTier,
              role: userRole,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingUser.id);

          if (updateError) {
            console.error('❌ Error updating user product tier:', updateError);
          } else {
            console.log('✅ Updated existing user:', { productTier, role: userRole });
          }

          // Update auth metadata for consistency
          await supabase.auth.admin.updateUserById(existingUser.id, {
            user_metadata: {
              product_tier: productTier,
              role: userRole,
              product_tier_updated_at: new Date().toISOString()
            }
          });

          // Create/update entitlements record - JVZoo is lifetime purchase
          try {
            await handleSuccessfulPurchase(existingUser.id, 'lifetime' as ProductType, {
              planName: cprodtitle,
              planAmount: payload.ctransamount,
              currency: 'USD'
            });
            console.log('✅ Entitlement created/updated for existing user:', existingUser.id);
          } catch (entErr) {
            console.error('⚠️ Error creating entitlement (non-blocking):', entErr);
          }
        } else {
          // Create new user with Supabase
          const { data: newUser, error: signUpError } = await supabase.auth.admin.createUser({
            email: ccustemail,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
              first_name: firstName,
              last_name: lastName,
              role: userRole,
              product_tier: productTier,
              app_context: 'smartcrm',
              email_template_set: 'smartcrm'
            }
          });

          if (signUpError) {
            console.error('❌ Error creating user:', signUpError);
            throw signUpError;
          }

          console.log('✅ Created new user:', newUser?.user?.id);

          // Create entitlements record for new user - JVZoo is lifetime purchase
          if (newUser?.user?.id) {
            try {
              await handleSuccessfulPurchase(newUser.user.id, 'lifetime' as ProductType, {
                planName: cprodtitle,
                planAmount: payload.ctransamount,
                currency: 'USD'
              });
              console.log('✅ Entitlement created for new user:', newUser.user.id);
            } catch (entErr) {
              console.error('⚠️ Error creating entitlement (non-blocking):', entErr);
            }
          }

          // Send password setup link using admin.generateLink (works with service role)
          const currentOrigin = process.env.FRONTEND_URL || 'https://smart-crm.videoremix.io';
          const { data: linkData, error: magicLinkError } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: ccustemail,
            options: {
              redirectTo: `${currentOrigin}/auth/callback?setup=true`,
            }
          });

          if (magicLinkError) {
            console.error('❌ Error generating magic link:', magicLinkError);
          } else {
            // The link is in linkData.properties.hashed_token - Supabase sends the email automatically
            console.log('✅ Magic link generated and email sent to:', ccustemail);
          }
        }
        break;
      }

      case 'RFND': {
        // Refund - REVOKE ALL ACCESS (set productTier to null and deactivate entitlement)
        console.log('💸 Processing refund for:', ccustemail);
        
        if (!supabase) {
          throw new Error('Supabase not configured');
        }
        const { data: refundUsersData } = await supabase.auth.admin.listUsers();
        const user = refundUsersData?.users?.find(u => u.email?.toLowerCase() === ccustemail.toLowerCase());
        if (user) {
          await supabase
            .from('profiles')
            .update({ 
              product_tier: null, // ZERO ACCESS - must repurchase
              role: 'regular_user',
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

          // Update auth metadata
          await supabase.auth.admin.updateUserById(user.id, {
            user_metadata: {
              product_tier: null,
              role: 'regular_user',
              product_tier_updated_at: new Date().toISOString(),
              refunded_at: new Date().toISOString()
            }
          });

          // Revoke entitlements - set status to 'refunded' with immediate revoke
          try {
            const now = new Date().toISOString();
            await upsertEntitlement({
              userId: user.id,
              status: 'refunded',
              productType: 'lifetime',
              revokeAt: now, // Immediate revocation
            });
            console.log('✅ Entitlement revoked for refund:', user.id);
          } catch (entErr) {
            console.error('⚠️ Error revoking entitlement (non-blocking):', entErr);
          }
          
          console.log('✅ REVOKED ALL ACCESS for refund:', ccustemail);
        }
        break;
      }

      case 'CGBK': {
        // Chargeback - REVOKE ALL ACCESS (set productTier to null and deactivate entitlement)
        console.log('⚠️ Processing chargeback for:', ccustemail);
        
        if (!supabase) {
          throw new Error('Supabase not configured');
        }
        const { data: chargebackUsersData } = await supabase.auth.admin.listUsers();
        const cbUser = chargebackUsersData?.users?.find(u => u.email?.toLowerCase() === ccustemail.toLowerCase());
        if (cbUser) {
          await supabase
            .from('profiles')
            .update({ 
              product_tier: null, // ZERO ACCESS - must repurchase
              role: 'regular_user',
              updated_at: new Date().toISOString()
            })
            .eq('id', cbUser.id);

          // Update auth metadata
          await supabase.auth.admin.updateUserById(cbUser.id, {
            user_metadata: {
              product_tier: null,
              role: 'regular_user',
              product_tier_updated_at: new Date().toISOString(),
              chargeback_at: new Date().toISOString()
            }
          });

          // Revoke entitlements - set status to 'refunded' (chargebacks treated same as refunds)
          try {
            const now = new Date().toISOString();
            await upsertEntitlement({
              userId: cbUser.id,
              status: 'refunded',
              productType: 'lifetime',
              revokeAt: now, // Immediate revocation
            });
            console.log('✅ Entitlement revoked for chargeback:', cbUser.id);
          } catch (entErr) {
            console.error('⚠️ Error revoking entitlement (non-blocking):', entErr);
          }
          
          console.log('✅ REVOKED ALL ACCESS for chargeback:', ccustemail);
        }
        break;
      }

      case 'INSF': {
        // Insufficient funds - could suspend or flag
        console.log('⚠️ Insufficient funds for:', ccustemail);
        break;
      }

      default:
        console.log(`ℹ️ Unhandled JVZoo transaction type: ${ctransaction}`);
    }

    // JVZoo expects the verification hash to be returned
    res.status(200).send(payload.cverify);
  } catch (error) {
    console.error('❌ Error processing JVZoo webhook:', error);
    res.status(500).send('Internal server error');
  }
}

-- Add product_tier column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS product_tier text DEFAULT 'smartcrm';

-- Update the trigger to sync product_tier from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    username, 
    first_name, 
    last_name, 
    role, 
    product_tier,
    app_context, 
    email_template_set
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'regular_user'),
    COALESCE(NEW.raw_user_meta_data->>'product_tier', 'smartcrm'),
    COALESCE(NEW.raw_user_meta_data->>'app_context', 'smartcrm'),
    COALESCE(NEW.raw_user_meta_data->>'email_template_set', 'smartcrm')
  )
  ON CONFLICT (id) 
  DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    product_tier = COALESCE(EXCLUDED.product_tier, profiles.product_tier),
    app_context = COALESCE(EXCLUDED.app_context, profiles.app_context),
    email_template_set = COALESCE(EXCLUDED.email_template_set, profiles.email_template_set),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Comment explaining the product tiers
COMMENT ON COLUMN profiles.product_tier IS 'Product tier purchased: smartcrm (base CRM), sales_maximizer (includes AI Goals), ai_boost_unlimited (all AI tools)';

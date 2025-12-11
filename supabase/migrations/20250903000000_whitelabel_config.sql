/*
  # White Label Configuration Tables

  1. New Tables
    - `whitelabel_configs`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, references customers)
      - `company_name` (text)
      - `logo_url` (text, optional)
      - `primary_color` (text)
      - `secondary_color` (text)
      - `hero_title` (text)
      - `hero_subtitle` (text)
      - `cta_buttons` (jsonb)
      - `redirect_mappings` (jsonb)
      - `show_pricing` (boolean)
      - `show_testimonials` (boolean)
      - `show_features` (boolean)
      - `support_email` (text, optional)
      - `support_phone` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on whitelabel_configs table
    - Add policies for tenant access

  3. Indexes
    - Index on customer_id for performance
*/

-- Create whitelabel_configs table
CREATE TABLE IF NOT EXISTS whitelabel_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  company_name text NOT NULL DEFAULT 'Smart CRM',
  logo_url text,
  primary_color text NOT NULL DEFAULT '#3B82F6',
  secondary_color text NOT NULL DEFAULT '#6366F1',
  hero_title text NOT NULL DEFAULT 'Transform Your Sales Process with AI',
  hero_subtitle text NOT NULL DEFAULT 'Smart CRM combines powerful sales tools with advanced AI capabilities to streamline your workflow and boost your results.',
  cta_buttons jsonb NOT NULL DEFAULT '[
    {
      "id": "trial",
      "text": "Start Your Free Trial",
      "url": "/dashboard",
      "color": "#3B82F6",
      "variant": "primary",
      "enabled": true
    },
    {
      "id": "demo",
      "text": "Go to Dashboard",
      "url": "/dashboard",
      "color": "#10B981",
      "variant": "secondary",
      "enabled": true
    }
  ]'::jsonb,
  redirect_mappings jsonb NOT NULL DEFAULT '{}'::jsonb,
  show_pricing boolean NOT NULL DEFAULT true,
  show_testimonials boolean NOT NULL DEFAULT true,
  show_features boolean NOT NULL DEFAULT true,
  support_email text,
  support_phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE whitelabel_configs ENABLE ROW LEVEL SECURITY;

-- Create policies for whitelabel_configs (tenant access)
CREATE POLICY "Tenant access to whitelabel_configs"
  ON whitelabel_configs
  FOR ALL
  TO authenticated
  USING (
    customer_id IN (
      SELECT customers.id
      FROM customers
      WHERE customers.id = whitelabel_configs.customer_id
    )
  )
  WITH CHECK (
    customer_id IN (
      SELECT customers.id
      FROM customers
      WHERE customers.id = whitelabel_configs.customer_id
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_whitelabel_configs_customer_id ON whitelabel_configs(customer_id);
CREATE INDEX IF NOT EXISTS idx_whitelabel_configs_created_at ON whitelabel_configs(created_at);

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_whitelabel_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_whitelabel_configs_updated_at_trigger
  BEFORE UPDATE ON whitelabel_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_whitelabel_configs_updated_at();

-- Insert default configuration for existing customers
INSERT INTO whitelabel_configs (customer_id, company_name, primary_color, secondary_color, hero_title, hero_subtitle)
SELECT
  id as customer_id,
  'Smart CRM' as company_name,
  '#3B82F6' as primary_color,
  '#6366F1' as secondary_color,
  'Transform Your Sales Process with AI' as hero_title,
  'Smart CRM combines powerful sales tools with advanced AI capabilities to streamline your workflow and boost your results.' as hero_subtitle
FROM customers
ON CONFLICT (customer_id) DO NOTHING;
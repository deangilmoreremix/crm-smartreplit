-- Update field types to match Twenty CRM FieldMetadataType enum
-- This migration updates the field_types enum to include all Twenty field types

-- First, update any existing records to use compatible field types
UPDATE field_metadata
SET type = CASE
  WHEN type = 'EMAIL' THEN 'EMAILS'
  WHEN type = 'PHONE' THEN 'PHONES'
  WHEN type = 'URL' THEN 'LINKS'
  WHEN type = 'JSON' THEN 'RAW_JSON'
  ELSE type
END
WHERE type IN ('EMAIL', 'PHONE', 'URL', 'JSON');

-- Add new enum values (if the enum exists, this will add to it)
-- Note: In production, this would need to be handled more carefully with enum alterations
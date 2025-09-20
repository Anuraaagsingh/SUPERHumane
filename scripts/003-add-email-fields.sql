-- Add missing fields to email_metadata table
-- This migration adds snippet and has_attachments fields

-- Add snippet field
ALTER TABLE email_metadata 
ADD COLUMN IF NOT EXISTS snippet TEXT;

-- Add has_attachments field
ALTER TABLE email_metadata 
ADD COLUMN IF NOT EXISTS has_attachments BOOLEAN DEFAULT false;

-- Update existing records to have default values
UPDATE email_metadata 
SET snippet = '' 
WHERE snippet IS NULL;

UPDATE email_metadata 
SET has_attachments = false 
WHERE has_attachments IS NULL;

-- Add index for snippet field for better search performance
CREATE INDEX IF NOT EXISTS idx_email_metadata_snippet ON email_metadata USING gin(to_tsvector('english', snippet));

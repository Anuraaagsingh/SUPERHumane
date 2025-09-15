-- Create demo user in Supabase auth system
-- This needs to be run in Supabase SQL Editor since auth.users is protected

-- First, let's create the user profile in our profiles table
INSERT INTO profiles (id, email, full_name, avatar_url, created_at, updated_at)
VALUES (
  'demo-user-uuid-12345',
  'demo@mastermail.com',
  'Demo User',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  updated_at = NOW();

-- Update existing emails to use the new demo email
UPDATE emails SET 
  recipient_email = 'demo@mastermail.com',
  updated_at = NOW()
WHERE recipient_email = 'demo@hispeedmail.com';

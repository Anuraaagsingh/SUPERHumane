-- Quick Database Setup for MasterMail Authentication
-- Run this in your Supabase SQL Editor to fix authentication issues

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS email_metadata CASCADE;
DROP TABLE IF EXISTS email_accounts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table (essential for authentication)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email accounts table (for OAuth providers)
CREATE TABLE email_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'google', 'outlook', 'demo'
  email TEXT NOT NULL,
  display_name TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider, email)
);

-- Email metadata table (for storing emails)
CREATE TABLE email_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES email_accounts(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL,
  thread_id TEXT,
  subject TEXT,
  sender_email TEXT,
  sender_name TEXT,
  recipient_emails TEXT[],
  labels TEXT[] DEFAULT '{}',
  snippet TEXT,
  has_attachments BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  is_snoozed BOOLEAN DEFAULT false,
  snooze_until TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_id, message_id)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON users 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users 
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for email_accounts table
CREATE POLICY "Users can view own email accounts" ON email_accounts 
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own email accounts" ON email_accounts 
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own email accounts" ON email_accounts 
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for email_metadata table
CREATE POLICY "Users can view own email metadata" ON email_metadata 
  FOR SELECT USING (
    account_id IN (
      SELECT id FROM email_accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own email metadata" ON email_metadata 
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT id FROM email_accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own email metadata" ON email_metadata 
  FOR UPDATE USING (
    account_id IN (
      SELECT id FROM email_accounts WHERE user_id = auth.uid()
    )
  );

-- Create demo user and account for testing
INSERT INTO users (id, email, name, avatar_url, settings)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'demo@mastermail.com',
  'Demo User',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  '{
    "theme": "light",
    "keyboard_shortcuts": true,
    "notifications": {
      "email": true,
      "push": false
    }
  }'
) ON CONFLICT (email) DO NOTHING;

-- Create demo email account
INSERT INTO email_accounts (id, user_id, provider, email, display_name, access_token, refresh_token, settings)
VALUES (
  '660e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440000',
  'demo',
  'demo@mastermail.com',
  'Demo User',
  'demo_access_token',
  'demo_refresh_token',
  '{
    "sync_enabled": false,
    "sync_frequency": 300
  }'
) ON CONFLICT (user_id, provider, email) DO NOTHING;

-- Insert a few demo emails
INSERT INTO email_metadata (
  id, account_id, message_id, thread_id, subject, sender_email, sender_name, 
  recipient_emails, labels, snippet, has_attachments, is_read, is_starred, 
  received_at, created_at
) VALUES 
(
  '770e8400-e29b-41d4-a716-446655440001',
  '660e8400-e29b-41d4-a716-446655440000',
  'msg_001',
  'thread_001',
  'Welcome to MasterMail!',
  'welcome@mastermail.com',
  'MasterMail Team',
  ARRAY['demo@mastermail.com'],
  ARRAY['welcome'],
  'Welcome to MasterMail! This is your first email. We''re excited to have you on board...',
  false,
  false,
  false,
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '1 hour'
),
(
  '770e8400-e29b-41d4-a716-446655440002',
  '660e8400-e29b-41d4-a716-446655440000',
  'msg_002',
  'thread_002',
  'Q4 Project Update',
  'sarah.chen@techcorp.com',
  'Sarah Chen',
  ARRAY['demo@mastermail.com'],
  ARRAY['work', 'important'],
  'Hi team, I wanted to update everyone on our Q4 mobile app launch progress...',
  true,
  false,
  true,
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '2 hours'
);

-- Verify the setup
SELECT 'Quick setup complete!' as status, 
       (SELECT COUNT(*) FROM users) as users_count,
       (SELECT COUNT(*) FROM email_accounts) as accounts_count,
       (SELECT COUNT(*) FROM email_metadata) as emails_count;

-- Complete database setup for MasterMail
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS shared_view_comments CASCADE;
DROP TABLE IF EXISTS shareable_views CASCADE;
DROP TABLE IF EXISTS follow_up_reminders CASCADE;
DROP TABLE IF EXISTS scheduled_emails CASCADE;
DROP TABLE IF EXISTS email_metadata CASCADE;
DROP TABLE IF EXISTS email_accounts CASCADE;
DROP TABLE IF EXISTS snippets CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email accounts table
CREATE TABLE email_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'gmail', 'outlook', 'imap', 'demo'
  email TEXT NOT NULL,
  display_name TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Snippets table
CREATE TABLE snippets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  shortcut TEXT,
  tags TEXT[] DEFAULT '{}',
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email metadata table (for local email management)
CREATE TABLE email_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES email_accounts(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL, -- Provider's message ID
  thread_id TEXT,
  subject TEXT,
  sender_email TEXT,
  sender_name TEXT,
  recipient_emails TEXT[],
  labels TEXT[] DEFAULT '{}',
  snippet TEXT, -- Email preview/snippet
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

-- Scheduled emails table
CREATE TABLE scheduled_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES email_accounts(id) ON DELETE CASCADE,
  to_emails TEXT[] NOT NULL,
  cc_emails TEXT[] DEFAULT '{}',
  bcc_emails TEXT[] DEFAULT '{}',
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Follow-up reminders table
CREATE TABLE follow_up_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES email_accounts(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL,
  remind_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'triggered', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shareable message views table
CREATE TABLE shareable_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES email_accounts(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'base64url'),
  expires_at TIMESTAMP WITH TIME ZONE,
  comments_enabled BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments on shared views table
CREATE TABLE shared_view_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shareable_view_id UUID REFERENCES shareable_views(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_email_accounts_user_id ON email_accounts(user_id);
CREATE INDEX idx_email_metadata_account_id ON email_metadata(account_id);
CREATE INDEX idx_email_metadata_received_at ON email_metadata(received_at DESC);
CREATE INDEX idx_email_metadata_is_read ON email_metadata(is_read);
CREATE INDEX idx_email_metadata_is_snoozed ON email_metadata(is_snoozed, snooze_until);
CREATE INDEX idx_scheduled_emails_scheduled_for ON scheduled_emails(scheduled_for);
CREATE INDEX idx_follow_up_reminders_remind_at ON follow_up_reminders(remind_at);
CREATE INDEX idx_shareable_views_token ON shareable_views(token);

-- RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shareable_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_view_comments ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can view own email accounts" ON email_accounts FOR SELECT USING (user_id::text = auth.uid()::text);
CREATE POLICY "Users can manage own email accounts" ON email_accounts FOR ALL USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can view own snippets" ON snippets FOR SELECT USING (user_id::text = auth.uid()::text OR is_shared = true);
CREATE POLICY "Users can manage own snippets" ON snippets FOR ALL USING (user_id::text = auth.uid()::text);

-- Email metadata policies (through account ownership)
CREATE POLICY "Users can view own email metadata" ON email_metadata FOR SELECT 
USING (account_id IN (SELECT id FROM email_accounts WHERE user_id::text = auth.uid()::text));

CREATE POLICY "Users can manage own email metadata" ON email_metadata FOR ALL 
USING (account_id IN (SELECT id FROM email_accounts WHERE user_id::text = auth.uid()::text));

-- Similar policies for other tables...
CREATE POLICY "Users can manage own scheduled emails" ON scheduled_emails FOR ALL 
USING (account_id IN (SELECT id FROM email_accounts WHERE user_id::text = auth.uid()::text));

CREATE POLICY "Users can manage own reminders" ON follow_up_reminders FOR ALL 
USING (account_id IN (SELECT id FROM email_accounts WHERE user_id::text = auth.uid()::text));

CREATE POLICY "Users can manage own shareable views" ON shareable_views FOR ALL 
USING (account_id IN (SELECT id FROM email_accounts WHERE user_id::text = auth.uid()::text));

-- Public access to shareable views by token
CREATE POLICY "Public can view shareable views by token" ON shareable_views FOR SELECT 
USING (expires_at IS NULL OR expires_at > NOW());

CREATE POLICY "Public can view comments on shareable views" ON shared_view_comments FOR SELECT 
USING (shareable_view_id IN (SELECT id FROM shareable_views WHERE expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Anyone can add comments to enabled shareable views" ON shared_view_comments FOR INSERT 
WITH CHECK (shareable_view_id IN (SELECT id FROM shareable_views WHERE comments_enabled = true AND (expires_at IS NULL OR expires_at > NOW())));

-- Create demo user and account
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
    },
    "inbox_splits": [
      {"name": "Primary", "rules": []},
      {"name": "Social", "rules": [{"type": "sender_domain", "value": "twitter.com"}]},
      {"name": "Updates", "rules": [{"type": "sender_domain", "value": "github.com"}]}
    ]
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

-- Insert demo emails
INSERT INTO email_metadata (
  id, account_id, message_id, thread_id, subject, sender_email, sender_name, 
  recipient_emails, labels, snippet, has_attachments, is_read, is_starred, is_archived, is_snoozed, 
  received_at, created_at
) VALUES 
-- 1. Work Email - Project Update
(
  '770e8400-e29b-41d4-a716-446655440001',
  '660e8400-e29b-41d4-a716-446655440000',
  'msg_001',
  'thread_001',
  'Q4 Project Update - Mobile App Launch',
  'sarah.chen@techcorp.com',
  'Sarah Chen',
  ARRAY['demo@mastermail.com'],
  ARRAY['work', 'important'],
  'Hi team, I wanted to update everyone on our Q4 mobile app launch progress. We''re on track for the December release with some exciting new features...',
  true,
  false,
  true,
  false,
  false,
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '2 hours'
),
-- 2. Promotional Email - Black Friday Sale
(
  '770e8400-e29b-41d4-a716-446655440002',
  '660e8400-e29b-41d4-a716-446655440000',
  'msg_002',
  'thread_002',
  '🔥 Black Friday: 70% OFF Everything! Limited Time',
  'deals@shopmart.com',
  'ShopMart Deals',
  ARRAY['demo@mastermail.com'],
  ARRAY['promotions'],
  'Don''t miss out on our biggest sale of the year! Get 70% off on all items including electronics, clothing, and home goods. Limited time offer ends Sunday...',
  false,
  true,
  false,
  false,
  false,
  NOW() - INTERVAL '4 hours',
  NOW() - INTERVAL '4 hours'
),
-- 3. OTP Email - Security Code
(
  '770e8400-e29b-41d4-a716-446655440003',
  '660e8400-e29b-41d4-a716-446655440000',
  'msg_003',
  'thread_003',
  'Your verification code: 847392',
  'noreply@securebank.com',
  'SecureBank Security',
  ARRAY['demo@mastermail.com'],
  ARRAY['important', 'security'],
  'Your verification code is: 847392. This code will expire in 10 minutes. If you didn''t request this code, please contact our support team immediately.',
  false,
  false,
  false,
  false,
  false,
  NOW() - INTERVAL '15 minutes',
  NOW() - INTERVAL '15 minutes'
),
-- 4. Social Email - Twitter Notification
(
  '770e8400-e29b-41d4-a716-446655440004',
  '660e8400-e29b-41d4-a716-446655440000',
  'msg_004',
  'thread_004',
  'You have 3 new mentions on Twitter',
  'notifications@twitter.com',
  'Twitter',
  ARRAY['demo@mastermail.com'],
  ARRAY['social'],
  'You have 3 new mentions on Twitter. @john_doe mentioned you in a tweet about the new product launch. @tech_news shared your latest article...',
  false,
  true,
  false,
  false,
  false,
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '1 hour'
),
-- 5. Work Email - Meeting Invitation
(
  '770e8400-e29b-41d4-a716-446655440005',
  '660e8400-e29b-41d4-a716-446655440000',
  'msg_005',
  'thread_005',
  'Meeting: Product Strategy Review - Tomorrow 2PM',
  'mike.johnson@techcorp.com',
  'Mike Johnson',
  ARRAY['demo@mastermail.com', 'team@techcorp.com'],
  ARRAY['work', 'meeting'],
  'Hi team, just a reminder about our Product Strategy Review meeting tomorrow at 2PM. We''ll be discussing the Q1 roadmap and budget allocation. Please prepare your updates...',
  true,
  false,
  false,
  false,
  true,
  NOW() - INTERVAL '30 minutes',
  NOW() - INTERVAL '30 minutes'
),
-- 6. Newsletter - Tech News
(
  '770e8400-e29b-41d4-a716-446655440006',
  '660e8400-e29b-41d4-a716-446655440000',
  'msg_006',
  'thread_006',
  'Weekly Tech Digest: AI Breakthroughs & Startup News',
  'newsletter@techweekly.com',
  'Tech Weekly',
  ARRAY['demo@mastermail.com'],
  ARRAY['newsletters'],
  'This week in tech: OpenAI releases GPT-5 with enhanced reasoning capabilities, Tesla announces breakthrough in battery technology, and 3 new unicorn startups emerge...',
  false,
  true,
  false,
  false,
  false,
  NOW() - INTERVAL '6 hours',
  NOW() - INTERVAL '6 hours'
),
-- 7. Personal Email - Family Update
(
  '770e8400-e29b-41d4-a716-446655440007',
  '660e8400-e29b-41d4-a716-446655440000',
  'msg_007',
  'thread_007',
  'Thanksgiving Plans - Can you make it?',
  'mom@family.com',
  'Mom',
  ARRAY['demo@mastermail.com'],
  ARRAY['personal', 'family'],
  'Hi honey, just wanted to check if you can make it to Thanksgiving dinner this year. Grandma is asking about you and we''d love to have you here. Let me know soon...',
  false,
  false,
  true,
  false,
  false,
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
),
-- 8. Work Email - Code Review Request
(
  '770e8400-e29b-41d4-a716-446655440008',
  '660e8400-e29b-41d4-a716-446655440000',
  'msg_008',
  'thread_008',
  'PR Review: Feature/user-authentication',
  'alex.kim@techcorp.com',
  'Alex Kim',
  ARRAY['demo@mastermail.com'],
  ARRAY['work', 'code-review'],
  'Hey, could you review the user authentication feature PR? I''ve implemented OAuth2 with Google and Microsoft providers. The main changes are in the auth service...',
  false,
  false,
  false,
  false,
  false,
  NOW() - INTERVAL '3 hours',
  NOW() - INTERVAL '3 hours'
),
-- 9. Promotional Email - Subscription Renewal
(
  '770e8400-e29b-41d4-a716-446655440009',
  '660e8400-e29b-41d4-a716-446655440000',
  'msg_009',
  'thread_009',
  'Your Premium Subscription expires in 7 days',
  'billing@premiumservice.com',
  'Premium Service',
  ARRAY['demo@mastermail.com'],
  ARRAY['billing', 'important'],
  'Your Premium subscription will expire in 7 days. To continue enjoying all our premium features, please renew your subscription. We''re offering a 20% discount...',
  false,
  true,
  false,
  false,
  false,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
),
-- 10. Social Email - LinkedIn Connection
(
  '770e8400-e29b-41d4-a716-446655440010',
  '660e8400-e29b-41d4-a716-446655440000',
  'msg_010',
  'thread_010',
  'You have 5 new connection requests on LinkedIn',
  'notifications@linkedin.com',
  'LinkedIn',
  ARRAY['demo@mastermail.com'],
  ARRAY['social', 'linkedin'],
  'You have 5 new connection requests waiting for your response. Sarah Johnson, Product Manager at TechCorp, wants to connect. View all requests to expand your network...',
  false,
  true,
  false,
  false,
  false,
  NOW() - INTERVAL '5 hours',
  NOW() - INTERVAL '5 hours'
),
-- 11. Work Email - Bug Report
(
  '770e8400-e29b-41d4-a716-446655440011',
  '660e8400-e29b-41d4-a716-446655440000',
  'msg_011',
  'thread_011',
  'URGENT: Critical bug in payment system',
  'qa.team@techcorp.com',
  'QA Team',
  ARRAY['demo@mastermail.com', 'dev-team@techcorp.com'],
  ARRAY['work', 'urgent', 'bug'],
  'URGENT: We''ve discovered a critical bug in the payment processing system that''s causing duplicate charges. This affects 15% of transactions. Immediate fix required...',
  true,
  false,
  true,
  false,
  false,
  NOW() - INTERVAL '45 minutes',
  NOW() - INTERVAL '45 minutes'
),
-- 12. Personal Email - Event Invitation
(
  '770e8400-e29b-41d4-a716-446655440012',
  '660e8400-e29b-41d4-a716-446655440000',
  'msg_012',
  'thread_012',
  'You''re invited: Annual Company Holiday Party',
  'events@techcorp.com',
  'HR Events Team',
  ARRAY['demo@mastermail.com'],
  ARRAY['personal', 'event'],
  'You''re cordially invited to our Annual Company Holiday Party! Join us on December 15th at the Grand Ballroom for an evening of celebration, food, and fun...',
  true,
  true,
  false,
  true,
  false,
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days'
);

-- Update some emails to have different read states and flags for better testing
UPDATE email_metadata SET is_read = false WHERE message_id IN ('msg_001', 'msg_003', 'msg_005', 'msg_007', 'msg_008', 'msg_011');
UPDATE email_metadata SET is_starred = true WHERE message_id IN ('msg_001', 'msg_007', 'msg_011');
UPDATE email_metadata SET is_archived = true WHERE message_id = 'msg_012';
UPDATE email_metadata SET is_snoozed = true, snooze_until = NOW() + INTERVAL '2 hours' WHERE message_id = 'msg_005';

-- Verify the setup
SELECT 'Setup complete!' as status, 
       (SELECT COUNT(*) FROM users) as users_count,
       (SELECT COUNT(*) FROM email_accounts) as accounts_count,
       (SELECT COUNT(*) FROM email_metadata) as emails_count;

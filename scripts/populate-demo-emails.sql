-- Populate demo emails for testing
-- This script creates 12 diverse demo emails with various contexts

-- First, let's create a demo user if it doesn't exist
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

-- Create a demo email account
INSERT INTO email_accounts (id, user_id, provider, email, display_name, access_token, refresh_token, settings)
VALUES (
  '660e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440000',
  'gmail',
  'demo@mastermail.com',
  'Demo User',
  'demo_access_token',
  'demo_refresh_token',
  '{
    "sync_enabled": true,
    "sync_frequency": 300
  }'
) ON CONFLICT (user_id, provider, email) DO NOTHING;

-- Now insert 12 diverse demo emails
INSERT INTO email_metadata (
  id, account_id, message_id, thread_id, subject, sender_email, sender_name, 
  recipient_emails, labels, is_read, is_starred, is_archived, is_snoozed, 
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
  false,
  false,
  false,
  false,
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
  'You\'re invited: Annual Company Holiday Party',
  'events@techcorp.com',
  'HR Events Team',
  ARRAY['demo@mastermail.com'],
  ARRAY['personal', 'event'],
  true,
  false,
  false,
  false,
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days'
);

-- Update some emails to have different read states and flags for better testing
UPDATE email_metadata SET is_read = false WHERE message_id IN ('msg_001', 'msg_003', 'msg_005', 'msg_007', 'msg_008', 'msg_011');
UPDATE email_metadata SET is_starred = true WHERE message_id IN ('msg_001', 'msg_007', 'msg_011');
UPDATE email_metadata SET is_archived = true WHERE message_id = 'msg_012';
UPDATE email_metadata SET is_snoozed = true, snooze_until = NOW() + INTERVAL '2 hours' WHERE message_id = 'msg_005';
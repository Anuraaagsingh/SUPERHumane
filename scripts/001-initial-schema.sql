-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
  provider TEXT NOT NULL, -- 'gmail', 'outlook', 'imap'
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

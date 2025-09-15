-- Create scheduled_jobs table for background job processing
CREATE TABLE IF NOT EXISTS scheduled_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('send_email', 'reminder', 'unsnooze')),
  payload JSONB NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient job processing
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_pending ON scheduled_jobs(status, scheduled_for) 
WHERE status = 'pending';

-- Create index for user jobs
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_user ON scheduled_jobs(user_id);

-- Enable RLS
ALTER TABLE scheduled_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage their own scheduled jobs" ON scheduled_jobs
  FOR ALL USING (auth.uid() = user_id);

-- Update messages table to support snooze and reminders
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS is_snoozed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS snoozed_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS has_reminder BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_triggered_at TIMESTAMPTZ;

-- Create index for snoozed messages
CREATE INDEX IF NOT EXISTS idx_messages_snoozed ON messages(is_snoozed, snoozed_until)
WHERE is_snoozed = TRUE;

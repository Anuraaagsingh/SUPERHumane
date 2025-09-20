# 🚨 URGENT: Database Setup Required

## The Problem
Your Vercel logs show: `"Could not find the table 'public.users' in the schema cache"`

This means the database tables haven't been created in Supabase yet.

## ⚡ Quick Fix (2 minutes)

### Step 1: Access Supabase
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar

### Step 2: Run the Setup Script
1. Copy the entire contents of `scripts/setup-database.sql`
2. Paste it into the SQL Editor
3. Click "Run" to execute the script

### Step 3: Verify Setup
The script will show:
```
Setup complete! | users_count: 1 | accounts_count: 1 | emails_count: 12
```

## What This Script Does

1. **Creates all required tables**:
   - `users` - User profiles
   - `email_accounts` - Email account connections
   - `email_metadata` - Email messages
   - `snippets` - User snippets
   - `scheduled_emails` - Scheduled emails
   - `follow_up_reminders` - Follow-up reminders
   - `shareable_views` - Shareable message views

2. **Sets up Row Level Security (RLS)** policies for data protection

3. **Creates demo data**:
   - Demo user: `demo@mastermail.com`
   - Demo email account
   - 12 sample emails with realistic content

4. **Adds performance indexes** for fast queries

## After Running the Script

1. **Test the demo account**:
   - Go to your Vercel deployment
   - Login with `demo@mastermail.com` / `demo123`
   - You should now see 12 emails in the inbox

2. **Check the debug info**:
   - Click the 🔍 button to see account/email counts
   - Check browser console for detailed logs

## If You Still Have Issues

1. **Check Supabase logs** for any SQL errors
2. **Verify environment variables** in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. **Test the debug endpoints**:
   - `GET /api/debug/emails` - Should show accounts and emails
   - `POST /api/debug/populate-demo` - Should populate demo emails

## Expected Result

After running the script, you should see:
- ✅ 12 emails in the inbox
- ✅ Proper email formatting with snippets
- ✅ Working keyboard shortcuts
- ✅ Email actions (star, archive, etc.)

The script is idempotent - you can run it multiple times safely.

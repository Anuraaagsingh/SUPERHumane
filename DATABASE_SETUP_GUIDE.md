# 🗄️ Database Setup Guide

## The Problem
You have no tables in your Supabase database, which is causing authentication to fail when trying to set up user profiles.

## Quick Fix (5 minutes)

### Step 1: Access Supabase SQL Editor
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click on **SQL Editor** in the left sidebar

### Step 2: Run the Quick Setup Script
1. Copy the contents of `scripts/quick-database-setup.sql`
2. Paste it into the SQL Editor
3. Click **Run** (or press Ctrl+Enter)

### Step 3: Verify Setup
You should see a success message with table counts:
```
Quick setup complete! | users_count: 1 | accounts_count: 1 | emails_count: 2
```

## What This Creates

### Essential Tables:
- **`users`** - Stores user profiles and settings
- **`email_accounts`** - Stores OAuth provider information (Google, etc.)
- **`email_metadata`** - Stores email messages

### Security:
- **Row Level Security (RLS)** enabled on all tables
- **Policies** ensure users can only access their own data
- **Demo user** created for testing

### Demo Data:
- Demo user: `demo@mastermail.com`
- Demo email account
- Sample emails for testing

## Alternative: Full Database Setup

If you want all features (snippets, scheduled emails, etc.), run the full setup:

1. Copy contents of `scripts/setup-database.sql`
2. Paste into Supabase SQL Editor
3. Click **Run**

This creates all tables with comprehensive features and demo data.

## Test Your Setup

After running the script:

1. **Test Demo Login:**
   - Go to your login page
   - Click "Try Demo Account"
   - Should work without errors

2. **Test Google OAuth:**
   - Click "Continue with Gmail"
   - Complete OAuth flow
   - Should redirect to inbox successfully

3. **Check Debug Endpoint:**
   - Visit `/api/debug/supabase-config`
   - Should show database connection working

## Troubleshooting

### If you get permission errors:
- Make sure you're logged into Supabase as the project owner
- Check that RLS policies are created correctly

### If authentication still fails:
- Check browser console for error messages
- Verify environment variables are set in Vercel
- Check Supabase Google OAuth configuration

### If you see "relation does not exist":
- The script didn't run completely
- Try running it again
- Check for any error messages in the SQL Editor

## Next Steps

Once the database is set up:

1. **Configure Google OAuth** in Supabase Dashboard
2. **Set environment variables** in Vercel
3. **Test the authentication flow**
4. **Deploy and test in production**

The database setup is the foundation - without it, authentication will always fail!

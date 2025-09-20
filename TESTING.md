# Testing Guide

## Demo Account Testing

1. **Access the application**: Visit https://super-humane-9yo7448ep-anurags-projects-47784640.vercel.app/login

2. **Login with Demo Account**:
   - Click "Try Demo Account" button
   - Email: `demo@mastermail.com`
   - Password: `demo123`

3. **Expected Behavior**:
   - Should redirect to `/inbox`
   - Should see 12 demo emails with various labels and states
   - Emails should have snippets and attachment indicators
   - Should be able to navigate between emails using keyboard shortcuts

## Gmail Account Testing

1. **Login with Gmail**:
   - Click "Continue with Gmail" button
   - Complete OAuth flow
   - Grant necessary permissions

2. **Expected Behavior**:
   - Should redirect to `/inbox`
   - Should sync recent emails from Gmail
   - Should display emails with proper formatting

## Database Migration

If you need to run the database migration to add the new fields:

```sql
-- Run this in your Supabase SQL editor
ALTER TABLE email_metadata 
ADD COLUMN IF NOT EXISTS snippet TEXT;

ALTER TABLE email_metadata 
ADD COLUMN IF NOT EXISTS has_attachments BOOLEAN DEFAULT false;

UPDATE email_metadata 
SET snippet = '' 
WHERE snippet IS NULL;

UPDATE email_metadata 
SET has_attachments = false 
WHERE has_attachments IS NULL;
```

## Troubleshooting

### Demo emails not showing
- Check if the demo account was created properly
- Verify the `email_accounts` table has a record for the demo user
- Check if the `email_metadata` table has demo emails

### Gmail emails not syncing
- Verify OAuth tokens are being stored in `email_accounts` table
- Check the sync service logs for errors
- Ensure Gmail API credentials are properly configured

### Common Issues
1. **Database schema mismatch**: Run the migration script above
2. **Missing environment variables**: Check Vercel environment variables
3. **OAuth scope issues**: Ensure proper scopes are requested
4. **CORS issues**: Check redirect URLs in OAuth providers

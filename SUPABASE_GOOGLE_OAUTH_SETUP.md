# 🔐 Supabase Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication using Supabase's built-in OAuth integration, which is much more reliable than custom OAuth implementation.

## Prerequisites

- Supabase project set up
- Google Cloud Console access
- Vercel deployment

## Step 1: Configure Google OAuth in Google Cloud Console

### 1.1 Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Select **Web application** as the application type
6. Fill in the details:
   - **Name**: MasterMail OAuth Client
   - **Authorized JavaScript origins**: 
     - `https://super-humane-mvt9kmllb-anurags-projects-47784640.vercel.app`
     - `http://localhost:3000` (for development)
   - **Authorized redirect URIs**:
     - `https://your-supabase-project-ref.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback` (for development)

### 1.2 Configure OAuth Consent Screen

1. Go to **OAuth consent screen** in Google Cloud Console
2. Choose **External** user type
3. Fill in the required information:
   - **App name**: MasterMail
   - **User support email**: your-email@example.com
   - **Developer contact information**: your-email@example.com
4. Add scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
5. Add test users (your email) for testing
6. Save and continue

## Step 2: Configure Supabase Google OAuth

### 2.1 Enable Google Provider in Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Find **Google** and click **Enable**
5. Enter your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
6. **Redirect URL**: Copy the URL provided by Supabase (should be `https://your-project-ref.supabase.co/auth/v1/callback`)
7. Save the configuration

### 2.2 Update Google Cloud Console with Supabase Redirect URI

1. Go back to Google Cloud Console
2. Edit your OAuth 2.0 Client ID
3. Add the Supabase redirect URI to **Authorized redirect URIs**:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
4. Save changes

## Step 3: Configure Vercel Environment Variables

Set these environment variables in your Vercel dashboard:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SITE_URL=https://super-humane-mvt9kmllb-anurags-projects-47784640.vercel.app
```

## Step 4: Update Database Schema (if needed)

Make sure your Supabase database has the required tables. Run this SQL in Supabase SQL Editor:

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_metadata ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Create policies for email_accounts table
CREATE POLICY "Users can view own email accounts" ON email_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email accounts" ON email_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email accounts" ON email_accounts
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for email_metadata table
CREATE POLICY "Users can view own emails" ON email_metadata
  FOR SELECT USING (
    account_id IN (
      SELECT id FROM email_accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own emails" ON email_metadata
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT id FROM email_accounts WHERE user_id = auth.uid()
    )
  );
```

## Step 5: Test the Implementation

### 5.1 Test Locally

1. Start your development server:
   ```bash
   npm run dev
   ```
2. Go to `http://localhost:3000/login`
3. Click "Continue with Gmail"
4. Complete the OAuth flow
5. Verify you're redirected to the inbox

### 5.2 Test in Production

1. Deploy to Vercel
2. Go to your production URL
3. Test the Gmail login flow
4. Check Vercel function logs for any errors

## Step 6: Handle Gmail API Access

After successful OAuth, you can access Gmail APIs using the provider tokens:

```typescript
// In your component or API route
const { data: { user } } = await supabase.auth.getUser()
const providerToken = user?.session?.provider_token

if (providerToken) {
  // Use the token to make Gmail API calls
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages', {
    headers: {
      'Authorization': `Bearer ${providerToken}`
    }
  })
}
```

## Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch" error**
   - Ensure the redirect URI in Google Cloud Console matches exactly with Supabase
   - Check for trailing slashes or HTTP vs HTTPS mismatches

2. **"invalid_client" error**
   - Verify Client ID and Client Secret are correct
   - Ensure they're set in Supabase dashboard

3. **"access_denied" error**
   - Check OAuth consent screen configuration
   - Ensure test users are added if in testing mode

4. **CORS errors**
   - Verify authorized JavaScript origins in Google Cloud Console
   - Check that your domain is correctly configured

### Debug Steps

1. Check Supabase Auth logs in the dashboard
2. Check Vercel function logs
3. Use browser developer tools to inspect network requests
4. Verify environment variables are set correctly

## Benefits of Supabase OAuth

- ✅ Handles token refresh automatically
- ✅ Secure token storage
- ✅ Built-in session management
- ✅ No custom OAuth implementation needed
- ✅ Follows OAuth 2.0 best practices
- ✅ Easy to maintain and debug

This approach is much more reliable than custom OAuth implementation and follows industry best practices.

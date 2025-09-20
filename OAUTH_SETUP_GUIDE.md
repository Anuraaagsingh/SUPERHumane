# 🔧 Gmail OAuth Setup Guide

## 🚨 **Error: "Missing required parameter: client_id"**

This error occurs when the Gmail OAuth credentials are not properly configured. Follow these steps to fix it:

## Step 1: Create Google OAuth Credentials

### 1.1 Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Gmail API**
   - **Google+ API** (for user info)

### 1.2 Create OAuth 2.0 Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client IDs**
3. Set **Application type** to "Web application"
4. Add **Authorized redirect URIs**:
   ```
   http://localhost:3000/api/auth/gmail-callback
   https://your-domain.vercel.app/api/auth/gmail-callback
   ```
5. Click **Create**
6. Copy the **Client ID** and **Client Secret**

## Step 2: Configure Environment Variables

### 2.1 For Vercel Deployment
Add these to your **Vercel Environment Variables**:

```bash
# Gmail OAuth (REQUIRED)
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here

# Site URL (REQUIRED for OAuth redirects)
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app

# Supabase (if not already set)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2.2 For Local Development
Create a `.env.local` file:

```bash
# Gmail OAuth
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Step 3: Verify Configuration

### 3.1 Use Debug Tools
1. Deploy your app to Vercel
2. Go to the inbox page
3. Click the **⚙️** button to check environment variables
4. Look for any missing variables in the console

### 3.2 Test Gmail OAuth
1. Click "Continue with Gmail"
2. You should be redirected to Google's OAuth consent screen
3. After authorization, you should be redirected back to your app

## Step 4: OAuth Consent Screen (Important!)

### 4.1 Configure OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type
3. Fill in required fields:
   - **App name**: MasterMail
   - **User support email**: your email
   - **Developer contact**: your email
4. Add scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`

### 4.2 Add Test Users (for Testing)
1. In OAuth consent screen, go to **Test users**
2. Add your email address
3. This allows you to test the OAuth flow

## Step 5: Common Issues & Solutions

### Issue: "Error 400: invalid_request"
**Solution**: Check that your redirect URI exactly matches what you configured in Google Cloud Console

### Issue: "This app isn't verified"
**Solution**: This is normal for testing. Click "Advanced" → "Go to MasterMail (unsafe)" to proceed

### Issue: "Access blocked: This app's request is invalid"
**Solution**: 
1. Check your OAuth consent screen configuration
2. Ensure all required scopes are added
3. Verify the redirect URI is correct

### Issue: Environment variables not loading
**Solution**:
1. Redeploy your Vercel app after adding environment variables
2. Check that variable names are exactly as specified
3. Use the **⚙️** debug button to verify

## Step 6: Production Considerations

### 6.1 Publish Your App
1. Once testing is complete, go to OAuth consent screen
2. Click **Publish App** to make it available to all users
3. This removes the "unverified app" warning

### 6.2 Domain Verification
1. Add your production domain to authorized domains
2. This improves trust and reduces security warnings

## 🔍 **Debugging Tools Available**

- **⚙️ Environment Check**: Verifies all required environment variables
- **🏥 Database Check**: Verifies database tables exist
- **🔍 Debug Emails**: Shows account and email data
- **📧 Populate Demo**: Adds demo emails for testing

## 📋 **Required OAuth Scopes**

Based on the [Google OAuth 2.0 documentation](https://developers.google.com/identity/protocols/oauth2), these scopes are required:

```javascript
const scopes = [
  'https://www.googleapis.com/auth/gmail.readonly',    // Read Gmail messages
  'https://www.googleapis.com/auth/gmail.send',        // Send emails
  'https://www.googleapis.com/auth/gmail.modify',      // Modify messages (star, archive, etc.)
  'https://www.googleapis.com/auth/userinfo.email',    // Get user email
  'https://www.googleapis.com/auth/userinfo.profile'   // Get user profile info
]
```

## ✅ **Verification Checklist**

- [ ] Google Cloud Console project created
- [ ] Gmail API and Google+ API enabled
- [ ] OAuth 2.0 credentials created
- [ ] Redirect URIs configured correctly
- [ ] OAuth consent screen configured
- [ ] Required scopes added
- [ ] Test users added (for testing)
- [ ] Environment variables set in Vercel
- [ ] App deployed and tested
- [ ] Gmail OAuth flow working

After completing these steps, the "Missing required parameter: client_id" error should be resolved, and Gmail OAuth should work correctly.

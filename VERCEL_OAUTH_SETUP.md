# 🚀 Vercel Gmail OAuth Setup Guide

Your app is deployed at: **https://super-humane-mvt9kmllb-anurags-projects-47784640.vercel.app**

## ✅ Current Status
- Gmail OAuth credentials are configured in Vercel ✅
- Supabase is configured ✅
- App is deployed and running ✅

## 🔧 Required Google Cloud Console Configuration

### 1. Update OAuth Redirect URIs
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Find your OAuth 2.0 Client ID
4. Click **Edit** (pencil icon)
5. Add these **Authorized redirect URIs**:
   ```
   https://super-humane-mvt9kmllb-anurags-projects-47784640.vercel.app/api/auth/gmail-callback
   http://localhost:3000/api/auth/gmail-callback
   ```
6. Click **Save**

### 2. Configure OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type
3. Fill in required fields:
   - **App name**: MasterMail
   - **User support email**: your email
   - **Developer contact**: your email
4. Add these scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`

### 3. Add Test Users (for Testing)
1. In OAuth consent screen, go to **Test users**
2. Add your email address
3. This allows you to test the OAuth flow

## 🔄 Deploy the Updated Code

After making the changes above, redeploy your app:

```bash
# Commit and push the changes
git add .
git commit -m "Fix Gmail OAuth redirect URI for production"
git push

# Vercel will automatically redeploy
```

## 🧪 Test the Authentication

1. Go to: https://super-humane-mvt9kmllb-anurags-projects-47784640.vercel.app
2. Click **"Continue with Gmail"**
3. You should be redirected to Google's OAuth consent screen
4. After authorization, you should be redirected back to your app

## 🔍 Debugging

If you still get errors, check:

1. **Environment Variables**: Visit https://super-humane-mvt9kmllb-anurags-projects-47784640.vercel.app/api/health/env
2. **Console Logs**: Check Vercel function logs in your dashboard
3. **Redirect URI**: Make sure it exactly matches what you configured in Google Cloud Console

## 🚨 Common Issues

### "Error 400: invalid_request"
- **Solution**: Check that your redirect URI exactly matches: `https://super-humane-mvt9kmllb-anurags-projects-47784640.vercel.app/api/auth/gmail-callback`

### "This app isn't verified"
- **Solution**: This is normal for testing. Click "Advanced" → "Go to MasterMail (unsafe)" to proceed

### "Access blocked: This app's request is invalid"
- **Solution**: 
  1. Check your OAuth consent screen configuration
  2. Ensure all required scopes are added
  3. Verify the redirect URI is correct

## ✅ Verification Checklist

- [ ] Google Cloud Console project created
- [ ] Gmail API and Google+ API enabled
- [ ] OAuth 2.0 credentials created
- [ ] Redirect URIs configured correctly (both localhost and production)
- [ ] OAuth consent screen configured
- [ ] Required scopes added
- [ ] Test users added (for testing)
- [ ] App redeployed to Vercel
- [ ] Gmail OAuth flow working on production

After completing these steps, Gmail authentication should work perfectly on your Vercel deployment!

# 🚀 Quick Fix for Gmail Authentication 500 Error

## Immediate Steps to Fix the Issue

### 1. Check Vercel Deployment Protection ⚠️
**This is likely the main cause of your 500 error!**

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `super-humane-f3drn93cj-anurags-projects-47784640`
3. Go to **Settings** → **Security**
4. Look for **"Deployment Protection"** section
5. **DISABLE** deployment protection or configure it to allow API routes
6. Save changes

### 2. Set Environment Variables in Vercel 🔧

Go to your Vercel project settings and add these environment variables:

```
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
NEXT_PUBLIC_SITE_URL=https://super-humane-mvt9kmllb-anurags-projects-47784640.vercel.app
```

**Steps:**
1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable above
3. Make sure to select "Production" environment
4. Save and redeploy

### 3. Fix Google OAuth Redirect URI 🔗

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. In **"Authorized redirect URIs"**, add:
   ```
   https://super-humane-mvt9kmllb-anurags-projects-47784640.vercel.app/api/auth/gmail-callback
   ```
5. Save changes

### 4. Test the Configuration 🧪

After making the above changes:

1. **Redeploy** your Vercel application
2. Visit: `https://super-humane-mvt9kmllb-anurags-projects-47784640.vercel.app/api/debug/gmail-config`
3. Check if all environment variables are properly set
4. Try the Gmail login again

### 5. Check Vercel Function Logs 📊

If still having issues:

1. Go to Vercel Dashboard → Your Project → Functions
2. Click on the `gmail-auth` function
3. Check the logs for detailed error messages
4. Look for the debug information we added

## Expected Results ✅

After these fixes:
- The 500 error should be resolved
- Gmail authentication should work properly
- You should be redirected to Google OAuth consent screen
- After consent, you should be redirected back to your app

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| 500 Internal Server Error | Disable Vercel Deployment Protection |
| redirect_uri_mismatch | Add correct redirect URI to Google Console |
| Environment variables not found | Set them in Vercel dashboard |
| Still getting localhost redirects | Check NEXT_PUBLIC_SITE_URL is set correctly |

## Need Help? 🆘

If you're still having issues after these steps:
1. Check the debug endpoint: `/api/debug/gmail-config`
2. Check Vercel function logs
3. Verify all environment variables are set correctly
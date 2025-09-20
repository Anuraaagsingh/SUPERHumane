# Environment Variables Setup Guide

## Required Environment Variables

Set these in your Vercel dashboard under Settings → Environment Variables:

### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### Gmail OAuth Configuration
```
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### Site Configuration
```
NEXT_PUBLIC_SITE_URL=https://super-humane-f3drn93cj-anurags-projects-47784640.vercel.app
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. In **Authorized redirect URIs**, add:
   ```
   https://super-humane-f3drn93cj-anurags-projects-47784640.vercel.app/api/auth/gmail-callback
   ```
6. Save the changes

## Security Notes

- Never commit `.env` files to version control
- Use Vercel's environment variables for production
- The `GOOGLE_CLIENT_SECRET` should never be exposed to the client-side
- All sensitive keys are handled server-side only

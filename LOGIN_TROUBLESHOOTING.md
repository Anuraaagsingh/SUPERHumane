# Login Loop Troubleshooting Guide

If you're experiencing a login loop where you're continuously redirected back to the login page after attempting to authenticate, follow this guide to diagnose and fix the issue.

## Recent Fixes

We've made several improvements to the authentication flow that should resolve most login loop issues:

1. **Eliminated Redundant API Calls**: Fixed duplicate profile setup calls that could cause race conditions.
2. **Improved Cookie Handling**: Enhanced cookie management in both server and middleware contexts.
3. **Enhanced Middleware**: Added better route protection and session validation.
4. **Improved OAuth Flow**: Updated Google OAuth flow with proper parameters for reliable authentication.
5. **Better Error Handling**: Added more comprehensive error logging and user feedback.

## 1. Environment Variables

Ensure these environment variables are properly set in your `.env.local` file (for local development) and in your Vercel project settings (for deployment):

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Site URL (used for OAuth redirects)
NEXT_PUBLIC_SITE_URL=https://your-deployed-url.vercel.app

# Google OAuth (for Gmail integration)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

You can check if your environment variables are correctly loaded by visiting `/api/debug/env` in your deployed application.

## 2. Google OAuth Configuration

In the Google Cloud Console:

1. Go to your project > APIs & Services > Credentials
2. Edit your OAuth 2.0 Client ID
3. Add the exact callback URL to "Authorized redirect URIs":
   ```
   https://your-deployed-url.vercel.app/login/callback
   ```
4. Make sure the URI is exact - no trailing slashes or typos
5. Ensure the Gmail API is enabled in the API Library
6. Make sure the OAuth consent screen is properly configured

## 3. Supabase Configuration

In your Supabase dashboard:

1. Go to Authentication > URL Configuration
2. Set "Site URL" to your deployed URL (e.g., `https://your-deployed-url.vercel.app`)
3. Add `/login/callback` to the "Redirect URLs" list
4. Go to Authentication > Providers > Google
5. Make sure it's enabled and has the correct Client ID and Client Secret
6. Set the correct scopes: `https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify`

## 4. Browser Issues

1. Check if cookies are being blocked by your browser
2. Try using an incognito/private window
3. Clear browser cache and cookies
4. Check browser console for any errors during the authentication process

## 5. Debugging Tools

The application includes several debugging endpoints:

- `/api/debug/env` - Check if environment variables are properly set
- `/api/debug/auth` - Check the current authentication status

## 6. Common Issues and Solutions

### "No authorization code provided"
- Check that Google OAuth is correctly configured
- Verify the redirect URI is exactly as expected
- Check for any browser extensions blocking redirects

### "Failed to exchange code for session"
- Check that your Supabase URL and Anon Key are correct
- Verify that the Site URL in Supabase matches your deployed URL
- Make sure the callback route is properly handling the code

### "User is null after login"
- Check if cookies are being properly set
- Verify that the middleware is correctly handling authentication
- Check if there are any CORS issues
- Make sure your browser accepts third-party cookies

### Continuous Redirect Loop
- Check that the middleware is correctly detecting authenticated users
- Verify that the `useAuth` hook is properly setting the user state
- Make sure the login callback is correctly exchanging the code for a session
- Check browser console for any cookie-related errors
- Try using an incognito window to rule out browser extension issues

### Cookie-Related Issues
- Ensure cookies are being set with the proper domain
- Check that the `sameSite` attribute is set to `lax` or `none` (with secure)
- Verify that cookies are not being blocked by browser settings
- For production, ensure the `secure` flag is set

### OAuth Configuration Issues
- Make sure `access_type` is set to `offline` to get a refresh token
- Set `prompt` to `consent` to ensure the user is prompted for consent
- Double-check that the scopes match exactly between Google Cloud Console and your code

## 7. Logging and Monitoring

The application includes extensive logging. Check your browser console and server logs for any error messages or warnings that might indicate the source of the issue.

If you're still experiencing issues, try deploying a fresh version of the application with the correct environment variables and configuration.

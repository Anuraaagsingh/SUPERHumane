# 🔍 Debug Authentication Issues

## The Problem
You're being redirected to login with no visible errors. This typically indicates an authentication state issue, not a load balancing problem.

## Debugging Steps

### 1. Check Browser Console
Open browser developer tools and look for:
- `[Supabase]` prefixed logs
- `[Supabase Auth]` prefixed logs
- Any error messages

### 2. Test Debug Endpoints
Visit these URLs to check configuration:

**Supabase Configuration:**
```
https://your-domain.vercel.app/api/debug/supabase-config
```

**Gmail Configuration (if still using custom OAuth):**
```
https://your-domain.vercel.app/api/debug/gmail-config
```

**Health Check:**
```
https://your-domain.vercel.app/api/health
```

### 3. Check Vercel Function Logs
1. Go to Vercel Dashboard → Your Project → Functions
2. Look for logs from:
   - `/login/callback` function
   - `/api/auth/setup-profile` function
3. Look for error messages or failed requests

### 4. Verify Supabase Configuration

**Check Supabase Dashboard:**
1. Go to Authentication → Providers
2. Ensure Google is enabled
3. Verify Client ID and Secret are set
4. Check the redirect URL matches exactly

**Check Environment Variables:**
Make sure these are set in Vercel:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

### 5. Test Authentication Flow

**Step-by-step test:**
1. Go to login page
2. Open browser console
3. Click "Continue with Gmail"
4. Watch console logs
5. Complete OAuth flow
6. Check if you're redirected back
7. Look for any error messages

### 6. Common Issues & Solutions

| Issue | Symptoms | Solution |
|-------|----------|----------|
| **Supabase not configured** | Redirect to login immediately | Set up Google provider in Supabase |
| **Wrong redirect URI** | OAuth error in Google | Update redirect URI in Google Console |
| **Missing environment variables** | 500 errors in logs | Set all required env vars in Vercel |
| **Database tables missing** | Setup profile fails | Run database setup SQL |
| **CORS issues** | Network errors in console | Check authorized origins in Google Console |

### 7. Expected Log Flow

When authentication works correctly, you should see:

```
[Supabase] Starting Google OAuth
[Supabase] Current origin: https://your-domain.vercel.app
[Supabase] Supabase client: true
[Supabase] OAuth response: { data: {...}, error: null }
[Supabase] Google OAuth initiated successfully
```

Then after OAuth callback:
```
[Supabase OAuth] Callback received: { code: true, next: "/inbox", error: null, ... }
[Supabase OAuth] Auth exchange result: { user: true, session: true, ... }
[Supabase Auth] State change: { event: "SIGNED_IN", hasUser: true, ... }
[Supabase Auth] User signed in, setting up profile...
[Supabase Auth] Profile setup successful
```

### 8. Quick Fixes

**If you see "redirect_uri_mismatch":**
1. Go to Google Cloud Console
2. Update redirect URI to: `https://your-project-ref.supabase.co/auth/v1/callback`

**If you see "invalid_client":**
1. Check Supabase Google provider configuration
2. Verify Client ID and Secret are correct

**If you see database errors:**
1. Run the database setup SQL in Supabase
2. Check RLS policies are enabled

**If authentication works but redirects to login:**
1. Check the `useAuth` hook logs
2. Verify the setup-profile API is working
3. Check if there are any JavaScript errors

## Load Balancing Note

**You don't need a load balancer for this issue.** The redirect to login is an authentication problem, not a performance issue. Load balancers are only needed when you have:
- High traffic (thousands of concurrent users)
- Multiple server instances
- Geographic distribution needs

For a single Vercel deployment, the built-in CDN and edge functions handle load distribution automatically.

## Next Steps

1. **Check the debug endpoints** to see what's configured
2. **Look at browser console** for error messages
3. **Check Vercel function logs** for server-side errors
4. **Verify Supabase configuration** is correct
5. **Test the authentication flow** step by step

The issue is likely in the Supabase OAuth configuration or environment variables, not load balancing.

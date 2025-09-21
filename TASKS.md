# MasterMail Fix Tasks

## Authentication Issues
- [x] Fix login callback route to be dynamic
- [x] Fix cookie handling in server components
- [x] Ensure proper token extraction from OAuth session
- [x] Add debug logging to trace authentication flow
- [x] Fix Gmail API scopes and permissions
- [x] Fix callback URL configuration

## API Connections
- [x] Fix Gmail API integration
- [x] Add error handling for token expiration
- [x] Implement token refresh mechanism
- [x] Verify Supabase table structure and permissions
- [x] Ensure environment variables are correctly set

## UI/UX Issues
- [x] Add better error messages during authentication
- [x] Implement loading states during API calls
- [x] Ensure proper redirects after authentication
- [x] Add fallback for failed API connections

## Deployment
- [x] Ensure Vercel environment variables are set correctly
- [x] Add CORS configuration for API endpoints
- [x] Fix dynamic routes handling in production

## Important Notes for Deployment
1. Make sure your Supabase project has the correct OAuth settings:
   - Redirect URL should be exactly: `https://your-domain.com/login/callback`
   - Required scopes: `https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify`

2. Ensure these environment variables are set in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (should match your deployed URL)

3. Database tables must be created in Supabase:
   - Run the SQL script in `scripts/001-initial-schema.sql`
   - This creates the required tables for users, email accounts, and email metadata
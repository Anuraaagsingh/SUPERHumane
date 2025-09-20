# 🚨 Gmail OAuth Setup Required

The "Gmail authentication failed" error occurs because the Gmail OAuth credentials are not configured.

## Quick Fix Steps:

### 1. Create Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Gmail API** and **Google+ API**
4. Go to **APIs & Services** → **Credentials**
5. Click **Create Credentials** → **OAuth 2.0 Client IDs**
6. Set **Application type** to "Web application"
7. Add **Authorized redirect URIs**:
   ```
   http://localhost:3000/api/auth/gmail-callback
   ```
8. Copy the **Client ID** and **Client Secret**

### 2. Create Environment File
Create a `.env.local` file in your project root with:

```bash
# Gmail OAuth (REQUIRED)
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here

# Site URL (REQUIRED)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase (if not already set)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Configure OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type
3. Fill in required fields
4. Add these scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`

### 4. Add Test Users
1. In OAuth consent screen, go to **Test users**
2. Add your email address

### 5. Restart Development Server
```bash
npm run dev
```

After completing these steps, the Gmail OAuth should work correctly!

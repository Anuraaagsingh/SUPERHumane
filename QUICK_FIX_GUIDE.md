# 🚀 QUICK FIX GUIDE - Gmail Integration & Database Issues

## 🚨 **CRITICAL: Database Setup Required First**

### Step 1: Set Up Database (2 minutes)
1. Go to your **Supabase project dashboard**
2. Click **"SQL Editor"** in the left sidebar
3. Copy the entire contents of `scripts/setup-database.sql`
4. Paste and **Run** the script
5. Verify you see: `Setup complete! | users_count: 1 | accounts_count: 1 | emails_count: 12`

### Step 2: Configure Gmail OAuth (3 minutes)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Gmail API** and **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
5. Set **Application type** to "Web application"
6. Add **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/gmail-callback` (development)
   - `https://your-domain.vercel.app/api/auth/gmail-callback` (production)
7. Copy the **Client ID** and **Client Secret**

### Step 3: Update Environment Variables
Add these to your **Vercel Environment Variables**:

```bash
# Gmail OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Site URL (for OAuth redirects)
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app

# Supabase (if not already set)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 4: Deploy and Test
1. **Deploy** the updated code to Vercel
2. **Test Demo Account**:
   - Login with `demo@mastermail.com` / `demo123`
   - Should see 12 emails immediately
3. **Test Gmail Account**:
   - Click "Continue with Gmail"
   - Complete OAuth flow
   - Should see your Gmail emails

## 🔧 **Debug Tools Available**

### In the Inbox UI:
- **🔍 Debug emails** - Check account/email counts
- **📧 Populate demo** - Manually add demo emails
- **🏥 Check database** - Verify database health

### API Endpoints:
- `GET /api/health/database` - Database health check
- `GET /api/debug/emails` - Debug email data
- `POST /api/debug/populate-demo` - Populate demo emails

## 🐛 **Common Issues & Solutions**

### Issue: "Could not find table 'public.users'"
**Solution**: Run the database setup script in Supabase SQL Editor

### Issue: Gmail OAuth redirects to wrong URL
**Solution**: Check `NEXT_PUBLIC_SITE_URL` environment variable

### Issue: Gmail API quota exceeded
**Solution**: Wait 24 hours or request quota increase in Google Cloud Console

### Issue: Emails not syncing from Gmail
**Solution**: Check Gmail API credentials and scopes

## 📊 **Expected Results**

After setup, you should see:
- ✅ **Demo account**: 12 realistic emails with snippets
- ✅ **Gmail account**: Your actual Gmail emails synced
- ✅ **Working features**: Star, archive, compose, keyboard shortcuts
- ✅ **Debug tools**: All buttons working and showing correct data

## 🆘 **If Still Having Issues**

1. **Check Vercel logs** for specific errors
2. **Use debug buttons** to identify the problem
3. **Verify environment variables** are set correctly
4. **Check Supabase logs** for database errors

The new Gmail integration uses direct OAuth flow instead of Supabase Auth, which should resolve the integration issues you were experiencing.

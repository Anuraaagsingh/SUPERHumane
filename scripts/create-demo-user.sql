-- Create demo user in Supabase auth
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  '00000000-0000-0000-0000-000000000000',
  'demo@hispeedmail.com',
  crypt('demo123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Create demo user profile
INSERT INTO public.users (
  id,
  email,
  name,
  avatar_url,
  settings,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'demo@hispeedmail.com',
  'Demo User',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
  '{"theme": "light", "notifications": true, "keyboard_shortcuts": true}',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  avatar_url = EXCLUDED.avatar_url,
  settings = EXCLUDED.settings,
  updated_at = NOW();

-- Create demo email account
INSERT INTO public.email_accounts (
  id,
  user_id,
  email,
  display_name,
  provider,
  access_token,
  refresh_token,
  token_expires_at,
  settings,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440000',
  'demo@hispeedmail.com',
  'Demo User',
  'demo',
  'demo_access_token',
  'demo_refresh_token',
  NOW() + INTERVAL '1 year',
  '{"sync_enabled": true, "notifications": true}',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

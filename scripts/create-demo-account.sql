-- Create demo user account
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'demo@hispeedmail.com',
  crypt('demo123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"email": "demo@hispeedmail.com", "name": "Demo User"}',
  false,
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Create user profile
INSERT INTO user_profiles (
  id,
  email,
  name,
  avatar_url,
  provider,
  provider_account_id,
  access_token,
  refresh_token,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'demo@hispeedmail.com',
  'Demo User',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
  'email',
  'demo@hispeedmail.com',
  null,
  null,
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  avatar_url = EXCLUDED.avatar_url;

-- Support anonymous course generation
-- This migration allows courses to be created without requiring user authentication

-- Create an anonymous user for courses that don't have a specific user
INSERT INTO auth.users (
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'anonymous@tweetcourse.com',
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "system", "providers": ["system"]}',
  '{"name": "Anonymous User"}',
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Create corresponding user profile for anonymous user
INSERT INTO users (
  id,
  auth_user_id,
  email,
  subscription_tier,
  usage_count,
  monthly_usage_count,
  monthly_usage_reset_date
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  'anonymous@tweetcourse.com',
  'free',
  0,
  0,
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Allow service role to insert courses for anonymous user
CREATE POLICY IF NOT EXISTS "Service role can create anonymous courses" ON courses
  FOR INSERT 
  TO service_role
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

-- Allow service role to create usage logs for anonymous user  
CREATE POLICY IF NOT EXISTS "Service role can create anonymous usage logs" ON usage_logs
  FOR INSERT 
  TO service_role
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

-- Add comment for documentation
COMMENT ON TABLE courses IS 'Courses table - supports both authenticated users and anonymous course generation';
-- Migration to Supabase Auth from Clerk
-- This migration updates the users table to work with Supabase Auth

-- Add auth_user_id column to reference auth.users
ALTER TABLE users ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for the new column
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);

-- Update RLS policies to use Supabase Auth
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own courses" ON courses;
DROP POLICY IF EXISTS "Users can insert own courses" ON courses;
DROP POLICY IF EXISTS "Users can update own courses" ON courses;
DROP POLICY IF EXISTS "Users can delete own courses" ON courses;
DROP POLICY IF EXISTS "Users can view own usage logs" ON usage_logs;
DROP POLICY IF EXISTS "Users can insert own usage logs" ON usage_logs;

-- New RLS policies for Supabase Auth
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth_user_id = auth.uid());

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth_user_id = auth.uid());

-- Courses policies
CREATE POLICY "Users can view own courses" ON courses
  FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own courses" ON courses
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can update own courses" ON courses
  FOR UPDATE USING (user_id IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own courses" ON courses
  FOR DELETE USING (user_id IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  ));

-- Usage logs policies
CREATE POLICY "Users can view own usage logs" ON usage_logs
  FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own usage logs" ON usage_logs
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  ));

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_user_id, email, subscription_tier, usage_count, monthly_usage_count, monthly_usage_reset_date)
  VALUES (
    NEW.id,
    NEW.email,
    'free',
    0,
    0,
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile on auth signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Make clerk_user_id nullable for migration period
ALTER TABLE users ALTER COLUMN clerk_user_id DROP NOT NULL;
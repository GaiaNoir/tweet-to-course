-- Initial database schema for TweetToCourse application
-- This migration creates the core tables: users, courses, and usage_logs

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'lifetime')),
  usage_count INTEGER DEFAULT 0 CHECK (usage_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  original_content TEXT NOT NULL,
  modules JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage logs table
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('generate', 'export_pdf', 'export_notion')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_courses_user_id ON courses(user_id);
CREATE INDEX idx_courses_created_at ON courses(created_at DESC);
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_action ON usage_logs(action);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at DESC);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at 
  BEFORE UPDATE ON courses 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (clerk_user_id = auth.jwt() ->> 'sub');

-- Courses policies
CREATE POLICY "Users can view own courses" ON courses
  FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
  ));

CREATE POLICY "Users can insert own courses" ON courses
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
  ));

CREATE POLICY "Users can update own courses" ON courses
  FOR UPDATE USING (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
  ));

CREATE POLICY "Users can delete own courses" ON courses
  FOR DELETE USING (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
  ));

-- Usage logs policies
CREATE POLICY "Users can view own usage logs" ON usage_logs
  FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
  ));

CREATE POLICY "Users can insert own usage logs" ON usage_logs
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
  ));

-- Service role can bypass RLS for admin operations
CREATE POLICY "Service role can manage all data" ON users
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all courses" ON courses
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all usage logs" ON usage_logs
  FOR ALL USING (auth.role() = 'service_role');
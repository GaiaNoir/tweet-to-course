#!/usr/bin/env node

/**
 * Direct SQL migration for TweetToCourse project
 * This bypasses the exec function and uses direct table operations
 */

const { createClient } = require('@supabase/supabase-js');

async function directMigration() {
  // TweetToCourse project credentials
  const supabaseUrl = 'https://rpwjenxdthwgjuwngncb.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwd2plbnhkdGh3Z2p1d25nbmNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg0NTQwMCwiZXhwIjoyMDY4NDIxNDAwfQ.3GZ7YtbQdMWa66SUi-Jkv0xBMEuGfq1SU6v6M14-5ko';

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🚀 Starting direct migration to TweetToCourse project...');
  console.log('📍 Target project:', supabaseUrl);
  console.log('');

  try {
    // Since we can't use exec, we'll need to create tables through the Supabase dashboard
    // But let's try one more approach - using the REST API directly
    
    console.log('❌ Unfortunately, Supabase client library does not support DDL operations');
    console.log('   (CREATE TABLE, ALTER TABLE, etc.) through the JavaScript client.');
    console.log('');
    console.log('📋 You need to run the SQL manually in your Supabase dashboard:');
    console.log('');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your TweetToCourse project');
    console.log('3. Go to SQL Editor');
    console.log('4. Copy and paste the following SQL:');
    console.log('');
    console.log('-- COPY THIS SQL TO YOUR SUPABASE SQL EDITOR --');
    console.log('');
    
    const sql = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for TweetToCourse
CREATE TABLE IF NOT EXISTS tweet_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'lifetime')),
  usage_count INTEGER DEFAULT 0 CHECK (usage_count >= 0),
  customer_code TEXT,
  subscription_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses table for TweetToCourse
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES tweet_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  original_content TEXT NOT NULL,
  modules JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage logs table for TweetToCourse
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES tweet_users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN (
    'generate', 
    'export_pdf', 
    'export_notion', 
    'payment_success', 
    'payment_failed', 
    'subscription_created', 
    'subscription_updated', 
    'subscription_cancelled', 
    'invoice_created'
  )),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tweet_users_clerk_user_id ON tweet_users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_tweet_users_email ON tweet_users(email);
CREATE INDEX IF NOT EXISTS idx_tweet_users_customer_code ON tweet_users(customer_code) WHERE customer_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tweet_users_subscription_code ON tweet_users(subscription_code) WHERE subscription_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_courses_user_id ON courses(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_action ON usage_logs(action);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at DESC);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_tweet_users_updated_at ON tweet_users;
CREATE TRIGGER update_tweet_users_updated_at 
  BEFORE UPDATE ON tweet_users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at 
  BEFORE UPDATE ON courses 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE tweet_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON tweet_users
  FOR SELECT USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own profile" ON tweet_users
  FOR UPDATE USING (clerk_user_id = auth.jwt() ->> 'sub');

-- Courses policies
CREATE POLICY "Users can view own courses" ON courses
  FOR SELECT USING (user_id IN (
    SELECT id FROM tweet_users WHERE clerk_user_id = auth.jwt() ->> 'sub'
  ));

CREATE POLICY "Users can insert own courses" ON courses
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM tweet_users WHERE clerk_user_id = auth.jwt() ->> 'sub'
  ));

CREATE POLICY "Users can update own courses" ON courses
  FOR UPDATE USING (user_id IN (
    SELECT id FROM tweet_users WHERE clerk_user_id = auth.jwt() ->> 'sub'
  ));

CREATE POLICY "Users can delete own courses" ON courses
  FOR DELETE USING (user_id IN (
    SELECT id FROM tweet_users WHERE clerk_user_id = auth.jwt() ->> 'sub'
  ));

-- Usage logs policies
CREATE POLICY "Users can view own usage logs" ON usage_logs
  FOR SELECT USING (user_id IN (
    SELECT id FROM tweet_users WHERE clerk_user_id = auth.jwt() ->> 'sub'
  ));

CREATE POLICY "Users can insert own usage logs" ON usage_logs
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM tweet_users WHERE clerk_user_id = auth.jwt() ->> 'sub'
  ));

-- Service role can bypass RLS for admin operations
CREATE POLICY "Service role can manage all data" ON tweet_users
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all courses" ON courses
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all usage logs" ON usage_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Add comments for documentation
COMMENT ON COLUMN tweet_users.customer_code IS 'Paystack customer code for billing management';
COMMENT ON COLUMN tweet_users.subscription_code IS 'Paystack subscription code for recurring billing';
`;

    console.log(sql);
    console.log('');
    console.log('-- END OF SQL --');
    console.log('');
    console.log('5. Click "Run" to execute the SQL');
    console.log('6. Verify the tables were created in the Table Editor');
    console.log('');
    console.log('🎯 This will create all the necessary tables, indexes, triggers, and security policies');
    console.log('   for your TweetToCourse application.');

  } catch (error) {
    console.error('❌ Script failed:', error.message);
  }
}

// Run direct migration
directMigration().catch(console.error);
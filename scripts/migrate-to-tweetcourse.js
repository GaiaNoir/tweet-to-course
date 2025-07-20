#!/usr/bin/env node

/**
 * Direct migration script for TweetToCourse project
 * This script runs migrations directly on the TweetToCourse Supabase project
 */

const { createClient } = require('@supabase/supabase-js');

async function runMigrations() {
  // TweetToCourse project credentials
  const supabaseUrl = 'https://rpwjenxdthwgjuwngncb.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwd2plbnhkdGh3Z2p1d25nbmNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg0NTQwMCwiZXhwIjoyMDY4NDIxNDAwfQ.3GZ7YtbQdMWa66SUi-Jkv0xBMEuGfq1SU6v6M14-5ko';

  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🚀 Starting TweetToCourse database migrations...');
  console.log('📍 Target project:', supabaseUrl);
  console.log('');

  try {
    // Migration 1: Create tables
    console.log('⏳ Creating core tables...');
    const { error: tablesError } = await supabase.rpc('exec', {
      sql: `
        -- Enable UUID extension
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

        -- Users table
        CREATE TABLE IF NOT EXISTS tweet_users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          clerk_user_id TEXT UNIQUE NOT NULL,
          email TEXT NOT NULL,
          subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'lifetime')),
          usage_count INTEGER DEFAULT 0 CHECK (usage_count >= 0),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Courses table
        CREATE TABLE IF NOT EXISTS courses (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES tweet_users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          original_content TEXT NOT NULL,
          modules JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Usage logs table
        CREATE TABLE IF NOT EXISTS usage_logs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES tweet_users(id) ON DELETE CASCADE,
          action TEXT NOT NULL CHECK (action IN ('generate', 'export_pdf', 'export_notion')),
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (tablesError && !tablesError.message.includes('exec')) {
      throw tablesError;
    }
    console.log('✅ Core tables created successfully');

    // Migration 2: Create indexes
    console.log('⏳ Creating indexes...');
    const { error: indexesError } = await supabase.rpc('exec', {
      sql: `
        -- Indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_tweet_users_clerk_user_id ON tweet_users(clerk_user_id);
        CREATE INDEX IF NOT EXISTS idx_tweet_users_email ON tweet_users(email);
        CREATE INDEX IF NOT EXISTS idx_courses_user_id ON courses(user_id);
        CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_usage_logs_action ON usage_logs(action);
        CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at DESC);
      `
    });

    if (indexesError && !indexesError.message.includes('exec')) {
      throw indexesError;
    }
    console.log('✅ Indexes created successfully');

    // Migration 3: Create functions and triggers
    console.log('⏳ Creating functions and triggers...');
    const { error: triggersError } = await supabase.rpc('exec', {
      sql: `
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
      `
    });

    if (triggersError && !triggersError.message.includes('exec')) {
      throw triggersError;
    }
    console.log('✅ Functions and triggers created successfully');

    // Migration 4: Add subscription fields
    console.log('⏳ Adding subscription fields...');
    const { error: subscriptionError } = await supabase.rpc('exec', {
      sql: `
        -- Add new columns to tweet_users table
        ALTER TABLE tweet_users 
        ADD COLUMN IF NOT EXISTS customer_code TEXT,
        ADD COLUMN IF NOT EXISTS subscription_code TEXT;

        -- Add indexes for the new columns
        CREATE INDEX IF NOT EXISTS idx_tweet_users_customer_code ON tweet_users(customer_code) WHERE customer_code IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_tweet_users_subscription_code ON tweet_users(subscription_code) WHERE subscription_code IS NOT NULL;

        -- Update usage_logs action check constraint to include new payment-related actions
        ALTER TABLE usage_logs 
        DROP CONSTRAINT IF EXISTS usage_logs_action_check;

        ALTER TABLE usage_logs 
        ADD CONSTRAINT usage_logs_action_check 
        CHECK (action IN (
          'generate', 
          'export_pdf', 
          'export_notion', 
          'payment_success', 
          'payment_failed', 
          'subscription_created', 
          'subscription_updated', 
          'subscription_cancelled', 
          'invoice_created'
        ));
      `
    });

    if (subscriptionError && !subscriptionError.message.includes('exec')) {
      throw subscriptionError;
    }
    console.log('✅ Subscription fields added successfully');

    console.log('');
    console.log('🎉 All migrations completed successfully!');
    console.log('📊 Database is ready for TweetToCourse application');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migrations
runMigrations().catch(console.error);
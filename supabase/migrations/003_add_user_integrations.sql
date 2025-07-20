-- Add user integrations table for storing OAuth tokens
CREATE TABLE IF NOT EXISTS user_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('notion', 'google_drive', 'dropbox')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  workspace_id TEXT,
  workspace_name TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Add RLS policies
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- Users can only access their own integrations
CREATE POLICY "Users can view own integrations" ON user_integrations
  FOR SELECT USING (auth.uid()::text = (SELECT clerk_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can insert own integrations" ON user_integrations
  FOR INSERT WITH CHECK (auth.uid()::text = (SELECT clerk_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can update own integrations" ON user_integrations
  FOR UPDATE USING (auth.uid()::text = (SELECT clerk_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can delete own integrations" ON user_integrations
  FOR DELETE USING (auth.uid()::text = (SELECT clerk_user_id FROM users WHERE id = user_id));

-- Add index for faster lookups
CREATE INDEX idx_user_integrations_user_provider ON user_integrations(user_id, provider);
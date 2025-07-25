-- Add monthly usage tracking for free tier limits
-- This migration adds fields to track monthly course generation limits

-- Add monthly usage tracking columns to users table
ALTER TABLE users 
ADD COLUMN monthly_usage_count INTEGER DEFAULT 0 CHECK (monthly_usage_count >= 0),
ADD COLUMN monthly_usage_reset_date DATE DEFAULT CURRENT_DATE;

-- Add index for monthly usage queries
CREATE INDEX idx_users_monthly_usage_reset ON users(monthly_usage_reset_date);

-- Update usage_logs to include monthly tracking metadata
ALTER TABLE usage_logs 
ADD COLUMN usage_month DATE DEFAULT CURRENT_DATE;

-- Add index for monthly usage log queries
CREATE INDEX idx_usage_logs_usage_month ON usage_logs(usage_month, user_id, action);

-- Function to reset monthly usage for users whose reset date has passed
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void AS $$
BEGIN
  UPDATE users 
  SET 
    monthly_usage_count = 0,
    monthly_usage_reset_date = CURRENT_DATE + INTERVAL '1 month'
  WHERE monthly_usage_reset_date <= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to get current monthly usage for a user
CREATE OR REPLACE FUNCTION get_monthly_usage(user_clerk_id TEXT)
RETURNS TABLE(
  current_usage INTEGER,
  reset_date DATE,
  subscription_tier TEXT
) AS $$
BEGIN
  -- First, reset usage if needed
  PERFORM reset_monthly_usage();
  
  -- Return current usage info
  RETURN QUERY
  SELECT 
    u.monthly_usage_count,
    u.monthly_usage_reset_date,
    u.subscription_tier
  FROM users u
  WHERE u.clerk_user_id = user_clerk_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment monthly usage
CREATE OR REPLACE FUNCTION increment_monthly_usage(user_clerk_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  new_usage_count INTEGER;
BEGIN
  -- Reset usage if needed first
  PERFORM reset_monthly_usage();
  
  -- Increment usage and return new count
  UPDATE users 
  SET monthly_usage_count = monthly_usage_count + 1
  WHERE clerk_user_id = user_clerk_id
  RETURNING monthly_usage_count INTO new_usage_count;
  
  RETURN COALESCE(new_usage_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Initialize monthly_usage_reset_date for existing users (set to next month)
UPDATE users 
SET monthly_usage_reset_date = CURRENT_DATE + INTERVAL '1 month'
WHERE monthly_usage_reset_date IS NULL;

-- Add comment to document the new fields
COMMENT ON COLUMN users.monthly_usage_count IS 'Number of courses generated in current month (for free tier limits)';
COMMENT ON COLUMN users.monthly_usage_reset_date IS 'Date when monthly usage count resets';
COMMENT ON COLUMN usage_logs.usage_month IS 'Month when the usage occurred (for monthly analytics)';


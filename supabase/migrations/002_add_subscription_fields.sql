-- Add subscription management fields to users table
-- This migration adds customer_code and subscription_code for Paystack integration

-- Add new columns to users table
ALTER TABLE users 
ADD COLUMN customer_code TEXT,
ADD COLUMN subscription_code TEXT;

-- Add indexes for the new columns
CREATE INDEX idx_users_customer_code ON users(customer_code) WHERE customer_code IS NOT NULL;
CREATE INDEX idx_users_subscription_code ON users(subscription_code) WHERE subscription_code IS NOT NULL;

-- Update usage_logs action check constraint to include new payment-related actions
ALTER TABLE usage_logs 
DROP CONSTRAINT usage_logs_action_check;

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

-- Add comment to document the new fields
COMMENT ON COLUMN users.customer_code IS 'Paystack customer code for billing management';
COMMENT ON COLUMN users.subscription_code IS 'Paystack subscription code for recurring billing';
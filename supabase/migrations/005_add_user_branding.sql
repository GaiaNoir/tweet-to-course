-- Add branding settings to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS branding_settings JSONB DEFAULT '{
  "logo_url": null,
  "primary_color": "#4F46E5",
  "accent_color": "#06B6D4",
  "footer_text": null
}'::jsonb;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_branding ON users USING GIN (branding_settings);
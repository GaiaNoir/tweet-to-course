-- Force disable email confirmation by updating auth config
-- This ensures users get a session immediately after signup

-- Update the auth.config table to disable email confirmation
-- Note: This might not work on hosted Supabase, but worth trying

-- Alternative: Create a function to auto-confirm users
CREATE OR REPLACE FUNCTION auto_confirm_user()
RETURNS TRIGGER AS $
BEGIN
  -- Auto-confirm the user's email
  UPDATE auth.users 
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id 
  AND email_confirmed_at IS NULL;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-confirm users on creation
DROP TRIGGER IF EXISTS auto_confirm_user_trigger ON auth.users;
CREATE TRIGGER auto_confirm_user_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION auto_confirm_user();

-- Comment for documentation
COMMENT ON FUNCTION auto_confirm_user() IS 'Automatically confirms user emails to bypass email confirmation requirement';
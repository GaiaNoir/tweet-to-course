-- Fix course save policy for service role
-- This migration ensures the service role can properly insert courses

-- Drop existing service role policy if it exists
DROP POLICY IF EXISTS "Service role can manage all courses" ON courses;

-- Create a more explicit service role policy for courses
CREATE POLICY "Service role can manage all courses" ON courses
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Also ensure anon role can't access courses directly (security)
DROP POLICY IF EXISTS "Anon users cannot access courses" ON courses;
CREATE POLICY "Anon users cannot access courses" ON courses
  FOR ALL 
  TO anon
  USING (false);

-- Verify RLS is enabled
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Add comment for documentation
COMMENT ON POLICY "Service role can manage all courses" ON courses IS 
'Allows service role (used by background processors) to insert, update, and delete courses for any user';

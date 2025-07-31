-- Fix RLS policy for course_generation_jobs to allow service role to insert jobs
-- This is needed for the async API endpoints that use the admin client

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert their own jobs" ON course_generation_jobs;

-- Create a new INSERT policy that allows both authenticated users and service role
CREATE POLICY "Allow job creation" ON course_generation_jobs
  FOR INSERT WITH CHECK (
    -- Allow if user is authenticated and inserting their own job
    (auth.uid() = user_id) OR 
    -- Allow if using service role (for API endpoints)
    (auth.jwt() ->> 'role' = 'service_role')
  );

-- Also add a policy to allow service role to insert any job
CREATE POLICY "Service role can insert jobs" ON course_generation_jobs
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

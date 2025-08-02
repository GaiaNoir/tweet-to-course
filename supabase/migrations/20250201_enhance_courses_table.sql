-- Migration: Enhance courses table for Supabase auth and job integration
-- This migration updates the existing courses table to work with Supabase auth
-- and adds better integration with the job processing system

-- First, let's ensure the courses table exists with the correct structure
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL, -- Link to the job that created this course
  title text NOT NULL,
  original_content text NOT NULL,
  modules jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb, -- Store additional metadata like source type, URL, etc.
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add new columns if they don't exist (for existing installations)
DO $$ 
BEGIN
  -- Add job_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'courses' AND column_name = 'job_id') THEN
    ALTER TABLE public.courses ADD COLUMN job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL;
  END IF;
  
  -- Add metadata column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'courses' AND column_name = 'metadata') THEN
    ALTER TABLE public.courses ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
  
  -- Add status column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'courses' AND column_name = 'status') THEN
    ALTER TABLE public.courses ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted'));
  END IF;
  
  -- Ensure modules column has proper default
  ALTER TABLE public.courses ALTER COLUMN modules SET DEFAULT '[]'::jsonb;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_user_id ON public.courses(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_job_id ON public.courses(job_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON public.courses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_courses_title ON public.courses USING gin(to_tsvector('english', title));

-- Enable RLS if not already enabled
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Drop old RLS policies that might reference Clerk
DROP POLICY IF EXISTS "Users can view own courses" ON public.courses;
DROP POLICY IF EXISTS "Users can insert own courses" ON public.courses;
DROP POLICY IF EXISTS "Users can update own courses" ON public.courses;
DROP POLICY IF EXISTS "Users can delete own courses" ON public.courses;
DROP POLICY IF EXISTS "Service role can manage all courses" ON public.courses;

-- Create new RLS policies for Supabase auth
CREATE POLICY "Users can view own courses" ON public.courses 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own courses" ON public.courses 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own courses" ON public.courses 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own courses" ON public.courses 
  FOR DELETE USING (auth.uid() = user_id);

-- Allow service role to manage all courses (for API operations)
CREATE POLICY "Service role can manage all courses" ON public.courses 
  FOR ALL USING (auth.role() = 'service_role');

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_courses_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at on courses table
DROP TRIGGER IF EXISTS handle_courses_updated_at ON public.courses;
CREATE TRIGGER handle_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.handle_courses_updated_at();

-- Create function to automatically link completed jobs to courses
CREATE OR REPLACE FUNCTION public.link_job_to_course()
RETURNS trigger AS $$
BEGIN
  -- When a job is completed and has a result, try to find the corresponding course
  IF NEW.status = 'completed' AND NEW.result IS NOT NULL AND OLD.status != 'completed' THEN
    -- Update any course created around the same time by the same user
    UPDATE public.courses 
    SET job_id = NEW.id
    WHERE user_id = NEW.user_id 
      AND job_id IS NULL 
      AND created_at >= NEW.created_at - INTERVAL '5 minutes'
      AND created_at <= NEW.created_at + INTERVAL '5 minutes'
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically link jobs to courses
DROP TRIGGER IF EXISTS link_completed_job_to_course ON public.jobs;
CREATE TRIGGER link_completed_job_to_course
  AFTER UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.link_job_to_course();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.courses TO authenticated;
GRANT SELECT ON public.courses TO anon;

-- Create a view for course statistics
CREATE OR REPLACE VIEW public.course_stats AS
SELECT 
  u.id as user_id,
  u.email,
  COUNT(c.id) as total_courses,
  COUNT(CASE WHEN c.status = 'active' THEN 1 END) as active_courses,
  COUNT(CASE WHEN c.status = 'archived' THEN 1 END) as archived_courses,
  MIN(c.created_at) as first_course_created,
  MAX(c.created_at) as last_course_created
FROM public.users u
LEFT JOIN public.courses c ON u.id = c.user_id
GROUP BY u.id, u.email;

-- Grant access to the view
GRANT SELECT ON public.course_stats TO authenticated;

-- Create RLS policy for the view
ALTER VIEW public.course_stats SET (security_barrier = true);
CREATE POLICY "Users can view own course stats" ON public.course_stats
  FOR SELECT USING (auth.uid() = user_id);

-- Add helpful comments
COMMENT ON TABLE public.courses IS 'Generated courses linked to users and jobs with metadata and status tracking';
COMMENT ON COLUMN public.courses.job_id IS 'Links to the job that generated this course for tracking purposes';
COMMENT ON COLUMN public.courses.metadata IS 'JSON metadata including source type, URL, generation parameters, etc.';
COMMENT ON COLUMN public.courses.status IS 'Course status: active (visible), archived (hidden), deleted (soft delete)';
COMMENT ON VIEW public.course_stats IS 'Aggregated statistics about courses per user';

-- Create function to get user courses with job information
CREATE OR REPLACE FUNCTION public.get_user_courses_with_jobs(user_uuid uuid)
RETURNS TABLE (
  course_id uuid,
  course_title text,
  course_status text,
  course_created_at timestamptz,
  job_id uuid,
  job_status text,
  job_created_at timestamptz,
  modules_count integer
) 
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT 
    c.id as course_id,
    c.title as course_title,
    c.status as course_status,
    c.created_at as course_created_at,
    j.id as job_id,
    j.status as job_status,
    j.created_at as job_created_at,
    jsonb_array_length(c.modules) as modules_count
  FROM public.courses c
  LEFT JOIN public.jobs j ON c.job_id = j.id
  WHERE c.user_id = user_uuid
    AND c.status != 'deleted'
  ORDER BY c.created_at DESC;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_user_courses_with_jobs(uuid) TO authenticated;

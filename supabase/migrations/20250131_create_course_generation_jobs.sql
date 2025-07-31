-- Create course generation jobs table for async processing
CREATE TABLE IF NOT EXISTS course_generation_jobs (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  result JSONB NULL,
  error_message TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE NULL,
  completed_at TIMESTAMP WITH TIME ZONE NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_course_generation_jobs_user_id ON course_generation_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_course_generation_jobs_status ON course_generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_course_generation_jobs_created_at ON course_generation_jobs(created_at);

-- Enable RLS
ALTER TABLE course_generation_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own jobs" ON course_generation_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own jobs" ON course_generation_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role can update any job (for background processing)
CREATE POLICY "Service role can update jobs" ON course_generation_jobs
  FOR UPDATE USING (true);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_course_generation_jobs_updated_at 
  BEFORE UPDATE ON course_generation_jobs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

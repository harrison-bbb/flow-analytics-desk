-- Create user metrics table
CREATE TABLE public.user_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  roi_percentage NUMERIC DEFAULT 0,
  time_saved_month INTEGER DEFAULT 0,
  money_saved_month NUMERIC DEFAULT 0,
  money_saved_total NUMERIC DEFAULT 0,
  executions_month INTEGER DEFAULT 0,
  managed_workflows INTEGER DEFAULT 0,
  api_usage_percentage NUMERIC DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create executions log table
CREATE TABLE public.executions_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  execution_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  workflow_name VARCHAR NOT NULL,
  n8n_workflow_id VARCHAR,
  time_saved INTEGER DEFAULT 0,
  money_saved NUMERIC DEFAULT 0,
  automation_type VARCHAR,
  execution_status VARCHAR DEFAULT 'success',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create workflows table
CREATE TABLE public.workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workflow_name VARCHAR NOT NULL,
  n8n_workflow_id VARCHAR,
  status VARCHAR DEFAULT 'active',
  description TEXT,
  estimated_time_saved_per_run INTEGER DEFAULT 0,
  estimated_money_saved_per_run NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executions_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_metrics
CREATE POLICY "Users can view own metrics" ON public.user_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own metrics" ON public.user_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own metrics" ON public.user_metrics
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for executions_log
CREATE POLICY "Users can view own executions" ON public.executions_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert executions" ON public.executions_log
  FOR INSERT WITH CHECK (true);

-- Create RLS policies for workflows
CREATE POLICY "Users can view own workflows" ON public.workflows
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own workflows" ON public.workflows
  FOR ALL USING (auth.uid() = user_id);

-- Enable realtime for live updates
ALTER TABLE public.user_metrics REPLICA IDENTITY FULL;
ALTER TABLE public.executions_log REPLICA IDENTITY FULL;
ALTER TABLE public.workflows REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.executions_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workflows;
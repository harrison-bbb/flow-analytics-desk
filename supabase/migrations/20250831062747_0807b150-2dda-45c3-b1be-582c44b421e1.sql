-- Add execution details field to executions_log table
ALTER TABLE public.executions_log 
ADD COLUMN IF NOT EXISTS execution_details TEXT;

-- Create client_profile table for contact information
CREATE TABLE IF NOT EXISTS public.client_profile (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  business_name TEXT,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  logo_url TEXT,
  address TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for client_profile
ALTER TABLE public.client_profile ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for client_profile
CREATE POLICY "Users can view own profile" 
ON public.client_profile 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
ON public.client_profile 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
ON public.client_profile 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_client_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_client_profile_updated_at
BEFORE UPDATE ON public.client_profile
FOR EACH ROW
EXECUTE FUNCTION public.update_client_profile_updated_at();
-- First, let's check the current state and fix the user_subscriptions table security

-- Drop any existing policies that might allow public access
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Public read access" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Allow public read" ON public.user_subscriptions;

-- Ensure RLS is enabled
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.user_subscriptions;

-- Create secure policies for user_subscriptions
-- 1. Only authenticated users can view their own subscription data
CREATE POLICY "Users can view own subscriptions" 
ON public.user_subscriptions 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- 2. Only service role can insert/update subscription data (for admin operations)
CREATE POLICY "Service role can manage all subscriptions" 
ON public.user_subscriptions 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Allow authenticated users to update only their own subscription status (for plan changes)
CREATE POLICY "Users can update own subscription status" 
ON public.user_subscriptions 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure no public access to sensitive subscription data
REVOKE ALL ON public.user_subscriptions FROM anon;
REVOKE ALL ON public.user_subscriptions FROM public;

-- Grant proper access to authenticated users (read-only for their own data)
GRANT SELECT ON public.user_subscriptions TO authenticated;
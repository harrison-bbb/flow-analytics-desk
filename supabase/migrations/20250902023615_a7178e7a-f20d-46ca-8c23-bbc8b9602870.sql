-- Check current policies on user_subscriptions and fix security
-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.user_subscriptions; 
DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription status" ON public.user_subscriptions;

-- Ensure RLS is enabled
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create secure, properly named policies
CREATE POLICY "authenticated_users_own_subscriptions_select" 
ON public.user_subscriptions 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "service_role_all_operations" 
ON public.user_subscriptions 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "authenticated_users_own_subscriptions_update" 
ON public.user_subscriptions 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Explicitly revoke any public access
REVOKE ALL ON public.user_subscriptions FROM anon;
REVOKE ALL ON public.user_subscriptions FROM public;
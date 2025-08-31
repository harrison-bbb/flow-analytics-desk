-- Create subscription plans table with the three retainer plans
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  monthly_cost_aud NUMERIC NOT NULL,
  description TEXT,
  features JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert the three retainer plans
INSERT INTO public.subscription_plans (name, monthly_cost_aud, description) VALUES
('Automation Essentials', 1500, 'Perfect for small businesses starting their automation journey'),
('Growth Engine', 3500, 'Ideal for growing companies scaling their operations'), 
('Strategic Partner', 6000, 'Comprehensive automation solutions for enterprise clients');

-- Create user subscriptions table to link users to their current plan
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscription_plans (readable by everyone, manageable by service role)
CREATE POLICY "Anyone can view active plans" 
ON public.subscription_plans 
FOR SELECT 
USING (is_active = true);

-- RLS policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions" 
ON public.user_subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions" 
ON public.user_subscriptions 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Function to get user's current plan cost
CREATE OR REPLACE FUNCTION public.get_user_plan_cost(target_user_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    plan_cost NUMERIC;
BEGIN
    SELECT sp.monthly_cost_aud
    INTO plan_cost
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = target_user_id 
    AND us.is_active = true
    ORDER BY us.started_at DESC
    LIMIT 1;
    
    -- Return default cost if no plan found (fallback to Growth Engine)
    RETURN COALESCE(plan_cost, 3500);
END;
$$;

-- Updated ROI calculation function using plan cost
CREATE OR REPLACE FUNCTION public.calculate_roi_with_plan(total_saved NUMERIC, plan_cost NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
BEGIN
    -- Return 0 if no savings or invalid plan cost
    IF total_saved <= 0 OR plan_cost <= 0 THEN
        RETURN 0;
    END IF;
    
    -- Calculate ROI: ((total_saved - plan_cost) / plan_cost) * 100
    -- Cap ROI between -100% and 9999% to prevent overflow
    DECLARE
        roi_value NUMERIC;
    BEGIN
        roi_value := ((total_saved - plan_cost) / plan_cost) * 100;
        RETURN GREATEST(-100, LEAST(9999, roi_value));
    END;
END;
$$;

-- Update the user metrics trigger to use plan-based ROI
CREATE OR REPLACE FUNCTION public.update_user_metrics_on_execution()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_month text;
    last_updated_month text;
    reset_monthly boolean;
    new_total_saved numeric;
    new_executions integer;
    user_plan_cost numeric;
BEGIN
    -- Get current month in YYYY-MM format
    current_month := to_char(now(), 'YYYY-MM');
    
    -- Get existing metrics
    SELECT to_char(last_updated, 'YYYY-MM') INTO last_updated_month
    FROM user_metrics 
    WHERE user_id = NEW.user_id;
    
    -- Check if we need to reset monthly counters
    reset_monthly := (last_updated_month IS NULL OR last_updated_month != current_month);
    
    -- Calculate new total saved and executions
    SELECT 
        COALESCE(money_saved_total, 0) + COALESCE(NEW.money_saved, 0),
        CASE 
            WHEN reset_monthly THEN 1
            ELSE COALESCE(executions_month, 0) + 1
        END
    INTO new_total_saved, new_executions
    FROM user_metrics 
    WHERE user_id = NEW.user_id;
    
    -- If no existing record, use current values
    IF new_total_saved IS NULL THEN
        new_total_saved := COALESCE(NEW.money_saved, 0);
        new_executions := 1;
    END IF;
    
    -- Get user's plan cost
    user_plan_cost := get_user_plan_cost(NEW.user_id);
    
    -- Update or insert user metrics
    INSERT INTO user_metrics (
        user_id,
        time_saved_month,
        money_saved_month,
        money_saved_total,
        executions_month,
        roi_percentage,
        managed_workflows,
        last_updated
    )
    VALUES (
        NEW.user_id,
        COALESCE(NEW.time_saved, 0),
        COALESCE(NEW.money_saved, 0),
        COALESCE(NEW.money_saved, 0),
        1,
        calculate_roi_with_plan(COALESCE(NEW.money_saved, 0), user_plan_cost),
        1,
        now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        time_saved_month = CASE 
            WHEN reset_monthly THEN COALESCE(NEW.time_saved, 0)
            ELSE user_metrics.time_saved_month + COALESCE(NEW.time_saved, 0)
        END,
        money_saved_month = CASE 
            WHEN reset_monthly THEN COALESCE(NEW.money_saved, 0)
            ELSE user_metrics.money_saved_month + COALESCE(NEW.money_saved, 0)
        END,
        money_saved_total = new_total_saved,
        executions_month = new_executions,
        roi_percentage = calculate_roi_with_plan(new_total_saved, user_plan_cost),
        last_updated = now();
    
    RETURN NEW;
END;
$$;

-- Create trigger on executions_log
DROP TRIGGER IF EXISTS update_user_metrics_trigger ON public.executions_log;
CREATE TRIGGER update_user_metrics_trigger
    AFTER INSERT ON public.executions_log
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_metrics_on_execution();

-- Update timestamps trigger for subscription tables
CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON public.subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_client_profile_updated_at();

CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_client_profile_updated_at();
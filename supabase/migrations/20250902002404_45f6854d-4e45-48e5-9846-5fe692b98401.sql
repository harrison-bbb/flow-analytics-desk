-- Recalculate metrics for the current user using the correct plan cost
DO $$
DECLARE
    current_user_id uuid := 'e8727b67-2c5f-4f52-8cd1-616438128b07';
    current_month text;
    monthly_executions integer;
    monthly_time integer;
    monthly_money numeric;
    total_money numeric;
    calculated_roi numeric;
    user_plan_cost numeric;
BEGIN
    -- Get current month in YYYY-MM format
    current_month := to_char(now(), 'YYYY-MM');
    
    -- Get user's plan cost
    SELECT sp.monthly_cost_aud
    INTO user_plan_cost
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = current_user_id 
    AND us.is_active = true
    ORDER BY us.started_at DESC
    LIMIT 1;
    
    -- Use default if no plan found
    user_plan_cost := COALESCE(user_plan_cost, 3500);
    
    -- Calculate monthly metrics (current month only)
    SELECT 
        COALESCE(COUNT(*), 0),
        COALESCE(SUM(time_saved), 0),
        COALESCE(SUM(money_saved), 0)
    INTO monthly_executions, monthly_time, monthly_money
    FROM executions_log 
    WHERE user_id = current_user_id 
    AND to_char(execution_date, 'YYYY-MM') = current_month;
    
    -- Calculate total money saved
    SELECT COALESCE(SUM(money_saved), 0)
    INTO total_money
    FROM executions_log 
    WHERE user_id = current_user_id;
    
    -- Calculate ROI using plan cost: ((total_saved - plan_cost) / plan_cost) * 100
    calculated_roi := CASE 
        WHEN total_money > 0 AND user_plan_cost > 0
        THEN ((total_money - user_plan_cost) / user_plan_cost) * 100
        ELSE 0 
    END;
    
    -- Update user metrics with corrected ROI calculation
    UPDATE user_metrics SET
        time_saved_month = monthly_time,
        money_saved_month = monthly_money,
        money_saved_total = total_money,
        executions_month = monthly_executions,
        roi_percentage = calculated_roi,
        managed_workflows = 1,
        last_updated = now()
    WHERE user_id = current_user_id;
    
    -- Log the calculation for debugging
    RAISE NOTICE 'Recalculated ROI: Total saved: %, Plan cost: %, ROI: %', total_money, user_plan_cost, calculated_roi;
END $$;
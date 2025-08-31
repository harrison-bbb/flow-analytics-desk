-- Fix function search path security warning
CREATE OR REPLACE FUNCTION update_user_metrics_on_execution()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_month text;
    last_updated_month text;
    reset_monthly boolean;
BEGIN
    -- Get current month in YYYY-MM format
    current_month := to_char(now(), 'YYYY-MM');
    
    -- Get existing metrics
    SELECT to_char(last_updated, 'YYYY-MM') INTO last_updated_month
    FROM user_metrics 
    WHERE user_id = NEW.user_id;
    
    -- Check if we need to reset monthly counters
    reset_monthly := (last_updated_month IS NULL OR last_updated_month != current_month);
    
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
        CASE 
            WHEN COALESCE(NEW.money_saved, 0) > 0 
            THEN ((COALESCE(NEW.money_saved, 0) - 10) / 10) * 100 
            ELSE 0 
        END,
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
        money_saved_total = user_metrics.money_saved_total + COALESCE(NEW.money_saved, 0),
        executions_month = CASE 
            WHEN reset_monthly THEN 1
            ELSE user_metrics.executions_month + 1
        END,
        roi_percentage = CASE 
            WHEN (user_metrics.money_saved_total + COALESCE(NEW.money_saved, 0)) > 0 
            THEN (((user_metrics.money_saved_total + COALESCE(NEW.money_saved, 0)) - (CASE WHEN reset_monthly THEN 1 ELSE user_metrics.executions_month + 1 END * 10)) / (CASE WHEN reset_monthly THEN 1 ELSE user_metrics.executions_month + 1 END * 10)) * 100
            ELSE 0 
        END,
        last_updated = now();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
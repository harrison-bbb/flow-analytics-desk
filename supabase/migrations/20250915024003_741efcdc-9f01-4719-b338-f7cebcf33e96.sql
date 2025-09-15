-- Update recalculate function to handle existing records properly
CREATE OR REPLACE FUNCTION public.recalculate_user_metrics_simple(target_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_month text;
    monthly_executions integer;
    monthly_time numeric;
    monthly_money numeric;
    total_money numeric;
    calculated_roi numeric;
BEGIN
    -- Get current month in YYYY-MM format
    current_month := to_char(now(), 'YYYY-MM');
    
    -- Calculate monthly metrics (current month only)
    SELECT 
        COALESCE(COUNT(*), 0),
        COALESCE(SUM(time_saved), 0),
        COALESCE(SUM(money_saved), 0)
    INTO monthly_executions, monthly_time, monthly_money
    FROM executions_log 
    WHERE user_id = target_user_id 
    AND to_char(execution_date, 'YYYY-MM') = current_month;
    
    -- Calculate total money saved
    SELECT COALESCE(SUM(money_saved), 0)
    INTO total_money
    FROM executions_log 
    WHERE user_id = target_user_id;
    
    -- Calculate ROI with reasonable bounds (cap at 999% to avoid overflow)
    calculated_roi := CASE 
        WHEN monthly_executions > 0 AND total_money > 0
        THEN LEAST(999, ((total_money - (monthly_executions * 10)) / GREATEST(monthly_executions * 10, 1)) * 100)
        ELSE 0 
    END;
    
    -- Update existing or insert new user metrics
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
        target_user_id,
        monthly_time,
        monthly_money,
        total_money,
        monthly_executions,
        calculated_roi,
        1,
        now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        time_saved_month = EXCLUDED.time_saved_month,
        money_saved_month = EXCLUDED.money_saved_month,
        money_saved_total = EXCLUDED.money_saved_total,
        executions_month = EXCLUDED.executions_month,
        roi_percentage = EXCLUDED.roi_percentage,
        managed_workflows = EXCLUDED.managed_workflows,
        last_updated = EXCLUDED.last_updated;
END;
$function$;
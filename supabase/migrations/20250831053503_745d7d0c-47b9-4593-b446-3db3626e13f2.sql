-- Create function to recalculate user metrics from execution logs
CREATE OR REPLACE FUNCTION recalculate_user_metrics(target_user_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_month text;
    monthly_executions integer;
    monthly_time integer;
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
    
    -- Calculate ROI (assuming $10 cost per execution)
    calculated_roi := CASE 
        WHEN monthly_executions > 0 
        THEN ((total_money - (monthly_executions * 10)) / (monthly_executions * 10)) * 100
        ELSE 0 
    END;
    
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
        time_saved_month = monthly_time,
        money_saved_month = monthly_money,
        money_saved_total = total_money,
        executions_month = monthly_executions,
        roi_percentage = calculated_roi,
        last_updated = now();
END;
$$ LANGUAGE plpgsql;

-- Recalculate metrics for the existing user
SELECT recalculate_user_metrics('e8727b67-2c5f-4f52-8cd1-616438128b07');
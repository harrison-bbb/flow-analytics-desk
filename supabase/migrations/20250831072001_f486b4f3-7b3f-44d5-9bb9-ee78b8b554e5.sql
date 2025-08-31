-- Fix numeric field overflow issues by increasing precision limits

-- Update user_metrics table to handle larger ROI and money values
ALTER TABLE user_metrics 
ALTER COLUMN roi_percentage TYPE numeric(8,2),
ALTER COLUMN money_saved_month TYPE numeric(10,2),
ALTER COLUMN money_saved_total TYPE numeric(12,2);

-- Update executions_log table to handle larger money and time values
ALTER TABLE executions_log
ALTER COLUMN time_saved TYPE numeric(8,2),
ALTER COLUMN money_saved TYPE numeric(10,2);

-- Update workflows table to handle larger estimated values
ALTER TABLE workflows
ALTER COLUMN estimated_money_saved_per_run TYPE numeric(10,2);

-- Update the ROI calculation function to prevent overflow
CREATE OR REPLACE FUNCTION public.calculate_roi_safe(total_saved numeric, executions integer)
RETURNS numeric
LANGUAGE plpgsql
AS $$
BEGIN
    -- Return 0 if no executions or negative savings
    IF executions <= 0 OR total_saved <= 0 THEN
        RETURN 0;
    END IF;
    
    -- Calculate ROI with reasonable bounds (cap at 9999% to prevent overflow)
    -- Assumes $10 cost per execution as baseline
    DECLARE
        cost_basis numeric := executions * 10;
        roi_value numeric;
    BEGIN
        roi_value := ((total_saved - cost_basis) / cost_basis) * 100;
        
        -- Cap ROI between -100% and 9999% to prevent overflow
        RETURN GREATEST(-100, LEAST(9999, roi_value));
    END;
END;
$$;

-- Update the user metrics calculation function to use safe ROI calculation
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
BEGIN
    -- Get current month in YYYY-MM format
    current_month := to_char(now(), 'YYYY-MM');
    
    -- Get existing metrics
    SELECT to_char(last_updated, 'YYYY-MM') INTO last_updated_month
    FROM user_metrics 
    WHERE user_id = NEW.user_id;
    
    -- Check if we need to reset monthly counters
    reset_monthly := (last_updated_month IS NULL OR last_updated_month != current_month);
    
    -- Calculate new total saved and executions for ROI
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
        calculate_roi_safe(COALESCE(NEW.money_saved, 0), 1),
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
        roi_percentage = calculate_roi_safe(new_total_saved, new_executions),
        last_updated = now();
    
    RETURN NEW;
END;
$$;
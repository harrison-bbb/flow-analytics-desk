-- Fix security warnings by setting search_path for functions that don't have it

-- Fix calculate_roi_safe function
CREATE OR REPLACE FUNCTION public.calculate_roi_safe(total_saved numeric, executions integer)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Fix calculate_roi_with_plan function 
CREATE OR REPLACE FUNCTION public.calculate_roi_with_plan(total_saved NUMERIC, plan_cost NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
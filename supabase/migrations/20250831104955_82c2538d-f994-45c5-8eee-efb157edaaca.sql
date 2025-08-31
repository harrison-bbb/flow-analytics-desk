-- Add workflow management tracking columns
ALTER TABLE workflows 
ADD COLUMN is_currently_managed boolean DEFAULT true,
ADD COLUMN parent_workflow_id uuid REFERENCES workflows(id);

-- Add index for better performance
CREATE INDEX idx_workflows_parent_workflow_id ON workflows(parent_workflow_id);
CREATE INDEX idx_workflows_currently_managed ON workflows(is_currently_managed);

-- Function to update managed workflows count
CREATE OR REPLACE FUNCTION public.update_managed_workflows_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_workflow_id uuid;
    managed_count integer;
BEGIN
    -- Get the user_id from the workflow
    IF TG_OP = 'DELETE' THEN
        user_workflow_id := OLD.user_id;
    ELSE
        user_workflow_id := NEW.user_id;
    END IF;
    
    -- Count currently managed workflows for this user
    SELECT COUNT(*) INTO managed_count
    FROM workflows 
    WHERE user_id = user_workflow_id 
    AND is_currently_managed = true;
    
    -- Update user_metrics
    INSERT INTO user_metrics (user_id, managed_workflows, last_updated)
    VALUES (user_workflow_id, managed_count, now())
    ON CONFLICT (user_id) DO UPDATE SET
        managed_workflows = managed_count,
        last_updated = now();
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- Create trigger for automatic workflow count updates
CREATE TRIGGER update_managed_workflows_trigger
AFTER INSERT OR UPDATE OF is_currently_managed OR DELETE
ON workflows
FOR EACH ROW
EXECUTE FUNCTION update_managed_workflows_count();
-- 1. Update Enums (Must be outside transaction blocks in some pg versions, run these individually if they error)
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'On Hold';
ALTER TYPE milestone_status ADD VALUE IF NOT EXISTS 'On Hold';

-- 2. Update projects table
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS planned_start_date DATE,
ADD COLUMN IF NOT EXISTS actual_start_date DATE,
ADD COLUMN IF NOT EXISTS planned_end_date DATE,
ADD COLUMN IF NOT EXISTS actual_end_date DATE,
ADD COLUMN IF NOT EXISTS remaining_budget DECIMAL(15, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);

UPDATE public.projects 
SET planned_start_date = start_date, planned_end_date = end_date 
WHERE planned_start_date IS NULL;

-- 3. Update milestones table
ALTER TABLE public.milestones
ADD COLUMN IF NOT EXISTS planned_start_date DATE,
ADD COLUMN IF NOT EXISTS actual_start_date DATE,
ADD COLUMN IF NOT EXISTS planned_end_date DATE,
ADD COLUMN IF NOT EXISTS actual_end_date DATE,
ADD COLUMN IF NOT EXISTS planned_budget DECIMAL(15, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(15, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS remaining_budget DECIMAL(15, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);

UPDATE public.milestones 
SET planned_start_date = start_date, planned_end_date = end_date 
WHERE planned_start_date IS NULL;

-- 4. Update tasks table
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS milestone_id UUID REFERENCES public.milestones(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS planned_start_date DATE,
ADD COLUMN IF NOT EXISTS actual_start_date DATE,
ADD COLUMN IF NOT EXISTS planned_end_date DATE,
ADD COLUMN IF NOT EXISTS actual_end_date DATE,
ADD COLUMN IF NOT EXISTS planned_cost DECIMAL(15, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(15, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS remaining_cost DECIMAL(15, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);

-- Trigger to calculate task remaining_cost
CREATE OR REPLACE FUNCTION update_task_remaining_cost()
RETURNS TRIGGER AS $$
BEGIN
    NEW.remaining_cost = COALESCE(NEW.planned_cost, 0) - COALESCE(NEW.actual_cost, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS task_remaining_cost_trigger ON public.tasks;
CREATE TRIGGER task_remaining_cost_trigger
BEFORE INSERT OR UPDATE OF planned_cost, actual_cost
ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION update_task_remaining_cost();

UPDATE public.tasks 
SET planned_start_date = start_date, planned_end_date = end_date 
WHERE planned_start_date IS NULL;

-- 5. Trigger Functions for Auto-Calculation

-- Task -> Milestone
CREATE OR REPLACE FUNCTION update_milestone_budget()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.milestone_id IS NOT NULL THEN
        UPDATE public.milestones
        SET 
            planned_budget = COALESCE((SELECT SUM(planned_cost) FROM public.tasks WHERE milestone_id = NEW.milestone_id), 0),
            actual_cost = COALESCE((SELECT SUM(actual_cost) FROM public.tasks WHERE milestone_id = NEW.milestone_id), 0),
            remaining_budget = COALESCE((SELECT SUM(planned_cost) - SUM(actual_cost) FROM public.tasks WHERE milestone_id = NEW.milestone_id), 0),
            progress = COALESCE((SELECT AVG(progress)::INT FROM public.tasks WHERE milestone_id = NEW.milestone_id), 0)
        WHERE id = NEW.milestone_id;
    END IF;
    
    IF TG_OP = 'UPDATE' AND OLD.milestone_id IS NOT NULL AND OLD.milestone_id != NEW.milestone_id THEN
        -- Handle case where a task is moved to another milestone
        UPDATE public.milestones
        SET 
            planned_budget = COALESCE((SELECT SUM(planned_cost) FROM public.tasks WHERE milestone_id = OLD.milestone_id), 0),
            actual_cost = COALESCE((SELECT SUM(actual_cost) FROM public.tasks WHERE milestone_id = OLD.milestone_id), 0),
            remaining_budget = COALESCE((SELECT SUM(planned_cost) - SUM(actual_cost) FROM public.tasks WHERE milestone_id = OLD.milestone_id), 0),
            progress = COALESCE((SELECT AVG(progress)::INT FROM public.tasks WHERE milestone_id = OLD.milestone_id), 0)
        WHERE id = OLD.milestone_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS task_budget_trigger ON public.tasks;
CREATE TRIGGER task_budget_trigger
AFTER INSERT OR UPDATE OR DELETE
ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION update_milestone_budget();

-- Milestone -> Project
CREATE OR REPLACE FUNCTION update_project_budget()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.project_id IS NOT NULL THEN
        UPDATE public.projects
        SET 
            budget = COALESCE((SELECT SUM(planned_budget) FROM public.milestones WHERE project_id = NEW.project_id), 0),
            actual_cost = COALESCE((SELECT SUM(actual_cost) FROM public.milestones WHERE project_id = NEW.project_id), 0),
            remaining_budget = COALESCE((SELECT SUM(planned_budget) - SUM(actual_cost) FROM public.milestones WHERE project_id = NEW.project_id), 0),
            progress = COALESCE((SELECT AVG(progress)::INT FROM public.milestones WHERE project_id = NEW.project_id), 0)
        WHERE id = NEW.project_id;
    END IF;
    
    IF TG_OP = 'UPDATE' AND OLD.project_id IS NOT NULL AND OLD.project_id != NEW.project_id THEN
        -- Handle case where a milestone is moved to another project
        UPDATE public.projects
        SET 
            budget = COALESCE((SELECT SUM(planned_budget) FROM public.milestones WHERE project_id = OLD.project_id), 0),
            actual_cost = COALESCE((SELECT SUM(actual_cost) FROM public.milestones WHERE project_id = OLD.project_id), 0),
            remaining_budget = COALESCE((SELECT SUM(planned_budget) - SUM(actual_cost) FROM public.milestones WHERE project_id = OLD.project_id), 0),
            progress = COALESCE((SELECT AVG(progress)::INT FROM public.milestones WHERE project_id = OLD.project_id), 0)
        WHERE id = OLD.project_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS milestone_budget_trigger ON public.milestones;
CREATE TRIGGER milestone_budget_trigger
AFTER INSERT OR UPDATE OR DELETE
ON public.milestones
FOR EACH ROW
EXECUTE FUNCTION update_project_budget();

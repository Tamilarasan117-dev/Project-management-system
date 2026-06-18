-- Add project_type to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Internal project' CHECK (type IN ('Internal project', 'External project'));

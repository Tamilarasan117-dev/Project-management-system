-- Add document_url and remarks to tasks table
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS document_url TEXT,
ADD COLUMN IF NOT EXISTS remarks TEXT;

-- Update documents table to support milestone-wise uploads and remarks
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS milestone_id UUID REFERENCES public.milestones(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS remarks TEXT;

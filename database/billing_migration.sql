-- Create the billings table
CREATE TABLE IF NOT EXISTS public.billings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES public.milestones(id) ON DELETE CASCADE,
    vendor_name TEXT NOT NULL,
    invoice_no TEXT NOT NULL,
    invoice_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    payment_status TEXT NOT NULL CHECK (payment_status IN ('Paid', 'Not Paid')),
    attachment_url TEXT,
    actual_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.billings ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policy
DROP POLICY IF EXISTS "Enable full access for authenticated users" ON public.billings;
CREATE POLICY "Enable full access for authenticated users" ON public.billings
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

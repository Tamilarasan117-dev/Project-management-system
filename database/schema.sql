-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types (idempotent)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('Project Manager', 'Team Member', 'UI/UX Designer', 'Frontend Developer', 'Backend Developer', 'API Developer', 'Database Developer', 'QA / Testing Engineer', 'Deployment Engineer', 'DevOps Engineer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('Active', 'Inactive', 'On Leave');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('Started', 'In Progress', 'Completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE milestone_status AS ENUM ('Not Started', 'In Progress', 'Completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('Started', 'In Progress', 'Completed', 'Blocked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_type AS ENUM ('Individual', 'Team');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users table (extends Supabase auth if needed, but for simplicity here we use a custom table for EPMS users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    role user_role NOT NULL,
    status user_status DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    budget DECIMAL(15, 2) NOT NULL,
    actual_cost DECIMAL(15, 2) DEFAULT 0.00,
    status project_status DEFAULT 'Started',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;

-- Milestones table
CREATE TABLE IF NOT EXISTS public.milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status milestone_status DEFAULT 'Not Started',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Teams table
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    lead_id UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status task_status DEFAULT 'Started',
    type task_type NOT NULL,
    assigned_to VARCHAR(255),
    role VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Team Members mapping
CREATE TABLE IF NOT EXISTS public.team_members (
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    PRIMARY KEY (team_id, user_id)
);

-- Daily Progress Reports (DPR)
CREATE TABLE IF NOT EXISTS public.dprs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    employee_name VARCHAR(255) NOT NULL,
    task_name VARCHAR(255),
    report_date DATE NOT NULL,
    hours_worked DECIMAL(5, 2) NOT NULL,
    progress INT CHECK (progress >= 0 AND progress <= 100),
    status task_status,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Documents
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    size_str VARCHAR(50) NOT NULL,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Email Notifications History
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT,
    status VARCHAR(50) DEFAULT 'Sent',
    sent_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Overall Budget Configuration (Single row config)
CREATE TABLE IF NOT EXISTS public.budget_config (
    id INT PRIMARY KEY DEFAULT 1,
    overall_budget DECIMAL(15, 2) NOT NULL
);

-- Disable RLS for easy testing from frontend without auth
ALTER TABLE public.milestones DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.dprs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;


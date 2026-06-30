# CRM & Project Management System: Documentation

## Overview
The CRM & Project Management System is a comprehensive web application designed to streamline project lifecycle management, team collaboration, financial tracking, and document management. It serves as a centralized hub for managing internal and external projects from initiation to billing.

## Technology Stack
- **Frontend Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + Lucide React Icons
- **Routing:** React Router DOM v6
- **Data Visualization:** Recharts, Gantt-Task-React
- **Backend & Database:** Supabase (PostgreSQL, Auth, Storage, Realtime)

## Core Modules & Features

### 1. Dashboard
The centralized control panel providing high-level metrics across the entire system.
- **Top Metrics:** Aggregated count of Projects, Milestones, active Tasks, and Total System Budget.
- **Financial Visualizations:** Dynamic Pie Charts depicting Budget Utilization (Remaining Budget vs Actual Cost).
- **Progress Tracking:** Bar charts representing the completion status of active projects.
- *Data Flow:* Fetches real-time aggregations from `projects`, `tasks`, and `billings`.

### 2. Project Management
The foundation of the hierarchy. All work is scoped under a Project.
- **Creation:** Users define Project Name, Code, Dates, and Planned Budget.
- **Categorization:** Projects are tagged as either `Internal project` or `External project`.
- **Automation:** Creating a project automatically provisions standard Milestones (Requirement Gathering, Design, Development, Testing).

### 3. Milestone & Task Management
Breaks down projects into actionable phases and assignable work units.
- **Milestones:** Major phases within a project.
- **Tasks:** Specific deliverables assigned to Team members. Tracks `Planned Cost`, `Hours Logged`, and `Completion Percentage`.

### 4. Gantt Chart
Visual timeline of all projects.
- **Tabbed Interface:** Separates timelines for `Internal Team` and `External Team` based on the Project Type.
- **Dependencies:** Visually renders start/end dates to identify bottlenecks.

### 5. Daily Progress Report (DPR)
The time-tracking and status-updating engine for team members.
- **Logging:** Employees log hours worked and update task completion percentages daily.
- **Rollup:** Task progress automatically rolls up to update Milestone and Project overall progress.

### 6. Budget & Financial Tracking
Monitors the financial health of the organization.
- **Planned Budget:** Manually set during Project creation. Commas and text-formatting are automatically parsed to ensure accurate numeric storage.
- **Actual Cost (Automated):** Project actual costs are dynamically fetched and calculated from the **Billing** module. 
- **Balanced Cost / Remaining Budget:** Automatically calculated as `Planned Budget` minus `Actual Cost`.

### 7. Billing Management
Handles all external vendor invoices and client billing.
- **Invoicing:** Users record Vendor Name, Invoice Number, Amount, and Payment Status.
- **Integration:** The `Invoice Amount` is directly tied to the Budget module. Adding an invoice immediately increases the Project's Actual Cost and decreases its Remaining Budget.

### 8. Document Management
Central repository for project artifacts.
- **Storage:** Direct integration with Supabase Storage buckets.
- **Hierarchy:** Documents are organized strictly by Project and Milestone.

## Database Architecture
The PostgreSQL database (managed via Supabase) is highly relational, utilizing Foreign Keys with `ON DELETE CASCADE` to maintain data integrity.

### Key Tables
1. `projects` - Top level entity.
2. `milestones` - Child of `projects`.
3. `tasks` - Child of `milestones`.
4. `billings` - Financial records tied to `projects`.
5. `documents` - File metadata tied to `projects` and `milestones`.

### Automated Triggers
The backend utilizes PL/pgSQL triggers to maintain data consistency:
- **`billing_actual_cost_trigger`**: Runs on `billings` (INSERT/UPDATE/DELETE). Automatically sums `invoice_amount` and updates `projects.actual_cost`.
- **`task_remaining_cost_trigger`**: Calculates individual task remaining costs.

## Security
- **Row Level Security (RLS):** Enabled on tables to ensure data access is restricted to authenticated users.
- **Authentication:** Managed entirely via Supabase Auth.

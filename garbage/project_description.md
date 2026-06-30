# CRM & Project Resource Management System

## Overview
The **CRM & Project Resource Management System** is a comprehensive, modern web application designed to track and manage projects, tasks, budgets, and teams in real-time. Built with a sleek, glassmorphic UI, the system provides project managers with deep visibility into daily operations, financial health, and document organization.

## Technology Stack
- **Frontend Framework**: React (with Vite for fast bundling)
- **Language**: TypeScript
- **Styling**: Vanilla CSS with modern "Magic UI" principles (glassmorphism, smooth animations, CSS variables for theming)
- **Icons**: Lucide React
- **Backend / Database**: Supabase (PostgreSQL)
- **Cloud Storage**: Supabase Storage
- **Real-time Engine**: Supabase Realtime (Postgres Changes)

## Core Modules & Features

### 1. Dashboard
- **Executive Overview**: High-level metrics showing Total Projects, Active Projects, Total Tasks, and Completed Tasks.
- **Financial Tracking**: Real-time synchronization of the Overall Budget vs. Actual Costs, displaying the exact remaining budget across the entire organization.
- **Real-time Updates**: Data across the dashboard updates automatically without needing to refresh.

### 2. Project Management
- **Lifecycle Tracking**: Create and manage projects from initiation to completion.
- **Financials**: Track allocated budget versus actual cost per project.
- **Status Workflows**: Categorize projects by status (Not Started, Started, In Progress, On Hold, Completed, Blocked).

### 3. Gantt Chart
- **Visual Timelines**: Interactive timeline visualization of all active projects.
- **Date Tracking**: Automatically maps project Start Dates and End Dates to a clear visual calendar.

### 4. Milestones & Task Management
- **Milestones**: Break large projects down into manageable phases.
- **Task Assignment**: Assign specific tasks to Internal Teams or External Vendors.
- **Task Metrics**: Track Planned vs. Actual start/end dates and costs.
- **Cloud Document Attachments**: Upload task-related documents directly to Supabase Cloud Storage.

### 5. Document Management
- **Hierarchical Drill-down**: Documents are organized cleanly by **Project > Milestone**.
- **Cloud Storage Integration**: Seamless integration with Supabase Storage buckets (`PRM document files`).
- **Live Access**: Instantly open, view, and download uploaded files directly from the cloud without relying on local storage.
- **Legacy Fallback**: Automatic routing to fetch files by name even if they were uploaded prior to the full cloud integration.

### 6. Team & Resource Management (DPR)
- **Team Organization**: Manage team members and external contractors.
- **Daily Progress Reports (DPR)**: Employees log their daily hours worked and percentage of progress against specific tasks. 

### 7. Budget & Billing
- **Centralized Budgeting**: Manage the overarching company budget.
- **Cost Analysis**: Granular tracking of planned costs vs actual costs at the task level, rolling up to the project and global level.

## Architecture Highlights
- **Real-time Subscriptions**: The application utilizes Supabase's `channel` subscriptions to listen for `INSERT`, `UPDATE`, and `DELETE` events on the database. When a team member updates a task, the UI instantly reflects the change for all other connected users.
- **Component Modularity**: The UI is broken down into modular React components (`Dashboard`, `TaskManagement`, `DocumentManagement`, etc.) for maintainability.
- **Security & RLS**: Utilizes Supabase Row Level Security (RLS) policies to ensure that cloud storage and database records are securely accessed.

## Future Roadmap / Potential Enhancements
- Integration with an email provider (like Resend or SendGrid) for automated push notifications.
- Advanced role-based access control (RBAC) separating Admin, Manager, and Employee views.
- Exporting reports to PDF/Excel.

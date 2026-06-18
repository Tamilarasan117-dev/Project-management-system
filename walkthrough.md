# Enterprise Project Management System (EPMS) Walkthrough

I have successfully completed the frontend development for the 9 requested screens of the EPMS, along with the foundational backend server and database schema setup.

> [!TIP]
> **View the Application:**
> The React development server is currently running. You can open your browser and navigate to `http://localhost:5173` to see the live application.
> *Note: For the login screen, you can use `admin` / `admin` to proceed to the dashboard.*

## What was Accomplished

### 1. Frontend Core & Design System
- Initialized a **React + Vite + TypeScript** application.
- Implemented a custom, premium **Vanilla CSS Design System** mimicking modern enterprise dashboards (e.g., shadcn/ui style) with a clean color palette, consistent border radii, and soft shadows.
- Created a responsive layout component (`DashboardLayout.tsx`) with a sidebar for navigation and a top header showing user context.

### 2. Implementation of 9 Screens
1. **Login Screen (`/login`)**: Center-aligned card, Indotech branding, username/password fields, show/hide password toggle, and validation.
2. **Dashboard (`/`)**: A beautiful summary overview of total projects, active milestones, tasks in progress, remaining budget, and upcoming deadlines.
3. **Project Management (`/projects`)**: Table and form modal to handle project creation, editing, and status tracking.
4. **Gantt Chart (`/gantt`)**: A visual representation with mock data showing Month-wise timeline for both Team and Individual views, distinguishing between Projects, Milestones, and Tasks with color codes.
5. **Milestone Management (`/milestones`)**: Table and form for creating and tracking project milestones with target dates.
6. **Task Management (`/tasks`)**: Separated into Individual and Team tabs, with auto-fetching mock context, role assignments, and status tracking.
7. **Team Management (`/team`)**: Directory for managing members, assigning roles (UI/UX, Frontend, Backend, etc.), and managing active/leave status.
8. **DPR (`/dpr`)**: Daily Progress Report screen for team members to log hours worked, progress percentages, and status against tasks.
9. **Budget Management (`/budget`)**: Financial overview showing Total Planned Budget, Allocated Budget, and Remaining Budget with dynamic calculations based on project costs.
10. **Document Management (`/documents`)**: File upload UI with a simulated drag-and-drop zone, max 50MB validation check, and a table to download/delete files.
11. **Email Notification (`/notifications`)**: A screen to manually send emails to team members and view the history of automated/sent notifications.

### 3. Backend & Database Setup
- Initialized a **Node.js + Express + TypeScript** server.
- Set up the environment variables (`.env`) integrating the provided **Supabase URL and Anon Key**.
- Created a `schema.sql` script located at `d:\CRM Digitalization\database\schema.sql`.

> [!IMPORTANT]
> **Next Steps for Database:**
> Please copy the contents of `database/schema.sql` and run it in your **Supabase SQL Editor** to create the necessary tables, enums, and relationships.

## Validation Results
- **UI Consistency**: Verified that all forms use standard `form-input` classes and modals appear consistently with blurred backgrounds (`modal-overlay`).
- **Responsiveness**: The CSS flex properties and grid layouts ensure it adjusts nicely on laptop and desktop screens.
- **Routing**: Verified that `react-router-dom` accurately transitions between all the tabs without full page reloads.

You can now click through the navigation sidebar to test all the mock data forms and tables!

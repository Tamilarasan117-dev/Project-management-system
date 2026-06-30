# CRM & Project Management: Comprehensive Test Cases

This document outlines the test cases for validating the core functionalities of the CRM & Project Management System.

## 1. Authentication & Roles
| Test Case ID | Feature | Description | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC-AUTH-01 | Login | Valid user login | 1. Enter valid email & password. <br> 2. Click Login. | User is navigated to the Dashboard. | |
| TC-AUTH-02 | Login | Invalid user login | 1. Enter invalid credentials. <br> 2. Click Login. | Error message is displayed. User remains on login screen. | |
| TC-AUTH-03 | Session | Persist session | 1. Login to app. <br> 2. Refresh browser. | User remains logged in without re-entering credentials. | |

## 2. Project & Milestone Management
| Test Case ID | Feature | Description | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC-PRJ-01 | Create Project | Add a new Internal project | 1. Navigate to Projects. <br> 2. Click Add Project. <br> 3. Fill details (Type: Internal, Budget: 50,000). <br> 4. Save. | Project appears in table. Budget formatting handles commas correctly. | |
| TC-PRJ-02 | Edit Project Budget | Update project budget with commas | 1. Click Edit on a project. <br> 2. Enter '15,000' in Budget field. <br> 3. Save. | Budget saves correctly as '15000' and displays as '₹ 15,000' without resetting to 0. | |
| TC-PRJ-03 | Auto Milestones | Automatic milestone generation | 1. Create a new project. <br> 2. Navigate to Milestones. | 4 standard milestones (Requirement, Design, Dev, Testing) are auto-created for the new project. | |
| TC-MIL-01 | Create Milestone | Add manual milestone | 1. Navigate to Milestones. <br> 2. Add milestone to existing project. <br> 3. Save. | New milestone is linked to the correct project and visible in the list. | |

## 3. Gantt Chart
| Test Case ID | Feature | Description | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC-GNT-01 | Internal Tab | Filter by Internal projects | 1. Go to Gantt Chart. <br> 2. Click "Internal Team Gantt Chart" tab. | Only projects with Type = 'Internal project' are displayed on the timeline. | |
| TC-GNT-02 | External Tab | Filter by External projects | 1. Go to Gantt Chart. <br> 2. Click "External Team Gantt Chart" tab. | Only projects with Type = 'External project' are displayed on the timeline. | |
| TC-GNT-03 | Auto-Scheduling | View task dependencies | 1. Create project with dates. | Gantt chart renders bars spanning the correct start and end dates. | |

## 4. Billing & Financials
| Test Case ID | Feature | Description | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC-BIL-01 | Create Invoice | Add a new vendor bill | 1. Go to Billing. <br> 2. Add Bill for Project X with Amount ₹10,000. | Invoice appears in Billing table. | |
| TC-BIL-02 | Actual Cost Sync | Auto-calculate Actual Cost | 1. Go to Budget module. <br> 2. View Project X. | Project X 'Actual Cost' automatically shows ₹10,000. 'Remaining Budget' is updated. | |
| TC-BIL-03 | Delete Invoice Sync | Auto-recalculate on delete | 1. Go to Billing. <br> 2. Delete the ₹10,000 invoice. <br> 3. Go to Budget. | Project X 'Actual Cost' returns to ₹0. Remaining Budget increases. | |
| TC-BIL-04 | Edit Invoice Sync | Auto-recalculate on edit | 1. Go to Billing. <br> 2. Edit invoice to ₹5,000. <br> 3. Go to Budget. | Project X 'Actual Cost' instantly updates to ₹5,000. | |

## 5. Dashboard
| Test Case ID | Feature | Description | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC-DASH-01 | Metric Cards | View top-level metrics | 1. Go to Dashboard. | Total Projects, Active Tasks, and Total Budget sum up correctly across the system. | |
| TC-DASH-02 | Budget Charts | Pie chart accuracy | 1. Go to Dashboard. | Pie chart slices visually represent 'Remaining Budget' vs 'Actual Cost' from Billing. | |
| TC-DASH-03 | Project Progress | Progress bars | 1. Go to Dashboard. | Project progress bars reflect the aggregated completion percentage of underlying tasks. | |

## 6. Document Management
| Test Case ID | Feature | Description | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC-DOC-01 | Upload | Upload a file | 1. Go to Documents. <br> 2. Select Project & Milestone. <br> 3. Upload PDF. | File uploads successfully to Supabase Storage. | |
| TC-DOC-02 | View | View uploaded file | 1. Click View icon on uploaded document. | File opens in a new browser tab. | |
| TC-DOC-03 | Delete | Remove a file | 1. Click Delete icon. <br> 2. Confirm. | File is removed from the table and Supabase Storage. | |

## 7. Daily Progress Report (DPR)
| Test Case ID | Feature | Description | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC-DPR-01 | Log Hours | Submit daily work | 1. Go to DPR. <br> 2. Select Project/Milestone/Task. <br> 3. Enter Hours & Progress. <br> 4. Save. | Entry is saved. Task progress is updated system-wide. | |

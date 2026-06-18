import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProjectManagement from './pages/ProjectManagement';
import GanttChart from './pages/GanttChart';
import MilestoneManagement from './pages/MilestoneManagement';
import TaskManagement from './pages/TaskManagement';
import TeamManagement from './pages/TeamManagement';
import DPR from './pages/DPR';
import BudgetManagement from './pages/BudgetManagement';
import DocumentManagement from './pages/DocumentManagement';
import EmailNotification from './pages/EmailNotification';
import BillingManagement from './pages/BillingManagement';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<ProjectManagement />} />
          <Route path="gantt" element={<GanttChart />} />
          <Route path="milestones" element={<MilestoneManagement />} />
          <Route path="tasks" element={<TaskManagement />} />
          <Route path="team" element={<TeamManagement />} />
          <Route path="dpr" element={<DPR />} />
          <Route path="budget" element={<BudgetManagement />} />
          <Route path="billing" element={<BillingManagement />} />
          <Route path="documents" element={<DocumentManagement />} />
          <Route path="notifications" element={<EmailNotification />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

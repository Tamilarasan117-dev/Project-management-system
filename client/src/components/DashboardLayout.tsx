import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  CalendarDays, 
  Flag, 
  CheckSquare, 
  Users, 
  FileText, 
  DollarSign, 
  FolderOpen, 
  Mail,
  Receipt,
  LogOut
} from 'lucide-react';

const Logo = () => (
  <svg width="150" height="40" viewBox="0 0 150 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="150" height="40" fill="#e3282f" />
    <text x="75" y="27" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="1">
      INDO TECH
    </text>
  </svg>
);

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: Briefcase },
  { name: 'Gantt Chart', href: '/gantt', icon: CalendarDays },
  { name: 'Milestones', href: '/milestones', icon: Flag },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Team', href: '/team', icon: Users },
  { name: 'DPR', href: '/dpr', icon: FileText },
  { name: 'Budget', href: '/budget', icon: DollarSign },
  { name: 'Billing', href: '/billing', icon: Receipt },
  { name: 'Documents', href: '/documents', icon: FolderOpen },
  { name: 'Notifications', href: '/notifications', icon: Mail },
];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="glass" style={{
        width: 'var(--sidebar-width)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
        boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ height: 'var(--header-height)', display: 'flex', alignItems: 'center', padding: '0 1.5rem', borderBottom: '1px solid rgba(226, 232, 240, 0.4)' }}>
          <Logo />
        </div>
        <nav style={{ flex: 1, padding: '1.5rem 1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  borderRadius: '0.75rem',
                  color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
                  backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  transform: isActive ? 'scale(1.02)' : 'scale(1)'
                }}
                onMouseOver={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
                }}
                onMouseOut={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <item.icon size={isActive ? 22 : 20} style={{ transition: 'all 0.3s ease' }} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
          <button 
            onClick={handleLogout}
            className="btn w-full" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-start', color: 'var(--muted-foreground)', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="glass" style={{ 
          height: 'var(--header-height)', 
          borderBottom: '1px solid rgba(226, 232, 240, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem',
          zIndex: 5,
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h2 className="text-xl font-bold capitalize text-slate-800">
            {location.pathname === '/' ? 'Dashboard' : location.pathname.substring(1).replace('-', ' ')}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ textAlign: 'right' }}>
                <p className="text-sm font-semibold">User Name</p>
                <p className="text-sm text-muted" style={{ fontSize: '0.75rem' }}>Project Manager</p>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e3282f', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                UN
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

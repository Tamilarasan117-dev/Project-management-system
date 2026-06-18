import { Briefcase, CalendarDays, CheckSquare, DollarSign, PieChart as PieChartIcon, BarChart2 } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
export default function Dashboard() {
  const [projects, setProjects] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync with Budget Management page
  const [overallBudget] = useLocalStorage('epms_overall_budget', 5000000);

  useEffect(() => {
    fetchDashboardData();

    const subProjects = supabase.channel('dash_projects').on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, fetchDashboardData).subscribe();
    const subMilestones = supabase.channel('dash_milestones').on('postgres_changes', { event: '*', schema: 'public', table: 'milestones' }, fetchDashboardData).subscribe();
    const subTasks = supabase.channel('dash_tasks').on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchDashboardData).subscribe();

    return () => {
      supabase.removeChannel(subProjects);
      supabase.removeChannel(subMilestones);
      supabase.removeChannel(subTasks);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [projectsRes, milestonesRes, tasksRes] = await Promise.all([
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('milestones').select('*'),
        supabase.from('tasks').select('*')
      ]);

      setProjects(projectsRes.data || []);
      setMilestones(milestonesRes.data || []);
      setTasks(tasksRes.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const actualCost = projects.reduce((sum, p) => sum + (Number(p.actual_cost) || 0), 0);
  const remainingBudget = overallBudget - actualCost;
  
  const activeMilestones = milestones.filter(m => m.status === 'In Progress' || m.status === 'Not Started').length;
  const tasksInProgress = tasks.filter(t => t.status === 'In Progress').length;
  const tasksCompleted = tasks.filter(t => t.status === 'Completed').length;

  // Compute Upcoming Deadlines by looking at uncompleted tasks with end_dates close to today
  const upcomingDeadlines = [...tasks]
    .filter(t => t.status !== 'Completed' && t.end_date)
    .sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())
    .slice(0, 4);

  const getMonthStr = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('default', { month: 'short' }).toUpperCase();
    } catch { return '---'; }
  };
  
  const getDayStr = (dateStr: string) => {
    try {
      return new Date(dateStr).getDate().toString();
    } catch { return '-'; }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return { bg: '#dcfce7', text: '#16a34a', bar: '#16a34a', percent: '100%' };
      case 'In Progress': return { bg: '#dbeafe', text: '#2563eb', bar: '#2563eb', percent: '50%' };
      case 'Started': return { bg: '#e0e7ff', text: '#4f46e5', bar: '#4f46e5', percent: '20%' };
      case 'Blocked': return { bg: '#fee2e2', text: '#dc2626', bar: '#dc2626', percent: '10%' };
      default: return { bg: '#f1f5f9', text: '#64748b', bar: '#cbd5e1', percent: '0%' };
    }
  };

  // Data for Charts
  const projectStatusData = [
    { name: 'Completed', value: projects.filter(p => p.status === 'Completed').length, color: '#10b981' },
    { name: 'In Progress', value: projects.filter(p => p.status === 'In Progress').length, color: '#3b82f6' },
    { name: 'Started', value: projects.filter(p => p.status === 'Started').length, color: '#8b5cf6' },
    { name: 'Blocked', value: projects.filter(p => p.status === 'Blocked').length, color: '#ef4444' },
    { name: 'Not Started', value: projects.filter(p => !p.status || p.status === 'Not Started').length, color: '#cbd5e1' }
  ].filter(d => d.value > 0);

  const taskStatusData = [
    { name: 'Completed', count: tasks.filter(t => t.status === 'Completed').length, fill: '#10b981' },
    { name: 'In Progress', count: tasks.filter(t => t.status === 'In Progress').length, fill: '#3b82f6' },
    { name: 'Not Started', count: tasks.filter(t => !t.status || t.status === 'Not Started').length, fill: '#cbd5e1' },
    { name: 'Blocked', count: tasks.filter(t => t.status === 'Blocked').length, fill: '#ef4444' }
  ].filter(d => d.count > 0);

  return (
    <div className="flex flex-col gap-6 p-2">
      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <div className="card glass-card">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-muted">Total Projects</p>
              <h3 className="text-3xl mt-1 text-slate-800">{projects.length}</h3>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 text-blue-700 shadow-sm">
              <Briefcase size={24} />
            </div>
          </div>
          <div className="text-sm flex items-center gap-1">
            <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-md text-xs">+Active tracking</span>
          </div>
        </div>

        <div className="card glass-card">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-muted">Active Milestones</p>
              <h3 className="text-3xl mt-1 text-slate-800">{activeMilestones}</h3>
            </div>
            <div className="p-3 rounded-xl bg-warning/10 text-warning shadow-sm">
              <CalendarDays size={24} />
            </div>
          </div>
          <div className="text-sm">
            <span className="font-medium text-muted">Across all projects</span>
          </div>
        </div>

        <div className="card glass-card">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-muted">Total Tasks</p>
              <h3 className="text-3xl mt-1 text-slate-800">{tasks.length}</h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 shadow-sm">
              <CheckSquare size={24} />
            </div>
          </div>
          <div className="text-sm flex items-center gap-2">
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md text-xs">{tasksCompleted} completed</span>
            <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-md text-xs">{tasksInProgress} in progress</span>
          </div>
        </div>

        <div className="card glass-card">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-muted">Remaining Budget</p>
              <h3 className="text-3xl mt-1 text-slate-800">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(remainingBudget)}
              </h3>
            </div>
            <div className="p-3 rounded-xl" style={{ backgroundColor: '#f3e8ff', color: '#9333ea' }}>
              <DollarSign size={24} />
            </div>
          </div>
          <div className="text-sm">
            <span className="font-medium text-muted">
              {actualCost > 0 ? `${Math.round((actualCost / overallBudget) * 100) || 0}% used of total` : 'No expenses yet'}
            </span>
          </div>
        </div>
      </div>

      {/* Pictorial Representation (Charts) Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        <div className="card">
          <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <PieChartIcon size={20} style={{ color: '#2563eb' }} />
            <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>Project Status Distribution</h2>
          </div>
          <div style={{ height: '300px' }} className="w-full">
            {projectStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">No project data available</div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <BarChart2 size={20} style={{ color: '#10b981' }} />
            <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>Tasks Progress Overview</h2>
          </div>
          <div style={{ height: '300px' }} className="w-full">
            {taskStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskStatusData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {taskStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">No task data available</div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
        {/* Recent Projects Table */}
        <div className="card glass-card table-container" style={{ flex: '2', minWidth: '400px' }}>
          <div className="flex justify-between items-center mb-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-lg font-bold text-slate-800">Recent Projects</h2>
            <span className="font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full cursor-pointer hover:bg-blue-100 transition-colors">View All</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Status</th>
                  <th>Overall Progress</th>
                </tr>
              </thead>
              <tbody>
                {projects.slice(0, 5).map(project => {
                  const colors = getStatusColor(project.status);
                  return (
                    <tr key={project.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem' }}>
                        <div className="font-semibold" style={{ color: 'var(--foreground)' }}>{project.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{project.code}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span 
                          style={{ padding: '0.25rem 0.625rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap', backgroundColor: colors.bg, color: colors.text }}
                        >
                          {project.status || 'Not Started'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div className="flex items-center gap-3">
                          <div style={{ flex: 1, height: '0.5rem', backgroundColor: 'var(--secondary)', borderRadius: '9999px', overflow: 'hidden' }}>
                            <div 
                              style={{ height: '100%', borderRadius: '9999px', transition: 'width 0.5s', width: colors.percent, backgroundColor: colors.bar }}
                            ></div>
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, width: '2rem', textAlign: 'right', color: colors.text }}>
                            {colors.percent}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {projects.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ color: 'var(--muted-foreground)', textAlign: 'center', padding: '2.5rem', fontWeight: 500 }}>
                      {loading ? 'Loading projects...' : 'No projects active.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="card" style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column' }}>
          <div className="flex justify-between items-center mb-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>Upcoming Deadlines</h2>
          </div>
          
          <div className="flex flex-col gap-3">
            {upcomingDeadlines.length > 0 ? upcomingDeadlines.map((task, i) => {
              // Cycle through some nice soft colors based on index
              const colors = [
                { bg: '#fee2e2', text: '#dc2626' }, // red
                { bg: '#fef9c3', text: '#ca8a04' }, // yellow
                { bg: '#dbeafe', text: '#2563eb' }, // blue
                { bg: '#f3e8ff', text: '#9333ea' }, // purple
                { bg: '#fee2e2', text: '#dc2626' },
                { bg: '#fef9c3', text: '#ca8a04' },
                { bg: '#dbeafe', text: '#2563eb' },
                { bg: '#f3e8ff', text: '#9333ea' },
              ];
              const colorTheme = colors[i % colors.length];

              return (
                <div key={task.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                  <div style={{ padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: colorTheme.bg, color: colorTheme.text, textAlign: 'center', minWidth: '3rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>{getMonthStr(task.end_date)}</div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 800 }}>{getDayStr(task.end_date)}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--foreground)' }}>{task.title}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>{task.projects?.name || 'Assigned to Project'}</p>
                  </div>
                </div>
              );
            }) : (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.875rem', backgroundColor: 'var(--secondary)', borderRadius: '0.5rem' }}>
                No upcoming deadlines.
              </div>
            )}
          </div>
          
          {upcomingDeadlines.length > 0 && (
            <button style={{ marginTop: 'auto', paddingTop: '1rem', width: '100%', fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary)', borderTop: '1px solid var(--border)', padding: '1rem 0 0 0' }}>
              View Full Calendar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
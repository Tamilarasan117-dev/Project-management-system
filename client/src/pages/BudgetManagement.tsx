import { Search, Eye, Edit, Trash2, DollarSign, TrendingDown, TrendingUp, X } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function BudgetManagement() {
  const [overallBudget, setOverallBudget] = useLocalStorage('epms_overall_budget', 5000000);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditingOverall, setIsEditingOverall] = useState(false);
  const [tempBudget, setTempBudget] = useState(overallBudget);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<any>({});

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      
      const formattedProjects = data?.map(p => ({
        id: p.id,
        name: p.name,
        code: p.code,
        status: p.status,
        budget: p.budget,
        actualCost: p.actual_cost,
        endDate: p.end_date
      })) || [];
      
      setProjects(formattedProjects);
    } catch (error) {
      console.error('Error fetching budget projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const actualCost = projects.reduce((sum, p) => sum + (Number(p.actualCost) || 0), 0);
  const remainingBudget = overallBudget - actualCost;

  const handleUpdateCost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('projects').update({ actual_cost: currentProject.actualCost }).eq('id', currentProject.id);
      if (error) throw error;
      fetchProjects(); // Refresh the list from the database
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Error updating actual cost:', err);
      alert('Failed to update cost in the database');
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Completed': return <span className="badge badge-success">{status}</span>;
      case 'In Progress': return <span className="badge badge-primary">{status}</span>;
      case 'Started': return <span className="badge badge-secondary">{status}</span>;
      default: return <span className="badge badge-secondary">{status}</span>;
    }
  };

  return (
    <div>
      <div className="flex gap-6 mb-6">
        <div className="card flex-1">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-muted text-sm font-medium">Total Planned Budget</p>
              {isEditingOverall ? (
                <div className="flex items-center gap-2 mt-1">
                  <input 
                    type="number" 
                    className="form-input" 
                    style={{ padding: '0.25rem 0.5rem', width: '150px' }}
                    value={tempBudget}
                    onChange={e => setTempBudget(Number(e.target.value))}
                  />
                  <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => { setOverallBudget(tempBudget); setIsEditingOverall(false); }}>Save</button>
                  <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }} onClick={() => { setTempBudget(overallBudget); setIsEditingOverall(false); }}>Cancel</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold">₹ {overallBudget.toLocaleString('en-IN')}</h3>
                  <button onClick={() => setIsEditingOverall(true)} className="text-muted hover:text-primary"><Edit size={16} /></button>
                </div>
              )}
            </div>
            <div style={{ padding: '0.5rem', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '50%' }}>
              <DollarSign size={24} />
            </div>
          </div>
        </div>
        
        <div className="card flex-1">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-muted text-sm font-medium">Actual Cost</p>
              <h3 className="text-2xl font-bold text-warning">₹ {actualCost.toLocaleString('en-IN')}</h3>
              <p className="text-xs text-muted mt-1">Auto Calculated</p>
            </div>
            <div style={{ padding: '0.5rem', backgroundColor: 'var(--warning)', color: 'white', borderRadius: '50%' }}>
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        <div className="card flex-1">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-muted text-sm font-medium">Remaining Budget</p>
              <h3 className="text-2xl font-bold text-success">₹ {remainingBudget.toLocaleString('en-IN')}</h3>
              <p className="text-xs text-muted mt-1">Auto Calculated</p>
            </div>
            <div style={{ padding: '0.5rem', backgroundColor: 'var(--success)', color: 'white', borderRadius: '50%' }}>
              <TrendingDown size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="page-header">
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search projects..."
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Project Name</th>
              <th style={{ textAlign: 'right' }}>Planned Budget</th>
              <th style={{ textAlign: 'right' }}>Actual Cost</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map(project => (
              <tr key={project.id}>
                <td className="font-medium">{project.name}</td>
                <td style={{ textAlign: 'right' }}>₹ {(Number(project.budget) || 0).toLocaleString('en-IN')}</td>
                <td style={{ textAlign: 'right' }}>₹ {(Number(project.actualCost) || 0).toLocaleString('en-IN')}</td>
                <td>{getStatusBadge(project.status)}</td>
                <td>
                  <div className="flex gap-2">
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '0.25rem 0.5rem' }} 
                      title="View"
                      onClick={() => { setCurrentProject(project); setIsViewModalOpen(true); }}
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '0.25rem 0.5rem' }} 
                      title="Edit Cost"
                      onClick={() => { setCurrentProject(project); setIsEditModalOpen(true); }}
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '0.25rem 0.5rem', color: 'var(--destructive)' }} 
                      title="Delete"
                      onClick={() => {
                        if(confirm('Are you sure you want to remove this project?')) {
                          setProjects(projects.filter(p => p.id !== project.id));
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan={5} className="text-center text-muted py-8">Loading projects from backend...</td>
              </tr>
            )}
            {!loading && filteredProjects.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-muted py-8">No projects found. Create one in the Projects screen.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <h2 className="text-lg font-bold">Update Actual Cost</h2>
              <button onClick={() => setIsEditModalOpen(false)} style={{ color: 'var(--muted-foreground)' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateCost} className="flex flex-col gap-4">
              <div>
                <label className="form-label">Project Name</label>
                <input type="text" className="form-input" value={currentProject.name} disabled />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="form-label">Planned Budget</label>
                  <input type="number" className="form-input" value={currentProject.budget || ''} onChange={e => setCurrentProject({...currentProject, budget: e.target.value})} />
                </div>
                <div className="flex-1">
                  <label className="form-label">Actual Cost</label>
                  <input type="number" className="form-input" value={currentProject.actualCost || ''} onChange={e => setCurrentProject({...currentProject, actualCost: e.target.value})} required autoFocus />
                </div>
              </div>
              <div className="flex gap-4 mt-4">
                <button type="button" className="btn btn-outline flex-1" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary flex-1">Save Cost</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isViewModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px', padding: 0, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', animation: 'modalIn 0.3s ease-out' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <svg width="120" height="32" viewBox="0 0 150 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="150" height="40" rx="4" fill="#e3282f" />
                  <text x="75" y="27" fontFamily="Inter, sans-serif" fontSize="22" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="1">INDO TECH</text>
                </svg>
                <div style={{ height: '24px', width: '2px', backgroundColor: '#cbd5e1' }}></div>
                <h2 className="text-lg font-bold text-slate-800">Project Budget View</h2>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} style={{ color: '#64748b', padding: '0.5rem', borderRadius: '50%', backgroundColor: 'white', border: '1px solid #e2e8f0', cursor: 'pointer' }} className="hover:bg-slate-50 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div style={{ padding: '2rem', backgroundColor: '#f8fafc' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 className="text-xl font-bold text-slate-800 mb-1">{currentProject.name}</h3>
                <p className="text-sm text-slate-500">Budget & Financial Overview</p>
              </div>

              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #e2e8f0' }}>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Planned Budget</p>
                  <p className="text-2xl font-bold text-slate-800">₹ {(Number(currentProject.budget) || 0).toLocaleString('en-IN')}</p>
                </div>
                <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #e2e8f0', borderBottom: '4px solid #facc15' }}>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Actual Cost</p>
                  <p className="text-2xl font-bold text-slate-800">₹ {(Number(currentProject.actualCost) || 0).toLocaleString('en-IN')}</p>
                </div>
                <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #e2e8f0', borderBottom: '4px solid #22c55e' }}>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Remaining Budget</p>
                  <p className="text-2xl font-bold text-slate-800">₹ {Math.max(0, (Number(currentProject.budget) || 0) - (Number(currentProject.actualCost) || 0)).toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Chart Section */}
              <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #e2e8f0' }}>
                <div style={{ height: '300px' }} className="w-full flex justify-center items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Actual Cost', value: Number(currentProject.actualCost) || 0, color: '#facc15' },
                          { name: 'Remaining Budget', value: Math.max(0, (Number(currentProject.budget) || 0) - (Number(currentProject.actualCost) || 0)), color: '#22c55e' }
                        ].filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        animationBegin={0}
                        animationDuration={800}
                        animationEasing="ease-out"
                      >
                        {[
                          { name: 'Actual Cost', value: Number(currentProject.actualCost) || 0, color: '#facc15' },
                          { name: 'Remaining Budget', value: Math.max(0, (Number(currentProject.budget) || 0) - (Number(currentProject.actualCost) || 0)), color: '#22c55e' }
                        ].filter(d => d.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                         formatter={(value: any) => `₹ ${Number(value).toLocaleString('en-IN')}`} 
                         contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: '#f1f5f9', padding: '1rem 2rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-primary shadow-sm" onClick={() => setIsViewModalOpen(false)}>
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
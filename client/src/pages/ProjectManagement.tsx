import { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

type ProjectStatus = 'Started' | 'In Progress' | 'Completed';

interface Project {
  id: string;
  name: string;
  code: string;
  description: string;
  startDate: string;
  endDate: string;
  plannedStartDate?: string;
  actualStartDate?: string;
  plannedEndDate?: string;
  actualEndDate?: string;
  budget: number;
  plannedBudget?: number;
  actualCost?: number;
  progress?: number;
  isManualProgress?: boolean;
  status: ProjectStatus;
  type?: 'Internal project' | 'External project';
  managerName?: string;
}

export default function ProjectManagement() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Internal project' | 'External project'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<Partial<Project>>({});

  useEffect(() => {
    fetchProjects();

    const subscription = supabase
      .channel('projects_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        fetchProjects();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      
      // Transform data from snake_case to camelCase for the frontend
      const formattedProjects = data?.map(p => ({
        id: p.id,
        name: p.name,
        code: p.code,
        description: p.description,
        startDate: p.start_date,
        endDate: p.end_date,
        plannedStartDate: p.planned_start_date,
        actualStartDate: p.actual_start_date,
        plannedEndDate: p.planned_end_date,
        actualEndDate: p.actual_end_date,
        budget: p.budget,
        plannedBudget: p.planned_budget,
        actualCost: p.actual_cost,
        status: p.status,
        type: p.type,
        progress: p.progress || 0,
        isManualProgress: p.is_manual_progress || false,
        managerName: p.manager_name
      })) || [];
      
      setProjects(formattedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      alert('Failed to load projects from backend');
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(p => 
    (typeFilter === 'All' || p.type === typeFilter || (typeFilter === 'Internal project' && !p.type)) &&
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const dbProject = {
      name: currentProject.name,
      code: currentProject.code,
      description: currentProject.description,
      start_date: currentProject.startDate,
      end_date: currentProject.endDate,
      planned_start_date: currentProject.plannedStartDate || currentProject.startDate,
      planned_end_date: currentProject.plannedEndDate || currentProject.endDate,
      actual_start_date: currentProject.actualStartDate || null,
      actual_end_date: currentProject.actualEndDate || null,
      budget: currentProject.budget,
      progress: currentProject.progress || 0,
      is_manual_progress: currentProject.isManualProgress || false,
      status: currentProject.status || 'Started',
      type: currentProject.type || 'Internal project'
    };

    if (dbProject.status !== 'On Hold') {
      if (dbProject.progress === 0) dbProject.status = 'Started';
      else if (dbProject.progress === 100) dbProject.status = 'Completed';
      else dbProject.status = 'In Progress';
    }

    try {
      if (currentProject.id) {
        // Update existing
        const { error } = await supabase.from('projects').update(dbProject).eq('id', currentProject.id);
        if (error) throw error;
        
        // Cascade constraints to milestones
        const { data: milestones } = await supabase.from('milestones').select('*').eq('project_id', currentProject.id);
        if (milestones && milestones.length > 0) {
           for (const m of milestones) {
              let updated = false;
              let mStart = m.start_date;
              let mEnd = m.end_date;
              
              if (new Date(mStart as string) < new Date(dbProject.start_date as string) || new Date(mStart as string) > new Date(dbProject.end_date as string)) {
                 mStart = dbProject.start_date as string;
                 updated = true;
              }
              if (new Date(mEnd as string) > new Date(dbProject.end_date as string) || new Date(mEnd as string) < new Date(dbProject.start_date as string)) {
                 mEnd = dbProject.end_date as string;
                 updated = true;
              }
              
              if (new Date(mStart as string) > new Date(mEnd as string)) {
                 mEnd = mStart;
                 updated = true;
              }
              
              if (updated) {
                 await supabase.from('milestones').update({ start_date: mStart, end_date: mEnd, planned_start_date: mStart, planned_end_date: mEnd }).eq('id', m.id);
                 
                 // Also cascade from milestone to tasks
                 const { data: tasks } = await supabase.from('tasks').select('*').eq('milestone_id', m.id);
                 if (tasks && tasks.length > 0) {
                    for (const t of tasks) {
                       let tUpdated = false;
                       let tStart = t.start_date;
                       let tEnd = t.end_date;
                       if (new Date(tStart as string) < new Date(mStart as string) || new Date(tStart as string) > new Date(mEnd as string)) { tStart = mStart as string; tUpdated = true; }
                       if (new Date(tEnd as string) > new Date(mEnd as string) || new Date(tEnd as string) < new Date(mStart as string)) { tEnd = mEnd as string; tUpdated = true; }
                       if (new Date(tStart as string) > new Date(tEnd as string)) { tEnd = tStart; tUpdated = true; }
                       if (tUpdated) {
                          await supabase.from('tasks').update({ start_date: tStart, end_date: tEnd, planned_start_date: tStart, planned_end_date: tEnd }).eq('id', t.id);
                       }
                    }
                 }
              }
           }
        }
         
         // Re-apply the manually entered budget to override the database trigger
         if (currentProject.budget !== undefined) {
            await supabase.from('projects').update({ budget: Number(currentProject.budget) }).eq('id', currentProject.id);
         }
      } else {
        // Insert new
        const { data: newProject, error } = await supabase.from('projects').insert([dbProject]).select().single();
        if (error) throw error;
        
        if (newProject) {
          // Re-apply the manually entered budget to override the database trigger
          if (currentProject.budget !== undefined) {
            await supabase.from('projects').update({ budget: Number(currentProject.budget) }).eq('id', newProject.id);
          }
        }
      }
      
      setIsModalOpen(false);
      setCurrentProject({});
      fetchProjects(); // Refresh list
    } catch (error: any) {
      console.error('Error saving project:', error);
      alert('Failed to save project to backend: ' + (error.message || JSON.stringify(error)));
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) throw error;
        fetchProjects(); // Refresh list
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project');
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: ProjectStatus) => {
    try {
      const { error } = await supabase.from('projects').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      fetchProjects();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const getStatusBadge = (status: ProjectStatus, id?: string) => {
    if (!id) {
       return <span className={`badge ${status === 'Completed' ? 'badge-success' : status === 'In Progress' ? 'badge-primary' : 'badge-secondary'}`}>{status}</span>;
    }
    return (
      <select 
        value={status || 'Started'}
        onChange={(e) => handleStatusChange(id, e.target.value as ProjectStatus)}
        className={`badge ${status === 'Completed' ? 'badge-success' : status === 'In Progress' ? 'badge-primary' : 'badge-secondary'}`}
        style={{ border: 'none', outline: 'none', cursor: 'pointer', fontWeight: 600 }}
      >
        <option value="Started" style={{ color: 'initial', background: 'white' }}>Started</option>
        <option value="In Progress" style={{ color: 'initial', background: 'white' }}>In Progress</option>
        <option value="Completed" style={{ color: 'initial', background: 'white' }}>Completed</option>
      </select>
    );
  };

  return (
    <div>
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
        <div className="flex gap-4 items-center" style={{ marginLeft: 'auto' }}>
          <select 
            className="form-input" 
            style={{ width: '200px', padding: '0.5rem' }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
          >
            <option value="All">All Projects</option>
            <option value="Internal project">Internal Projects</option>
            <option value="External project">External Projects</option>
          </select>
          <button 
            className="btn btn-primary"
            onClick={() => { setCurrentProject({ status: 'Started' }); setIsModalOpen(true); }}
          >
            <Plus size={18} style={{ marginRight: '0.5rem' }} />
            Add Project
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Project Code</th>
              <th>Project Name</th>
              <th>Budget</th>
              <th>Type</th>
              <th>Start Date</th>
              <th>Manager</th>
              <th>Progress</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map(project => (
              <tr key={project.id}>
                <td className="font-medium">{project.code}</td>
                <td>{project.name}</td>
                <td>₹ {project.budget.toLocaleString('en-IN')}</td>
                <td>
                  <span className={`badge ${project.type === 'External project' ? 'badge-secondary' : 'badge-primary'}`}>
                    {project.type || 'Internal project'}
                  </span>
                </td>
                <td>{project.startDate}</td>
                <td>{project.managerName || '-'}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="flex-1" style={{ height: '6px', backgroundColor: 'var(--border)', borderRadius: '3px', overflow: 'hidden', width: '60px' }}>
                      <div style={{ height: '100%', width: `${project.progress || 0}%`, backgroundColor: (project.progress || 0) === 100 ? 'var(--success)' : 'var(--primary)' }} />
                    </div>
                    <span className="text-xs font-medium">{project.progress || 0}%</span>
                  </div>
                </td>
                <td>{getStatusBadge(project.status as ProjectStatus, project.id)}</td>
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
                      title="Edit"
                      onClick={() => { setCurrentProject(project); setIsModalOpen(true); }}
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '0.25rem 0.5rem', color: 'var(--destructive)' }} 
                      title="Delete"
                      onClick={() => handleDelete(project.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan={9} className="text-center py-4 text-muted">Loading projects from backend...</td>
              </tr>
            )}
            {!loading && filteredProjects.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-4 text-muted">No projects found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <h2 className="text-lg font-bold">{currentProject.id ? 'Edit Project' : 'Add Project'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--muted-foreground)' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input 
                  required 
                  type="text" 
                  className="form-input" 
                  value={currentProject.name || ''} 
                  onChange={e => setCurrentProject({...currentProject, name: e.target.value})} 
                />
              </div>
              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label className="form-label">Project Code</label>
                  <input 
                    required 
                    type="text" 
                    className="form-input" 
                    value={currentProject.code || ''} 
                    onChange={e => setCurrentProject({...currentProject, code: e.target.value})} 
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Project Type</label>
                  <select 
                    className="form-input"
                    value={currentProject.type || 'Internal project'}
                    onChange={e => setCurrentProject({...currentProject, type: e.target.value as any})}
                  >
                    <option value="Internal project">Internal project</option>
                    <option value="External project">External project</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-input" 
                  rows={3}
                  value={currentProject.description || ''} 
                  onChange={e => setCurrentProject({...currentProject, description: e.target.value})} 
                />
              </div>
              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label className="form-label">Start Date</label>
                  <input 
                    required 
                    type="date" 
                    className="form-input" 
                    value={currentProject.startDate || ''} 
                    onChange={e => setCurrentProject({...currentProject, startDate: e.target.value})} 
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">End Date</label>
                  <input 
                    required 
                    type="date" 
                    className="form-input" 
                    value={currentProject.endDate || ''} 
                    onChange={e => setCurrentProject({...currentProject, endDate: e.target.value})} 
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label className="form-label">Budget ($)</label>
                  <input 
                    required 
                    type="text" 
                    className="form-input" 
                    value={currentProject.budget !== undefined ? currentProject.budget : ''} 
                    onChange={e => {
                      const val = e.target.value.replace(/,/g, '').replace(/[^\d.]/g, '');
                      setCurrentProject({...currentProject, budget: val ? Number(val) : 0});
                    }}
                  />
                </div>
                <div className="form-group flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <label className="form-label" style={{ marginBottom: 0 }}>Progress (%)</label>
                    <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={currentProject.isManualProgress || false}
                        onChange={e => setCurrentProject({...currentProject, isManualProgress: e.target.checked})}
                      />
                      Override Auto-Calculation
                    </label>
                  </div>
                  <input 
                    type="number"
                    min="0"
                    max="100" 
                    className="form-input" 
                    value={currentProject.progress || 0} 
                    disabled={!currentProject.isManualProgress}
                    onChange={e => setCurrentProject({...currentProject, progress: parseInt(e.target.value) || 0})} 
                    style={{ backgroundColor: !currentProject.isManualProgress ? '#f1f5f9' : 'white' }}
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label className="form-label">Status</label>
                  <select 
                    className="form-input"
                    value={currentProject.status}
                    onChange={e => setCurrentProject({...currentProject, status: e.target.value as ProjectStatus})}
                  >
                    <option value="Started">Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2" style={{ marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isViewModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', padding: 0, overflow: 'hidden' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <svg width="120" height="32" viewBox="0 0 150 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="150" height="40" rx="4" fill="#e3282f" />
                  <text x="75" y="27" fontFamily="Inter, sans-serif" fontSize="22" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="1">INDO TECH</text>
                </svg>
                <div style={{ height: '24px', width: '2px', backgroundColor: '#cbd5e1' }}></div>
                <h2 className="text-lg font-bold text-slate-800">Project Details</h2>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} style={{ color: '#64748b', padding: '0.5rem', borderRadius: '50%', backgroundColor: 'white', border: '1px solid #e2e8f0', cursor: 'pointer' }} className="hover:bg-slate-50 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div style={{ padding: '2rem' }}>
              <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Project Name</p>
                  <div className="text-sm font-semibold text-slate-900 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                    {currentProject.name}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Project Code</p>
                  <div className="text-sm font-bold text-blue-700 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                    {currentProject.code}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Project Type</p>
                  <div className="text-sm font-semibold text-purple-700 bg-purple-50 px-3 py-2 rounded-lg border border-purple-100">
                    {currentProject.type || 'Internal project'}
                  </div>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Progress & Status</p>
                  <div className="flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 h-[38px]">
                    <span className="font-bold text-slate-700">{currentProject.progress || 0}% {currentProject.isManualProgress && '(Manual)'}</span>
                    <div style={{ height: '20px', width: '1px', backgroundColor: '#cbd5e1' }}></div>
                    <div>{getStatusBadge(currentProject.status as ProjectStatus)}</div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Timeline</p>
                  <div className="text-sm font-medium text-slate-800 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 flex items-center gap-2">
                    <span className="text-slate-500">{currentProject.startDate}</span>
                    <span className="text-slate-400">→</span>
                    <span className="text-slate-500">{currentProject.endDate}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Budget & Status</p>
                  <div className="flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                    <span className="text-sm font-bold text-emerald-600">${currentProject.budget?.toLocaleString()}</span>
                    <div className="h-4 w-px bg-slate-300"></div>
                    <div>{getStatusBadge(currentProject.status as ProjectStatus, currentProject.id || '')}</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '1rem 2rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
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
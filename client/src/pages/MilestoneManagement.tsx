import { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

type MilestoneStatus = 'Not Started' | 'In Progress' | 'Completed';

interface Milestone {
  id: string;
  projectId: string;
  projectName: string;
  projectCode?: string;
  name: string;
  startDate: string;
  endDate: string;
  plannedStartDate?: string;
  actualStartDate?: string;
  plannedEndDate?: string;
  actualEndDate?: string;
  plannedBudget?: number;
  actualCost?: number;
  progress?: number;
  isManualProgress?: boolean;
  status: MilestoneStatus;
}

export default function MilestoneManagement() {
  const [projects, setProjects] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchProjects();
    fetchMilestones();

    const subscription = supabase
      .channel('milestones_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'milestones' }, () => {
        fetchMilestones();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchProjects = async () => {
    const { data } = await supabase.from('projects').select('id, name, start_date, end_date');
    if (data) setProjects(data);
  };

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('milestones').select('*, projects(name, code)').order('created_at', { ascending: false });
      if (error) throw error;

      const formatted = data?.map(m => ({
        id: m.id,
        projectId: m.project_id,
        projectName: m.projects?.name || 'Unknown',
        projectCode: m.projects?.code || '-',
        name: m.name,
        startDate: m.start_date,
        endDate: m.end_date,
        plannedStartDate: m.planned_start_date,
        actualStartDate: m.actual_start_date,
        plannedEndDate: m.planned_end_date,
        actualEndDate: m.actual_end_date,
        plannedBudget: m.planned_budget,
        actualCost: m.actual_cost,
        progress: m.progress || 0,
        isManualProgress: m.is_manual_progress || false,
        status: m.status
      })) || [];
      
      setMilestones(formatted);
    } catch (error) {
      console.error('Error fetching milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState<Partial<Milestone>>({ status: 'Not Started' });
  const [selectedMilestones, setSelectedMilestones] = useState<string[]>([]);

  const filteredMilestones = milestones.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusChange = async (id: string, newStatus: MilestoneStatus) => {
    try {
      const { error } = await supabase.from('milestones').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      fetchMilestones();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const getStatusBadge = (status: MilestoneStatus, id: string) => {
    return (
      <select 
        value={status || 'Not Started'}
        onChange={(e) => handleStatusChange(id, e.target.value as MilestoneStatus)}
        className={`badge ${status === 'Completed' ? 'badge-success' : status === 'In Progress' ? 'badge-primary' : 'badge-secondary'}`}
        style={{ border: 'none', outline: 'none', cursor: 'pointer', fontWeight: 600 }}
      >
        <option value="Not Started" style={{ color: 'initial', background: 'white' }}>Not Started</option>
        <option value="In Progress" style={{ color: 'initial', background: 'white' }}>In Progress</option>
        <option value="Completed" style={{ color: 'initial', background: 'white' }}>Completed</option>
      </select>
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const dbMilestone = {
      project_id: currentMilestone.projectId,
      name: currentMilestone.name,
      start_date: currentMilestone.startDate,
      end_date: currentMilestone.endDate,
      planned_start_date: currentMilestone.plannedStartDate || currentMilestone.startDate,
      planned_end_date: currentMilestone.plannedEndDate || currentMilestone.endDate,
      actual_start_date: currentMilestone.actualStartDate || null,
      actual_end_date: currentMilestone.actualEndDate || null,
      progress: currentMilestone.progress || 0,
      is_manual_progress: currentMilestone.isManualProgress || false,
      status: currentMilestone.status || 'Not Started'
    };

    if (dbMilestone.progress === 0) dbMilestone.status = 'Not Started';
    else if (dbMilestone.progress === 100) dbMilestone.status = 'Completed';
    else dbMilestone.status = 'In Progress';

    try {
      if (currentMilestone.id) {
        const { error } = await supabase.from('milestones').update(dbMilestone).eq('id', currentMilestone.id);
        if (error) throw error;
        
        // Cascade constraint to tasks
        const { data: tasks } = await supabase.from('tasks').select('*').eq('milestone_id', currentMilestone.id);
        if (tasks && tasks.length > 0) {
           for (const t of tasks) {
              let updated = false;
              let tStart = t.start_date;
              let tEnd = t.end_date;
              if (new Date(tStart as string) < new Date(dbMilestone.start_date as string) || new Date(tStart as string) > new Date(dbMilestone.end_date as string)) {
                 tStart = dbMilestone.start_date as string;
                 updated = true;
              }
              if (new Date(tEnd as string) > new Date(dbMilestone.end_date as string) || new Date(tEnd as string) < new Date(dbMilestone.start_date as string)) {
                 tEnd = dbMilestone.end_date as string;
                 updated = true;
              }
              if (new Date(tStart as string) > new Date(tEnd as string)) {
                 tEnd = tStart;
                 updated = true;
              }
              if (updated) {
                 await supabase.from('tasks').update({ start_date: tStart, end_date: tEnd, planned_start_date: tStart, planned_end_date: tEnd }).eq('id', t.id);
              }
           }
        }
      } else {
        const { data: newMilestone, error } = await supabase.from('milestones').insert([dbMilestone]).select().single();
        if (error) throw error;
        
        if (newMilestone && newMilestone.name === 'Development') {
          const standardTasks = [
            'Frontend Setup',
            'Backend API Development',
            'Database Design',
            'Authentication Module',
            'Testing',
            'Bug Fixing'
          ].map((title) => ({
            project_id: newMilestone.project_id,
            milestone_id: newMilestone.id,
            title,
            start_date: newMilestone.start_date,
            end_date: newMilestone.end_date,
            planned_start_date: newMilestone.planned_start_date || newMilestone.start_date,
            planned_end_date: newMilestone.planned_end_date || newMilestone.end_date,
            status: 'Not Started',
            type: 'Team'
          }));
          
          const { error: taskError } = await supabase.from('tasks').insert(standardTasks);
          if (taskError) {
             console.error('Error auto-creating standard tasks for Development:', taskError);
          }
        }
      }

      // Cascade to Project
      if (currentMilestone.projectId) {
        const { data: pData } = await supabase.from('projects').select('is_manual_progress, status').eq('id', currentMilestone.projectId).single();
        if (pData && !pData.is_manual_progress) {
          const { data: milestonesData } = await supabase.from('milestones').select('progress').eq('project_id', currentMilestone.projectId);
          const count = milestonesData?.length || 0;
          const sumP = milestonesData?.reduce((acc, m) => acc + (m.progress || 0), 0) || 0;
          const newP = count > 0 ? Math.round(sumP / count) : 0;
          let newS = pData.status;
          if (newS !== 'Blocked') {
             newS = newP === 0 ? 'Started' : newP === 100 ? 'Completed' : 'In Progress';
          }
          await supabase.from('projects').update({ progress: newP, status: newS }).eq('id', currentMilestone.projectId);
        }
      }

      setIsModalOpen(false);
      setCurrentMilestone({});
      fetchMilestones();
    } catch (error: any) {
      console.error('Error saving milestone:', error);
      alert('Failed to save milestone: ' + (error.message || JSON.stringify(error)));
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this milestone?')) {
      try {
        const { error } = await supabase.from('milestones').delete().eq('id', id);
        if (error) throw error;
        fetchMilestones();
      } catch (error: any) {
        console.error('Error deleting milestone:', error);
        alert('Failed to delete milestone: ' + (error.message || JSON.stringify(error)));
      }
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedMilestones.length} milestone(s)?`)) {
      try {
        const { error } = await supabase.from('milestones').delete().in('id', selectedMilestones);
        if (error) throw error;
        setSelectedMilestones([]);
        fetchMilestones();
      } catch (error: any) {
        console.error('Error deleting milestones:', error);
        alert('Failed to delete selected milestones');
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search milestones..."
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4 items-center" style={{ marginLeft: 'auto' }}>
          {selectedMilestones.length > 0 && (
            <button 
              className="btn btn-outline"
              style={{ color: 'var(--destructive)', borderColor: 'var(--destructive)', padding: '0.5rem 1rem' }}
              onClick={handleBulkDelete}
            >
              <Trash2 size={18} style={{ marginRight: '0.5rem' }} />
              Delete Selected ({selectedMilestones.length})
            </button>
          )}
          <button 
            className="btn btn-primary"
            onClick={() => { setCurrentMilestone({ status: 'Not Started' }); setIsModalOpen(true); }}
          >
            <Plus size={18} style={{ marginRight: '0.5rem' }} />
            Add Milestone
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>
                <input 
                  type="checkbox" 
                  checked={selectedMilestones.length > 0 && selectedMilestones.length === filteredMilestones.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedMilestones(filteredMilestones.map(m => m.id));
                    } else {
                      setSelectedMilestones([]);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              <th>Project Name</th>
              <th>Project Code</th>
              <th>Milestone Name</th>
              <th>Start Date</th>
              <th>Target Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMilestones.map(milestone => (
              <tr key={milestone.id}>
                <td style={{ textAlign: 'center' }}>
                  <input 
                    type="checkbox"
                    checked={selectedMilestones.includes(milestone.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMilestones([...selectedMilestones, milestone.id]);
                      } else {
                        setSelectedMilestones(selectedMilestones.filter(id => id !== milestone.id));
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                </td>
                <td>{milestone.projectName}</td>
                <td>{milestone.projectCode}</td>
                <td className="font-medium">{milestone.name}</td>
                <td>{milestone.startDate}</td>
                <td>{milestone.endDate}</td>
                <td>{getStatusBadge(milestone.status, milestone.id)}</td>
                <td>
                  <div className="flex gap-2">
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '0.25rem 0.5rem' }} 
                      title="View"
                      onClick={() => { setCurrentMilestone(milestone); setIsViewModalOpen(true); }}
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '0.25rem 0.5rem' }} 
                      title="Edit"
                      onClick={() => { setCurrentMilestone(milestone); setIsModalOpen(true); }}
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '0.25rem 0.5rem', color: 'var(--destructive)' }} 
                      title="Delete"
                      onClick={() => handleDelete(milestone.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">Loading milestones...</td>
              </tr>
            )}
            {!loading && filteredMilestones.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                  No milestones found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <h2 className="text-lg font-bold">{currentMilestone.id ? 'Edit Milestone' : 'Add Milestone'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--muted-foreground)' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Project</label>
                <select 
                  required
                  className="form-input"
                  value={currentMilestone.projectId || ''}
                  onChange={e => {
                    const proj = projects.find(p => p.id === e.target.value);
                    setCurrentMilestone({
                      ...currentMilestone, 
                      projectId: e.target.value, 
                      projectName: proj?.name,
                      startDate: currentMilestone.startDate || (proj as any)?.start_date,
                      endDate: currentMilestone.endDate || (proj as any)?.end_date
                    });
                  }}
                >
                  <option value="">Select Project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Milestone Name</label>
                <input 
                  required 
                  type="text" 
                  className="form-input" 
                  value={currentMilestone.name || ''} 
                  onChange={e => setCurrentMilestone({...currentMilestone, name: e.target.value})} 
                />
              </div>
              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label className="form-label">Start Date</label>
                  <input 
                    required 
                    type="date" 
                    className="form-input" 
                    value={currentMilestone.startDate || ''} 
                    onChange={e => setCurrentMilestone({...currentMilestone, startDate: e.target.value})} 
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Target Date</label>
                  <input 
                    required 
                    type="date" 
                    className="form-input" 
                    value={currentMilestone.endDate || ''} 
                    onChange={e => setCurrentMilestone({...currentMilestone, endDate: e.target.value})} 
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label className="form-label">Actual Start Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={currentMilestone.actualStartDate || ''} 
                    onChange={e => setCurrentMilestone({...currentMilestone, actualStartDate: e.target.value})} 
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Actual End Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={currentMilestone.actualEndDate || ''} 
                    onChange={e => setCurrentMilestone({...currentMilestone, actualEndDate: e.target.value})} 
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <label className="form-label" style={{ marginBottom: 0 }}>Progress (%)</label>
                    <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={currentMilestone.isManualProgress || false}
                        onChange={e => setCurrentMilestone({...currentMilestone, isManualProgress: e.target.checked})}
                      />
                      Override Auto-Calculation
                    </label>
                  </div>
                  <input 
                    type="number"
                    min="0"
                    max="100" 
                    className="form-input" 
                    value={currentMilestone.progress || 0} 
                    disabled={!currentMilestone.isManualProgress}
                    onChange={e => setCurrentMilestone({...currentMilestone, progress: parseInt(e.target.value) || 0})} 
                    style={{ backgroundColor: !currentMilestone.isManualProgress ? '#f1f5f9' : 'white' }}
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Status</label>
                  <select 
                    className="form-input"
                    value={currentMilestone.status}
                    onChange={e => setCurrentMilestone({...currentMilestone, status: e.target.value as MilestoneStatus})}
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2" style={{ marginTop: '1rem' }}>
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
          <div className="modal-content" style={{ maxWidth: '500px', padding: 0, overflow: 'hidden' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <svg width="120" height="32" viewBox="0 0 150 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="150" height="40" rx="4" fill="#e3282f" />
                  <text x="75" y="27" fontFamily="Inter, sans-serif" fontSize="22" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="1">INDO TECH</text>
                </svg>
                <div style={{ height: '24px', width: '2px', backgroundColor: '#cbd5e1' }}></div>
                <h2 className="text-lg font-bold text-slate-800">Milestone Details</h2>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} style={{ color: '#64748b', padding: '0.5rem', borderRadius: '50%', backgroundColor: 'white', border: '1px solid #e2e8f0', cursor: 'pointer' }} className="hover:bg-slate-50 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div style={{ padding: '2rem' }}>
              <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                <div className="col-span-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Milestone Name</p>
                  <div className="text-base font-bold text-slate-900 bg-slate-50 px-3 py-3 rounded-lg border border-slate-200">
                    {currentMilestone.name}
                  </div>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Project Name</p>
                  <div className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                    {currentMilestone.projectName}
                  </div>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Timeline</p>
                  <div className="text-sm font-medium text-slate-800 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 flex items-center gap-2">
                    <span className="text-slate-500">{currentMilestone.startDate}</span>
                    <span className="text-slate-400">→</span>
                    <span className="text-slate-500">{currentMilestone.endDate}</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Progress & Status</p>
                  <div className="flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 h-[38px]">
                    <span className="font-bold text-slate-700">{currentMilestone.progress || 0}% {currentMilestone.isManualProgress && '(Manual)'}</span>
                    <div style={{ height: '20px', width: '1px', backgroundColor: '#cbd5e1' }}></div>
                    <div>{getStatusBadge(currentMilestone.status as MilestoneStatus, currentMilestone.id || '')}</div>
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
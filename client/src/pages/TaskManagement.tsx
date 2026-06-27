import { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit, Trash2, X, File } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Tab = 'individual' | 'team';
type TaskStatus = 'Started' | 'In Progress' | 'Blocked' | 'Completed';

interface Task {
  id: string;
  projectId: string;
  projectName: string;
  projectCode?: string;
  milestoneId?: string;
  milestoneName?: string;
  title: string;
  startDate: string;
  endDate: string;
  plannedStartDate?: string;
  actualStartDate?: string;
  plannedEndDate?: string;
  actualEndDate?: string;
  plannedCost?: number;
  actualCost?: number;
  progress?: number;
  status: TaskStatus;
  type: 'Individual' | 'Team';
  assignedTo?: string; // Employee or Team Name
  role?: string;     // If individual
  documentUrl?: string;
  documentFile?: File;
  documentSize?: number;
  remarks?: string;
}

export default function TaskManagement() {
  const [projects, setProjects] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchProjects();
    fetchMilestones();
    fetchTasks();

    const subscription = supabase
      .channel('tasks_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchProjects = async () => {
    const { data } = await supabase.from('projects').select('id, name');
    if (data) setProjects(data);
  };

  const fetchMilestones = async () => {
    const { data } = await supabase.from('milestones').select('id, project_id, name, start_date, end_date');
    if (data) setMilestones(data);
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('tasks').select('*, projects(name, code), milestones(name)').order('created_at', { ascending: false });
      if (error) throw error;

      const formatted = data?.map(t => ({
        id: t.id,
        projectId: t.project_id,
        projectName: t.projects?.name || 'Unknown',
        projectCode: t.projects?.code || '-',
        milestoneId: t.milestone_id,
        milestoneName: t.milestones?.name || 'None',
        title: t.title,
        startDate: t.start_date,
        endDate: t.end_date,
        plannedStartDate: t.planned_start_date,
        actualStartDate: t.actual_start_date,
        plannedEndDate: t.planned_end_date,
        actualEndDate: t.actual_end_date,
        plannedCost: t.planned_cost,
        actualCost: t.actual_cost,
        progress: t.progress,
        status: t.status,
        type: t.type,
        assignedTo: t.assigned_to,
        role: t.role,
        documentUrl: t.document_url,
        remarks: t.remarks
      })) || [];
      
      setTasks(formatted);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const [activeTab, setActiveTab] = useState<Tab>('individual');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  const [currentTask, setCurrentTask] = useState<Partial<Task>>({ type: 'Individual', status: 'Started' });

  const filteredTasks = tasks.filter(t => 
    (activeTab === 'individual' ? t.type === 'Individual' : t.type === 'Team') &&
    (t.title.toLowerCase().includes(searchTerm.toLowerCase()) || t.projectName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleStatusChange = async (id: string, newStatus: TaskStatus) => {
    try {
      const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      fetchTasks();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const getStatusBadge = (status: TaskStatus, id: string) => {
    return (
      <select 
        value={status || 'Not Started'}
        onChange={(e) => handleStatusChange(id, e.target.value as TaskStatus)}
        className={`badge ${status === 'Completed' ? 'badge-success' : status === 'In Progress' ? 'badge-primary' : status === 'Blocked' ? 'badge-destructive' : 'badge-secondary'}`}
        style={{ border: 'none', outline: 'none', cursor: 'pointer', fontWeight: 600 }}
      >
        <option value="Not Started" style={{ color: 'initial', background: 'white' }}>Not Started</option>
        <option value="Started" style={{ color: 'initial', background: 'white' }}>Started</option>
        <option value="In Progress" style={{ color: 'initial', background: 'white' }}>In Progress</option>
        <option value="On Hold" style={{ color: 'initial', background: 'white' }}>On Hold</option>
        <option value="Completed" style={{ color: 'initial', background: 'white' }}>Completed</option>
        <option value="Blocked" style={{ color: 'initial', background: 'white' }}>Blocked</option>
      </select>
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const dbTask = {
      project_id: currentTask.projectId,
      milestone_id: currentTask.milestoneId || null,
      title: currentTask.title,
      start_date: currentTask.startDate,
      end_date: currentTask.endDate,
      planned_start_date: currentTask.plannedStartDate || currentTask.startDate,
      planned_end_date: currentTask.plannedEndDate || currentTask.endDate,
      actual_start_date: currentTask.actualStartDate || null,
      actual_end_date: currentTask.actualEndDate || null,
      planned_cost: currentTask.plannedCost || 0,
      actual_cost: currentTask.actualCost || 0,
      progress: currentTask.progress || 0,
      status: currentTask.status || 'Not Started',
      type: currentTask.type,
      assigned_to: currentTask.assignedTo,
      role: currentTask.role,
      document_url: currentTask.documentUrl,
      remarks: currentTask.remarks
    };

    if (dbTask.status !== 'Blocked') {
      if (dbTask.progress === 0) dbTask.status = 'Started';
      else if (dbTask.progress === 100) dbTask.status = 'Completed';
      else dbTask.status = 'In Progress';
    }

    try {
      if (currentTask.documentFile) {
        const filePath = `public/${Date.now()}_${currentTask.documentFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('PRM document files')
          .upload(filePath, currentTask.documentFile);
          
        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          // Fallback or handle error if needed, but throwing is better
          throw uploadError;
        }
        
        const { data: publicUrlData } = supabase.storage
          .from('PRM document files')
          .getPublicUrl(filePath);
          
        dbTask.document_url = publicUrlData.publicUrl;
      }

      if (currentTask.id) {
        const { error } = await supabase.from('tasks').update(dbTask).eq('id', currentTask.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('tasks').insert([dbTask]);
        if (error) throw error;
      }
      
      // Automatic Document Sync
      if (currentTask.documentFile && currentTask.projectId) {
        const sizeMB = ((currentTask.documentSize || 0) / (1024 * 1024)).toFixed(2) + ' MB';
        const dbDoc = {
          project_id: currentTask.projectId,
          milestone_id: currentTask.milestoneId || null,
          remarks: currentTask.remarks || `Attached to task: ${currentTask.title}`,
          file_name: currentTask.documentFile.name,
          file_url: dbTask.document_url,
          size_str: sizeMB
        };
        // Insert into documents table
        await supabase.from('documents').insert([dbDoc]);
      }

      // Cascade Progress
      await cascadeProgress(currentTask.milestoneId || '', currentTask.projectId || '');

      setIsModalOpen(false);
      setCurrentTask({});
      fetchTasks();
    } catch (error: any) {
      console.error('Error saving task:', error);
      alert('Failed to save task: ' + (error.message || JSON.stringify(error)));
    }
  };

  const handleDelete = async (task: Task) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        const { error } = await supabase.from('tasks').delete().eq('id', task.id);
        if (error) throw error;
        
        // Cascade Progress after delete
        await cascadeProgress(task.milestoneId || '', task.projectId || '');
        
        fetchTasks();
      } catch (error: any) {
        console.error('Error deleting task:', error);
        alert('Failed to delete task: ' + (error.message || JSON.stringify(error)));
      }
    }
  };

  const cascadeProgress = async (milestoneId: string, projectId: string) => {
    try {
      if (milestoneId) {
        const { data: mData } = await supabase.from('milestones').select('is_manual_progress, status').eq('id', milestoneId).single();
        if (mData && !mData.is_manual_progress) {
          const { data: tasks } = await supabase.from('tasks').select('progress').eq('milestone_id', milestoneId);
          const count = tasks?.length || 0;
          const sumP = tasks?.reduce((acc, t) => acc + (t.progress || 0), 0) || 0;
          const newP = count > 0 ? Math.round(sumP / count) : 0;
          let newS = mData.status;
          if (newS !== 'Blocked') {
             newS = newP === 0 ? 'Not Started' : newP === 100 ? 'Completed' : 'In Progress';
          }
          await supabase.from('milestones').update({ progress: newP, status: newS }).eq('id', milestoneId);
        }
      }
      
      if (projectId) {
        const { data: pData } = await supabase.from('projects').select('is_manual_progress, status').eq('id', projectId).single();
        if (pData && !pData.is_manual_progress) {
          const { data: milestones } = await supabase.from('milestones').select('progress').eq('project_id', projectId);
          const count = milestones?.length || 0;
          const sumP = milestones?.reduce((acc, m) => acc + (m.progress || 0), 0) || 0;
          const newP = count > 0 ? Math.round(sumP / count) : 0;
          let newS = pData.status;
          if (newS !== 'Blocked') {
             newS = newP === 0 ? 'Started' : newP === 100 ? 'Completed' : 'In Progress';
          }
          await supabase.from('projects').update({ progress: newP, status: newS }).eq('id', projectId);
        }
      }
    } catch(e) { console.error('Cascading progress failed:', e); }
  };

  return (
    <div>
      <div className="flex gap-4 mb-6 border-b" style={{ borderBottom: '1px solid var(--border)' }}>
        <button
          className={`pb-2 ${activeTab === 'individual' ? 'font-bold text-primary border-b-2' : 'text-muted'}`}
          style={{ borderBottomColor: activeTab === 'individual' ? 'var(--primary)' : 'transparent', borderBottomStyle: 'solid', borderBottomWidth: '2px', paddingBottom: '0.5rem' }}
          onClick={() => setActiveTab('individual')}
        >
          Internal Team
        </button>
        <button
          className={`pb-2 ${activeTab === 'team' ? 'font-bold text-primary border-b-2' : 'text-muted'}`}
          style={{ borderBottomColor: activeTab === 'team' ? 'var(--primary)' : 'transparent', borderBottomStyle: 'solid', borderBottomWidth: '2px', paddingBottom: '0.5rem' }}
          onClick={() => setActiveTab('team')}
        >
          External Team
        </button>
      </div>

      <div className="page-header">
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search tasks..."
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => { 
            setCurrentTask({ type: activeTab === 'individual' ? 'Individual' : 'Team', status: 'Started' }); 
            setIsModalOpen(true); 
          }}
        >
          <Plus size={18} style={{ marginRight: '0.5rem' }} />
          Add Task
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Project Code</th>
              <th>Project Name</th>
              <th>Milestone</th>
              <th>Type</th>
              <th>Assigned To</th>
              <th>Task Title</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Document</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map(task => (
              <tr key={task.id}>
                <td className="font-medium">{task.projectCode}</td>
                <td>{task.projectName}</td>
                <td>{task.milestoneName}</td>
                <td><span className="badge badge-secondary">{task.type === 'Individual' ? 'Internal Team' : 'External Team'}</span></td>
                <td>{task.assignedTo}</td>
                <td className="font-medium">{task.title}</td>
                <td>{task.startDate}</td>
                <td>{task.endDate}</td>
                <td>{getStatusBadge(task.status, task.id)}</td>
                <td>
                  {task.documentUrl ? (
                    <div 
                      className="flex items-center gap-2 text-primary" 
                      style={{ cursor: 'pointer', maxWidth: '150px' }} 
                      title={task.documentUrl} 
                      onClick={() => {
                        let urlToOpen = task.documentUrl;
                        if (urlToOpen && !urlToOpen.startsWith('http')) {
                          const { data } = supabase.storage.from('PRM document files').getPublicUrl(`public/${urlToOpen}`);
                          urlToOpen = data.publicUrl;
                        }
                        if (urlToOpen) window.open(urlToOpen, '_blank');
                      }}
                    >
                      <File size={16} style={{ flexShrink: 0 }} />
                      <span className="truncate" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {task.documentUrl.startsWith('http') ? decodeURIComponent(task.documentUrl.split('/').pop()?.split('_').slice(1).join('_') || task.documentUrl) : task.documentUrl}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
                <td>
                  <div className="flex gap-2">
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '0.25rem 0.5rem' }} 
                      title="View"
                      onClick={() => { setCurrentTask(task); setIsViewModalOpen(true); }}
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '0.25rem 0.5rem' }} 
                      title="Edit"
                      onClick={() => { setCurrentTask(task); setIsModalOpen(true); }}
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '0.25rem 0.5rem', color: 'var(--destructive)' }} 
                      title="Delete"
                      onClick={() => handleDelete(task)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">Loading tasks...</td>
              </tr>
            )}
            {!loading && filteredTasks.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                  No {activeTab} tasks found.
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
              <h2 className="text-lg font-bold">{currentTask.id ? 'Edit Task' : `Add ${activeTab === 'individual' ? 'Internal Team' : 'Team'} Task`}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--muted-foreground)' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <select 
                  required
                  className="form-input"
                  value={currentTask.projectId || ''}
                  onChange={e => {
                    const proj = projects.find(p => p.id === e.target.value);
                    setCurrentTask({...currentTask, projectId: e.target.value, projectName: proj?.name, milestoneId: ''});
                  }}
                >
                  <option value="">Select Project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {currentTask.projectId && (
                <div className="form-group">
                  <label className="form-label">Milestone</label>
                  <select
                    required
                    className="form-input"
                    value={currentTask.milestoneId || ''}
                    onChange={e => {
                      const ms = milestones.find(m => m.id === e.target.value);
                      setCurrentTask({
                        ...currentTask, 
                        milestoneId: e.target.value,
                        startDate: (ms as any)?.start_date || (ms as any)?.startDate || currentTask.startDate,
                        endDate: (ms as any)?.end_date || (ms as any)?.endDate || currentTask.endDate
                      });
                    }}
                  >
                    <option value="">Select Milestone</option>
                    {milestones.filter(m => m.project_id === currentTask.projectId).map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {activeTab === 'individual' ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Employee Name</label>
                    <input 
                      required 
                      type="text" 
                      className="form-input" 
                      value={currentTask.assignedTo || ''} 
                      onChange={e => setCurrentTask({...currentTask, assignedTo: e.target.value})} 
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Team Name</label>
                    <input 
                      required 
                      type="text" 
                      className="form-input" 
                      value={currentTask.assignedTo || ''} 
                      onChange={e => setCurrentTask({...currentTask, assignedTo: e.target.value})} 
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input 
                  required 
                  type="text" 
                  className="form-input" 
                  value={currentTask.title || ''} 
                  onChange={e => setCurrentTask({...currentTask, title: e.target.value})} 
                />
              </div>

              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label className="form-label">Start Date</label>
                  <input 
                    required 
                    type="date" 
                    className="form-input" 
                    value={currentTask.startDate || ''} 
                    onChange={e => setCurrentTask({...currentTask, startDate: e.target.value})} 
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">End Date</label>
                  <input 
                    required 
                    type="date" 
                    className="form-input" 
                    value={currentTask.endDate || ''} 
                    onChange={e => setCurrentTask({...currentTask, endDate: e.target.value})} 
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label className="form-label">Actual Start Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={currentTask.actualStartDate || ''} 
                    onChange={e => setCurrentTask({...currentTask, actualStartDate: e.target.value})} 
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Actual End Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={currentTask.actualEndDate || ''} 
                    onChange={e => setCurrentTask({...currentTask, actualEndDate: e.target.value})} 
                  />
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="form-group flex-1">
                  <label className="form-label">Upload Document</label>
                  <input 
                    type="file" 
                    className="form-input" 
                    style={{ padding: '0.375rem 0.5rem', height: 'auto' }}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setCurrentTask({...currentTask, documentUrl: file.name, documentSize: file.size, documentFile: file}); 
                      }
                    }} 
                  />
                  {currentTask.documentUrl && <div className="text-sm text-muted mt-1" style={{ wordBreak: 'break-all' }}>Current file: {currentTask.documentUrl}</div>}
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Remarks</label>
                  <textarea 
                    className="form-input" 
                    rows={2}
                    placeholder="Enter remarks..."
                    value={currentTask.remarks || ''} 
                    onChange={e => setCurrentTask({...currentTask, remarks: e.target.value})} 
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label className="form-label">Progress (%)</label>
                  <input 
                    required 
                    type="number" 
                    min="0"
                    max="100"
                    className="form-input" 
                    value={currentTask.progress || 0} 
                    onChange={e => setCurrentTask({...currentTask, progress: parseInt(e.target.value) || 0})} 
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Status</label>
                  <select 
                    className="form-input"
                    value={currentTask.status}
                    onChange={e => setCurrentTask({...currentTask, status: e.target.value as TaskStatus})}
                  >
                    <option value="Started">Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Blocked">Blocked</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              
              
              <div className="flex justify-end gap-2" style={{ marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Task
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
                <h2 className="text-lg font-bold text-slate-800">Task Details</h2>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} style={{ color: '#64748b', padding: '0.5rem', borderRadius: '50%', backgroundColor: 'white', border: '1px solid #e2e8f0', cursor: 'pointer' }} className="hover:bg-slate-50 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div style={{ padding: '2rem' }}>
              <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                <div className="col-span-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Task Title</p>
                  <div className="text-base font-bold text-slate-900 bg-slate-50 px-3 py-3 rounded-lg border border-slate-200">
                    {currentTask.title}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Project</p>
                  <div className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                    {currentTask.projectName}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Type</p>
                  <div className="text-sm font-semibold text-slate-800 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                    {currentTask.type}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Assigned To</p>
                  <div className="text-sm font-medium text-slate-800 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 flex items-center gap-2">
                    <span className="font-semibold">{currentTask.assignedTo}</span>
                    {currentTask.role && <span className="text-slate-500 text-xs px-2 py-0.5 bg-slate-200 rounded-full">{currentTask.role}</span>}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Progress & Status</p>
                  <div className="flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 h-[38px]">
                    <span className="font-bold text-slate-700">{currentTask.progress || 0}%</span>
                    <div style={{ height: '20px', width: '1px', backgroundColor: '#cbd5e1' }}></div>
                    <div>{getStatusBadge(currentTask.status as TaskStatus, currentTask.id || '')}</div>
                  </div>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Timeline</p>
                  <div className="text-sm font-medium text-slate-800 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 flex items-center gap-2">
                    <span className="text-slate-500">{currentTask.startDate}</span>
                    <span className="text-slate-400">→</span>
                    <span className="text-slate-500">{currentTask.endDate}</span>
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
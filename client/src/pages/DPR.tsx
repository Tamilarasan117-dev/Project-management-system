import { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

type DPRStatus = 'Started' | 'In Progress' | 'Completed' | 'Blocked';

interface DPRRecord {
  id: string;
  projectId: string;
  projectName: string;
  employeeName: string;
  reportDate: string;
  hoursWorked: number;
  taskName: string;
  progress: number;
  status: DPRStatus;
}

export default function DPR() {
  const [projects, setProjects] = useState<any[]>([]);
  const [records, setRecords] = useState<DPRRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchProjects();
    fetchRecords();

    const subscription = supabase
      .channel('dprs_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dprs' }, () => {
        fetchRecords();
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

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('dprs').select('*, projects(name)').order('created_at', { ascending: false });
      if (error) throw error;

      const formatted = data?.map(r => ({
        id: r.id,
        projectId: r.project_id,
        projectName: r.projects?.name || 'Unknown',
        employeeName: r.employee_name,
        reportDate: r.report_date,
        hoursWorked: r.hours_worked,
        taskName: r.task_name,
        progress: r.progress,
        status: r.status
      })) || [];
      
      setRecords(formatted);
    } catch (error) {
      console.error('Error fetching DPRs:', error);
    } finally {
      setLoading(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<Partial<DPRRecord>>({ status: 'In Progress', progress: 0 });

  const filteredRecords = records.filter(r => 
    r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.taskName && r.taskName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status: DPRStatus) => {
    switch (status) {
      case 'Completed': return <span className="badge badge-success">{status}</span>;
      case 'In Progress': return <span className="badge badge-primary">{status}</span>;
      case 'Blocked': return <span className="badge badge-destructive">{status}</span>;
      default: return <span className="badge badge-secondary">{status}</span>;
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const dbRecord = {
      project_id: currentRecord.projectId,
      employee_name: currentRecord.employeeName,
      report_date: currentRecord.reportDate,
      hours_worked: currentRecord.hoursWorked,
      task_name: currentRecord.taskName,
      progress: currentRecord.progress,
      status: currentRecord.status || 'In Progress'
    };

    try {
      if (currentRecord.id) {
        const { error } = await supabase.from('dprs').update(dbRecord).eq('id', currentRecord.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('dprs').insert([dbRecord]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      setCurrentRecord({});
      fetchRecords();
    } catch (error: any) {
      console.error('Error saving DPR:', error);
      alert('Failed to save DPR: ' + (error.message || JSON.stringify(error)));
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this report?')) {
      try {
        const { error } = await supabase.from('dprs').delete().eq('id', id);
        if (error) throw error;
        fetchRecords();
      } catch (error: any) {
        console.error('Error deleting DPR:', error);
        alert('Failed to delete DPR: ' + (error.message || JSON.stringify(error)));
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
            placeholder="Search reports..."
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => { setCurrentRecord({ status: 'In Progress', progress: 0, reportDate: new Date().toISOString().split('T')[0] }); setIsModalOpen(true); }}
        >
          <Plus size={18} style={{ marginRight: '0.5rem' }} />
          Log Progress
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Employee Name</th>
              <th>Project</th>
              <th>Task</th>
              <th>Hours</th>
              <th>Progress</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map(record => (
              <tr key={record.id}>
                <td>{record.reportDate}</td>
                <td className="font-medium">{record.employeeName}</td>
                <td>{record.projectName}</td>
                <td>{record.taskName}</td>
                <td>{record.hoursWorked}h</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="flex-1" style={{ height: '6px', backgroundColor: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div 
                        style={{ height: '100%', width: `${record.progress}%`, backgroundColor: record.progress === 100 ? 'var(--success)' : 'var(--primary)' }}
                      />
                    </div>
                    <span className="text-sm font-medium">{record.progress}%</span>
                  </div>
                </td>
                <td>{getStatusBadge(record.status)}</td>
                <td>
                  <div className="flex gap-2">
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '0.25rem 0.5rem' }} 
                      title="View"
                      onClick={() => { setCurrentRecord(record); setIsViewModalOpen(true); }}
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '0.25rem 0.5rem' }} 
                      title="Edit"
                      onClick={() => { setCurrentRecord(record); setIsModalOpen(true); }}
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '0.25rem 0.5rem', color: 'var(--destructive)' }} 
                      title="Delete"
                      onClick={() => handleDelete(record.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">Loading DPRs...</td>
              </tr>
            )}
            {!loading && filteredRecords.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                  No progress reports found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <h2 className="text-lg font-bold">{currentRecord.id ? 'Edit Report' : 'Log Daily Progress'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--muted-foreground)' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label className="form-label">Employee Name</label>
                  <input 
                    required 
                    type="text" 
                    className="form-input" 
                    value={currentRecord.employeeName || ''} 
                    onChange={e => setCurrentRecord({...currentRecord, employeeName: e.target.value})} 
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Report Date</label>
                  <input 
                    required 
                    type="date" 
                    className="form-input" 
                    value={currentRecord.reportDate || ''} 
                    onChange={e => setCurrentRecord({...currentRecord, reportDate: e.target.value})} 
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label className="form-label">Project Name</label>
                  <select 
                    required
                    className="form-input"
                    value={currentRecord.projectId || ''}
                    onChange={e => {
                      const proj = projects.find(p => p.id === e.target.value);
                      setCurrentRecord({...currentRecord, projectId: e.target.value, projectName: proj?.name});
                    }}
                  >
                    <option value="">Select Project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Hours Worked</label>
                  <input 
                    required 
                    type="number" 
                    step="0.5"
                    className="form-input" 
                    value={currentRecord.hoursWorked || ''} 
                    onChange={e => setCurrentRecord({...currentRecord, hoursWorked: Number(e.target.value)})} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Task Completed / Details</label>
                <textarea 
                  required 
                  className="form-input" 
                  rows={3}
                  value={currentRecord.taskName || ''} 
                  onChange={e => setCurrentRecord({...currentRecord, taskName: e.target.value})} 
                />
              </div>

              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label className="form-label">Overall Progress ({currentRecord.progress || 0}%)</label>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="5"
                    style={{ width: '100%', marginTop: '0.5rem' }}
                    value={currentRecord.progress || 0} 
                    onChange={e => setCurrentRecord({...currentRecord, progress: Number(e.target.value)})} 
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Status</label>
                  <select 
                    className="form-input"
                    value={currentRecord.status}
                    onChange={e => setCurrentRecord({...currentRecord, status: e.target.value as DPRStatus})}
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
                  Save Report
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
                <h2 className="text-lg font-bold text-slate-800">Daily Progress Report</h2>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} style={{ color: '#64748b', padding: '0.5rem', borderRadius: '50%', backgroundColor: 'white', border: '1px solid #e2e8f0', cursor: 'pointer' }} className="hover:bg-slate-50 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div style={{ padding: '2rem' }}>
              <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                <div className="col-span-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Task / Details</p>
                  <div className="text-base font-bold text-slate-900 bg-slate-50 px-3 py-3 rounded-lg border border-slate-200">
                    {currentRecord.taskName}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Employee Name</p>
                  <div className="text-sm font-semibold text-slate-900 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                    {currentRecord.employeeName}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Report Date</p>
                  <div className="text-sm font-semibold text-slate-800 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                    {currentRecord.reportDate}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Project</p>
                  <div className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                    {currentRecord.projectName}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Hours Worked</p>
                  <div className="text-sm font-medium text-slate-800 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                    {currentRecord.hoursWorked}h
                  </div>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Progress & Status</p>
                  <div className="flex items-center gap-6 bg-slate-50 px-4 py-3 rounded-lg border border-slate-200">
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-slate-500">Completion</span>
                        <span className="text-xs font-bold text-slate-700">{currentRecord.progress}%</span>
                      </div>
                      <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${currentRecord.progress}%`, backgroundColor: currentRecord.progress === 100 ? '#10b981' : '#3b82f6' }} />
                      </div>
                    </div>
                    <div style={{ height: '30px', width: '1px', backgroundColor: '#cbd5e1' }}></div>
                    <div>{getStatusBadge(currentRecord.status as DPRStatus)}</div>
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
import { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

type UserStatus = 'Active' | 'Inactive' | 'On Leave';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  status: UserStatus;
}

export default function TeamManagement() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState<Partial<TeamMember>>({ status: 'Active' });
  
  useEffect(() => {
    fetchMembers();

    const subscription = supabase
      .channel('users_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchMembers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      if (error) throw error;

      const formatted = data?.map(u => ({
        id: u.id,
        name: u.username,
        email: u.email || '',
        role: u.role,
        status: u.status
      })) || [];
      
      setMembers(formatted);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'Active': return <span className="badge badge-success">{status}</span>;
      case 'On Leave': return <span className="badge badge-primary">{status}</span>;
      case 'Inactive': return <span className="badge badge-secondary">{status}</span>;
      default: return <span className="badge badge-secondary">{status}</span>;
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const dbUser = {
      username: currentMember.name,
      email: currentMember.email,
      role: currentMember.role || 'Team Member',
      status: currentMember.status || 'Active'
    };

    try {
      if (currentMember.id) {
        const { error } = await supabase.from('users').update(dbUser).eq('id', currentMember.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('users').insert([dbUser]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      setCurrentMember({});
      fetchMembers();
    } catch (error: any) {
      console.error('Error saving team member:', error);
      alert('Failed to save team member: ' + (error.message || JSON.stringify(error)));
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this team member?')) {
      try {
        const { error } = await supabase.from('users').delete().eq('id', id);
        if (error) throw error;
        fetchMembers();
      } catch (error: any) {
        console.error('Error deleting team member:', error);
        alert('Failed to delete team member: ' + (error.message || JSON.stringify(error)));
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
            placeholder="Search team members..."
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => { setCurrentMember({ status: 'Active' }); setIsModalOpen(true); }}
        >
          <Plus size={18} style={{ marginRight: '0.5rem' }} />
          Add Member
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Member Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map(member => (
              <tr key={member.id}>
                <td className="font-medium">{member.name}</td>
                <td>{member.role}</td>
                <td>{getStatusBadge(member.status)}</td>
                <td>
                  <div className="flex gap-2">
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '0.25rem 0.5rem' }} 
                      title="View"
                      onClick={() => { setCurrentMember(member); setIsViewModalOpen(true); }}
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '0.25rem 0.5rem' }} 
                      title="Edit"
                      onClick={() => { setCurrentMember(member); setIsModalOpen(true); }}
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '0.25rem 0.5rem', color: 'var(--destructive)' }} 
                      title="Delete"
                      onClick={() => handleDelete(member.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">Loading team members...</td>
              </tr>
            )}
            {!loading && filteredMembers.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                  No team members found.
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
              <h2 className="text-lg font-bold">{currentMember.id ? 'Edit Member' : 'Add Member'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--muted-foreground)' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Member Name</label>
                <input 
                  required 
                  type="text" 
                  className="form-input" 
                  value={currentMember.name || ''} 
                  onChange={e => setCurrentMember({...currentMember, name: e.target.value})} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <select 
                  className="form-input"
                  value={currentMember.role || 'Frontend Developer'}
                  onChange={e => setCurrentMember({...currentMember, role: e.target.value})}
                >
                  <option>Frontend Developer</option>
                  <option>Backend Developer</option>
                  <option>UI/UX Designer</option>
                  <option>Project Manager</option>
                  <option>QA / Testing Engineer</option>
                  <option>Team Member</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select 
                  className="form-input"
                  value={currentMember.status}
                  onChange={e => setCurrentMember({...currentMember, status: e.target.value as UserStatus})}
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive</option>
                </select>
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
                <h2 className="text-lg font-bold text-slate-800">Team Member Profile</h2>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} style={{ color: '#64748b', padding: '0.5rem', borderRadius: '50%', backgroundColor: 'white', border: '1px solid #e2e8f0', cursor: 'pointer' }} className="hover:bg-slate-50 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div style={{ padding: '2rem' }}>
              <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                <div className="col-span-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Member Name</p>
                  <div className="text-base font-bold text-slate-900 bg-slate-50 px-3 py-3 rounded-lg border border-slate-200">
                    {currentMember.name}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Role</p>
                  <div className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 inline-block">
                    {currentMember.role}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Status</p>
                  <div className="flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 h-[38px]">
                    <div>{getStatusBadge(currentMember.status as UserStatus)}</div>
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
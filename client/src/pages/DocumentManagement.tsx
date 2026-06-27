import { useState, useRef, useEffect } from 'react';
import { Search, Upload, Download, Trash2, X, File, ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Document {
  id: string;
  projectId: string;
  projectName: string;
  projectCode?: string;
  milestoneId?: string;
  milestoneName?: string;
  remarks?: string;
  fileName: string;
  file_url?: string;
  uploadDate: string;
  size: string;
}

export default function DocumentManagement() {
  const [projects, setProjects] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchProjects();
    fetchDocuments();

    const subscription = supabase
      .channel('documents_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => {
        fetchDocuments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchProjects = async () => {
    const { data: pData } = await supabase.from('projects').select('id, name');
    if (pData) setProjects(pData);
    const { data: mData } = await supabase.from('milestones').select('id, project_id, name');
    if (mData) setMilestones(mData);
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('documents').select('*, projects(name, code), milestones(name)').order('upload_date', { ascending: false });
      if (error) throw error;

      const formatted = data?.map(d => ({
        id: d.id,
        projectId: d.project_id,
        projectName: d.projects?.name || 'Unknown',
        projectCode: d.projects?.code || '-',
        milestoneId: d.milestone_id,
        milestoneName: d.milestones?.name || '-',
        remarks: d.remarks || '-',
        fileName: d.file_name,
        file_url: d.file_url,
        uploadDate: new Date(d.upload_date).toLocaleString(),
        size: d.size_str
      })) || [];
      
      setDocuments(formatted);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'project' | 'billing'>('project');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('');
  const [remarks, setRemarks] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBillingDoc = (d: Document) => d.remarks && d.remarks.toLowerCase().includes('billing attachment');

  const filteredDocuments = documents.filter(d => {
    const matchesSearch = d.fileName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          d.projectName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'billing' ? isBillingDoc(d) : !isBillingDoc(d);
    return matchesSearch && matchesTab;
  });

  const groupedDocs = filteredDocuments.reduce((acc: any, doc) => {
    const pTitle = `${doc.projectCode} - ${doc.projectName}`;
    if (!acc[pTitle]) acc[pTitle] = {};
    const msName = doc.milestoneName || 'General';
    if (!acc[pTitle][msName]) acc[pTitle][msName] = [];
    acc[pTitle][msName].push(doc);
    return acc;
  }, {});

  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
  const [expandedMilestones, setExpandedMilestones] = useState<string[]>([]);

  const toggleProject = (pName: string) => {
    setExpandedProjects(prev => prev.includes(pName) ? prev.filter(p => p !== pName) : [...prev, pName]);
  };

  const toggleMilestone = (mName: string) => {
    setExpandedMilestones(prev => prev.includes(mName) ? prev.filter(m => m !== mName) : [...prev, mName]);
  };

  const handleUploadClick = () => {
    if (!selectedProjectId) {
      alert('Please select a project first before uploading.');
      return;
    }
    fileInputRef.current?.click();
  };

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (selectedProjectId) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (!selectedProjectId) {
      alert('Please select a project first before uploading.');
      return;
    }

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedProjectId) {
      await processFile(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFile = async (file: File) => {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    
    try {
      // 1. Upload to Supabase Storage
      const filePath = `public/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('PRM document files')
        .upload(filePath, file);

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw uploadError;
      }

      // 2. Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from('PRM document files')
        .getPublicUrl(filePath);

      // 3. Save to database
      const dbDoc = {
        project_id: selectedProjectId,
        milestone_id: selectedMilestoneId || null,
        remarks: remarks,
        file_name: file.name,
        file_url: publicUrlData.publicUrl,
        size_str: sizeMB
      };

      const { error } = await supabase.from('documents').insert([dbDoc]);
      if (error) throw error;
      
      setIsModalOpen(false);
      setSelectedProjectId('');
      setSelectedMilestoneId('');
      setRemarks('');
      fetchDocuments();
    } catch (error: any) {
      console.error('Error saving document:', error);
      alert('Failed to save document: ' + (error.message || JSON.stringify(error)));
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      try {
        const { error } = await supabase.from('documents').delete().eq('id', id);
        if (error) throw error;
        fetchDocuments();
      } catch (error: any) {
        console.error('Error deleting document:', error);
        alert('Failed to delete document: ' + (error.message || JSON.stringify(error)));
      }
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center border-b border-border pb-4">
          <div className="flex gap-4">
            <button
              className={`pb-2 ${activeTab === 'project' ? 'font-bold text-primary border-b-2' : 'text-muted'}`}
              style={{ borderBottomColor: activeTab === 'project' ? 'var(--primary)' : 'transparent', borderBottomStyle: 'solid', borderBottomWidth: '2px', paddingBottom: '0.5rem', marginBottom: '-17px' }}
              onClick={() => setActiveTab('project')}
            >
              Project Documents
            </button>
            <button
              className={`pb-2 ${activeTab === 'billing' ? 'font-bold text-primary border-b-2' : 'text-muted'}`}
              style={{ borderBottomColor: activeTab === 'billing' ? 'var(--primary)' : 'transparent', borderBottomStyle: 'solid', borderBottomWidth: '2px', paddingBottom: '0.5rem', marginBottom: '-17px' }}
              onClick={() => setActiveTab('billing')}
            >
              Billing Documents
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <div style={{ position: 'relative', width: '300px' }}>
              <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
              <input
                type="text"
                className="form-input"
                placeholder={`Search ${activeTab} documents...`}
                style={{ paddingLeft: '2.5rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {activeTab === 'project' && (
              <button 
                className="btn btn-primary"
                onClick={() => setIsModalOpen(true)}
              >
                <Upload size={18} style={{ marginRight: '0.5rem' }} />
                Upload Document
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card glass-card" style={{ padding: '1.5rem' }}>
        {loading ? (
          <div className="text-center py-8 text-muted">Loading documents...</div>
        ) : Object.keys(groupedDocs).length === 0 ? (
          <div className="text-center py-8 text-muted">No documents found.</div>
        ) : (
          <div className="flex flex-col gap-4">
            {Object.keys(groupedDocs).map(projectName => {
              const projectDocs = groupedDocs[projectName];
              const isProjectExpanded = expandedProjects.includes(projectName);
              
              return (
                <div key={projectName} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', backgroundColor: 'var(--card)', boxShadow: 'var(--shadow-sm)' }}>
                  {/* Project Header */}
                  <div 
                    className="flex items-center"
                    onClick={() => toggleProject(projectName)}
                    style={{ 
                      padding: '1rem', 
                      cursor: 'pointer', 
                      gap: '0.75rem',
                      backgroundColor: isProjectExpanded ? 'var(--secondary)' : 'transparent', 
                      borderBottom: isProjectExpanded ? '1px solid var(--border)' : 'none',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    {isProjectExpanded ? <ChevronDown size={20} style={{ color: 'var(--muted-foreground)' }} /> : <ChevronRight size={20} style={{ color: 'var(--muted-foreground)' }} />}
                    {isProjectExpanded ? <FolderOpen size={22} style={{ color: 'var(--primary)' }} /> : <Folder size={22} style={{ color: 'var(--primary)' }} />}
                    <h3 className="text-lg font-semibold" style={{ margin: 0 }}>{projectName}</h3>
                    <span className="font-medium" style={{ marginLeft: 'auto', fontSize: '0.75rem', backgroundColor: 'var(--secondary)', padding: '0.25rem 0.5rem', borderRadius: '1rem', color: 'var(--muted-foreground)' }}>
                      {Object.values(projectDocs).flat().length} Files
                    </span>
                  </div>

                  {/* Project Content (Milestones) */}
                  {isProjectExpanded && (
                    <div className="flex flex-col gap-4" style={{ padding: '1rem', backgroundColor: 'var(--secondary)' }}>
                      {Object.keys(projectDocs).map(milestoneName => {
                        const milestoneDocs = projectDocs[milestoneName];
                        const milestoneKey = `${projectName}-${milestoneName}`;
                        const isMilestoneExpanded = expandedMilestones.includes(milestoneKey);
                        
                        return (
                          <div key={milestoneKey} style={{ border: '1px solid var(--border)', borderRadius: '0.5rem', overflow: 'hidden', backgroundColor: 'var(--card)' }}>
                            {/* Milestone Header */}
                            <div 
                              className="flex items-center"
                              onClick={() => toggleMilestone(milestoneKey)}
                              style={{ 
                                padding: '0.75rem 1rem', 
                                cursor: 'pointer', 
                                gap: '0.75rem',
                                borderBottom: isMilestoneExpanded ? '1px solid var(--border)' : 'none',
                                transition: 'background-color 0.2s'
                              }}
                            >
                              {isMilestoneExpanded ? <ChevronDown size={18} style={{ color: 'var(--muted-foreground)' }} /> : <ChevronRight size={18} style={{ color: 'var(--muted-foreground)' }} />}
                              {isMilestoneExpanded ? <FolderOpen size={18} style={{ color: 'var(--warning)' }} /> : <Folder size={18} style={{ color: 'var(--warning)' }} />}
                              <h4 className="font-medium">{milestoneName}</h4>
                              <span className="font-medium" style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                                {milestoneDocs.length} {milestoneDocs.length === 1 ? 'File' : 'Files'}
                              </span>
                            </div>

                            {/* Milestone Content (Documents) */}
                            {isMilestoneExpanded && (
                              <div style={{ padding: 0 }}>
                                <table className="w-full text-sm" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                  <thead style={{ backgroundColor: 'var(--secondary)', color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border)' }}>
                                    <tr>
                                      <th style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>File Name</th>
                                      <th style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>Remarks</th>
                                      <th style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>Upload Date</th>
                                      <th style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>Size</th>
                                      <th style={{ padding: '0.75rem 1rem', fontWeight: 500, textAlign: 'right' }}>Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {milestoneDocs.map((doc: Document) => (
                                      <tr key={doc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                          <div 
                                            className="flex items-center gap-2"
                                            style={{ cursor: 'pointer', color: 'var(--primary)' }}
                                            onClick={() => {
                                              let urlToOpen = doc.file_url;
                                              if (!urlToOpen || urlToOpen === 'mock_url' || !urlToOpen.startsWith('http')) {
                                                const { data } = supabase.storage.from('PRM document files').getPublicUrl(`public/${doc.fileName}`);
                                                urlToOpen = data.publicUrl;
                                              }
                                              window.open(urlToOpen, '_blank');
                                            }}
                                          >
                                            <File size={16} />
                                            <span className="font-medium" style={{ textDecoration: 'underline' }}>{doc.fileName}</span>
                                          </div>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={doc.remarks}>{doc.remarks}</td>
                                        <td style={{ padding: '0.75rem 1rem', color: 'var(--muted-foreground)' }}>{doc.uploadDate}</td>
                                        <td style={{ padding: '0.75rem 1rem', color: 'var(--muted-foreground)' }}>{doc.size}</td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                          <div className="flex gap-2 justify-between" style={{ justifyContent: 'flex-end' }}>
                                            <button 
                                              className="btn btn-outline" 
                                              style={{ padding: '0.25rem 0.5rem', border: 'none' }} 
                                              title="Download"
                                              onClick={() => {
                                                let urlToOpen = doc.file_url;
                                                if (!urlToOpen || urlToOpen === 'mock_url' || !urlToOpen.startsWith('http')) {
                                                  const { data } = supabase.storage.from('PRM document files').getPublicUrl(`public/${doc.fileName}`);
                                                  urlToOpen = data.publicUrl;
                                                }
                                                window.open(urlToOpen, '_blank');
                                              }}
                                            >
                                              <Download size={16} style={{ color: 'var(--muted-foreground)' }} />
                                            </button>
                                            <button 
                                              className="btn btn-outline" 
                                              style={{ padding: '0.25rem 0.5rem', border: 'none' }} 
                                              title="Delete"
                                              onClick={() => handleDelete(doc.id)}
                                            >
                                              <Trash2 size={16} style={{ color: 'var(--destructive)' }} />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <h2 className="text-lg font-bold">Upload Document</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--muted-foreground)' }}>
                <X size={20} />
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Select Project</label>
                <select 
                  className="form-input"
                  value={selectedProjectId}
                  onChange={e => {
                    setSelectedProjectId(e.target.value);
                    setSelectedMilestoneId('');
                  }}
                >
                  <option value="">Select Project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {selectedProjectId && (
                <div className="form-group">
                  <label className="form-label">Select Milestone (Optional)</label>
                  <select 
                    className="form-input"
                    value={selectedMilestoneId}
                    onChange={e => setSelectedMilestoneId(e.target.value)}
                  >
                    <option value="">No Milestone</option>
                    {milestones.filter(m => m.project_id === selectedProjectId).map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Remarks / Description</label>
                <textarea 
                  className="form-input"
                  rows={2}
                  placeholder="Enter remarks here..."
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                />
              </div>

              <div 
                style={{ 
                  border: '2px dashed var(--border)', 
                  borderRadius: '0.5rem', 
                  padding: '3rem', 
                  textAlign: 'center',
                  cursor: selectedProjectId ? 'pointer' : 'not-allowed',
                  opacity: selectedProjectId ? 1 : 0.5,
                  backgroundColor: isDragging ? 'var(--secondary)' : 'transparent',
                  transition: 'all 0.2s'
                }}
                onClick={handleUploadClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload size={48} style={{ margin: '0 auto', color: 'var(--muted-foreground)', marginBottom: '1rem' }} />
                <p className="font-medium">
                  {isDragging ? 'Drop file here!' : 'Click to browse or drag and drop'}
                </p>
                <p className="text-sm text-muted mt-1">PDF, DOCX, PNG, JPG (Max 10MB)</p>
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleFileChange}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
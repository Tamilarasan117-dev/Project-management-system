import { useState, useRef, useEffect } from 'react';
import { Search, Plus, Trash2, X, Receipt, Upload, Eye, Edit2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Billing {
  id: string;
  projectId: string;
  projectName: string;
  milestoneId?: string;
  milestoneName?: string;
  vendorName: string;
  invoiceNo: string;
  invoiceAmount: number;
  paymentStatus: string;
  attachmentUrl?: string;
  actualDate: string;
}

export default function BillingManagement() {
  const [projects, setProjects] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [billings, setBillings] = useState<Billing[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchProjects();
    fetchBillings();

    const subscription = supabase
      .channel('billings_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'billings' }, () => {
        fetchBillings();
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

  const fetchBillings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('billings').select('*, projects(name), milestones(name)').order('created_at', { ascending: false });
      if (error) throw error;

      const formatted = data?.map(d => ({
        id: d.id,
        projectId: d.project_id,
        projectName: d.projects?.name || 'Unknown',
        milestoneId: d.milestone_id,
        milestoneName: d.milestones?.name || '-',
        vendorName: d.vendor_name,
        invoiceNo: d.invoice_no,
        invoiceAmount: d.invoice_amount,
        paymentStatus: d.payment_status,
        attachmentUrl: d.attachment_url,
        actualDate: d.actual_date,
      })) || [];
      
      setBillings(formatted);
    } catch (error) {
      console.error('Error fetching billings:', error);
    } finally {
      setLoading(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Not Paid');
  const [actualDate, setActualDate] = useState('');
  const [fileName, setFileName] = useState('');
  const [currentBillingId, setCurrentBillingId] = useState<string | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentBilling, setCurrentBilling] = useState<Partial<Billing>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredBillings = billings.filter(b => 
    b.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
  };

  const resetForm = () => {
    setSelectedProjectId('');
    setSelectedMilestoneId('');
    setVendorName('');
    setInvoiceNo('');
    setInvoiceAmount('');
    setPaymentStatus('Not Paid');
    setActualDate('');
    setFileName('');
    setCurrentBillingId(null);
    setCurrentBilling({});
  };

  const handleEdit = (bill: Billing) => {
    setSelectedProjectId(bill.projectId);
    setSelectedMilestoneId(bill.milestoneId || '');
    setVendorName(bill.vendorName);
    setInvoiceNo(bill.invoiceNo);
    setInvoiceAmount(bill.invoiceAmount.toString());
    setPaymentStatus(bill.paymentStatus);
    setActualDate(bill.actualDate);
    setFileName(bill.attachmentUrl ? bill.attachmentUrl.split('/').pop() || '' : '');
    setCurrentBillingId(bill.id);
    setIsModalOpen(true);
  };

  const handleView = (bill: Billing) => {
    setCurrentBilling(bill);
    setIsViewModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedProjectId || !vendorName || !invoiceNo || !invoiceAmount || !actualDate) {
      alert('Please fill in all required fields (Project, Vendor, Invoice No, Amount, Actual Date)');
      return;
    }

    const dbBilling = {
      project_id: selectedProjectId,
      milestone_id: selectedMilestoneId || null,
      vendor_name: vendorName,
      invoice_no: invoiceNo,
      invoice_amount: parseFloat(invoiceAmount),
      payment_status: paymentStatus,
      attachment_url: fileName ? `mock_s3_url/${fileName}` : null,
      actual_date: actualDate
    };

    try {
      if (currentBillingId) {
        const { error } = await supabase.from('billings').update(dbBilling).eq('id', currentBillingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('billings').insert([dbBilling]);
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving billing:', error);
      alert('Failed to save billing record: ' + (error.message || JSON.stringify(error)));
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this billing record?')) {
      try {
        const { error } = await supabase.from('billings').delete().eq('id', id);
        if (error) throw error;
      } catch (error: any) {
        console.error('Error deleting billing:', error);
        alert('Failed to delete billing: ' + (error.message || JSON.stringify(error)));
      }
    }
  };

  // Filter milestones dynamically based on selected project
  const filteredMilestones = milestones.filter(m => m.project_id === selectedProjectId);

  return (
    <div>
      <div className="page-header">
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search invoices, vendors..."
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => { resetForm(); setIsModalOpen(true); }}
        >
          <Plus size={18} style={{ marginRight: '0.5rem' }} />
          Add Bill
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice No</th>
              <th>Vendor Name</th>
              <th>Project</th>
              <th>Milestone</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
              <th>Attachment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>Loading bills...</td></tr>
            ) : filteredBillings.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-foreground)' }}>No bills found</td></tr>
            ) : (
              filteredBillings.map((bill) => (
                <tr key={bill.id}>
                  <td className="font-medium">{bill.invoiceNo}</td>
                  <td>{bill.vendorName}</td>
                  <td>{bill.projectName}</td>
                  <td>{bill.milestoneName}</td>
                  <td className="font-medium text-primary">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(bill.invoiceAmount)}
                  </td>
                  <td>{new Date(bill.actualDate).toLocaleDateString()}</td>
                  <td>
                    <span 
                      style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '0.25rem', 
                        fontSize: '0.75rem', 
                        fontWeight: 600,
                        backgroundColor: bill.paymentStatus === 'Paid' ? '#dcfce7' : '#fee2e2',
                        color: bill.paymentStatus === 'Paid' ? '#16a34a' : '#dc2626'
                      }}
                    >
                      {bill.paymentStatus}
                    </span>
                  </td>
                  <td>
                    {bill.attachmentUrl ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#64748b', fontSize: '0.875rem' }}>
                        <Receipt size={16} />
                        Document
                      </span>
                    ) : '-'}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleView(bill)}
                        className="btn" 
                        style={{ padding: '0.25rem', color: 'var(--primary)' }}
                        title="View Bill"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => handleEdit(bill)}
                        className="btn" 
                        style={{ padding: '0.25rem', color: '#f59e0b' }}
                        title="Edit Bill"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(bill.id)}
                        className="btn" 
                        style={{ padding: '0.25rem', color: 'var(--destructive)' }}
                        title="Delete Bill"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header flex justify-between items-center">
              <h2 className="text-xl font-bold">Add New Bill</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--muted-foreground)' }}>
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Project Name *</label>
                <select 
                  className="form-input"
                  value={selectedProjectId}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value);
                    setSelectedMilestoneId('');
                  }}
                  required
                >
                  <option value="">Select Project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Milestone</label>
                <select 
                  className="form-input"
                  value={selectedMilestoneId}
                  onChange={(e) => setSelectedMilestoneId(e.target.value)}
                  disabled={!selectedProjectId}
                >
                  <option value="">Select Milestone</option>
                  {filteredMilestones.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Vendor Name *</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="Enter Vendor Name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Invoice No *</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  placeholder="INV-XXXX"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Invoice Amount *</label>
                <input 
                  type="number" 
                  className="form-input"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Actual Date *</label>
                <input 
                  type="date" 
                  className="form-input"
                  value={actualDate}
                  onChange={(e) => setActualDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Status *</label>
                <select 
                  className="form-input"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  required
                >
                  <option value="Not Paid">Not Paid</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Billing Attachment</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                  <button 
                    className="btn btn-outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={16} style={{ marginRight: '0.5rem' }} />
                    Choose File
                  </button>
                  <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                    {fileName || 'No file chosen'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="modal-footer flex justify-end gap-2" style={{ marginTop: '1.5rem' }}>
              <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save Bill</button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && currentBilling && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Billing Details</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-y-6 gap-x-8">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Project</p>
                <p className="text-base font-medium text-slate-900">{currentBilling.projectName || '-'}</p>
              </div>
              
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Milestone</p>
                <p className="text-base font-medium text-slate-900">{currentBilling.milestoneName || '-'}</p>
              </div>
              
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Vendor Name</p>
                <p className="text-base font-medium text-slate-900">{currentBilling.vendorName || '-'}</p>
              </div>
              
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Invoice No</p>
                <p className="text-base font-medium text-slate-900">{currentBilling.invoiceNo || '-'}</p>
              </div>
              
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Invoice Amount</p>
                <p className="text-base font-medium text-emerald-600">
                  {currentBilling.invoiceAmount ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(currentBilling.invoiceAmount) : '-'}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Actual Date</p>
                <p className="text-base font-medium text-slate-900">{currentBilling.actualDate ? new Date(currentBilling.actualDate).toLocaleDateString() : '-'}</p>
              </div>
              
              <div className="col-span-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Status & Attachments</p>
                <div className="flex items-center gap-4">
                  <span 
                    style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '0.25rem', 
                      fontSize: '0.75rem', 
                      fontWeight: 600,
                      backgroundColor: currentBilling.paymentStatus === 'Paid' ? '#dcfce7' : '#fee2e2',
                      color: currentBilling.paymentStatus === 'Paid' ? '#16a34a' : '#dc2626'
                    }}
                  >
                    {currentBilling.paymentStatus}
                  </span>
                  {currentBilling.attachmentUrl && (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                      <Receipt size={16} />
                      Document Attached
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
              <button 
                className="btn btn-primary"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Send, Search, CheckCircle, XCircle } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface Notification {
  id: string;
  recipient: string;
  subject: string;
  sentDate: string;
  status: 'Sent' | 'Failed';
}

export default function EmailNotification() {
  const [history, setHistory] = useLocalStorage<Notification[]>('epms_notifications', [
    { id: '1', recipient: 'john.doe@example.com', subject: 'Project Alpha Started', sentDate: '2026-06-16 09:00 AM', status: 'Sent' },
    { id: '2', recipient: 'jane.smith@example.com', subject: 'Task Assigned: UI Design', sentDate: '2026-06-16 10:15 AM', status: 'Sent' },
    { id: '3', recipient: 'team@indotech.com', subject: 'Budget Update Alert', sentDate: '2026-06-15 04:30 PM', status: 'Failed' },
  ]);
  
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = history.filter(h => 
    h.recipient.toLowerCase().includes(searchTerm.toLowerCase()) || 
    h.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!to || !subject || !message) return;

    const newNotification: Notification = {
      id: Date.now().toString(),
      recipient: to,
      subject: subject,
      sentDate: new Date().toLocaleString(),
      status: 'Sent' // Mocking successful send
    };

    setHistory([newNotification, ...history]);
    setTo('');
    setSubject('');
    setMessage('');
    
    // In a real app, this would show a toast notification
    alert('Email sent successfully!');
  };

  return (
    <div className="flex gap-6 flex-col lg:flex-row">
      <div className="card" style={{ flex: '1', height: 'fit-content' }}>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary">
          <Send size={20} />
          Send Email
        </h2>
        
        <form onSubmit={handleSend}>
          <div className="form-group">
            <label className="form-label">To (Recipient)</label>
            <input 
              required 
              type="email" 
              className="form-input" 
              value={to}
              onChange={e => setTo(e.target.value)}
              placeholder="e.g. user@example.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Subject</label>
            <input 
              required 
              type="text" 
              className="form-input" 
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Email subject"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Message</label>
            <textarea 
              required 
              className="form-input" 
              rows={8}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type your message here..."
            />
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={() => { setTo(''); setSubject(''); setMessage(''); }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex items-center gap-2">
              <Send size={16} />
              Send
            </button>
          </div>
        </form>
      </div>

      <div className="card" style={{ flex: '2' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Notification History</h2>
          <div style={{ position: 'relative', width: '250px' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search history..."
              style={{ paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Subject</th>
                <th>Sent Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map(item => (
                <tr key={item.id}>
                  <td>{item.recipient}</td>
                  <td className="font-medium">{item.subject}</td>
                  <td>{item.sentDate}</td>
                  <td>
                    {item.status === 'Sent' ? (
                      <span className="badge badge-success flex items-center gap-1 w-fit">
                        <CheckCircle size={14} /> Sent
                      </span>
                    ) : (
                      <span className="badge badge-destructive flex items-center gap-1 w-fit">
                        <XCircle size={14} /> Failed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                    No notification history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
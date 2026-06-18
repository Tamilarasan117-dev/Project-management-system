import { useState } from 'react';
import { Eye, EyeOff, LogIn, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Logo = () => (
  <svg width="220" height="60" viewBox="0 0 150 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="150" height="40" rx="4" fill="#e3282f" />
    <text x="75" y="27" fontFamily="Inter, sans-serif" fontSize="20" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="1">
      INDO TECH
    </text>
  </svg>
);

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) {
      setError('Username is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }
    
    if (username === 'admin' && password === 'admin') {
      navigate('/');
    } else {
      setError('Invalid credentials (use admin/admin)');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: '#0f172a',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Left Column - Colorful Digitalization Vibe */}
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 80%, #7c3aed 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '4rem',
        color: 'white'
      }}>
        {/* Abstract shapes for colorful tech vibe */}
        <div style={{
          position: 'absolute', top: '-10%', left: '-10%', width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(239,68,68,0.4) 0%, rgba(239,68,68,0) 70%)',
          borderRadius: '50%', filter: 'blur(80px)', zIndex: 0
        }}></div>
        <div style={{
          position: 'absolute', bottom: '-20%', right: '-10%', width: '700px', height: '700px',
          background: 'radial-gradient(circle, rgba(56,189,248,0.3) 0%, rgba(56,189,248,0) 70%)',
          borderRadius: '50%', filter: 'blur(100px)', zIndex: 0
        }}></div>
        
        {/* Floating grid effect (simple CSS pattern) */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.1, zIndex: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>

        <div style={{ position: 'relative', zIndex: 10, maxWidth: '600px' }}>
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem', 
            padding: '0.5rem 1rem', borderRadius: '999px', 
            backgroundColor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)', marginBottom: '2rem'
          }}>
            <Sparkles size={16} color="#fcd34d" />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em' }}>WELCOME TO INDOTECH</span>
          </div>
          
          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem', textShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
            Building Tomorrow's<br/>
            <span style={{ 
              background: 'linear-gradient(to right, #60a5fa, #c084fc, #f472b6)', 
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' 
            }}>Digital Experience.</span>
          </h1>
          
          <p style={{ fontSize: '1.125rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '2.5rem', maxWidth: '480px' }}>
            A unified platform designed for managing projects, teams, budgets, and operations efficiently.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', maxWidth: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: 'rgba(52, 211, 153, 0.2)', color: '#34d399' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>Enterprise Ready</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: 'rgba(52, 211, 153, 0.2)', color: '#34d399' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>Modern Interface</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: 'rgba(52, 211, 153, 0.2)', color: '#34d399' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>Fast & Secure</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: 'rgba(52, 211, 153, 0.2)', color: '#34d399' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>Realtime Updates</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div style={{
        flex: '0 0 500px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        position: 'relative'
      }}>
        <div style={{ width: '100%', maxWidth: '380px', padding: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <Logo />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginTop: '1.5rem' }}>Welcome Back</h2>
            <p style={{ marginTop: '0.5rem', color: '#64748b', fontSize: '0.95rem' }}>
              Enter your credentials to access the portal
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ width: '100%' }}>
            {error && (
              <div style={{ 
                backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '0.875rem', fontWeight: 500,
                padding: '0.875rem', borderRadius: '0.5rem', marginBottom: '1.5rem', textAlign: 'center',
                border: '1px solid #fecaca'
              }}>
                {error}
              </div>
            )}
            
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="username" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                USER NAME
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                placeholder="admin"
                style={{
                  width: '100%', padding: '0.875rem 1rem', borderRadius: '0.5rem',
                  border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '0.95rem',
                  color: '#1e293b', outline: 'none', transition: 'all 0.2s ease'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.backgroundColor = '#ffffff'; e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.backgroundColor = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '2.5rem', position: 'relative' }}>
              <label htmlFor="password" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '0.875rem 2.5rem 0.875rem 1rem', borderRadius: '0.5rem',
                    border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '0.95rem',
                    color: '#1e293b', outline: 'none', transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.backgroundColor = '#ffffff'; e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.backgroundColor = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)',
                    color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer',
                    padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              style={{ 
                width: '100%', padding: '1rem', backgroundColor: '#e3282f', color: 'white',
                border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(227, 40, 47, 0.3)'
              }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#c81e24'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(227, 40, 47, 0.4)'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#e3282f'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(227, 40, 47, 0.3)'; }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
            >
              <LogIn size={20} />
              Sign in to Dashboard
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

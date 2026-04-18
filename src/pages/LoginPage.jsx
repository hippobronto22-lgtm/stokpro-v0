import React, { useState } from 'react';
import { Eye, EyeOff, LogIn, AlertCircle, Loader } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import useStore from '../store/useStore';

const LoginPage = () => {
  const { theme } = useStore();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Email dan password wajib diisi.'); return; }
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged in App.jsx will handle the rest
    } catch (err) {
      const msg = {
        'auth/user-not-found':  'Akun dengan email ini tidak ditemukan.',
        'auth/wrong-password':  'Password salah. Silakan coba lagi.',
        'auth/invalid-email':   'Format email tidak valid.',
        'auth/too-many-requests': 'Terlalu banyak percobaan. Coba beberapa saat lagi.',
        'auth/user-disabled':   'Akun ini telah dinonaktifkan.',
        'auth/invalid-credential': 'Email atau password salah.',
      }[err.code] || 'Gagal masuk. Periksa email dan password Anda.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'admin') { setEmail('admin@stokpro.id'); setPassword('admin123'); }
    else { setEmail('operator@stokpro.id'); setPassword('operator123'); }
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-main)', padding: '1.5rem', position: 'relative', overflow: 'hidden'
    }}>
      {/* Background decoration */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-15%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)' }} />
        {/* Grid pattern */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '60px 60px', opacity: 0.3 }} />
      </div>

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
            <svg width="44" height="44" viewBox="0 0 40 40" fill="none">
              <path d="M10 15L20 10L30 15L20 20L10 15Z" fill="#1E40AF"/>
              <path d="M10 15V25L20 30V20L10 15Z" fill="#1D4ED8"/>
              <path d="M20 20V30L30 25V15L20 20Z" fill="#2563EB"/>
              <path d="M22 28L28 32V24L22 20V28Z" fill="#166534"/>
              <path d="M28 32L34 28V20L28 24V32Z" fill="#22C55E"/>
              <path d="M22 20L28 16L34 20L28 24L22 20Z" fill="#15803D"/>
              <path d="M12 28C14 26 22 18 30 14" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              <path d="M26 12L30 14L28 18" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.04em', lineHeight: 1 }}>
                <span style={{ color: '#1E40AF' }}>Stok</span>
                <span style={{ color: '#22C55E' }}>Pro</span>
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 2 }}>Smart Inventory Solutions</div>
            </div>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 8 }}>Masuk untuk melanjutkan ke sistem</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 20, padding: '2rem', backdropFilter: 'blur(12px)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.3)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0 0 1.5rem 0' }}>Masuk ke Akun Anda</h2>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, marginBottom: '1.25rem', color: '#ef4444', fontSize: '0.85rem' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Email */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                Email
              </label>
              <input
                type="email"
                className="form-input"
                placeholder="email@perusahaan.id"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ width: '100%' }}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ width: '100%', paddingRight: '3rem' }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
                >
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', borderRadius: 12, fontSize: '0.95rem', fontWeight: '700', marginTop: 8, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }}/> Memproses...</>
              ) : (
                <><LogIn size={18}/> Masuk</>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-main)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
              Demo Akun — Klik untuk Isi Otomatis
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => fillDemo('admin')}
                style={{ padding: '0.4rem 0.75rem', borderRadius: 8, background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemo('operator')}
                style={{ padding: '0.4rem 0.75rem', borderRadius: 8, background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}
              >
                Operator Gudang
              </button>
            </div>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>admin@stokpro.id</span><span style={{ opacity: 0.6 }}>admin123</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>operator@stokpro.id</span><span style={{ opacity: 0.6 }}>operator123</span>
              </div>
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '1.5rem' }}>
          © 2025 StokPro · Smart Inventory Solutions
        </p>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default LoginPage;

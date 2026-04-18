import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, ShoppingCart, Package, Warehouse,
  Factory, Truck, BarChart3, Sun, Moon,
  Database, ArrowLeftRight, Menu, X, LogOut, Loader
} from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import useStore from './store/useStore';

// Pages
import LoginPage   from './pages/LoginPage';
import Dashboard   from './pages/Dashboard';
import Orders      from './pages/Orders';
import Purchasing  from './pages/Purchasing';
import Inventory   from './pages/Inventory';
import Production  from './pages/Production';
import Traceability from './pages/Traceability';
import Outgoing    from './pages/Outgoing';
import Reports     from './pages/Reports';
import ProductManagement from './pages/ProductManagement';
import MasterData  from './pages/MasterData';

// ── Menu Config ────────────────────────────────────────────────────────────────
const menuItems = [
  { id: 'dashboard',    label: 'Dashboard',               icon: LayoutDashboard },
  { type: 'divider',    label: 'Penjualan' },
  { id: 'orders',       label: 'Manajemen Pesanan',        icon: ShoppingCart },
  { id: 'products',     label: 'Manajemen Produk',         icon: Package },
  { type: 'divider',    label: 'Produksi' },
  { id: 'production',   label: 'Produksi',                 icon: Factory },
  { id: 'traceability', label: 'Tracking Relasi Produksi', icon: ArrowLeftRight },
  { type: 'divider',    label: 'Gudang' },
  { id: 'inventory',    label: 'Manajemen Gudang',         icon: Warehouse },
  { id: 'purchasing',   label: 'Input Bahan Baku',         icon: Package },
  { id: 'outgoing',     label: 'Pengeluaran Barang',       icon: Truck },
  { type: 'divider',    label: 'Laporan & Data' },
  { id: 'reports',      label: 'Laporan',                  icon: BarChart3 },
  { id: 'master',       label: 'Master Data',              icon: Database },
];

// ── Sidebar Item ───────────────────────────────────────────────────────────────
const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} style={{
    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
    padding: '0.65rem 0.75rem', borderRadius: 10, marginBottom: 2,
    background: active ? 'var(--primary-light)' : 'transparent',
    color: active ? 'var(--primary)' : 'var(--text-muted)',
    border: 'none', fontFamily: 'inherit', cursor: 'pointer',
    transition: 'all 0.15s ease', textAlign: 'left',
    fontWeight: active ? '600' : '400', fontSize: '0.875rem'
  }}>
    <Icon size={18} style={{ flexShrink: 0 }}/>
    <span>{label}</span>
  </button>
);

// ── Loading Screen ─────────────────────────────────────────────────────────────
const LoadingScreen = ({ message = 'Memuat data...' }) => (
  <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', gap: 16 }}>
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
    <Loader size={24} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }}/>
    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{message}</p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ── App ────────────────────────────────────────────────────────────────────────
function App() {
  const [activeTab, setActiveTab]     = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true); // waiting for Firebase

  const {
    theme, toggleTheme,
    currentUser, setCurrentUser,
    roles, setRoles,
    setInventory, setOrders, setPurchases,
    setProduction, setOutgoing, setUsers, setMasterData,
    loadDashboardLayout
  } = useStore();

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // ── Firebase Auth Observer ─────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user profile from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setCurrentUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...userDoc.data() });
        } else {
          // Fallback: basic profile from Firebase Auth
          setCurrentUser({ uid: firebaseUser.uid, email: firebaseUser.email, name: firebaseUser.displayName || firebaseUser.email, role: 'Admin', roleId: 'ROLE-001' });
        }
        loadDashboardLayout();
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // ── Firestore Real-time Listeners (only when logged in) ───────────────────
  useEffect(() => {
    if (!currentUser) return;

    const unsubs = [
      onSnapshot(collection(db, 'inventory'),  (s) => setInventory(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, 'orders'),     (s) => setOrders(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, 'purchases'),  (s) => setPurchases(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, 'production'), (s) => setProduction(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, 'outgoing'),   (s) => setOutgoing(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, 'users'),      (s) => setUsers(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, 'roles'),      (s) => setRoles(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, 'masterData'), (s) => {
        const suppliers = [], units = [];
        s.docs.forEach(d => {
          const item = { id: d.id.split('_')[1] || d.id, ...d.data() };
          if (item.type === 'suppliers') suppliers.push(item);
          else units.push(item);
        });
        setMasterData({ suppliers, units });
      }),
    ];

    return () => unsubs.forEach(u => u());
  }, [currentUser?.uid]);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
  };

  // ── Waiting for Firebase ───────────────────────────────────────────────────
  if (authLoading) return <LoadingScreen message="Menghubungkan ke server..." />;

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!currentUser) return <LoginPage />;

  // ── RBAC ───────────────────────────────────────────────────────────────────
  const userRole = roles.find(r => r.id === currentUser.roleId);
  const userPermissions = new Set(userRole?.permissions || menuItems.filter(i => i.id).map(i => i.id));

  const visibleMenuItems = menuItems.filter(item => item.type === 'divider' || userPermissions.has(item.id));
  const cleanMenu = visibleMenuItems.filter((item, idx, arr) => {
    if (item.type !== 'divider') return true;
    const next = arr[idx + 1];
    return next && next.type !== 'divider';
  });

  useEffect(() => {
    const allowed = menuItems.filter(i => i.id && userPermissions.has(i.id));
    if (allowed.length > 0 && !userPermissions.has(activeTab)) {
      setActiveTab(allowed[0].id);
    }
  }, [currentUser?.roleId]);

  const handleNavigate = (id) => {
    if (!userPermissions.has(id)) return;
    setActiveTab(id);
    setSidebarOpen(false);
  };

  const renderContent = () => {
    if (!userPermissions.has(activeTab)) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '2rem' }}>🔒</span>
          </div>
          <h3 style={{ fontWeight: '800', fontSize: '1.25rem', margin: 0 }}>Akses Ditolak</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: 320, margin: 0 }}>Anda tidak memiliki izin untuk mengakses halaman ini.</p>
          <div style={{ padding: '0.5rem 1.25rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 8, fontSize: '0.82rem', fontWeight: '700', border: '1px solid rgba(239,68,68,0.2)' }}>
            Role Anda: {currentUser.role}
          </div>
        </div>
      );
    }
    switch (activeTab) {
      case 'dashboard':    return <Dashboard />;
      case 'products':     return <ProductManagement />;
      case 'orders':       return <Orders />;
      case 'purchasing':   return <Purchasing />;
      case 'inventory':    return <Inventory />;
      case 'production':   return <Production />;
      case 'traceability': return <Traceability />;
      case 'outgoing':     return <Outgoing />;
      case 'reports':      return <Reports />;
      case 'master':       return <MasterData />;
      default:             return <Dashboard />;
    }
  };

  const activeLabel = menuItems.find(i => i.id === activeTab)?.label || '';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 40 }}
          className="mobile-overlay"
        />
      )}

      {/* Sidebar */}
      <aside className="app-sidebar" style={{
        width: 'var(--sidebar-width)', background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border)', padding: '1.25rem 1rem',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        height: '100vh', overflowY: 'auto', position: 'sticky', top: 0,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 0.5rem', marginBottom: '2rem' }}>
          <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
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
            <div style={{ fontSize: '1.3rem', fontWeight: '800', letterSpacing: '-0.02em', lineHeight: 1 }}>
              <span style={{ color: '#1E40AF' }}>Stok</span><span style={{ color: '#22C55E' }}>Pro</span>
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 1 }}>Smart Inventory</div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1 }}>
          {cleanMenu.map((item, idx) =>
            item.type === 'divider' ? (
              <div key={`d-${idx}`} style={{ margin: '0.75rem 0 0.4rem', padding: '0 0.5rem' }}>
                {item.label && <span style={{ fontSize: '0.6rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', opacity: 0.7 }}>{item.label}</span>}
              </div>
            ) : (
              <SidebarItem key={item.id} icon={item.icon} label={item.label} active={activeTab === item.id} onClick={() => handleNavigate(item.id)}/>
            )
          )}
        </nav>

        {/* User + Logout */}
        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)', marginTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 0.5rem', marginBottom: 6 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.9rem', flexShrink: 0 }}>
              {currentUser.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '0.8rem', fontWeight: '700', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.name}</p>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: 0 }}>{currentUser.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '0.55rem 0.75rem', borderRadius: 10,
            background: 'rgba(239,68,68,0.08)', color: '#ef4444',
            border: '1px solid rgba(239,68,68,0.2)', fontFamily: 'inherit',
            cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600', transition: 'all 0.15s ease'
          }}>
            <LogOut size={16}/> Keluar
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflow: 'hidden' }}>
        <header style={{ height: 'var(--header-height)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', gap: 12, flexShrink: 0, background: 'var(--bg-sidebar)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-ghost btn-icon mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ display: 'none' }}>
              {sidebarOpen ? <X size={20}/> : <Menu size={20}/>}
            </button>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0, whiteSpace: 'nowrap' }}>{activeLabel}</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn btn-ghost btn-icon" onClick={toggleTheme} title="Ganti Tema">
              {theme === 'dark' ? <Sun size={19}/> : <Moon size={19}/>}
            </button>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          <div style={{ animation: 'fadeIn 0.25s ease-in-out', maxWidth: '100%' }}>
            {renderContent()}
          </div>
        </main>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .app-sidebar { position: fixed !important; left: ${sidebarOpen ? '0' : 'calc(-1 * var(--sidebar-width))'} !important; z-index: 50; transition: left 0.25s ease; height: 100vh !important; top: 0; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

export default App;

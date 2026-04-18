import React, { useState } from 'react';
import {
  Truck, Square, Users, Shield, Plus, Edit, Trash2, X, Save,
  Phone, Search, Eye, EyeOff, CheckCircle2, XCircle
} from 'lucide-react';
import useStore from '../store/useStore';

// ── Helpers ───────────────────────────────────────────────────────────────────
const ALL_PERMISSIONS = [
  { id: 'dashboard',    label: 'Dashboard' },
  { id: 'orders',       label: 'Manajemen Pesanan' },
  { id: 'products',     label: 'Manajemen Produk' },
  { id: 'production',   label: 'Produksi' },
  { id: 'traceability', label: 'Tracking Produksi' },
  { id: 'inventory',    label: 'Manajemen Gudang' },
  { id: 'purchasing',   label: 'Input Bahan Baku' },
  { id: 'outgoing',     label: 'Pengeluaran Barang' },
  { id: 'reports',      label: 'Laporan' },
  { id: 'master',       label: 'Master Data' },
];

const ROLE_COLORS = ['#ef4444','#3b82f6','#10b981','#f59e0b','#8b5cf6','#06b6d4'];

const StatusBadge = ({ status }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '2px 8px', borderRadius: 20, fontSize: '0.72rem', fontWeight: '700',
    background: status === 'Aktif' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
    color: status === 'Aktif' ? '#10b981' : '#ef4444',
    border: `1px solid ${status === 'Aktif' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
  }}>
    {status === 'Aktif' ? <CheckCircle2 size={11}/> : <XCircle size={11}/>}
    {status}
  </span>
);

// ── Users Tab ─────────────────────────────────────────────────────────────────
const UsersTab = () => {
  const { users, roles, addUser, updateUser, deleteUser } = useStore();
  const [search, setSearch]       = useState('');
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState(null);
  const [showPw, setShowPw]       = useState(false);
  const [form, setForm]           = useState({ name: '', email: '', password: '', roleId: '', status: 'Aktif' });

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', email: '', password: '', roleId: roles[0]?.id || '', status: 'Aktif' });
    setShowPw(false);
    setModal(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({ name: user.name, email: user.email, password: user.password, roleId: user.roleId, status: user.status });
    setShowPw(false);
    setModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const role = roles.find(r => r.id === form.roleId);
    const payload = { ...form, role: role?.name || '' };
    if (editing) updateUser(editing.id, payload);
    else addUser(payload);
    setModal(false);
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Hapus user "${name}"?`)) deleteUser(id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ fontWeight: '800', fontSize: '1.05rem', margin: 0 }}>Daftar Pengguna</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>{filtered.length} pengguna ditemukan</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}/>
            <input
              type="text" placeholder="Cari pengguna..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '2.2rem', paddingRight: '1rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 8, color: 'inherit', fontSize: '0.875rem', width: 200 }}
            />
          </div>
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={17}/> Tambah User
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 560 }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '0.75rem 1.25rem', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nama</th>
              <th style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email</th>
              <th style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Role</th>
              <th style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Belum ada pengguna</td></tr>
            ) : (
              filtered.map(user => {
                const role = roles.find(r => r.id === user.roleId);
                return (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.9rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: `${role?.color || '#3b82f6'}20`, color: role?.color || '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.85rem', flexShrink: 0 }}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.875rem' }}>{user.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Sejak {user.createdAt}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.9rem 1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>{user.email}</td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: '700', background: `${role?.color || '#3b82f6'}18`, color: role?.color || '#3b82f6', border: `1px solid ${role?.color || '#3b82f6'}30` }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.9rem 1rem' }}><StatusBadge status={user.status}/></td>
                    <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                        <button className="btn btn-ghost btn-icon" onClick={() => openEdit(user)} title="Edit"><Edit size={15}/></button>
                        <button className="btn btn-ghost btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(user.id, user.name)} title="Hapus"><Trash2 size={15}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: 480, animation: 'slideUp 0.25s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h4 style={{ fontWeight: '800', fontSize: '1.1rem', margin: 0 }}>{editing ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h4>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}><X size={22}/></button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Nama Lengkap</label>
                <input type="text" className="form-input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nama pengguna"/>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Email</label>
                <input type="email" className="form-input" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="email@perusahaan.id"/>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="form-input"
                    required={!editing}
                    placeholder={editing ? 'Kosongkan jika tidak diubah' : 'Password baru'}
                    value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                    style={{ paddingRight: '3rem' }}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Role</label>
                  <select className="form-input" value={form.roleId} onChange={e => setForm({...form, roleId: e.target.value})} required>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Status</label>
                  <select className="form-input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    <option>Aktif</option>
                    <option>Nonaktif</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', padding: '0.8rem', marginTop: 6 }}>
                <Save size={17}/> {editing ? 'Simpan Perubahan' : 'Tambah Pengguna'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Roles Tab ─────────────────────────────────────────────────────────────────
const RolesTab = () => {
  const { roles, users, addRole, updateRole, deleteRole } = useStore();
  const [modal, setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]     = useState({ name: '', description: '', permissions: [], color: ROLE_COLORS[0] });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '', permissions: [], color: ROLE_COLORS[0] });
    setModal(true);
  };

  const openEdit = (role) => {
    setEditing(role);
    setForm({ name: role.name, description: role.description, permissions: [...role.permissions], color: role.color || ROLE_COLORS[0] });
    setModal(true);
  };

  const togglePermission = (pid) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(pid) ? f.permissions.filter(p => p !== pid) : [...f.permissions, pid]
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editing) updateRole(editing.id, form);
    else addRole(form);
    setModal(false);
  };

  const handleDelete = (id, name) => {
    const usedBy = users.filter(u => u.roleId === id).length;
    if (usedBy > 0) { alert(`Role "${name}" masih digunakan oleh ${usedBy} pengguna.`); return; }
    if (window.confirm(`Hapus role "${name}"?`)) deleteRole(id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ fontWeight: '800', fontSize: '1.05rem', margin: 0 }}>Manajemen Role & Hak Akses</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>{roles.length} role tersedia</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={17}/> Tambah Role</button>
      </div>

      {/* Role Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {roles.map(role => {
          const memberCount = users.filter(u => u.roleId === role.id).length;
          return (
            <div key={role.id} style={{ background: 'var(--bg-card)', border: `1px solid var(--border)`, borderTop: `3px solid ${role.color || '#3b82f6'}`, borderRadius: 14, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Role Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: role.color || '#3b82f6' }}/>
                    <span style={{ fontWeight: '800', fontSize: '1rem' }}>{role.name}</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{role.description}</p>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-ghost btn-icon" onClick={() => openEdit(role)}><Edit size={14}/></button>
                  <button className="btn btn-ghost btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(role.id, role.name)}><Trash2 size={14}/></button>
                </div>
              </div>

              {/* Members */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.6rem 0.75rem', background: 'var(--bg-main)', borderRadius: 8 }}>
                <Users size={14} color="var(--text-muted)"/>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{memberCount} pengguna dengan role ini</span>
              </div>

              {/* Permissions */}
              <div>
                <p style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 8 }}>Hak Akses Modul</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ALL_PERMISSIONS.map(p => {
                    const has = role.permissions?.includes(p.id);
                    return (
                      <span key={p.id} style={{ padding: '3px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: '600', background: has ? `${role.color || '#3b82f6'}18` : 'var(--bg-main)', color: has ? (role.color || '#3b82f6') : 'var(--text-muted)', border: `1px solid ${has ? `${role.color || '#3b82f6'}30` : 'var(--border)'}`, opacity: has ? 1 : 0.5 }}>
                        {p.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', overflowY: 'auto' }}>
          <div className="card" style={{ width: '100%', maxWidth: 520, margin: 'auto', animation: 'slideUp 0.25s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h4 style={{ fontWeight: '800', fontSize: '1.1rem', margin: 0 }}>{editing ? 'Edit Role' : 'Tambah Role Baru'}</h4>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}><X size={22}/></button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Nama Role</label>
                  <input type="text" className="form-input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Contoh: Supervisor"/>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: 6 }}>Warna</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {ROLE_COLORS.map(c => (
                      <button key={c} type="button" onClick={() => setForm({...form, color: c})}
                        style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: form.color === c ? '3px solid white' : '2px solid transparent', cursor: 'pointer', padding: 0 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Deskripsi</label>
                <input type="text" className="form-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Keterangan singkat role ini"/>
              </div>

              {/* Permissions Checkboxes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Hak Akses Modul</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {ALL_PERMISSIONS.map(p => {
                    const checked = form.permissions.includes(p.id);
                    return (
                      <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '0.5rem 0.75rem', borderRadius: 8, background: checked ? `${form.color}15` : 'var(--bg-main)', border: `1px solid ${checked ? `${form.color}40` : 'var(--border)'}`, transition: 'all 0.15s ease' }}>
                        <input type="checkbox" checked={checked} onChange={() => togglePermission(p.id)} style={{ accentColor: form.color }}/>
                        <span style={{ fontSize: '0.82rem', fontWeight: checked ? '700' : '400', color: checked ? form.color : 'var(--text-muted)' }}>{p.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', padding: '0.8rem', marginTop: 4 }}>
                <Save size={17}/> {editing ? 'Simpan Perubahan' : 'Buat Role'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Suppliers & Units (existing) ──────────────────────────────────────────────
const SuppliersUnitsTab = ({ activeTab }) => {
  const { masterData, addMasterItem, updateMasterItem, deleteMasterItem } = useStore();
  const [search, setSearch] = useState('');
  const [modal, setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]     = useState({ name: '', phone: '', address: '', description: '' });

  const data = (masterData[activeTab] || []).filter(item =>
    (item.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditing(null); setForm({ name: '', phone: '', address: '', description: '' }); setModal(true); };
  const openEdit = (item) => { setEditing(item); setForm({ ...item }); setModal(true); };

  const handleSave = (e) => {
    e.preventDefault();
    if (editing) updateMasterItem(activeTab, editing.id, form);
    else addMasterItem(activeTab, { ...form, id: `${activeTab.slice(0,1).toUpperCase()}-${Date.now().toString().slice(-4)}` });
    setModal(false);
  };

  const handleDelete = (id) => { if (window.confirm('Hapus data ini?')) deleteMasterItem(activeTab, id); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ fontWeight: '800', fontSize: '1.05rem', margin: 0 }}>Daftar {activeTab === 'suppliers' ? 'Supplier' : 'Satuan'}</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>{data.length} data ditemukan</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}/>
            <input type="text" placeholder="Cari..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '2.2rem', paddingRight: '1rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 8, color: 'inherit', fontSize: '0.875rem', width: 200 }}/>
          </div>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={17}/> Tambah Data</button>
        </div>
      </div>

      <div style={{ overflowX: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 400 }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '0.75rem 1.25rem', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>ID</th>
              <th style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nama</th>
              {activeTab === 'suppliers' && <th style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Kontak</th>}
              {activeTab === 'suppliers' && <th style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Alamat</th>}
              <th style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Belum ada data</td></tr>
            ) : data.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.9rem 1.25rem', fontWeight: '700', color: 'var(--primary)', fontSize: '0.825rem' }}>#{item.id}</td>
                <td style={{ padding: '0.9rem 1rem', fontWeight: '600', fontSize: '0.875rem' }}>{item.name}</td>
                {activeTab === 'suppliers' && <td style={{ padding: '0.9rem 1rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}><span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12}/>{item.phone || '-'}</span></td>}
                {activeTab === 'suppliers' && <td style={{ padding: '0.9rem 1rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>{item.address || '-'}</td>}
                <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                    <button className="btn btn-ghost btn-icon" onClick={() => openEdit(item)}><Edit size={15}/></button>
                    <button className="btn btn-ghost btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(item.id)}><Trash2 size={15}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: 450, animation: 'slideUp 0.25s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h4 style={{ fontWeight: '800', fontSize: '1.1rem', margin: 0 }}>{editing ? 'Edit Data' : 'Tambah Data'}</h4>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}><X size={22}/></button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Nama {activeTab === 'suppliers' ? 'Supplier' : 'Satuan'}</label>
                <input type="text" className="form-input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}/>
              </div>
              {activeTab === 'suppliers' && (
                <>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>No. Telp</label>
                    <input type="text" className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}/>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Alamat</label>
                    <textarea className="form-input" style={{ height: 80, paddingTop: '0.75rem' }} value={form.address} onChange={e => setForm({...form, address: e.target.value})}/>
                  </div>
                </>
              )}
              <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', padding: '0.8rem', marginTop: 4 }}>
                <Save size={17}/> {editing ? 'Simpan' : 'Tambah'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main MasterData Page ──────────────────────────────────────────────────────
const MasterData = () => {
  const [activeTab, setActiveTab] = useState('suppliers');

  const tabs = [
    { id: 'suppliers',  label: 'Supplier',    icon: Truck },
    { id: 'units',      label: 'Satuan',      icon: Square },
    { id: 'users',      label: 'Pengguna',    icon: Users },
    { id: 'roles',      label: 'Role & Akses',icon: Shield },
  ];

  const renderTab = () => {
    if (activeTab === 'users')  return <UsersTab />;
    if (activeTab === 'roles')  return <RolesTab />;
    return <SuppliersUnitsTab activeTab={activeTab} />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Tab buttons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '0.55rem 1.25rem', borderRadius: 10, border: activeTab !== tab.id ? '1px solid var(--border)' : 'none' }}
          >
            <tab.icon size={16}/>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {renderTab()}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default MasterData;

import React, { useState } from 'react';
import { Package, Search, Filter, Edit3, Trash2, X, Plus, PlusCircle, Save } from 'lucide-react';
import useStore from '../store/useStore';

const Inventory = () => {
  const { inventory, updateInventoryItem, deleteInventoryItem, addInventoryItem, masterData } = useStore();
  const [activeTab, setActiveTab] = useState('BB'); // 'BB' for Bahan Baku, 'PJ' for Produk Jadi
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    price: 0,
    minStock: 5,
    costPrice: 0
  });

  const filteredItems = inventory.filter(item => {
    const matchesTab = item.id.startsWith(activeTab);
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                         item.id.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        category: item.category,
        unit: item.unit,
        price: item.price || 0,
        minStock: item.minStock || 5,
        costPrice: item.costPrice || 0
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        unit: masterData.units[0]?.name || '',
        price: 0,
        minStock: 5,
        costPrice: 0
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingItem) {
      updateInventoryItem(editingItem.id, formData);
    } else {
      // Use activeTab to decide prefix for manual additions
      const idPrefix = activeTab;
      addInventoryItem({
        ...formData,
        id: `${idPrefix}-${Date.now().toString().slice(-4)}`
      });
    }
    setIsModalOpen(false);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Tersedia': return <span className="badge badge-success">Tersedia</span>;
      case 'Menipis': return <span className="badge badge-warning">Menipis</span>;
      case 'Habis': return <span className="badge badge-danger">Habis</span>;
      default: return null;
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
  };

  return (
    <div className="flex flex-col gap-6">

      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button 
            className={`btn ${activeTab === 'BB' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('BB')}
            style={{ padding: '0.6rem 1.5rem', borderRadius: 10 }}
          >
            Stok Bahan Baku
          </button>
          <button 
            className={`btn ${activeTab === 'PJ' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('PJ')}
            style={{ padding: '0.6rem 1.5rem', borderRadius: 10 }}
          >
            Stok Produk
          </button>
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
           Data ditambahkan otomatis melalui menu Input Bahan & Produksi
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700' }}>Ringkasan Stok & Material</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Menampilkan data <strong>{activeTab === 'BB' ? 'Bahan Baku' : 'Produk Jadi'}</strong></p>
          </div>
          <div className="flex gap-2">
             <div style={{ position: 'relative' }}>
               <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
               <input 
                type="text" 
                placeholder="Cari barang..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ padding: '0.5rem 1rem 0.5rem 2.2rem', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 8, color: 'white', fontSize: '0.875rem', width: 250 }}
              />
             </div>
          </div>
        </div>

        <div className="table-container" style={{ marginTop: 0 }}>
          <table style={{ minWidth: 800 }}>
            <thead>
              <tr>
                <th>Nama Barang</th>
                <th>Stok Fisik</th>
                <th>Dipesan</th>
                <th>Satuan</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Belum ada data barang di kategori ini</td></tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div style={{ background: 'var(--bg-main)', padding: 8, borderRadius: 8 }}>
                          <Package size={18} color="var(--primary)" />
                        </div>
                        <div className="flex flex-col">
                           <span style={{ fontWeight: '600' }}>{item.name}</span>
                           <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: '700' }}>#{item.id}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: '700', fontSize: '1rem' }}>{item.stock}</td>
                    <td style={{ fontWeight: '600', color: 'var(--warning)' }}>{item.reserved || 0}</td>
                    <td><span className="badge" style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border)' }}>{item.unit}</span></td>
                    <td>{getStatusBadge(item.status)}</td>
                    <td>
                      <div className="flex justify-center gap-2">
                        <button className="btn btn-ghost btn-icon" onClick={() => handleOpenModal(item)}>
                          <Edit3 size={16} />
                        </button>
                        <button className="btn btn-ghost btn-icon" style={{ color: 'var(--danger)' }} onClick={() => {
                          if(confirm('Hapus data barang ini?')) deleteInventoryItem(item.id);
                        }}>
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
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
           <div className="card" style={{ width: '100%', maxWidth: 500, animation: 'slideUp 0.3s ease' }}>
              <div className="flex justify-between items-center mb-6">
                 <div>
                    <h4 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{editingItem ? 'Edit Data Barang' : 'Tambah Barang Baru'}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{editingItem ? `Mengedit ${editingItem.name}` : 'Menambah item baru ke inventaris'}</p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--text-muted)' }} className="btn btn-ghost btn-icon"><X size={24} /></button>
              </div>

              <form onSubmit={handleSave}>
                 <div className="form-group">
                    <label>Nama Barang</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required
                      placeholder="Contoh: Minyak Lavender Rose"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                 </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                       <label>Satuan</label>
                       <select 
                         className="form-input"
                         required
                         value={formData.unit}
                         onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                       >
                          <option value="">Pilih Satuan...</option>
                          {masterData.units.map(unit => (
                            <option key={unit.id} value={unit.name}>{unit.name}</option>
                          ))}
                       </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                       <label>Min. Stok (Peringatan)</label>
                       <input 
                         type="number" 
                         className="form-input" 
                         required
                         min="0"
                         value={formData.minStock}
                         onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                       />
                    </div>
                    <div className="form-group">
                       <label>Harga Beli (HPP)</label>
                       <input 
                         type="number" 
                         className="form-input" 
                         required
                         min="0"
                         value={formData.costPrice}
                         onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                       />
                    </div>
                 </div>

                  {(editingItem?.id?.startsWith('PJ') || !editingItem) && (
                    <div className="form-group">
                       <label>Harga Jual (Pemasaran)</label>
                       <input 
                         type="number" 
                         className="form-input" 
                         required
                         min="0"
                         value={formData.price}
                         onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                       />
                    </div>
                  )}

                 <div className="flex gap-3 mt-8">
                    <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '1rem' }}>
                       <Save size={18} />
                       <span>{editingItem ? 'Simpan Perubahan' : 'Tambah Barang'}</span>
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Inventory;

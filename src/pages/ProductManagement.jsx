import React, { useState } from 'react';
import { Package, Plus, Search, Edit3, Trash2, X, Bookmark, TrendingUp, Info, Save } from 'lucide-react';
import useStore from '../store/useStore';

const ProductManagement = () => {
  const { inventory, updateInventoryItem, deleteInventoryItem, addInventoryItem, masterData } = useStore();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    unit: ''
  });

  // Filter only Product categories, showing newest first
  const productsOnly = [...inventory].reverse().filter(item => item.id.startsWith('PJ'));
  
  const filteredItems = productsOnly.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        price: item.price || '',
        unit: item.unit
      });
    } else {
      setEditingItem(null);
      setFormData({ name: '', price: '', unit: masterData.units[0]?.name || '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const finalData = { 
      ...formData, 
      price: Number(formData.price) || 0 
    };
    
    if (editingItem) {
      updateInventoryItem(editingItem.id, finalData);
    } else {
      const idPrefix = 'PJ';
      const newItem = {
        ...finalData,
        id: `${idPrefix}-${Date.now().toString().slice(-4)}`,
        stock: 0,
        reserved: 0,
        status: 'Habis',
        costPrice: 0
      };
      addInventoryItem(newItem);
    }
    setIsModalOpen(false);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const handlePriceChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); 
    setFormData({ ...formData, price: value });
  };

  const formatDisplayPrice = (val) => {
    if (!val && val !== 0) return '';
    return new Intl.NumberFormat('id-ID').format(val);
  };

  // List of products that need pricing (price is 0)
  const pendingPricing = productsOnly.filter(p => !p.price || p.price === 0);

  return (
    <div className="flex flex-col gap-6">

      {pendingPricing.length > 0 && (
         <div className="alert alert-info flex items-center gap-3" style={{ background: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.2)', padding: '1rem', borderRadius: 12 }}>
            <Info size={20} color="#3b82f6" />
            <div style={{ flex: 1 }}>
               <span style={{ fontWeight: '700', fontSize: '0.875rem', color: '#3b82f6' }}>Pemberitahuan:</span>
               <span style={{ fontSize: '0.875rem', color: 'var(--text-main)', marginLeft: '0.5rem' }}>
                  Ada <strong>{pendingPricing.length} produk baru</strong> dari produksi yang belum memiliki harga jual.
               </span>
            </div>
         </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '700' }}>Daftar Katalog Produk</h3>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
            <input 
              type="text" 
              placeholder="Cari nama produk..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.5rem', width: 300, background: 'var(--bg-main)' }}
            />
          </div>
        </div>

        <div className="table-container" style={{ marginTop: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Nama Produk</th>
                <th style={{ textAlign: 'right' }}>Biaya Produksi (HPP)</th>
                <th style={{ textAlign: 'right' }}>Harga Jual</th>
                <th>Satuan</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Tidak ada produk ditemukan</td></tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div style={{ background: 'var(--primary-light)', padding: 8, borderRadius: 8 }}>
                          <Bookmark size={18} color="var(--primary)" />
                        </div>
                        <div className="flex flex-col">
                           <span style={{ fontWeight: '600' }}>{item.name}</span>
                           <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ID: {item.id}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--text-muted)' }}>
                      {formatCurrency(item.costPrice)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '800', color: item.price > 0 ? 'var(--primary)' : 'var(--danger)' }}>
                      {item.price > 0 ? formatCurrency(item.price) : 'Harga belum diatur'}
                    </td>
                    <td>{item.unit}</td>
                    <td>
                      <div className="flex justify-center gap-2">
                         <button className="btn btn-primary btn-sm" style={{ padding: '0.4rem 0.8rem' }} onClick={() => handleOpenModal(item)}>
                           <Edit3 size={14} />
                           <span>Atur Harga</span>
                         </button>
                         <button className="btn btn-ghost btn-icon" style={{ color: 'var(--danger)' }} onClick={() => {
                           if(confirm('Hapus produk ini dari katalog?')) deleteInventoryItem(item.id);
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
                    <h4 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Atur Harga Jual</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Produk: {editingItem?.name}</p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--text-muted)' }} className="btn btn-ghost btn-icon"><X size={24} /></button>
              </div>

              <form onSubmit={handleSave}>
                 <div className="form-group">
                    <label>Nama Produk / Barang</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required
                      placeholder="Contoh: Minyak Lavender"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={!!editingItem} // Avoid name changes once produced
                    />
                 </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="form-group">
                       <label>Satuan</label>
                       <select 
                         className="form-input"
                         required
                         value={formData.unit}
                         onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                         disabled={!!editingItem}
                       >
                          {masterData.units.map(unit => (
                            <option key={unit.id} value={unit.name}>{unit.name}</option>
                          ))}
                       </select>
                    </div>
                 </div>

                 <div className="form-group">
                    <div className="flex justify-between items-center mb-2">
                       <label className="mb-0">Harga Jual (Rp)</label>
                       {editingItem && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                             Modal (HPP): <strong>{formatCurrency(editingItem.costPrice)}</strong>
                          </span>
                       )}
                    </div>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Rp</span>
                      <input 
                        type="text" 
                        className="form-input" 
                        required
                        style={{ paddingLeft: '2.5rem', fontWeight: '700', fontSize: '1.1rem', color: 'var(--primary)' }}
                        placeholder="0"
                        value={formatDisplayPrice(formData.price)}
                        onChange={handlePriceChange}
                      />
                    </div>
                    {editingItem && formData.price > editingItem.costPrice && (
                       <div className="flex items-center gap-1 mt-2" style={{ color: '#10b981', fontSize: '0.75rem' }}>
                          <TrendingUp size={12} />
                          <span>Estimasi Margin: {formatCurrency(formData.price - editingItem.costPrice)}</span>
                       </div>
                    )}
                    {editingItem && formData.price > 0 && formData.price < editingItem.costPrice && (
                       <div className="flex items-center gap-1 mt-2" style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>
                          <TrendingUp size={12} style={{ transform: 'rotate(180deg)' }} />
                          <span>Estimasi Rugi: {formatCurrency(editingItem.costPrice - formData.price)}</span>
                       </div>
                    )}
                 </div>

                 <div className="flex gap-3 mt-8">
                    <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '1rem' }}>
                       <Save size={18} className="mr-2" />
                       <span>Simpan Perubahan</span>
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

export default ProductManagement;

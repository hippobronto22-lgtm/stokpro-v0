import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  ShoppingCart, 
  Calendar, 
  Truck, 
  FileText,
  X,
  Save,
  TrendingUp,
  Package
} from 'lucide-react';
import useStore from '../store/useStore';

const Purchasing = () => {
  const { masterData, purchases, addPurchase, inventory } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredPurchases = useMemo(() => {
    return (purchases || []).filter(p => {
      const matchesSearch = p.id.toLowerCase().includes(search.toLowerCase()) || 
                           p.supplier.toLowerCase().includes(search.toLowerCase());
      const pDate = new Date(p.date);
      const matchesStart = !startDate || pDate >= new Date(startDate);
      const matchesEnd = !endDate || pDate <= new Date(endDate);
      return matchesSearch && matchesStart && matchesEnd;
    });
  }, [purchases, search, startDate, endDate]);

  const [formData, setFormData] = useState({
    supplier: '',
    date: new Date().toISOString().split('T')[0],
    items: [{ name: '', quantity: 0, unit: 'ml', price: 0 }]
  });

  const materialsList = useMemo(() => {
    return inventory.filter(i => i.id.startsWith('BB'));
  }, [inventory]);

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { name: '', quantity: 0, unit: 'ml', price: 0 }]
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      id: `PUR-${Date.now().toString().slice(-4)}`,
      total: calculateTotal(),
      status: 'Diterima'
    };
    addPurchase(payload);
    setIsModalOpen(false);
    setFormData({
      supplier: '',
      date: new Date().toISOString().split('T')[0],
      items: [{ name: '', quantity: 0, unit: 'ml', price: 0 }]
    });
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <button className="btn btn-primary shadow-lg shadow-primary/20" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>Tambah Bahan Baku</span>
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700' }}>Riwayat Pembelian Bahan</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Menampilkan daftar transaksi pengadaan</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2">
                <Calendar size={16} color="var(--text-muted)" />
                <input 
                  type="date" 
                  className="form-input" 
                  style={{ width: 'auto', padding: '0.4rem 0.6rem', fontSize: '0.8rem' }} 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>s/d</span>
                <input 
                  type="date" 
                  className="form-input" 
                  style={{ width: 'auto', padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
             </div>
             <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
                <input 
                  type="text" 
                  placeholder="Cari transaksi..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ padding: '0.5rem 1rem 0.5rem 2.22rem', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 8, color: 'white', fontSize: '0.875rem', width: 220 }}
                />
             </div>
          </div>
        </div>

        <div className="table-container" style={{ marginTop: 0 }}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tanggal</th>
                <th>Supplier</th>
                <th>Daftar Bahan / Barang</th>
                <th style={{ textAlign: 'right' }}>Total Transaksi</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Tidak ada transaksi ditemukan</td></tr>
              ) : (
                filteredPurchases.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: '700', color: 'var(--primary)' }}>#{p.id}</td>
                    <td>{p.date}</td>
                    <td style={{ fontWeight: '600' }}>{p.supplier}</td>
                    <td style={{ fontSize: '0.875rem' }}>
                      {p.items?.map(i => i.name).join(', ') || '-'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '700' }}>{formatCurrency(p.total)}</td>
                    <td><span className="badge badge-success">{p.status}</span></td>
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
           <div className="card" style={{ width: '100%', maxWidth: 900, maxHeight: '94vh', overflowY: 'auto', animation: 'slideUp 0.3s ease', padding: 0, border: '1px solid var(--border)' }}>
              
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div className="flex items-center gap-3">
                    <div style={{ background: 'var(--primary-light)', padding: 10, borderRadius: 12 }}>
                       <Truck size={24} color="var(--primary)" />
                    </div>
                    <div>
                       <h4 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Tambah Bahan Baku</h4>
                       <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Input stok material baru ke gudang</p>
                    </div>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--text-muted)' }} className="btn btn-ghost btn-icon"><X size={24} /></button>
              </div>

              <form onSubmit={handleSave} style={{ padding: '1.5rem' }}>
                 <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="form-group mb-0">
                       <label style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Pilih Supplier</label>
                       <select 
                          className="form-input" 
                          required
                          value={formData.supplier || ''}
                          onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                        >
                          <option value="">Pilih Supplier...</option>
                          {(masterData.suppliers || []).map(s => (
                            <option key={s.id} value={s.name}>{s.name}</option>
                          ))}
                        </select>
                    </div>
                    <div className="form-group mb-0">
                       <label style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Tanggal Masuk</label>
                       <div style={{ position: 'relative' }}>
                          <Calendar size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          <input 
                            type="date" 
                            className="form-input" 
                            required 
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            style={{ paddingLeft: '2.5rem' }} 
                          />
                       </div>
                    </div>
                 </div>

                 {/* Items Table-like Header */}
                 <div style={{ background: 'var(--bg-main)', padding: '0.75rem 1rem', borderRadius: '8px 8px 0 0', border: '1px solid var(--border)', borderBottom: 'none', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr 40px', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Nama Bahan / Barang</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Jumlah</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Satuan</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Harga Satuan</span>
                    <span></span>
                 </div>

                 {/* Items List */}
                 <div style={{ border: '1px solid var(--border)', borderRadius: '0 0 8px 8px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                    {formData.items.map((item, index) => (
                      <div key={index} style={{ padding: '0.75rem 1rem', background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', borderBottom: index === formData.items.length - 1 ? 'none' : '1px solid var(--border)', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr 40px', gap: '1rem', alignItems: 'center' }}>
                         <input 
                           type="text"
                           className="form-input"
                           placeholder="Ketik nama bahan..."
                           required
                           list="material-suggestions"
                           value={item.name || ''}
                           onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                           style={{ padding: '0.5rem 0.75rem' }}
                         />
                         <input 
                           type="number" 
                           className="form-input" 
                           required
                           min="1"
                           value={item.quantity || 0}
                           onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                           style={{ padding: '0.5rem 0.75rem' }}
                         />
                         <select 
                           className="form-input"
                           required
                           value={item.unit || ''}
                           onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                           style={{ padding: '0.5rem 0.75rem' }}
                         >
                            <option value="">Pilih...</option>
                            {(masterData.units || []).map(u => (
                              <option key={u.id} value={u.name}>{u.name}</option>
                            ))}
                         </select>
                         <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rp</span>
                            <input 
                              type="number" 
                              className="form-input" 
                              required
                              min="0"
                              value={item.price || 0}
                              onChange={(e) => handleItemChange(index, 'price', Number(e.target.value))}
                              style={{ padding: '0.5rem 0.75rem 0.5rem 1.75rem' }}
                            />
                         </div>
                         <button type="button" className="btn btn-ghost btn-icon" style={{ color: 'var(--danger)', padding: 0 }} onClick={() => handleRemoveItem(index)}>
                            <Trash2 size={18} />
                         </button>
                      </div>
                    ))}
                 </div>

                 <button type="button" className="btn btn-ghost" onClick={handleAddItem} style={{ color: 'var(--primary)', marginBottom: '2rem' }}>
                    <Plus size={18} />
                    <span>Tambah Baris Bahan</span>
                 </button>

                 {/* Footer / Summary & Actions */}
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                    <div style={{ textAlign: 'left' }}>
                       <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginRight: '1rem' }}>Total Estimasi Biaya:</span>
                       <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary)' }}>{formatCurrency(calculateTotal())}</span>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem 3rem' }}>
                       <Save size={20} />
                       <span>Simpan & Masukkan Gudang</span>
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Datalist */}
      <datalist id="material-suggestions">
         {materialsList.map(m => (
           m && <option key={m.id} value={m.name} />
         ))}
      </datalist>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Purchasing;

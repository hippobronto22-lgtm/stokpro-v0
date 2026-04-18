import React, { useState } from 'react';
import { Truck, Plus, Search, Calendar, MapPin, X, Save, Package, AlertCircle, Info, List, Clock, Send, ChevronRight } from 'lucide-react';
import useStore from '../store/useStore';

const Outgoing = () => {
  const { outgoing, inventory, orders, addOutgoing } = useStore();
  const [activeView, setActiveView] = useState('history'); // 'history' or 'backlog'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    product: '',
    quantity: 0,
    destination: '',
    orderId: ''
  });

  // Calculate Backlog (Items ordered but not fully shipped)
  const backlogItems = (orders || [])
    .filter(o => o.status === 'Diproses' || o.status === 'Pending')
    .flatMap(o => (o.items || []).map(item => ({
      ...item,
      orderId: o.id || '',
      customer: o.customer || 'Pelanggan',
      orderDate: o.date || '',
      remaining: Math.max(0, (item.quantity || 0) - (item.shippedQuantity || 0))
    })))
    .filter(item => item.remaining > 0);

  // Group Backlog by Order ID
  const groupedBacklog = backlogItems.reduce((acc, item) => {
    if (!acc[item.orderId]) {
      acc[item.orderId] = {
        orderId: item.orderId,
        customer: item.customer,
        items: []
      };
    }
    acc[item.orderId].items.push(item);
    return acc;
  }, {});

  const filteredOutgoing = (outgoing || []).filter(out => 
    (out.product || '').toLowerCase().includes(search.toLowerCase()) || 
    (out.destination || '').toLowerCase().includes(search.toLowerCase()) ||
    (out.orderId || '').toLowerCase().includes(search.toLowerCase())
  );

  // Filter the grouped backlog
  const filteredGroupedBacklog = Object.values(groupedBacklog).filter(group => 
    group.orderId.toLowerCase().includes(search.toLowerCase()) ||
    group.customer.toLowerCase().includes(search.toLowerCase()) ||
    group.items.some(it => it.name.toLowerCase().includes(search.toLowerCase()))
  );

  // Logic for selected order and item in Modal
  const activeOrders = (orders || []).filter(o => o.status === 'Diproses' || o.status === 'Pending');
  const selectedOrder = (orders || []).find(o => o.id === formData.orderId);
  const orderItems = selectedOrder?.items || [];
  const selectedItemData = orderItems.find(item => item.name === formData.product);
  
  const orderedQty = selectedItemData?.quantity || 0;
  const alreadyShippedQty = selectedItemData?.shippedQuantity || 0;
  const remainingQty = Math.max(0, orderedQty - alreadyShippedQty);

  const handleOrderChange = (id) => {
    const order = (orders || []).find(o => o.id === id);
    if (order) {
      setFormData({
        ...formData,
        orderId: id,
        destination: `Pesanan: ${order.customer}`,
        product: '', 
        quantity: 0
      });
    } else {
      setFormData({ ...formData, orderId: '', destination: '', product: '', quantity: 0 });
    }
  };

  const handleOpenProses = (item) => {
    setFormData({
      orderId: item.orderId,
      product: item.name,
      destination: `Pesanan: ${item.customer}`,
      quantity: 0
    });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.orderId || !formData.product || formData.quantity <= 0) {
      alert('Lengkapi data pengeluaran');
      return;
    }
    if (formData.quantity > remainingQty) {
      alert(`Gagal! Jumlah pengeluaran (${formData.quantity}) melebihi sisa pesanan (${remainingQty}).`);
      return;
    }

    const payload = {
      id: `OUT-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      ...formData,
      isFulfillingOrder: true 
    };

    addOutgoing(payload);
    alert('Pengeluaran berhasil dicatat!');
    setIsModalOpen(false);
    setFormData({ product: '', quantity: 0, destination: '', orderId: '' });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Reverted Tabs to Original Floating Design */}
      <div className="flex gap-3">
        <button 
          className={`btn ${activeView === 'history' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveView('history')}
          style={{ padding: '0.6rem 1.5rem', borderRadius: 12 }}
        >
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <span>Riwayat Pengeluaran</span>
          </div>
        </button>
        <button 
          className={`btn ${activeView === 'backlog' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveView('backlog')}
          style={{ padding: '0.6rem 1.5rem', borderRadius: 12 }}
        >
          <div className="flex items-center gap-2">
            <List size={16} />
            <span>Antrean Pengiriman</span>
            {backlogItems.length > 0 && <span className="badge badge-danger" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', border: activeView === 'backlog' ? '1px solid white' : 'none' }}>{backlogItems.length}</span>}
          </div>
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'between' }} className="justify-between">
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>
            {activeView === 'history' ? 'Laporan Pengeluaran' : 'Antrean Pengiriman'}
          </h3>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
            <input 
              type="text" 
              placeholder={activeView === 'history' ? "Cari ID atau produk..." : "Cari pemesan atau ID..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '0.5rem 1rem 0.5rem 2.2rem', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 6, color: 'white', fontSize: '0.875rem', width: 280 }}
            />
          </div>
        </div>

        <div className="table-container" style={{ marginTop: 0 }}>
          {activeView === 'history' ? (
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>ID Pesanan</th>
                  <th>Produk</th>
                  <th>Jumlah</th>
                  <th>Tujuan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOutgoing.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Belum ada data pengeluaran</td></tr>
                ) : (
                  filteredOutgoing.map(out => (
                    <tr key={out.id}>
                      <td>{out.date}</td>
                      <td style={{ fontWeight: '700', color: 'var(--primary)' }}>#{out.orderId}</td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div style={{ background: 'var(--bg-main)', padding: 8, borderRadius: 8 }}>
                            <Package size={18} color="var(--primary)" />
                          </div>
                          <span style={{ fontWeight: '500' }}>{out.product}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: '600' }}>{out.quantity}</td>
                      <td><span style={{ color: 'var(--text-muted)' }}>{out.destination}</span></td>
                      <td><span className="badge badge-success">Terkirim</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>Dipesan</th>
                  <th>Sisa Kirim</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredGroupedBacklog.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Semua pesanan sudah terkirim</td></tr>
                ) : (
                  filteredGroupedBacklog.map((group) => (
                    <React.Fragment key={group.orderId}>
                      <tr style={{ background: 'var(--bg-main)', borderTop: '2px solid var(--border)' }}>
                        <td colSpan="4" style={{ padding: '0.75rem 1.5rem' }}>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-4">
                              <span style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '0.9rem' }}>#{group.orderId}</span>
                              <div style={{ width: 1, height: 16, background: 'var(--border)' }}></div>
                              <span style={{ fontWeight: '600', color: 'white' }}>{group.customer}</span>
                            </div>
                            <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{group.items.length} Barang</span>
                          </div>
                        </td>
                      </tr>
                      {group.items.map((item, idx) => (
                        <tr key={`${group.orderId}-${item.id}-${idx}`}>
                          <td style={{ paddingLeft: '2.5rem' }}>
                            <div className="flex items-center gap-3">
                              <div style={{ background: 'var(--bg-sidebar)', padding: 8, borderRadius: 8, border: '1px solid var(--border)' }}>
                                <Package size={18} color="var(--primary)" />
                              </div>
                              <span style={{ fontWeight: '500' }}>{item.name}</span>
                            </div>
                          </td>
                          <td>{item.quantity}</td>
                          <td>
                            <div className="flex flex-col gap-2" style={{ width: 140 }}>
                              <div className="flex justify-between items-center">
                                <span style={{ fontWeight: '700', color: 'var(--warning)', fontSize: '0.875rem' }}>{item.remaining} {item.unit}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{Math.round(((item.shippedQuantity || 0) / item.quantity) * 100)}%</span>
                              </div>
                              <div style={{ width: '100%', height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                                 <div style={{ width: `${((item.shippedQuantity || 0) / item.quantity) * 100}%`, height: '100%', background: 'var(--primary)', borderRadius: 3 }}></div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }} onClick={() => handleOpenProses(item)}>
                              <Send size={14} />
                              <span>Proses</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
           <div className="card" style={{ width: '100%', maxWidth: 500, animation: 'slideUp 0.3s ease' }}>
              <div className="flex justify-between items-center mb-6">
                 <h4 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Catat Pengiriman</h4>
                 <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--text-muted)' }}><X size={24} /></button>
              </div>

              <form onSubmit={handleSave}>
                 <div className="form-group">
                    <label>ID Pesanan</label>
                    <select 
                      className="form-input"
                      required
                      value={formData.orderId}
                      onChange={(e) => handleOrderChange(e.target.value)}
                    >
                      <option value="">Pilih Pesanan...</option>
                      {activeOrders.map(o => (
                        <option key={o.id} value={o.id}>{o.id} - {o.customer}</option>
                      ))}
                    </select>
                 </div>

                 <div className="form-group">
                    <label>Produk</label>
                    <select 
                      className="form-input"
                      required
                      disabled={!formData.orderId}
                      value={formData.product}
                      onChange={(e) => setFormData({ ...formData, product: e.target.value, quantity: 0 })}
                    >
                      <option value="">{formData.orderId ? 'Pilih item...' : 'Pilih pesanan dahulu'}</option>
                      {orderItems.map(item => (
                        <option key={item.id} value={item.name} disabled={(item.shippedQuantity || 0) >= item.quantity}>
                          {item.name} {(item.shippedQuantity || 0) >= item.quantity ? '(Selesai)' : ''}
                        </option>
                      ))}
                    </select>
                 </div>

                 {formData.product && (
                   <div style={{ background: 'var(--bg-main)', padding: '1.25rem', borderRadius: 12, marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
                      <div className="grid grid-cols-3 gap-4 text-center">
                         <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Dipesan</p>
                            <p style={{ fontWeight: '700', fontSize: '1rem' }}>{orderedQty}</p>
                         </div>
                         <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Terkirim</p>
                            <p style={{ color: 'var(--warning)', fontWeight: '700', fontSize: '1rem' }}>{alreadyShippedQty}</p>
                         </div>
                         <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Sisa</p>
                            <p style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '1rem' }}>{remainingQty}</p>
                         </div>
                      </div>
                   </div>
                 )}

                 <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                       <label>Jumlah Kirim</label>
                       <input 
                         type="number" 
                         className="form-input" 
                         required
                         disabled={!formData.product || remainingQty <= 0}
                         min="1"
                         max={remainingQty}
                         value={formData.quantity}
                         onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                       />
                    </div>
                    <div className="form-group">
                       <label>Tujuan</label>
                       <input type="text" className="form-input" disabled value={formData.destination} />
                    </div>
                 </div>

                 <button type="submit" className="btn btn-primary w-full mt-6" style={{ padding: '1rem', justifyContent: 'center' }} disabled={remainingQty <= 0}>
                    <Save size={20} />
                    <span>Konfirmasi Pengiriman</span>
                 </button>
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

export default Outgoing;

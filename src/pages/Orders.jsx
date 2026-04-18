import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Eye, 
  Edit3, 
  Trash2, 
  Plus, 
  Filter, 
  Search, 
  ChevronLeft, 
  Minus, 
  ShoppingCart,
  CheckCircle2,
  Package,
  Calendar,
  X
} from 'lucide-react';
import useStore from '../store/useStore';

const Orders = () => {
  const { orders, inventory, addOrder, deleteOrder, updateOrder } = useStore();
  const [view, setView] = useState('list'); // 'list' or 'pos'
  const [search, setSearch] = useState('');
  
  // Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');

  // POS States
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [productSearch, setProductSearch] = useState('');

  // Edit State
  const [editingOrder, setEditingOrder] = useState(null);

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.customer.toLowerCase().includes(search.toLowerCase()) || 
                         o.id.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'Semua' || o.status === statusFilter;
    
    const orderDate = new Date(o.date);
    const matchesStart = !startDate || orderDate >= new Date(startDate);
    const matchesEnd = !endDate || orderDate <= new Date(endDate);
    
    return matchesSearch && matchesStatus && matchesStart && matchesEnd;
  });

  const products = inventory.filter(i => 
    i.id.startsWith('PJ') && 
    i.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Selesai': return <span className="badge badge-success">Selesai</span>;
      case 'Diproses': return <span className="badge badge-info">Diproses</span>;
      case 'Pending': return <span className="badge badge-warning">Pending</span>;
      case 'Dibatalkan': return <span className="badge badge-danger">Dibatalkan</span>;
      default: return null;
    }
  };

  // CRUD Actions
  const handleDeleteOrder = (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus pesanan ini?')) {
      deleteOrder(id);
    }
  };

  const handleEditClick = (order) => {
    setEditingOrder(order);
  };

  const handleUpdateOrder = (e) => {
    e.preventDefault();
    updateOrder(editingOrder.id, {
      customer: editingOrder.customer,
      date: editingOrder.date,
      status: editingOrder.status
    });
    setEditingOrder(null);
  };

  // POS Actions
  const addToCart = (product) => {
    const availableStock = product.stock - (product.reserved || 0);
    if (availableStock <= 0) {
      alert('Stok habis!');
      return;
    }
    
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= availableStock) {
          alert('Maksimal stok tercapai');
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1, unit: product.unit }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateCartQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const product = inventory.find(i => i.id === id);
        const availableStock = product.stock - (product.reserved || 0);
        const newQty = Math.max(1, item.quantity + delta);
        if (newQty > availableStock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = () => {
    if (!customerName) {
      alert('Masukkan nama pelanggan');
      return;
    }
    if (cart.length === 0) {
      alert('Keranjang kosong');
      return;
    }

    const newOrder = {
      id: `ORD-${Date.now().toString().slice(-4)}`,
      customer: customerName,
      date: new Date().toISOString().split('T')[0],
      status: 'Diproses',
      amount: totalAmount,
      items: cart
    };

    addOrder(newOrder);
    alert('Pesanan berhasil dibuat!');
    setCart([]);
    setCustomerName('');
    setView('list');
  };

  if (view === 'pos') {
    return (
      <div className="flex flex-col gap-6" style={{ height: 'calc(100vh - 140px)' }}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button className="btn btn-ghost" onClick={() => setView('list')}>
              <ChevronLeft size={20} />
              <span>Kembali</span>
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Mode Kasir (POS)</h3>
          </div>
          <div className="card" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <ShoppingCart size={18} color="var(--primary)" />
             <span style={{ fontWeight: '600' }}>{cart.length} Item</span>
          </div>
        </div>

        <div className="flex gap-6" style={{ flex: 1, overflow: 'hidden' }}>
          {/* Product Grid */}
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
             <div className="card" style={{ padding: '0.75rem 1rem' }}>
                <div style={{ position: 'relative' }}>
                  <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
                  <input 
                    type="text" 
                    placeholder="Cari produk produk jadi..." 
                    className="form-input"
                    style={{ paddingLeft: '2.5rem', background: 'transparent', border: 'none' }}
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>
             </div>

             <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {products.map(p => (
                  <div key={p.id} className="card product-card" onClick={() => addToCart(p)} style={{ cursor: 'pointer', transition: 'var(--transition)' }}>
                    <div style={{ background: 'var(--bg-main)', height: 120, borderRadius: 8, marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={40} color="var(--primary)" style={{ opacity: 0.5 }} />
                    </div>
                    <div style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: 4 }}>{p.name}</div>
                    <div style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '1rem' }}>{formatCurrency(p.price)}</div>
                    <div className="flex justify-between items-center mt-2">
                       <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Stok: {p.stock - (p.reserved || 0)}</span>
                       <Plus size={16} className="add-icon" />
                    </div>
                  </div>
                ))}
             </div>
          </div>

          {/* Cart Section */}
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h4 style={{ fontWeight: '700', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>Pesanan Pelanggan</h4>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Nama Pelanggan</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Masukkan nama..." 
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {cart.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', textAlign: 'center' }}>
                  <ShoppingCart size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                  <p>Keranjang masih kosong</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatCurrency(item.price)}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button className="btn btn-ghost btn-icon" style={{ padding: 4, height: 24, width: 24 }} onClick={() => updateCartQty(item.id, -1)}>
                          <Minus size={14} />
                        </button>
                        <span style={{ fontWeight: '600', minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                        <button className="btn btn-ghost btn-icon" style={{ padding: 4, height: 24, width: 24 }} onClick={() => updateCartQty(item.id, 1)}>
                          <Plus size={14} />
                        </button>
                        <button style={{ color: 'var(--danger)', marginLeft: 8 }} onClick={() => removeFromCart(item.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ borderTop: '2px dashed var(--border)', paddingTop: '1.5rem' }}>
              <div className="flex justify-between mb-4">
                <span style={{ color: 'var(--text-muted)' }}>Total Pembayaran</span>
                <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary)' }}>{formatCurrency(totalAmount)}</span>
              </div>
              <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', borderRadius: 12, justifyContent: 'center' }} onClick={handleCheckout}>
                 <CheckCircle2 size={20} />
                 <span>Selesaikan Pesanan</span>
              </button>
            </div>
          </div>
        </div>

        <style>{`
          .product-card:hover { 
            border-color: var(--primary); 
            transform: translateY(-2px); 
          }
          .add-icon {
            background: var(--primary);
            color: white;
            border-radius: 50%;
            padding: 2px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end mb-4">
        <button className="btn btn-primary" onClick={() => setView('pos')}>
          <Plus size={18} />
          <span>Tambah Pesanan (POS)</span>
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <div style={{ position: 'relative' }}>
                 <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
                 <input 
                  type="text" 
                  placeholder="Cari ID atau Pelanggan..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ padding: '0.5rem 1rem 0.5rem 2.2rem', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 6, color: 'white', fontSize: '0.875rem', width: 280 }}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar size={16} color="var(--text-muted)" />
                <input 
                  type="date" 
                  className="form-input" 
                  style={{ width: 'auto', padding: '0.4rem 0.6rem' }} 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span style={{ color: 'var(--text-muted)' }}>s/d</span>
                <input 
                  type="date" 
                  className="form-input" 
                  style={{ width: 'auto', padding: '0.4rem 0.6rem' }}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <select 
                className="form-input" 
                style={{ width: 'auto', padding: '0.4rem 2rem 0.4rem 0.6rem' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="Semua">Semua Status</option>
                <option value="Diproses">Diproses</option>
                <option value="Selesai">Selesai</option>
                <option value="Pending">Pending</option>
                <option value="Dibatalkan">Dibatalkan</option>
              </select>
            </div>
          </div>
        </div>

        <div className="table-container" style={{ marginTop: 0 }}>
          <table>
            <thead>
              <tr>
                <th>ID Pesanan</th>
                <th>Tanggal</th>
                <th>Pelanggan</th>
                <th>Total</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id}>
                  <td style={{ fontWeight: '600', color: 'var(--primary)' }}>#{order.id}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{order.date}</td>
                  <td>{order.customer}</td>
                  <td style={{ fontWeight: '600' }}>{formatCurrency(order.amount)}</td>
                  <td>{getStatusBadge(order.status)}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-ghost btn-icon" onClick={() => handleEditClick(order)}>
                        <Edit3 size={16} />
                      </button>
                      <button className="btn btn-ghost btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteOrder(order.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Order Modal */}
      {editingOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
           <div className="card" style={{ width: '100%', maxWidth: 450, animation: 'slideUp 0.3s ease' }}>
              <div className="flex justify-between items-center mb-6">
                 <h4 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Edit Pesanan #{editingOrder.id}</h4>
                 <button onClick={() => setEditingOrder(null)} style={{ color: 'var(--text-muted)' }}><X size={24} /></button>
              </div>

              <form onSubmit={handleUpdateOrder}>
                <div className="form-group">
                  <label>Nama Pelanggan</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editingOrder.customer}
                    onChange={(e) => setEditingOrder({ ...editingOrder, customer: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Tanggal Pesanan</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={editingOrder.date}
                    onChange={(e) => setEditingOrder({ ...editingOrder, date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select 
                    className="form-input"
                    value={editingOrder.status}
                    onChange={(e) => setEditingOrder({ ...editingOrder, status: e.target.value })}
                  >
                    <option value="Diproses">Diproses</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Pending">Pending</option>
                    <option value="Dibatalkan">Dibatalkan</option>
                  </select>
                </div>

                <div className="flex gap-3 mt-8">
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '1rem' }}>Update Pesanan</button>
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

export default Orders;

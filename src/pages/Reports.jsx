import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Package, 
  Download, 
  Calendar, 
  Filter, 
  TrendingUp, 
  ArrowLeftRight,
  ClipboardList,
  ShoppingCart
} from 'lucide-react';
import useStore from '../store/useStore';

const Reports = () => {
  const { inventory, production, orders } = useStore();
  const [activeTab, setActiveTab] = useState('stock'); // 'stock', 'usage', 'results', or 'sales'
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [salesStatusFilter, setSalesStatusFilter] = useState('Semua');

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const getStatusBadge = (stock, reserved, minStock) => {
    const available = stock - (reserved || 0);
    if (available <= 0) return <span className="badge badge-danger">Habis</span>;
    if (available < (minStock || 5)) return <span className="badge badge-warning">Menipis</span>;
    return <span className="badge badge-success">Tersedia</span>;
  };

  const getOrderStatusBadge = (status) => {
    switch(status) {
      case 'Selesai': return <span className="badge badge-success">Selesai</span>;
      case 'Diproses': return <span className="badge badge-warning">Diproses</span>;
      case 'Pending': return <span className="badge badge-info">Pending</span>;
      default: return <span className="badge badge-secondary">{status}</span>;
    }
  };

  // Filtered Inventory Data
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => 
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.id.toLowerCase().includes(search.toLowerCase())
    );
  }, [inventory, search]);

  // Aggregated Usage Data
  const usageData = useMemo(() => {
    const aggregated = {};
    
    production.forEach(batch => {
      // Check date range
      const batchDate = new Date(batch.date);
      const isAfterStart = !startDate || batchDate >= new Date(startDate);
      const isBeforeEnd = !endDate || batchDate <= new Date(endDate);
      
      if (isAfterStart && isBeforeEnd) {
        batch.inputs.forEach(input => {
          if (input.name.toLowerCase().includes(search.toLowerCase())) {
            if (!aggregated[input.name]) {
              aggregated[input.name] = {
                name: input.name,
                id: input.id,
                totalQty: 0,
                totalCost: 0,
                unit: input.unit || 'ml',
                batchCount: 0
              };
            }
            aggregated[input.name].totalQty += input.amount;
            aggregated[input.name].totalCost += (input.amount * (input.unitCost || 0));
            aggregated[input.name].batchCount += 1;
          }
        });
      }
    });
    
    return Object.values(aggregated).sort((a, b) => b.totalCost - a.totalCost);
  }, [production, search, startDate, endDate]);

  // Production Results Data
  const productionResultsData = useMemo(() => {
    return (production || [])
      .filter(batch => {
        const batchDate = new Date(batch.date);
        const nameMatch = (batch.outputs[0]?.name || '').toLowerCase().includes(search.toLowerCase()) ||
                         (batch.batchId || '').toLowerCase().includes(search.toLowerCase());
        const isAfterStart = !startDate || batchDate >= new Date(startDate);
        const isBeforeEnd = !endDate || batchDate <= new Date(endDate);
        return nameMatch && isAfterStart && isBeforeEnd;
      })
      .map(batch => {
        const outputProduct = inventory.find(i => i.name === batch.outputs[0]?.name || i.id === batch.outputs[0]?.id);
        return {
          ...batch,
          currentStock: outputProduct?.stock || 0,
          currentUnit: outputProduct?.unit || batch.outputs[0]?.unit
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [production, inventory, search, startDate, endDate]);

  // Sales Data
  const salesData = useMemo(() => {
    return (orders || [])
      .filter(order => {
        const orderDate = new Date(order.date);
        const matchesSearch = (order.id || '').toLowerCase().includes(search.toLowerCase()) || 
                             (order.customer || '').toLowerCase().includes(search.toLowerCase());
        const isAfterStart = !startDate || orderDate >= new Date(startDate);
        const isBeforeEnd = !endDate || orderDate <= new Date(endDate);
        const matchesStatus = salesStatusFilter === 'Semua' || order.status === salesStatusFilter;
        
        return matchesSearch && isAfterStart && isBeforeEnd && matchesStatus;
      })
      .map(order => {
        const totalRemaining = (order.items || []).reduce((sum, item) => {
          return sum + (item.quantity - (item.shippedQuantity || 0));
        }, 0);
        return {
          ...order,
          totalRemaining
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [orders, search, startDate, endDate, salesStatusFilter]);

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header & Main Filters */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-wrap gap-2">
            <button 
              className={`btn ${activeTab === 'stock' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('stock')}
              style={{ padding: '0.6rem 1rem', borderRadius: 10, fontSize: '0.85rem' }}
            >
              <Package size={16} />
              <span>Stok</span>
            </button>
            <button 
              className={`btn ${activeTab === 'usage' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('usage')}
              style={{ padding: '0.6rem 1rem', borderRadius: 10, fontSize: '0.85rem' }}
            >
              <ArrowLeftRight size={16} />
              <span>Penggunaan</span>
            </button>
            <button 
              className={`btn ${activeTab === 'results' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('results')}
              style={{ padding: '0.6rem 1rem', borderRadius: 10, fontSize: '0.85rem' }}
            >
              <ClipboardList size={16} />
              <span>Hasil Produksi</span>
            </button>
            <button 
              className={`btn ${activeTab === 'sales' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('sales')}
              style={{ padding: '0.6rem 1rem', borderRadius: 10, fontSize: '0.85rem' }}
            >
              <ShoppingCart size={16} />
              <span>Penjualan</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
             {activeTab === 'sales' && (
                <select 
                  className="form-input" 
                  style={{ width: 'auto', padding: '0.4rem 2rem 0.4rem 0.6rem', fontSize: '0.8rem' }}
                  value={salesStatusFilter}
                  onChange={(e) => setSalesStatusFilter(e.target.value)}
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Diproses">Diproses</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Pending">Pending</option>
                  <option value="Dibatalkan">Dibatalkan</option>
                </select>
             )}
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
                  placeholder="Cari..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ padding: '0.5rem 1rem 0.5rem 2.22rem', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 8, color: 'white', fontSize: '0.875rem', width: 180 }}
                />
             </div>
             <button className="btn btn-ghost btn-icon" style={{ border: '1px solid var(--border)', borderRadius: 8 }}>
                <Download size={18} />
             </button>
          </div>
        </div>
      </div>

      {activeTab === 'stock' && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
             <h3 style={{ fontSize: '1.125rem', fontWeight: '700' }}>Detail Inventaris Saat Ini</h3>
             <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Menampilkan total stok fisik dan nilai aset yang tersedia</p>
          </div>
          <div className="table-container" style={{ marginTop: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nama Barang</th>
                  <th style={{ textAlign: 'right' }}>Stok</th>
                  <th>Satuan</th>
                  <th style={{ textAlign: 'right' }}>Harga Beli</th>
                  <th style={{ textAlign: 'right' }}>Nilai Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Tidak ada data barang ditemukan</td></tr>
                ) : (
                  filteredInventory.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: '500', color: 'var(--primary)' }}>#{item.id}</td>
                      <td style={{ fontWeight: '600' }}>{item.name}</td>
                      <td style={{ fontWeight: '700', textAlign: 'right' }}>{item.stock}</td>
                      <td>{item.unit}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(item.costPrice)}</td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: '#10b981' }}>{formatCurrency((item.stock || 0) * (item.costPrice || 0))}</td>
                      <td>{getStatusBadge(item.stock, item.reserved, item.minStock)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'usage' && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
             <h3 style={{ fontSize: '1.125rem', fontWeight: '700' }}>Akumulasi Penggunaan Bahan</h3>
             <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total pemakaian bahan baku dalam periode produksi yang dipilih</p>
          </div>
          <div className="table-container" style={{ marginTop: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Nama Bahan Baku</th>
                  <th style={{ textAlign: 'right' }}>Total Digunakan</th>
                  <th>Satuan</th>
                  <th style={{ textAlign: 'right' }}>Jumlah Batch</th>
                  <th style={{ textAlign: 'right' }}>Estimasi Biaya Terpakai</th>
                </tr>
              </thead>
              <tbody>
                {usageData.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Tidak ada penggunaan bahan dalam periode ini</td></tr>
                ) : (
                  usageData.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="flex items-center gap-3">
                           <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: 8, borderRadius: 8 }}>
                              <TrendingUp size={16} color="var(--primary)" />
                           </div>
                           <span style={{ fontWeight: '600' }}>{item.name}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: '700', textAlign: 'right' }}>{item.totalQty.toLocaleString('id-ID')}</td>
                      <td>{item.unit}</td>
                      <td style={{ textAlign: 'right' }}>{item.batchCount} Batch</td>
                      <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--danger)' }}>{formatCurrency(item.totalCost)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {usageData.length > 0 && (
            <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
               <div className="flex flex-col items-end">
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Nilai Konsumsi Bahan</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--danger)' }}>
                    {formatCurrency(usageData.reduce((acc, curr) => acc + curr.totalCost, 0))}
                  </span>
               </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'results' && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
             <h3 style={{ fontSize: '1.125rem', fontWeight: '700' }}>Laporan Hasil Produksi</h3>
             <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Detail output produk jadi beserta konsumsi bahan dan kalkulasi HPP</p>
          </div>
          <div className="table-container" style={{ marginTop: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Tanggal / Batch</th>
                  <th>Produk Hasil</th>
                  <th>Bahan Baku Digunakan</th>
                  <th style={{ textAlign: 'right' }}>Jumlah Hasil</th>
                  <th style={{ textAlign: 'right' }}>Biaya Produksi</th>
                  <th style={{ textAlign: 'right' }}>HPP / Unit</th>
                  <th style={{ textAlign: 'right' }}>Stok Tersedia</th>
                </tr>
              </thead>
              <tbody>
                {productionResultsData.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Tidak ada data hasil produksi ditemukan</td></tr>
                ) : (
                  productionResultsData.map((batch) => (
                    <tr key={batch.id}>
                      <td>
                         <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>{batch.date}</div>
                         <div style={{ fontWeight: '700', color: 'var(--primary)' }}>#{batch.batchId}</div>
                      </td>
                      <td style={{ fontWeight: '700' }}>{batch.outputs[0]?.name}</td>
                      <td>
                        <div className="flex flex-wrap gap-1" style={{ maxWidth: 200 }}>
                          {(batch.inputs || []).map((inp, idx) => (
                            <span key={idx} style={{ fontSize: '0.65rem', background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '2px 6px', borderRadius: 4 }}>
                              {inp.name} ({inp.amount}{inp.unit})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>{batch.outputs[0]?.amount} {batch.outputs[0]?.unit}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(batch.totalCost)}</td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: '#10b981' }}>{formatCurrency(batch.bep)}</td>
                      <td style={{ textAlign: 'right' }}>
                         <span style={{ fontWeight: '700', color: batch.currentStock > 0 ? 'var(--primary)' : 'var(--danger)' }}>
                            {batch.currentStock} {batch.currentUnit}
                         </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'sales' && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
             <h3 style={{ fontSize: '1.125rem', fontWeight: '700' }}>Laporan Penjualan Produk</h3>
             <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Audit pesanan pelanggan, nilai transaksi, dan status pemenuhan pengiriman</p>
          </div>
          <div className="table-container" style={{ marginTop: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>ID Pesanan</th>
                  <th>Tanggal</th>
                  <th>Pelanggan</th>
                  <th>Produk & Jumlah</th>
                  <th style={{ textAlign: 'right' }}>Total Nilai</th>
                  <th style={{ textAlign: 'center' }}>Sisa Kirim</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {salesData.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Tidak ada data penjualan ditemukan</td></tr>
                ) : (
                  salesData.map((order) => (
                    <tr key={order.id}>
                      <td style={{ fontWeight: '700', color: 'var(--primary)' }}>#{order.id}</td>
                      <td>{order.date}</td>
                      <td style={{ fontWeight: '600' }}>{order.customer}</td>
                      <td>
                        <div className="flex flex-col gap-1">
                          {(order.items || []).map((item, idx) => (
                            <div key={idx} style={{ fontSize: '0.75rem' }}>
                              <span style={{ fontWeight: '600' }}>{item.name}</span> ({item.quantity} {item.unit})
                            </div>
                          ))}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '700' }}>{formatCurrency(order.amount)}</td>
                      <td style={{ textAlign: 'center' }}>
                         <span className={`badge ${order.totalRemaining > 0 ? 'badge-warning' : 'badge-success'}`}>
                            {order.totalRemaining} Item
                         </span>
                      </td>
                      <td>{getOrderStatusBadge(order.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;

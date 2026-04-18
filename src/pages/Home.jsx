import React, { useMemo } from 'react';
import { 
  ShoppingBag, 
  Package, 
  Factory, 
  AlertTriangle, 
  ArrowRight,
  PlusCircle,
  Truck,
  Box,
  Calendar,
  Layers
} from 'lucide-react';
import useStore from '../store/useStore';

const Home = ({ onNavigate }) => {
  const { inventory, orders, production } = useStore();
  
  const today = new Date().toLocaleDateString('id-ID', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Calculate High Level Metrics
  const summary = useMemo(() => {
    const lowStock = inventory.filter(i => (i.stock || 0) < (i.minStock || 5));
    const pendingOrders = orders.filter(o => o.status === 'Diproses' || o.status === 'Pending');
    const todayISO = new Date().toISOString().split('T')[0];
    const todayProd = production.filter(p => p.date === todayISO);

    return {
      lowStockCount: lowStock.length,
      pendingOrdersCount: pendingOrders.length,
      todayProdCount: todayProd.length,
      totalAssets: inventory.reduce((acc, curr) => acc + (curr.stock * (curr.costPrice || 0)), 0),
      criticalItems: lowStock.slice(0, 5)
    };
  }, [inventory, orders, production]);

  const QuickAction = ({ icon: Icon, title, desc, color, onClick }) => (
    <div 
      onClick={onClick}
      className="card hover:border-primary transition-all cursor-pointer flex items-center gap-5 p-6 group"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div style={{ 
        background: `${color}15`, 
        color: color, 
        padding: '16px', 
        borderRadius: '16px',
        transition: 'transform 0.3s ease'
      }} className="group-hover:scale-110">
        <Icon size={32} />
      </div>
      <div className="flex-1">
        <h3 style={{ fontSize: '1.125rem', fontWeight: '700' }}>{title}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{desc}</p>
      </div>
      <ArrowRight size={20} className="text-muted group-hover:text-primary transition-colors" />
    </div>
  );

  return (
    <div className="flex flex-col gap-8 pb-10">
      
      {/* Hero Welcome */}
      <div className="p-8 rounded-3xl relative overflow-hidden" style={{ 
        background: 'linear-gradient(135deg, #1E40AF 0%, #1e293b 100%)',
        color: 'white'
      }}>
        <div style={{ position: 'absolute', right: '-5%', top: '-10%', opacity: 0.1 }}>
             <Layers size={300} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2" style={{ opacity: 0.8 }}>
             <Calendar size={16} />
             <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{today}</span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
            Selamat Datang, Admin!
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: '600px', lineHeight: 1.6 }}>
            Sistem operasional StokPro terpantau stabil. Pastikan untuk memeriksa stok menipis sebelum memulai hari Anda.
          </p>
        </div>
      </div>

      {/* Operational Pulse HUD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center flex flex-col items-center gap-2 p-6" style={{ borderTop: '4px solid #ef4444' }}>
          <AlertTriangle size={24} color="#ef4444" />
          <h2 style={{ fontSize: '2rem', fontWeight: '800' }}>{summary.lowStockCount}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '600' }}>Stok Perlu Re-stok</p>
        </div>
        <div className="card text-center flex flex-col items-center gap-2 p-6" style={{ borderTop: '4px solid #3b82f6' }}>
          <ShoppingBag size={24} color="#3b82f6" />
          <h2 style={{ fontSize: '2rem', fontWeight: '800' }}>{summary.pendingOrdersCount}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '600' }}>Pesanan Perlu Diproses</p>
        </div>
        <div className="card text-center flex flex-col items-center gap-2 p-6" style={{ borderTop: '4px solid #10b981' }}>
          <Box size={24} color="#10b981" />
          <h2 style={{ fontSize: '2rem', fontWeight: '800' }}>{summary.todayProdCount}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '600' }}>Produksi Diselesaikan Hari Ini</p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem' }}>Jalan Pintas Utama</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <QuickAction 
            icon={PlusCircle} 
            title="Catat Order Baru" 
            desc="Input pesanan masuk dari pelanggan"
            color="#3b82f6"
            onClick={() => onNavigate('orders')}
          />
          <QuickAction 
            icon={Factory} 
            title="Input Produksi" 
            desc="Catat hasil olahan bahan baku"
            color="#10b981"
            onClick={() => onNavigate('production')}
          />
          <QuickAction 
            icon={Truck} 
            title="Pengiriman Barang" 
            desc="Proses pengeluaran stok ke kurir"
            color="#f59e0b"
            onClick={() => onNavigate('outgoing')}
          />
        </div>
      </div>

      {/* Priority Low Stock Table */}
      {summary.criticalItems.length > 0 && (
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                   <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Perhatian: Stok Menipis</h3>
                   <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Urutan prioritas berdasarkan jumlah stok terendah</p>
                </div>
                <button onClick={() => onNavigate('inventory')} className="btn btn-ghost" style={{ fontSize: '0.75rem' }}>Lihat Semua Gudang</button>
            </div>
            <div className="table-container" style={{ margin: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Bahan / Barang</th>
                    <th>ID</th>
                    <th style={{ textAlign: 'right' }}>Sisa Stok</th>
                    <th>Satuan</th>
                    <th>Peringatan</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.criticalItems.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: '700' }}>{item.name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>#{item.id}</td>
                      <td style={{ textAlign: 'right', fontWeight: '800', color: '#ef4444' }}>{item.stock}</td>
                      <td>{item.unit}</td>
                      <td>
                         <span className="badge badge-danger">Segera Reorder</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
      )}

    </div>
  );
};

export default Home;

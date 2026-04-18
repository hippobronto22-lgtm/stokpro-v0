import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar
} from 'recharts';
import {
  ShoppingBag,
  Activity,
  PackageCheck,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  Clock,
  GripHorizontal,
  Maximize2,
  Lock,
  Unlock,
  RotateCcw,
  Boxes,
  ArrowUpRight
} from 'lucide-react';
import useStore from '../store/useStore';

const GRID_COLS = 12;
const ROW_HEIGHT = 110;

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KpiCard = ({ title, value, subtitle, icon: Icon, color, trend, trendUp }) => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none', userSelect: 'none' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ background: `${color}20`, color, padding: '10px', borderRadius: '12px', display: 'flex' }}>
        <Icon size={22} />
      </div>
      {trend != null && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: '0.7rem', fontWeight: '700', padding: '3px 8px', borderRadius: '20px',
          background: trendUp ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
          color: trendUp ? '#10b981' : '#ef4444'
        }}>
          {trendUp ? <ArrowUpRight size={12} /> : <TrendingDown size={12} />}
          {trend}
        </div>
      )}
    </div>
    <div>
      <div style={{ fontSize: '1.55rem', fontWeight: '900', letterSpacing: '-0.03em', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-main)', marginTop: 4 }}>{title}</div>
      {subtitle && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>}
    </div>
    <div style={{ height: 3, borderRadius: 4, background: `linear-gradient(90deg, ${color}, transparent)`, marginTop: 8 }} />
  </div>
);

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { inventory, orders, production, purchases, dashboardLayout, updateDashboardLayout } = useStore();
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Default layout definition
  const DEFAULT_LAYOUT = [
    { id: 'kpi-revenue', x: 0,  y: 0,   w: 3, h: 1 },
    { id: 'kpi-asset',   x: 3,  y: 0,   w: 3, h: 1 },
    { id: 'kpi-orders',  x: 6,  y: 0,   w: 3, h: 1 },
    { id: 'kpi-fulfill', x: 9,  y: 0,   w: 3, h: 1 },
    { id: 'chart-trend', x: 0,  y: 1.2, w: 8, h: 4 },
    { id: 'chart-dist',  x: 8,  y: 1.2, w: 4, h: 4 },
    { id: 'chart-top',   x: 0,  y: 5.4, w: 7, h: 3.5 },
    { id: 'feed',        x: 7,  y: 5.4, w: 5, h: 3.5 },
  ];

  // Migrate legacy layout IDs automatically
  const validIds = new Set(DEFAULT_LAYOUT.map(l => l.id));
  const layout = Array.isArray(dashboardLayout) && dashboardLayout.length > 0 && dashboardLayout.every(l => validIds.has(l.id))
    ? dashboardLayout
    : DEFAULT_LAYOUT;

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => setContainerWidth(entries[0].contentRect.width));
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const gap = 16;
  const colWidth = Math.max(0, (containerWidth - (GRID_COLS - 1) * gap) / GRID_COLS);

  // Format helpers
  const fmt = (val) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

  const fmtShort = (val) => {
    if (!val) return 'Rp0';
    if (val >= 1_000_000) return `Rp${(val / 1_000_000).toFixed(1)}jt`;
    if (val >= 1_000)     return `Rp${(val / 1_000).toFixed(0)}rb`;
    return `Rp${val}`;
  };

  // ── Data Calculations ──────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const totalRevenue    = orders.reduce((s, o) => s + (o.amount || 0), 0);
    const totalAsset      = inventory.reduce((s, i) => s + ((i.stock || 0) * (i.costPrice || 0)), 0);
    const activeOrders    = orders.filter(o => o.status === 'Diproses' || o.status === 'Pending').length;
    const completedOrders = orders.filter(o => o.status === 'Selesai').length;
    const lowStock        = inventory.filter(i => (i.stock || 0) < (i.minStock || 5));
    const fulfillRate     = orders.length > 0 ? Math.round((completedOrders / orders.length) * 100) : 0;
    return { totalRevenue, totalAsset, activeOrders, completedOrders, lowStock, fulfillRate };
  }, [orders, inventory]);

  const salesTrend = useMemo(() => {
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });
    const daily = {};
    last7.forEach(d => { daily[d] = { revenue: 0, cost: 0 }; });
    orders.forEach(o => { if (daily[o.date]) daily[o.date].revenue += o.amount || 0; });
    production.forEach(p => { if (daily[p.date]) daily[p.date].cost += p.totalCost || 0; });
    return last7.map(d => ({ name: d.slice(5).replace('-', '/'), ...daily[d] }));
  }, [orders, production]);

  const topInventory = useMemo(() =>
    [...inventory]
      .map(i => ({ name: i.name, value: (i.stock || 0) * (i.costPrice || 0) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6),
  [inventory]);

  const stockDist = useMemo(() => [
    { name: 'Bahan Baku', value: inventory.filter(i => i.id?.startsWith('BB')).length, color: '#3b82f6' },
    { name: 'Produk Jadi', value: inventory.filter(i => i.id?.startsWith('PJ')).length, color: '#10b981' },
  ], [inventory]);

  const recentActivity = useMemo(() => [
    ...orders.map(o => ({ date: o.date, label: o.customer, sub: 'Penjualan', amount: o.amount || 0, color: '#3b82f6', icon: <ShoppingBag size={14}/> })),
    ...production.map(p => ({ date: p.date, label: p.outputs?.[0]?.name || 'Produksi', sub: 'Produksi', amount: p.totalCost || 0, color: '#10b981', icon: <Activity size={14}/> })),
    ...purchases.map(p => ({ date: p.date, label: p.supplier, sub: 'Pembelian', amount: p.total || 0, color: '#f59e0b', icon: <PackageCheck size={14}/> })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8),
  [orders, production, purchases]);

  // ── Drag & Resize Handlers ─────────────────────────────────────────────────
  const handleStart = (e, id, type) => {
    if (!isEditMode) return;
    const item = layout.find(l => l.id === id);
    if (!item) return;
    setActiveItem({ id, type, startX: e.clientX, startY: e.clientY, ...item });
    e.preventDefault();
    e.stopPropagation();
  };

  const handleMouseMove = (e) => {
    if (!activeItem || colWidth === 0) return;
    const dx = (e.clientX - activeItem.startX) / (colWidth + gap);
    const dy = (e.clientY - activeItem.startY) / (ROW_HEIGHT + gap);
    updateDashboardLayout(layout.map(item => {
      if (item.id !== activeItem.id) return item;
      if (activeItem.type === 'drag') return {
        ...item,
        x: Math.max(0, Math.min(GRID_COLS - item.w, activeItem.x + dx)),
        y: Math.max(0, activeItem.y + dy)
      };
      return {
        ...item,
        w: Math.max(1, Math.min(GRID_COLS - item.x, activeItem.w + dx)),
        h: Math.max(0.5, activeItem.h + dy)
      };
    }));
  };

  const handleEnd = () => {
    if (!activeItem) return;
    updateDashboardLayout(layout.map(item =>
      item.id !== activeItem.id ? item : {
        ...item,
        x: Math.round(item.x),
        y: Math.round(item.y * 2) / 2,
        w: Math.round(item.w),
        h: Math.round(item.h * 2) / 2
      }
    ));
    setActiveItem(null);
  };

  const resetLayout = () => updateDashboardLayout([...DEFAULT_LAYOUT]);

  // ── Panel Renderer ─────────────────────────────────────────────────────────
  const renderItem = (id) => {
    switch (id) {
      case 'kpi-revenue':
        return <KpiCard
          title="Total Pendapatan"
          value={fmtShort(metrics.totalRevenue)}
          subtitle={fmt(metrics.totalRevenue)}
          icon={DollarSign}
          color="#3b82f6"
          trend={`${orders.length} Order`}
          trendUp
        />;

      case 'kpi-asset':
        return <KpiCard
          title="Valuasi Aset Gudang"
          value={fmtShort(metrics.totalAsset)}
          subtitle={`${inventory.length} SKU terdaftar`}
          icon={Boxes}
          color="#10b981"
        />;

      case 'kpi-orders':
        return <KpiCard
          title="Pesanan Aktif"
          value={metrics.activeOrders}
          subtitle={`${metrics.completedOrders} Selesai`}
          icon={ShoppingBag}
          color="#f59e0b"
          trend={metrics.activeOrders > 0 ? `${metrics.activeOrders} pending` : 'Semua selesai'}
          trendUp={metrics.activeOrders === 0}
        />;

      case 'kpi-fulfill':
        return <KpiCard
          title="Tingkat Pemenuhan"
          value={`${metrics.fulfillRate}%`}
          subtitle={`${metrics.lowStock.length} item stok kritis`}
          icon={metrics.lowStock.length > 0 ? AlertTriangle : PackageCheck}
          color={metrics.lowStock.length > 0 ? '#ef4444' : '#10b981'}
          trend={metrics.lowStock.length > 0 ? `${metrics.lowStock.length} Kritis` : 'Normal'}
          trendUp={metrics.lowStock.length === 0}
        />;

      case 'chart-trend':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <h3 style={{ fontWeight: '800', fontSize: '0.95rem', margin: 0 }}>Tren Pendapatan vs Biaya Produksi</h3>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>7 hari terakhir</p>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: '0.68rem', color: 'var(--text-muted)', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 10, height: 3, borderRadius: 2, background: '#3b82f6', display: 'inline-block' }}/>Pendapatan
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 10, height: 3, borderRadius: 2, background: '#f59e0b', display: 'inline-block' }}/>Biaya
                </span>
              </div>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrend} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3}/>
                  <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} stroke="var(--text-muted)"/>
                  <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="var(--text-muted)" tickFormatter={fmtShort} width={52}/>
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 12, fontSize: '0.75rem' }}
                    formatter={(v, n) => [fmt(v), n === 'revenue' ? 'Pendapatan' : 'Biaya']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gR)"/>
                  <Area type="monotone" dataKey="cost"    stroke="#f59e0b" strokeWidth={2}   fill="url(#gC)" strokeDasharray="4 2"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'chart-dist':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h3 style={{ fontWeight: '800', fontSize: '0.95rem', margin: '0 0 2px 0' }}>Komposisi Inventaris</h3>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>Bahan Baku vs Produk Jadi</p>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stockDist} innerRadius="42%" outerRadius="72%" paddingAngle={4} dataKey="value">
                    {stockDist.map((e, i) => <Cell key={i} fill={e.color}/>)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 10, fontSize: '0.75rem' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 8 }}>
              {stockDist.map(d => (
                <div key={d.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }}/>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{d.name}</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: '800' }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'chart-top':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h3 style={{ fontWeight: '800', fontSize: '0.95rem', margin: '0 0 2px 0' }}>Top Inventaris by Nilai</h3>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>6 item dengan nilai stok tertinggi</p>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topInventory} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" opacity={0.3}/>
                  <XAxis type="number" fontSize={9}  tickLine={false} axisLine={false} stroke="var(--text-muted)" tickFormatter={fmtShort}/>
                  <YAxis type="category" dataKey="name" fontSize={10} tickLine={false} axisLine={false} stroke="var(--text-muted)" width={88} tick={{ fill: 'var(--text-muted)' }}/>
                  <Tooltip contentStyle={{ background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 10, fontSize: '0.75rem' }} formatter={v => [fmt(v), 'Nilai Stok']}/>
                  <Bar dataKey="value" fill="#10b981" radius={[0, 6, 6, 0]} maxBarSize={14}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'feed':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Clock size={16} color="var(--primary)"/>
              <h3 style={{ fontWeight: '800', fontSize: '0.95rem', margin: 0 }}>Aktivitas Terkini</h3>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {recentActivity.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', marginTop: 30 }}>Belum ada aktivitas</p>
              )}
              {recentActivity.map((act, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ background: `${act.color}18`, color: act.color, padding: 7, borderRadius: 9, display: 'flex', flexShrink: 0 }}>
                    {act.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: '700', fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{act.label}</p>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{act.sub} · {act.date}</p>
                  </div>
                  {act.amount > 0 && (
                    <span style={{ fontSize: '0.72rem', fontWeight: '800', color: act.color, whiteSpace: 'nowrap' }}>{fmtShort(act.amount)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 16, height: 'calc(100vh - 110px)' }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
    >
      {/* Control Bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '0.6rem 1rem', backdropFilter: 'blur(12px)'
      }}>
        <div>
          <span style={{ fontWeight: '800', fontSize: '1.1rem' }}>Dashboard</span>
          <span style={{ marginLeft: 10, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {isEditMode
              ? '✦ Mode Edit — geser & ubah ukuran panel'
              : `Diperbarui: ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isEditMode && (
            <button onClick={resetLayout} className="btn btn-ghost" style={{ padding: '0.35rem 0.8rem', fontSize: '0.75rem', borderRadius: 10 }}>
              <RotateCcw size={13}/> Reset
            </button>
          )}
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`btn ${isEditMode ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '0.35rem 1rem', borderRadius: 10, fontSize: '0.8rem', border: isEditMode ? 'none' : '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {isEditMode ? <><Lock size={14}/> Kunci Layout</> : <><Unlock size={14}/> Atur Layout</>}
          </button>
        </div>
      </div>

      {/* Grid Canvas */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          position: 'relative',
          background: isEditMode
            ? `repeating-linear-gradient(90deg, var(--border) 0px, var(--border) 1px, transparent 1px, transparent ${colWidth + gap}px)`
            : 'none',
        }}
      >
        {layout.map((item) => {
          const isActive = activeItem?.id === item.id;
          return (
            <div
              key={item.id}
              style={{
                position: 'absolute',
                left:   item.x * (colWidth + gap),
                top:    item.y * (ROW_HEIGHT + gap),
                width:  item.w * colWidth + (item.w - 1) * gap,
                height: item.h * ROW_HEIGHT + (item.h - 1) * gap,
                padding: '1.1rem',
                background: 'var(--bg-card)',
                backdropFilter: 'blur(12px)',
                border: isActive ? '2px solid var(--primary)' : '1px solid var(--border)',
                borderRadius: 16,
                boxShadow: isActive ? '0 20px 40px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.12)',
                transform: isActive ? 'scale(1.015)' : 'scale(1)',
                transition: isActive ? 'none' : 'box-shadow 0.25s ease, transform 0.25s ease',
                zIndex: isActive ? 50 : 10,
                overflow: 'hidden',
              }}
            >
              {/* Drag handle */}
              {isEditMode && (
                <>
                  <div
                    onMouseDown={(e) => handleStart(e, item.id, 'drag')}
                    style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: 26,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'move', zIndex: 20,
                      background: 'linear-gradient(to bottom, rgba(16,185,129,0.08), transparent)'
                    }}
                  >
                    <GripHorizontal size={14} color="var(--primary)" opacity={0.8}/>
                  </div>
                  {/* Resize handle */}
                  <div
                    onMouseDown={(e) => handleStart(e, item.id, 'resize')}
                    style={{ position: 'absolute', bottom: 4, right: 6, cursor: 'nwse-resize', zIndex: 20, opacity: 0.7 }}
                  >
                    <Maximize2 size={11} color="var(--primary)"/>
                  </div>
                </>
              )}
              <div style={{ height: '100%', marginTop: isEditMode ? 22 : 0 }}>
                {renderItem(item.id)}
              </div>
            </div>
          );
        })}

        {/* Ghost snap preview */}
        {activeItem && (() => {
          const item = layout.find(l => l.id === activeItem.id);
          if (!item) return null;
          const sx = Math.round(item.x), sy = Math.round(item.y * 2) / 2;
          const sw = Math.round(item.w), sh = Math.round(item.h * 2) / 2;
          return (
            <div style={{
              position: 'absolute',
              left:   sx * (colWidth + gap),
              top:    sy * (ROW_HEIGHT + gap),
              width:  sw * colWidth + (sw - 1) * gap,
              height: sh * ROW_HEIGHT + (sh - 1) * gap,
              border: '2px dashed rgba(16,185,129,0.4)',
              borderRadius: 16,
              background: 'rgba(16,185,129,0.05)',
              zIndex: 9,
              pointerEvents: 'none',
            }}/>
          );
        })()}
      </div>
    </div>
  );
};

export default Dashboard;

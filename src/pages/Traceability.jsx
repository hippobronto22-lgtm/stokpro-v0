import React, { useState, useMemo } from 'react';
import {
  Package,
  Database,
  ArrowRight,
  Calendar,
  AlertCircle,
  ChevronRight,
  Boxes
} from 'lucide-react';
import useStore from '../store/useStore';

const fmt = (val) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

// ── Empty State ───────────────────────────────────────────────────────────────
const EmptyState = ({ icon: Icon, text }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '4rem 2rem', textAlign: 'center',
    background: 'var(--bg-main)', border: '2px dashed var(--border)', borderRadius: 16
  }}>
    <Icon size={48} color="var(--border)" style={{ marginBottom: '1rem' }} />
    <p style={{ color: 'var(--text-muted)', fontWeight: '500', maxWidth: '300px', lineHeight: 1.6 }}>{text}</p>
  </div>
);

// ── Produk → Bahan ────────────────────────────────────────────────────────────
const ProductToMaterialView = ({ productId, production, inventory }) => {
  if (!productId) return <EmptyState icon={Package} text="Pilih produk jadi untuk melihat bahan baku yang digunakan dalam setiap batch produksi" />;

  const productInfo   = inventory.find(i => i.id === productId);
  const relevantBatches = production.filter(p => p.outputs?.some(o => o.id === productId));

  if (relevantBatches.length === 0) {
    return (
      <div style={{ padding: '3rem 1rem', textAlign: 'center', background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)' }}>
        <AlertCircle size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Belum ada catatan produksi untuk produk ini</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 4 }}>Tambahkan data produksi terlebih dahulu</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 4px' }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>
            Penelusuran: <span style={{ color: 'var(--primary)' }}>{productInfo?.name || productId}</span>
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
            {relevantBatches.length} batch produksi ditemukan
          </p>
        </div>
      </div>

      {/* Batch Cards */}
      {relevantBatches.map((batch) => {
        const outputForProduct = batch.outputs?.find(o => o.id === productId);
        return (
          <div key={batch.batchId} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            {/* Batch Header */}
            <div style={{ padding: '1.25rem 1.5rem', background: 'var(--bg-main)', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="badge badge-info" style={{ fontWeight: '700' }}>BATCH #{batch.batchId}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={13} /> {batch.date}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hasil Produksi</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary)' }}>
                    {outputForProduct?.amount} {outputForProduct?.unit}
                  </div>
                </div>
              </div>

              {/* KPI Strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 16 }}>
                <div style={{ background: 'var(--bg-card)', padding: '0.75rem 1rem', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>Total Biaya Produksi</div>
                  <div style={{ fontWeight: '800', fontSize: '1rem' }}>{fmt(batch.totalCost)}</div>
                </div>
                <div style={{ background: 'var(--bg-card)', padding: '0.75rem 1rem', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>BEP / Modal per Unit</div>
                  <div style={{ fontWeight: '800', fontSize: '1rem', color: '#f59e0b' }}>{fmt(batch.bep)}</div>
                </div>
                <div style={{ background: 'var(--bg-card)', padding: '0.75rem 1rem', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>Jumlah Bahan Digunakan</div>
                  <div style={{ fontWeight: '800', fontSize: '1rem' }}>{batch.inputs?.length || 0} item</div>
                </div>
              </div>
            </div>

            {/* Inputs Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 500 }}>
                <thead>
                  <tr>
                    <th style={{ padding: '0.75rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>Bahan Baku Digunakan</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>Jumlah</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>Biaya Satuan</th>
                    <th style={{ padding: '0.75rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', textAlign: 'right' }}>Kontribusi Biaya</th>
                  </tr>
                </thead>
                <tbody>
                  {(batch.inputs || []).map((input, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.85rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                          <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>{input.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: '600', fontSize: '0.875rem' }}>{input.amount} {input.unit}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{fmt(input.unitCost)}</td>
                      <td style={{ padding: '0.85rem 1.5rem', fontWeight: '800', color: '#10b981', textAlign: 'right', fontSize: '0.875rem' }}>
                        {fmt((input.amount || 0) * (input.unitCost || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Bahan → Produk ────────────────────────────────────────────────────────────
const MaterialToProductView = ({ materialId, production, inventory }) => {
  if (!materialId) return <EmptyState icon={Database} text="Pilih bahan baku untuk melihat kontribusinya pada setiap batch produksi" />;

  const materialInfo    = inventory.find(i => i.id === materialId);
  const relevantBatches = production.filter(p => p.inputs?.some(i => i.id === materialId));

  if (relevantBatches.length === 0) {
    return (
      <div style={{ padding: '3rem 1rem', textAlign: 'center', background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)' }}>
        <AlertCircle size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Bahan ini belum pernah digunakan dalam produksi</p>
      </div>
    );
  }

  // Aggregate totals
  const totalUsed   = relevantBatches.reduce((s, b) => s + (b.inputs?.find(i => i.id === materialId)?.amount || 0), 0);
  const totalCostContrib = relevantBatches.reduce((s, b) => {
    const u = b.inputs?.find(i => i.id === materialId);
    return s + ((u?.amount || 0) * (u?.unitCost || 0));
  }, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '0 4px' }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b', flexShrink: 0, marginTop: 4 }} />
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>
            Penelusuran: <span style={{ color: '#f59e0b' }}>{materialInfo?.name || materialId}</span>
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
            Digunakan dalam {relevantBatches.length} batch produksi
          </p>
        </div>
      </div>

      {/* Summary Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', marginBottom: 6 }}>Total Pemakaian</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '900' }}>{totalUsed} {materialInfo?.unit}</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', marginBottom: 6 }}>Total Kontribusi Biaya</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#f59e0b' }}>{fmt(totalCostContrib)}</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', marginBottom: 6 }}>Produk yang Dihasilkan</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '900' }}>{relevantBatches.length} batch</div>
        </div>
      </div>

      {/* Batch Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {relevantBatches.map((batch) => {
          const materialUsage  = batch.inputs?.find(i => i.id === materialId);
          const usageCost      = (materialUsage?.amount || 0) * (materialUsage?.unitCost || 0);
          const participationPct = batch.totalCost > 0 ? ((usageCost / batch.totalCost) * 100).toFixed(1) : '0.0';

          return (
            <div key={batch.batchId} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '4px solid #10b981', borderRadius: 12, overflow: 'hidden' }}>
              {/* Card Header */}
              <div style={{ padding: '1rem 1.25rem', background: 'var(--bg-main)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Batch #{batch.batchId}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Calendar size={12} /> {batch.date}
                  </div>
                </div>
                <span className="badge badge-success">Selesai</span>
              </div>

              {/* Card Body */}
              <div style={{ padding: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  {/* Usage */}
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Pemakaian Bahan</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: '800' }}>{materialUsage?.amount} {materialUsage?.unit}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Nilai: {fmt(usageCost)}</div>
                  </div>
                  {/* Output */}
                  <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Hasil Produk</div>
                    <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--primary)' }}>{batch.outputs?.[0]?.name || '-'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {batch.outputs?.[0]?.amount} {batch.outputs?.[0]?.unit}
                    </div>
                  </div>
                </div>

                {/* Participation Bar */}
                <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-main)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Partisipasi Biaya Batch</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 80, height: 6, background: 'var(--border)', borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ width: `${participationPct}%`, height: '100%', background: '#10b981', borderRadius: 6 }} />
                    </div>
                    <span style={{ fontWeight: '800', color: '#10b981', fontSize: '0.875rem' }}>{participationPct}%</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const Traceability = () => {
  const { inventory, production } = useStore();
  const [activeTab, setActiveTab]     = useState('product-to-material');
  const [selectedItemId, setSelectedItemId] = useState('');

  const dropdownItems = useMemo(() => {
    if (activeTab === 'product-to-material') {
      // Show all products that have been used as outputs in production
      const producedIds = new Set(production.flatMap(p => (p.outputs || []).map(o => o.id)));
      const invProducts = inventory.filter(i => i.id?.startsWith('PJ') || producedIds.has(i.id));
      return invProducts;
    } else {
      // Show all materials that have been used as inputs in production
      const usedIds = new Set(production.flatMap(p => (p.inputs || []).map(i => i.id)));
      const invMaterials = inventory.filter(i => i.id?.startsWith('BB') || usedIds.has(i.id));
      return invMaterials;
    }
  }, [activeTab, inventory, production]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedItemId('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Tab Toggle */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
              Metode Penelusuran
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => handleTabChange('product-to-material')}
                className={`btn ${activeTab === 'product-to-material' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: 10, padding: '0.5rem 1.25rem', border: activeTab !== 'product-to-material' ? '1px solid var(--border)' : 'none' }}
              >
                <Package size={16} />
                <span>Produk → Bahan Baku</span>
              </button>
              <button
                onClick={() => handleTabChange('material-to-product')}
                className={`btn ${activeTab === 'material-to-product' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: 10, padding: '0.5rem 1.25rem', border: activeTab !== 'material-to-product' ? '1px solid var(--border)' : 'none' }}
              >
                <Database size={16} />
                <span>Bahan Baku → Produk</span>
              </button>
            </div>
          </div>

          {/* Dropdown */}
          <div style={{ maxWidth: 480 }}>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
              {activeTab === 'product-to-material' ? 'Pilih Produk Jadi' : 'Pilih Bahan Baku'}
            </label>
            <div style={{ position: 'relative' }}>
              <select
                className="form-input"
                style={{ appearance: 'none', paddingLeft: '2.75rem', paddingRight: '1rem' }}
                value={selectedItemId}
                onChange={e => setSelectedItemId(e.target.value)}
              >
                <option value="">— Pilih Item —</option>
                {dropdownItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.id}) — Stok: {item.stock} {item.unit}
                  </option>
                ))}
              </select>
              {activeTab === 'product-to-material'
                ? <Package size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', pointerEvents: 'none' }} />
                : <Database size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', pointerEvents: 'none' }} />
              }
            </div>
            {dropdownItems.length === 0 && (
              <p style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertCircle size={13} />
                {activeTab === 'product-to-material'
                  ? 'Belum ada produk jadi. Tambahkan data produksi terlebih dahulu.'
                  : 'Belum ada bahan baku yang digunakan dalam produksi.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {activeTab === 'product-to-material' ? (
        <ProductToMaterialView
          productId={selectedItemId}
          production={production}
          inventory={inventory}
        />
      ) : (
        <MaterialToProductView
          materialId={selectedItemId}
          production={production}
          inventory={inventory}
        />
      )}
    </div>
  );
};

export default Traceability;

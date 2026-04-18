/**
 * Seed script: jalankan ini SEKALI untuk mengisi data awal di Firestore.
 * Cara: buka browser, buka dev tools console, paste seluruh kode ini, tekan Enter.
 *
 * ATAU: import dan panggil seedFirestore() dari komponen sementara.
 */

import { db, auth } from './firebase';
import { setDoc, doc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

export const seedFirestore = async () => {
  console.log('🌱 Memulai seed data ke Firestore...');

  // ── Roles ─────────────────────────────────────────────────────────────────
  const roles = [
    { id: 'ROLE-001', name: 'Admin', description: 'Akses penuh ke seluruh modul sistem', color: '#ef4444', permissions: ['dashboard','orders','products','production','traceability','inventory','purchasing','outgoing','reports','master'] },
    { id: 'ROLE-002', name: 'Manajer', description: 'Akses ke laporan, produksi, dan penjualan', color: '#3b82f6', permissions: ['dashboard','orders','products','production','traceability','inventory','reports'] },
    { id: 'ROLE-003', name: 'Operator Gudang', description: 'Akses ke gudang, pembelian, dan pengeluaran barang', color: '#10b981', permissions: ['inventory','purchasing','outgoing','production'] },
  ];
  for (const role of roles) await setDoc(doc(db, 'roles', role.id), role);
  console.log('✅ Roles seeded');

  // ── Inventory ─────────────────────────────────────────────────────────────
  const inventory = [
    { id: 'BB-001', name: 'Ekstrak Lavender', stock: 500, reserved: 0, unit: 'ml', status: 'Tersedia', costPrice: 150, minStock: 50 },
    { id: 'BB-002', name: 'Carrier Oil', stock: 2000, reserved: 0, unit: 'ml', status: 'Tersedia', costPrice: 50, minStock: 100 },
    { id: 'PJ-001', name: 'Minyak Lavender Rose', stock: 15, reserved: 0, unit: 'Botol', status: 'Tersedia', price: 125000, costPrice: 85000, minStock: 5 },
    { id: 'PJ-002', name: 'Minyak Peppermint', stock: 3, reserved: 0, unit: 'Botol', status: 'Menipis', price: 85000, costPrice: 60000, minStock: 5 },
  ];
  for (const item of inventory) await setDoc(doc(db, 'inventory', item.id), item);
  console.log('✅ Inventory seeded');

  // ── Master Data ────────────────────────────────────────────────────────────
  const masterData = [
    { type: 'suppliers', id: 's-1', name: 'Supplier Utama Jaya', phone: '08123456789', address: 'Jl. Industri No. 12, Jakarta' },
    { type: 'units', id: 'u-1', name: 'Botol' },
    { type: 'units', id: 'u-2', name: 'ml' },
    { type: 'units', id: 'u-3', name: 'Gram' },
    { type: 'units', id: 'u-4', name: 'Pcs' },
  ];
  for (const item of masterData) await setDoc(doc(db, 'masterData', `${item.type}_${item.id}`), item);
  console.log('✅ Master Data seeded');

  // ── Sample Orders ──────────────────────────────────────────────────────────
  const orders = [
    { id: 'ORD-001', customer: 'Budi Santoso', date: '2025-04-10', status: 'Selesai', amount: 250000, items: [{ id: 'PJ-001', name: 'Minyak Lavender Rose', price: 125000, quantity: 2, unit: 'Botol', shippedQuantity: 2 }] },
    { id: 'ORD-002', customer: 'Siti Aminah', date: '2025-04-12', status: 'Diproses', amount: 170000, items: [{ id: 'PJ-002', name: 'Minyak Peppermint', price: 85000, quantity: 2, unit: 'Botol', shippedQuantity: 0 }] },
  ];
  for (const order of orders) await setDoc(doc(db, 'orders', order.id), order);
  console.log('✅ Orders seeded');

  // ── Sample Purchases ───────────────────────────────────────────────────────
  await setDoc(doc(db, 'purchases', 'PUR-001'), { id: 'PUR-001', supplier: 'Supplier Utama Jaya', date: '2025-04-05', status: 'Diterima', total: 1000000 });
  console.log('✅ Purchases seeded');

  console.log('🎉 Seed selesai! Semua data berhasil ditulis ke Firestore.');
  console.log('');
  console.log('📌 LANGKAH SELANJUTNYA:');
  console.log('Buat akun Admin di Firebase Console → Authentication → Users → Add user:');
  console.log('  Email: admin@stokpro.id');
  console.log('  Password: (pilih password aman)');
  console.log('Salin UID yang diberikan Firebase, lalu jalankan seedUser() dengan UID tersebut.');
};

export const seedUser = async (uid, userData) => {
  await setDoc(doc(db, 'users', uid), userData);
  console.log(`✅ User profile saved for UID: ${uid}`);
};

// Contoh penggunaan seedUser:
// seedUser('UID_DARI_FIREBASE', {
//   id: 'UID_DARI_FIREBASE',
//   name: 'Admin Gudang',
//   email: 'admin@stokpro.id',
//   role: 'Admin',
//   roleId: 'ROLE-001',
//   status: 'Aktif',
// });

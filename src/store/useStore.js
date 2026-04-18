import { create } from 'zustand';
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  setDoc, getDocs, query, onSnapshot, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

// ── Helper: generate local id ─────────────────────────────────────────────────
const localId = (prefix = 'ID') => `${prefix}-${Date.now().toString().slice(-6)}`;

// ── Firestore collection helpers ───────────────────────────────────────────────
const col = (name) => collection(db, name);

const useStore = create((set, get) => ({
  // ── Auth state (managed by App.jsx via onAuthStateChanged) ────────────────
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),

  // ── UI State ───────────────────────────────────────────────────────────────
  theme: localStorage.getItem('stokpro-theme') || 'dark',
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('stokpro-theme', next);
    set({ theme: next });
  },

  // ── Loading flags ──────────────────────────────────────────────────────────
  dataLoaded: false,
  setDataLoaded: (v) => set({ dataLoaded: v }),

  // ── Real-time data (filled by listeners in App.jsx) ───────────────────────
  inventory:  [],
  orders:     [],
  purchases:  [],
  production: [],
  outgoing:   [],
  users:      [],
  roles:      [],
  masterData: { suppliers: [], units: [] },

  // Setters for listeners
  setInventory:  (data) => set({ inventory: data }),
  setOrders:     (data) => set({ orders: data }),
  setPurchases:  (data) => set({ purchases: data }),
  setProduction: (data) => set({ production: data }),
  setOutgoing:   (data) => set({ outgoing: data }),
  setUsers:      (data) => set({ users: data }),
  setRoles:      (data) => set({ roles: data }),
  setMasterData: (data) => set({ masterData: data }),

  // Dashboard layout (persisted in localStorage per-user)
  dashboardLayout: null,
  updateDashboardLayout: (layout) => {
    const uid = get().currentUser?.uid || 'local';
    localStorage.setItem(`dashboardLayout-${uid}`, JSON.stringify(layout));
    set({ dashboardLayout: layout });
  },
  loadDashboardLayout: () => {
    const uid = get().currentUser?.uid || 'local';
    const saved = localStorage.getItem(`dashboardLayout-${uid}`);
    const DEFAULT_LAYOUT = [
      { id: 'kpi-revenue', x: 0, y: 0,   w: 3, h: 1 },
      { id: 'kpi-asset',   x: 3, y: 0,   w: 3, h: 1 },
      { id: 'kpi-orders',  x: 6, y: 0,   w: 3, h: 1 },
      { id: 'kpi-fulfill', x: 9, y: 0,   w: 3, h: 1 },
      { id: 'chart-trend', x: 0, y: 1.2, w: 8, h: 4 },
      { id: 'chart-dist',  x: 8, y: 1.2, w: 4, h: 4 },
      { id: 'chart-top',   x: 0, y: 5.4, w: 7, h: 3.5 },
      { id: 'feed',        x: 7, y: 5.4, w: 5, h: 3.5 },
    ];
    set({ dashboardLayout: saved ? JSON.parse(saved) : DEFAULT_LAYOUT });
  },

  // ── calculateStatus helper ────────────────────────────────────────────────
  calculateStatus: (stock, reserved, minStock) => {
    const available = stock - (reserved || 0);
    if (available <= 0) return 'Habis';
    if (available < (minStock || 5)) return 'Menipis';
    return 'Tersedia';
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ORDER ACTIONS
  // ══════════════════════════════════════════════════════════════════════════
  addOrder: async (order) => {
    const state = get();
    // Reserve stock in inventory
    for (const oi of (order.items || [])) {
      const item = state.inventory.find(i => i.id === oi.id);
      if (item) {
        const newReserved = (item.reserved || 0) + oi.quantity;
        await updateDoc(doc(db, 'inventory', item.id), {
          reserved: newReserved,
          status: state.calculateStatus(item.stock, newReserved, item.minStock)
        });
      }
    }
    const payload = {
      ...order,
      items: order.items.map(i => ({ ...i, shippedQuantity: 0 })),
      createdAt: serverTimestamp()
    };
    await setDoc(doc(db, 'orders', order.id), payload);
  },

  updateOrderStatus: async (id, status) => {
    await updateDoc(doc(db, 'orders', id), { status });
  },

  deleteOrder: async (id) => {
    await deleteDoc(doc(db, 'orders', id));
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PURCHASE ACTIONS
  // ══════════════════════════════════════════════════════════════════════════
  addPurchase: async (purchase) => {
    const state = get();
    for (const pItem of (purchase.items || [])) {
      const existing = state.inventory.find(i => i.name.toLowerCase() === pItem.name.toLowerCase());
      if (existing) {
        const newStock = existing.stock + pItem.quantity;
        await updateDoc(doc(db, 'inventory', existing.id), {
          stock: newStock,
          costPrice: pItem.price || existing.costPrice,
          status: state.calculateStatus(newStock, existing.reserved, existing.minStock)
        });
      } else {
        const newId = `BB-${Date.now().toString().slice(-6)}`;
        await setDoc(doc(db, 'inventory', newId), {
          id: newId, name: pItem.name, stock: pItem.quantity, reserved: 0,
          unit: pItem.unit, costPrice: pItem.price, minStock: 5,
          status: state.calculateStatus(pItem.quantity, 0, 5)
        });
      }
    }
    await setDoc(doc(db, 'purchases', purchase.id), { ...purchase, createdAt: serverTimestamp() });
  },

  deletePurchase: async (id) => {
    await deleteDoc(doc(db, 'purchases', id));
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PRODUCTION ACTIONS
  // ══════════════════════════════════════════════════════════════════════════
  addProduction: async (record) => {
    const state = get();
    let totalCost = 0;
    const inputsWithCosts = [];

    for (const input of (record.inputs || [])) {
      const item = state.inventory.find(i => i.id === input.id);
      if (item) {
        const unitCost = item.costPrice || 0;
        totalCost += unitCost * input.amount;
        const newStock = Math.max(0, item.stock - input.amount);
        await updateDoc(doc(db, 'inventory', item.id), {
          stock: newStock,
          status: state.calculateStatus(newStock, item.reserved, item.minStock)
        });
        inputsWithCosts.push({ ...input, unitCost });
      } else {
        inputsWithCosts.push(input);
      }
    }

    const updatedOutputs = [];
    for (const output of (record.outputs || [])) {
      const bep = output.amount > 0 ? totalCost / output.amount : 0;
      const existing = state.inventory.find(i => i.name.toLowerCase() === output.name.toLowerCase());
      if (existing) {
        const newStock = existing.stock + output.amount;
        await updateDoc(doc(db, 'inventory', existing.id), {
          stock: newStock,
          costPrice: bep,
          status: state.calculateStatus(newStock, existing.reserved, existing.minStock)
        });
        updatedOutputs.push({ ...output, id: existing.id });
      } else {
        const newId = `PJ-${Date.now().toString().slice(-6)}`;
        await setDoc(doc(db, 'inventory', newId), {
          id: newId, name: output.name, stock: output.amount, reserved: 0,
          unit: output.unit, costPrice: bep, price: 0, minStock: 5,
          status: state.calculateStatus(output.amount, 0, 5)
        });
        updatedOutputs.push({ ...output, id: newId });
      }
    }

    const totalOutput = updatedOutputs.reduce((acc, o) => acc + o.amount, 0);
    const finalRecord = {
      ...record,
      inputs: inputsWithCosts,
      outputs: updatedOutputs,
      totalCost,
      bep: totalOutput > 0 ? totalCost / totalOutput : 0,
      createdAt: serverTimestamp()
    };
    await setDoc(doc(db, 'production', record.batchId), finalRecord);
  },

  deleteProduction: async (id) => {
    await deleteDoc(doc(db, 'production', id));
  },

  // ══════════════════════════════════════════════════════════════════════════
  // OUTGOING ACTIONS
  // ══════════════════════════════════════════════════════════════════════════
  addOutgoing: async (record) => {
    const state = get();
    const item = state.inventory.find(i => i.name === record.product);
    if (item) {
      const newStock    = item.stock - record.quantity;
      const newReserved = Math.max(0, (item.reserved || 0) - record.quantity);
      await updateDoc(doc(db, 'inventory', item.id), {
        stock: newStock, reserved: newReserved,
        status: state.calculateStatus(newStock, newReserved, item.minStock)
      });
    }
    if (record.orderId) {
      const order = state.orders.find(o => o.id === record.orderId);
      if (order) {
        const updatedItems = order.items.map(oi =>
          oi.name === record.product
            ? { ...oi, shippedQuantity: (oi.shippedQuantity || 0) + record.quantity }
            : oi
        );
        const allShipped = updatedItems.every(oi => (oi.shippedQuantity || 0) >= oi.quantity);
        await updateDoc(doc(db, 'orders', record.orderId), {
          items: updatedItems,
          status: allShipped ? 'Selesai' : order.status
        });
      }
    }
    await setDoc(doc(db, 'outgoing', record.id), { ...record, createdAt: serverTimestamp() });
  },

  deleteOutgoing: async (id) => {
    await deleteDoc(doc(db, 'outgoing', id));
  },

  // ══════════════════════════════════════════════════════════════════════════
  // INVENTORY ACTIONS
  // ══════════════════════════════════════════════════════════════════════════
  addInventoryItem: async (item) => {
    const id = item.id || localId('INV');
    await setDoc(doc(db, 'inventory', id), {
      ...item, id, stock: 0, reserved: 0,
      status: 'Tersedia', createdAt: serverTimestamp()
    });
  },

  updateInventoryItem: async (id, updates) => {
    const state = get();
    const item = state.inventory.find(i => i.id === id);
    if (item) {
      const merged = { ...item, ...updates };
      await updateDoc(doc(db, 'inventory', id), {
        ...updates,
        status: state.calculateStatus(merged.stock, merged.reserved, merged.minStock)
      });
    }
  },

  deleteInventoryItem: async (id) => {
    await deleteDoc(doc(db, 'inventory', id));
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MASTER DATA ACTIONS
  // ══════════════════════════════════════════════════════════════════════════
  addMasterItem: async (type, item) => {
    const id = item.id || localId(type.slice(0, 1).toUpperCase());
    await setDoc(doc(db, 'masterData', `${type}_${id}`), { ...item, id, type });
  },

  updateMasterItem: async (type, id, updates) => {
    await updateDoc(doc(db, 'masterData', `${type}_${id}`), updates);
  },

  deleteMasterItem: async (type, id) => {
    await deleteDoc(doc(db, 'masterData', `${type}_${id}`));
  },

  // ══════════════════════════════════════════════════════════════════════════
  // USER MANAGEMENT ACTIONS (Firestore only, no password — auth is Firebase)
  // ══════════════════════════════════════════════════════════════════════════
  addUser: async (user) => {
    const id = user.id || localId('USR');
    await setDoc(doc(db, 'users', id), {
      ...user, id, createdAt: serverTimestamp()
    });
  },

  updateUser: async (id, updates) => {
    await updateDoc(doc(db, 'users', id), updates);
  },

  deleteUser: async (id) => {
    await deleteDoc(doc(db, 'users', id));
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ROLE ACTIONS
  // ══════════════════════════════════════════════════════════════════════════
  addRole: async (role) => {
    const id = role.id || localId('ROLE');
    await setDoc(doc(db, 'roles', id), { ...role, id });
  },

  updateRole: async (id, updates) => {
    await updateDoc(doc(db, 'roles', id), updates);
  },

  deleteRole: async (id) => {
    await deleteDoc(doc(db, 'roles', id));
  },
}));

export default useStore;

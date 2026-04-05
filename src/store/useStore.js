import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { CUSTOMERS, LEADS, PRODUCTS, PIPELINE_DATA, QUOTATIONS, ORDERS } from '../data/mockData';
import api from '../lib/api';
import { isSupabaseConfigured } from '../lib/supabase';

/**
 * useStore - Zustand store con soporte para API de Supabase
 * 
 * Si Supabase está configurado, usa la API real.
 * Si no, usa los datos mock locales (para desarrollo sin backend).
 */
export const useStore = create((set, get) => ({
  // ============================================
  // ESTADO BASE
  // ============================================
  customers: CUSTOMERS,
  leads: LEADS,
  products: PRODUCTS,
  pipeline: PIPELINE_DATA,
  quotations: QUOTATIONS,
  orders: ORDERS,

  // ============================================
  // LOADING STATES
  // ============================================
  loading: {
    customers: false,
    leads: false,
    products: false,
    opportunities: false,
    quotations: false,
    orders: false,
  },
  error: null,

  // ============================================
  // HELPERS
  // ============================================
  isApiReady: () => isSupabaseConfigured(),

  setLoading: (key, value) => set((state) => ({
    loading: { ...state.loading, [key]: value }
  })),

  setError: (error) => set({ error }),

  // ============================================
  // CUSTOMERS
  // ============================================
  fetchCustomers: async () => {
    const { isApiReady } = get();
    if (!isApiReady()) return; // Usar datos mock si no hay API

    set((state) => ({ loading: { ...state.loading, customers: true } }));
    try {
      const result = await api.customers.getAll();
      if (result.success) {
        set({ customers: result.data });
      } else {
        console.error('Error fetching customers:', result.error);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      set((state) => ({ loading: { ...state.loading, customers: false } }));
    }
  },

  addCustomer: async (customer) => {
    const { isApiReady, customers } = get();
    
    if (isApiReady()) {
      set((state) => ({ loading: { ...state.loading, customers: true } }));
      try {
        // Agregar user_id del usuario actual (del contexto de auth)
        const customerWithUser = { ...customer, user_id: customer.user_id || null };
        const result = await api.customers.create(customerWithUser);
        if (result.success) {
          set({ customers: [result.data, ...customers] });
          return result.data;
        } else {
          console.error('Error creating customer:', result.error);
          return null;
        }
      } catch (err) {
        console.error('Error creating customer:', err);
        return null;
      } finally {
        set((state) => ({ loading: { ...state.loading, customers: false } }));
      }
    } else {
      // Fallback a datos locales (mock)
      const newCustomer = { ...customer, id: uuidv4() };
      set({ customers: [newCustomer, ...customers] });
      return newCustomer;
    }
  },

  updateCustomer: async (id, data) => {
    const { isApiReady, customers } = get();
    
    if (isApiReady()) {
      set((state) => ({ loading: { ...state.loading, customers: true } }));
      try {
        const result = await api.customers.update(id, data);
        if (result.success) {
          set({ 
            customers: customers.map(c => c.id === id ? result.data : c)
          });
          return result.data;
        }
        return null;
      } catch (err) {
        console.error('Error updating customer:', err);
        return null;
      } finally {
        set((state) => ({ loading: { ...state.loading, customers: false } }));
      }
    } else {
      set({ customers: customers.map(c => c.id === id ? { ...c, ...data } : c) });
      return customers.find(c => c.id === id);
    }
  },

  deleteCustomer: async (id) => {
    const { isApiReady, customers } = get();
    
    if (isApiReady()) {
      set((state) => ({ loading: { ...state.loading, customers: true } }));
      try {
        const result = await api.customers.delete(id);
        if (result.success) {
          set({ customers: customers.filter(c => c.id !== id) });
        }
      } catch (err) {
        console.error('Error deleting customer:', err);
      } finally {
        set((state) => ({ loading: { ...state.loading, customers: false } }));
      }
    } else {
      set({ customers: customers.filter(c => c.id !== id) });
    }
  },

  // ============================================
  // LEADS
  // ============================================
  fetchLeads: async () => {
    const { isApiReady } = get();
    if (!isApiReady()) return;

    set((state) => ({ loading: { ...state.loading, leads: true } }));
    try {
      const result = await api.leads.getAll();
      if (result.success) {
        set({ leads: result.data });
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      set((state) => ({ loading: { ...state.loading, leads: false } }));
    }
  },

  addLead: async (lead) => {
    const { isApiReady, leads } = get();
    
    if (isApiReady()) {
      set((state) => ({ loading: { ...state.loading, leads: true } }));
      try {
        const result = await api.leads.create({ ...lead, user_id: lead.user_id || null });
        if (result.success) {
          set({ leads: [result.data, ...leads] });
          return result.data;
        }
        return null;
      } catch (err) {
        console.error('Error creating lead:', err);
        return null;
      } finally {
        set((state) => ({ loading: { ...state.loading, leads: false } }));
      }
    } else {
      const newLead = { ...lead, id: uuidv4(), status: 'new' };
      set({ leads: [newLead, ...leads] });
      return newLead;
    }
  },

  convertLead: async (id) => {
    const { isApiReady, leads } = get();
    
    if (isApiReady()) {
      try {
        const result = await api.leads.convert(id);
        if (result.success) {
          set({ leads: leads.map(l => l.id === id ? { ...l, status: 'converted' } : l) });
        }
      } catch (err) {
        console.error('Error converting lead:', err);
      }
    } else {
      set({ leads: leads.map(l => l.id === id ? { ...l, status: 'converted' } : l) });
    }
  },

  // ============================================
  // PRODUCTS
  // ============================================
  fetchProducts: async () => {
    const { isApiReady } = get();
    if (!isApiReady()) return;

    set((state) => ({ loading: { ...state.loading, products: true } }));
    try {
      const result = await api.products.getAll();
      if (result.success) {
        set({ products: result.data });
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      set((state) => ({ loading: { ...state.loading, products: false } }));
    }
  },

  addProduct: async (product) => {
    const { isApiReady, products } = get();
    
    if (isApiReady()) {
      set((state) => ({ loading: { ...state.loading, products: true } }));
      try {
        const result = await api.products.create(product);
        if (result.success) {
          set({ products: [result.data, ...products] });
          return result.data;
        }
        return null;
      } catch (err) {
        console.error('Error creating product:', err);
        return null;
      } finally {
        set((state) => ({ loading: { ...state.loading, products: false } }));
      }
    } else {
      const newProduct = { ...product, id: uuidv4(), status: 'active' };
      set({ products: [newProduct, ...products] });
      return newProduct;
    }
  },

  // ============================================
  // OPPORTUNITIES (Pipeline)
  // ============================================
  fetchOpportunities: async () => {
    const { isApiReady } = get();
    if (!isApiReady()) return;

    set((state) => ({ loading: { ...state.loading, opportunities: true } }));
    try {
      const result = await api.opportunities.getAll();
      if (result.success) {
        // Agrupar por stage para el pipeline
        const pipeline = {
          lead: [],
          contact: [],
          qualification: [],
          proposal: [],
          negotiation: [],
          closed_won: [],
          closed_lost: []
        };
        
        result.data.forEach(opp => {
          if (pipeline[opp.stage]) {
            pipeline[opp.stage].push(opp);
          }
        });
        
        set({ pipeline });
      }
    } catch (err) {
      console.error('Error fetching opportunities:', err);
    } finally {
      set((state) => ({ loading: { ...state.loading, opportunities: false } }));
    }
  },

  movePipelineOpportunity: async (oppId, fromStage, toStage) => {
    const { isApiReady, pipeline } = get();
    
    if (isApiReady()) {
      try {
        const result = await api.opportunities.moveStage(oppId, toStage);
        if (result.success) {
          // Actualizar localmente
          const stageOpps = pipeline[fromStage];
          const opp = stageOpps.find(o => o.id === oppId);
          if (!opp) return;

          set({
            pipeline: {
              ...pipeline,
              [fromStage]: pipeline[fromStage].filter(o => o.id !== oppId),
              [toStage]: [...pipeline[toStage], { ...opp, stage: toStage }]
            }
          });
        }
      } catch (err) {
        console.error('Error moving opportunity:', err);
      }
    } else {
      // Fallback local
      const stageOpps = pipeline[fromStage];
      const opp = stageOpps.find(o => o.id === oppId);
      if (!opp) return;

      set({
        pipeline: {
          ...pipeline,
          [fromStage]: pipeline[fromStage].filter(o => o.id !== oppId),
          [toStage]: [...pipeline[toStage], { ...opp, stage: toStage }]
        }
      });
    }
  },

  addPipelineOpportunity: async (stage, opp) => {
    const { isApiReady, pipeline } = get();
    
    if (isApiReady()) {
      try {
        const result = await api.opportunities.create({ ...opp, stage });
        if (result.success) {
          set({
            pipeline: {
              ...pipeline,
              [stage]: [result.data, ...pipeline[stage]]
            }
          });
          return result.data;
        }
        return null;
      } catch (err) {
        console.error('Error creating opportunity:', err);
        return null;
      }
    } else {
      const newOpp = { ...opp, id: uuidv4(), stage };
      set({
        pipeline: {
          ...pipeline,
          [stage]: [newOpp, ...pipeline[stage]]
        }
      });
      return newOpp;
    }
  },

  // ============================================
  // QUOTATIONS
  // ============================================
  fetchQuotations: async () => {
    const { isApiReady } = get();
    if (!isApiReady()) return;

    set((state) => ({ loading: { ...state.loading, quotations: true } }));
    try {
      const result = await api.quotations.getAll();
      if (result.success) {
        set({ quotations: result.data });
      }
    } catch (err) {
      console.error('Error fetching quotations:', err);
    } finally {
      set((state) => ({ loading: { ...state.loading, quotations: false } }));
    }
  },

  addQuotation: async (quote) => {
    const { isApiReady, quotations } = get();
    
    if (isApiReady()) {
      set((state) => ({ loading: { ...state.loading, quotations: true } }));
      try {
        const result = await api.quotations.create(quote);
        if (result.success) {
          set({ quotations: [result.data, ...quotations] });
          return result.data;
        }
        return null;
      } catch (err) {
        console.error('Error creating quotation:', err);
        return null;
      } finally {
        set((state) => ({ loading: { ...state.loading, quotations: false } }));
      }
    } else {
      const newQuote = { ...quote, id: uuidv4() };
      set({ quotations: [newQuote, ...quotations] });
      return newQuote;
    }
  },

  // ============================================
  // ORDERS
  // ============================================
  fetchOrders: async () => {
    const { isApiReady } = get();
    if (!isApiReady()) return;

    set((state) => ({ loading: { ...state.loading, orders: true } }));
    try {
      const result = await api.orders.getAll();
      if (result.success) {
        set({ orders: result.data });
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      set((state) => ({ loading: { ...state.loading, orders: false } }));
    }
  },

  addOrder: async (order) => {
    const { isApiReady, orders } = get();
    
    if (isApiReady()) {
      set((state) => ({ loading: { ...state.loading, orders: true } }));
      try {
        const result = await api.orders.create(order);
        if (result.success) {
          set({ orders: [result.data, ...orders] });
          return result.data;
        }
        return null;
      } catch (err) {
        console.error('Error creating order:', err);
        return null;
      } finally {
        set((state) => ({ loading: { ...state.loading, orders: false } }));
      }
    } else {
      const newOrder = { ...order, id: uuidv4() };
      set({ orders: [newOrder, ...orders] });
      return newOrder;
    }
  }
}));

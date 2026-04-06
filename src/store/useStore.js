import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import api from '../lib/api';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { getInitialEntityState } from './initialState';

async function getAuthUserId() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * useStore - Zustand store con soporte para API de Supabase
 * 
 * Si Supabase está configurado, usa la API real.
 * Si no, usa los datos mock locales (para desarrollo sin backend).
 */
export const useStore = create((set, get) => ({
  // ============================================
  // ESTADO BASE (vacío con Supabase; mock solo sin API)
  // ============================================
  ...getInitialEntityState(),
  tickets: [],
  automations: [],
  userPreferences: null,
  appNotifications: [],

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
    tickets: false,
    automations: false,
    preferences: false,
    notifications: false,
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
      const uid = await getAuthUserId();
      if (!uid) {
        console.error('No hay sesión para crear cliente');
        return null;
      }
      set((state) => ({ loading: { ...state.loading, customers: true } }));
      try {
        const customerWithUser = {
          name: customer.name,
          company: customer.company,
          email: customer.email,
          phone: customer.phone ?? null,
          city: customer.city ?? 'Medellín',
          customer_type: customer.customer_type ?? 'corporate',
          score: customer.score ?? 50,
          lifetime_value: customer.lifetime_value ?? 0,
          purchase_count: customer.purchase_count ?? 0,
          user_id: uid,
        };
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
      const uid = await getAuthUserId();
      if (!uid) return null;
      set((state) => ({ loading: { ...state.loading, leads: true } }));
      try {
        const payload = {
          first_name: lead.first_name,
          last_name: lead.last_name,
          email: lead.email,
          company: lead.company || '',
          source: lead.source || 'web',
          interest: lead.interest || 'warm',
          score: lead.score ?? 50,
          budget: lead.budget ?? 0,
          status: lead.status || 'new',
          user_id: uid,
        };
        const result = await api.leads.create(payload);
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

  deleteLead: async (id) => {
    const { isApiReady, leads } = get();
    if (isApiReady()) {
      try {
        const result = await api.leads.delete(id);
        if (result.success) set({ leads: leads.filter((l) => l.id !== id) });
      } catch (err) {
        console.error('Error deleting lead:', err);
      }
    } else {
      set({ leads: leads.filter((l) => l.id !== id) });
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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        return {
          ok: false,
          error: 'No hay sesión activa. Cerrá sesión y volvé a iniciar para crear productos.',
        };
      }
      set((state) => ({ loading: { ...state.loading, products: true } }));
      try {
        const result = await api.products.create({
          sku: product.sku,
          name: product.name,
          category: product.category || 'General',
          price: product.price,
          discount_price: product.discount_price ?? null,
          stock: product.stock ?? 0,
          margin: product.margin ?? 0,
          status: product.status || 'active',
        });
        if (result.success) {
          set({ products: [result.data, ...products] });
          return { ok: true, data: result.data };
        }
        const msg = result.error || 'No se pudo crear el producto.';
        console.error('Error creating product:', msg);
        return { ok: false, error: typeof msg === 'string' ? msg : String(msg) };
      } catch (err) {
        console.error('Error creating product:', err);
        return { ok: false, error: err?.message || 'Error de red al crear el producto.' };
      } finally {
        set((state) => ({ loading: { ...state.loading, products: false } }));
      }
    } else {
      const newProduct = { ...product, id: uuidv4(), status: 'active' };
      set({ products: [newProduct, ...products] });
      return { ok: true, data: newProduct };
    }
  },

  deleteProduct: async (id) => {
    const { isApiReady, products } = get();
    if (isApiReady()) {
      try {
        const result = await api.products.delete(id);
        if (result.success) {
          set({ products: products.filter((p) => p.id !== id) });
        } else if (typeof window !== 'undefined') {
          const msg =
            result.error ||
            'No se pudo eliminar el producto. En Supabase ejecutá la migración que añade políticas DELETE en `products` (RLS).';
          window.alert(msg);
        }
      } catch (err) {
        console.error('Error deleting product:', err);
        if (typeof window !== 'undefined') {
          window.alert(err?.message || 'Error al eliminar el producto.');
        }
      }
    } else {
      set({ products: products.filter((p) => p.id !== id) });
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
      const uid = await getAuthUserId();
      if (!uid) return null;
      try {
        const result = await api.opportunities.create({
          name: opp.name,
          value: opp.value ?? 0,
          probability: opp.probability ?? 50,
          customer_id: opp.customer_id || null,
          stage,
          user_id: uid,
        });
        if (result.success) {
          await get().fetchOpportunities();
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

  deleteOpportunity: async (oppId, stage) => {
    const { isApiReady, pipeline } = get();
    if (isApiReady()) {
      try {
        const result = await api.opportunities.delete(oppId);
        if (result.success) {
          set({
            pipeline: {
              ...pipeline,
              [stage]: (pipeline[stage] || []).filter((o) => o.id !== oppId),
            },
          });
        }
      } catch (err) {
        console.error('Error deleting opportunity:', err);
      }
    } else {
      set({
        pipeline: {
          ...pipeline,
          [stage]: (pipeline[stage] || []).filter((o) => o.id !== oppId),
        },
      });
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
      const uid = await getAuthUserId();
      if (!uid) return null;
      set((state) => ({ loading: { ...state.loading, quotations: true } }));
      try {
        const result = await api.quotations.create({
          number: quote.number,
          customer_id: quote.customer_id,
          user_id: uid,
          status: quote.status || 'draft',
          subtotal: quote.subtotal ?? 0,
          tax: quote.tax ?? 0,
          total: quote.total ?? 0,
          validity: quote.validity || null,
        });
        if (result.success) {
          await get().fetchQuotations();
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

  deleteQuotation: async (id) => {
    const { isApiReady, quotations } = get();
    if (isApiReady()) {
      try {
        const result = await api.quotations.delete(id);
        if (result.success) set({ quotations: quotations.filter((q) => q.id !== id) });
      } catch (err) {
        console.error('Error deleting quotation:', err);
      }
    } else {
      set({ quotations: quotations.filter((q) => q.id !== id) });
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
      const uid = await getAuthUserId();
      if (!uid) return null;
      set((state) => ({ loading: { ...state.loading, orders: true } }));
      try {
        const result = await api.orders.create({
          number: order.number,
          customer_id: order.customer_id,
          user_id: uid,
          status: order.status || 'confirmed',
          total: order.total ?? 0,
          carrier: order.carrier || null,
          delivery_date: order.delivery_date || null,
        });
        if (result.success) {
          await get().fetchOrders();
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
  },

  deleteOrder: async (id) => {
    const { isApiReady, orders } = get();
    if (isApiReady()) {
      try {
        const result = await api.orders.delete(id);
        if (result.success) set({ orders: orders.filter((o) => o.id !== id) });
      } catch (err) {
        console.error('Error deleting order:', err);
      }
    } else {
      set({ orders: orders.filter((o) => o.id !== id) });
    }
  },

  // ============================================
  // SUPPORT TICKETS
  // ============================================
  fetchTickets: async () => {
    const { isApiReady } = get();
    if (!isApiReady()) return;
    set((state) => ({ loading: { ...state.loading, tickets: true } }));
    try {
      const result = await api.supportTickets.getAll();
      if (result.success) set({ tickets: result.data });
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      set((state) => ({ loading: { ...state.loading, tickets: false } }));
    }
  },

  addTicket: async (ticket) => {
    const { isApiReady, tickets } = get();
    if (!isApiReady()) {
      const id = `TK-${Date.now().toString().slice(-8)}`;
      const row = {
        id,
        subject: ticket.subject,
        body: ticket.body || null,
        status: 'open',
        customer_label: ticket.customer_label || 'Cliente',
        priority: ticket.priority || 'medium',
        created_at: new Date().toISOString(),
      };
      set({ tickets: [row, ...tickets] });
      return row;
    }
    const uid = await getAuthUserId();
    if (!uid) return null;
    set((state) => ({ loading: { ...state.loading, tickets: true } }));
    try {
      const result = await api.supportTickets.create({
        user_id: uid,
        customer_id: ticket.customer_id || null,
        customer_label: ticket.customer_label || null,
        subject: ticket.subject,
        body: ticket.body || null,
        priority: ticket.priority || 'medium',
        status: 'open',
      });
      if (result.success) {
        set({ tickets: [result.data, ...tickets] });
        return result.data;
      }
      return null;
    } finally {
      set((state) => ({ loading: { ...state.loading, tickets: false } }));
    }
  },

  updateTicket: async (id, updates) => {
    const { isApiReady, tickets } = get();
    if (!isApiReady()) {
      set({ tickets: tickets.map((t) => (t.id === id ? { ...t, ...updates } : t)) });
      return;
    }
    const result = await api.supportTickets.update(id, updates);
    if (result.success) {
      set({ tickets: tickets.map((t) => (t.id === id ? result.data : t)) });
    }
  },

  deleteTicket: async (id) => {
    const { isApiReady, tickets } = get();
    if (isApiReady()) {
      try {
        const result = await api.supportTickets.delete(id);
        if (result.success) set({ tickets: tickets.filter((t) => t.id !== id) });
      } catch (err) {
        console.error('Error deleting ticket:', err);
      }
    } else {
      set({ tickets: tickets.filter((t) => t.id !== id) });
    }
  },

  // ============================================
  // USER PREFERENCES
  // ============================================
  fetchPreferences: async () => {
    const { isApiReady } = get();
    if (!isApiReady()) return;
    set((state) => ({ loading: { ...state.loading, preferences: true } }));
    try {
      const result = await api.userPreferences.get();
      if (result.success) set({ userPreferences: result.data });
    } catch (e) {
      console.error(e);
    } finally {
      set((state) => ({ loading: { ...state.loading, preferences: false } }));
    }
  },

  savePreferences: async (prefs) => {
    const { isApiReady } = get();
    if (!isApiReady()) return null;
    const result = await api.userPreferences.upsert(prefs);
    if (result.success) {
      set({ userPreferences: result.data });
      return result.data;
    }
    return null;
  },

  // ============================================
  // AUTOMATION RULES
  // ============================================
  fetchAutomations: async () => {
    const { isApiReady } = get();
    if (!isApiReady()) return;
    set((state) => ({ loading: { ...state.loading, automations: true } }));
    try {
      const result = await api.automationRules.getAll();
      if (result.success) set({ automations: result.data });
    } catch (e) {
      console.error(e);
    } finally {
      set((state) => ({ loading: { ...state.loading, automations: false } }));
    }
  },

  addAutomationRule: async (rule) => {
    const { isApiReady, automations } = get();
    const uid = await getAuthUserId();
    if (!isApiReady() || !uid) return null;
    const result = await api.automationRules.create({
      user_id: uid,
      name: rule.name,
      trigger_config: rule.trigger_config || {},
      action_config: rule.action_config || {},
      status: rule.status || 'active',
    });
    if (result.success) {
      set({ automations: [result.data, ...automations] });
      return result.data;
    }
    return null;
  },

  updateAutomationRule: async (id, updates) => {
    const { isApiReady, automations } = get();
    if (!isApiReady()) return null;
    const result = await api.automationRules.update(id, updates);
    if (result.success) {
      set({ automations: automations.map((a) => (a.id === id ? result.data : a)) });
      return result.data;
    }
    return null;
  },

  deleteAutomationRule: async (id) => {
    const { isApiReady, automations } = get();
    if (!isApiReady()) {
      set({ automations: automations.filter((a) => a.id !== id) });
      return;
    }
    try {
      const result = await api.automationRules.delete(id);
      if (result.success) set({ automations: automations.filter((a) => a.id !== id) });
    } catch (err) {
      console.error('Error deleting automation rule:', err);
    }
  },

  // ============================================
  // APP NOTIFICATIONS (tabla)
  // ============================================
  fetchAppNotifications: async () => {
    const { isApiReady } = get();
    if (!isApiReady()) return;
    set((state) => ({ loading: { ...state.loading, notifications: true } }));
    try {
      const result = await api.appNotifications.getAll();
      if (result.success) set({ appNotifications: result.data });
    } catch (e) {
      console.error(e);
    } finally {
      set((state) => ({ loading: { ...state.loading, notifications: false } }));
    }
  },

  markNotificationRead: async (id) => {
    const { isApiReady, appNotifications } = get();
    if (!isApiReady()) return;
    const result = await api.appNotifications.markRead(id);
    if (result.success) {
      set({
        appNotifications: appNotifications.map((n) =>
          n.id === id ? { ...n, read_at: result.data.read_at } : n
        ),
      });
    }
  },

  markAllNotificationsRead: async () => {
    const { isApiReady } = get();
    if (!isApiReady()) return;
    const result = await api.appNotifications.markAllRead();
    if (result.success) await get().fetchAppNotifications();
  },

  // ============================================
  // SEARCH
  // ============================================
  searchCrm: async (q) => {
    const { isApiReady } = get();
    if (!isApiReady()) return [];
    const result = await api.search.crm(q);
    return result.success ? result.data : [];
  }
}));

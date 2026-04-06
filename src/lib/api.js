/**
 * API Service - Capa de abstracción para llamadas a Supabase
 * Este archivo proporciona una interfaz de API consistente
 * que puede ser llamada desde el store de Zustand
 */

import { supabase } from './supabase'

// ============================================
// HELPERS
// ============================================

const handleError = (error) => {
  console.error('API Error:', error)
  return { success: false, error: error.message }
}

const handleSuccess = (data) => {
  return { success: true, data }
}

// ============================================
// CUSTOMERS API
// ============================================

export const api = {
  // CUSTOMERS
  customers: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) return handleError(error)
      return handleSuccess(data)
    },

    getById: async (id) => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single()
      if (error) return handleError(error)
      return handleSuccess(data)
    },

    create: async (customer) => {
      const { data, error } = await supabase
        .from('customers')
        .insert([customer])
        .select()
        .single()
      if (error) return handleError(error)
      return handleSuccess(data)
    },

    update: async (id, updates) => {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) return handleError(error)
      return handleSuccess(data)
    },

    delete: async (id) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)
      if (error) return handleError(error)
      return handleSuccess({ deleted: true })
    }
  },

  // LEADS
  leads: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) return handleError(error)
      return handleSuccess(data)
    },

    getById: async (id) => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single()
      if (error) return handleError(error)
      return handleSuccess(data)
    },

    create: async (lead) => {
      const { data, error } = await supabase
        .from('leads')
        .insert([lead])
        .select()
        .single()
      if (error) return handleError(error)
      return handleSuccess(data)
    },

    update: async (id, updates) => {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) return handleError(error)
      return handleSuccess(data)
    },

    delete: async (id) => {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id)
      if (error) return handleError(error)
      return handleSuccess({ deleted: true })
    },

    convert: async (id) => {
      const { data, error } = await supabase
        .from('leads')
        .update({ status: 'converted' })
        .eq('id', id)
        .select()
        .single()
      if (error) return handleError(error)
      return handleSuccess(data)
    }
  },

  // OPPORTUNITIES (Pipeline)
  opportunities: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*, customers(name, company)')
        .order('created_at', { ascending: false })
      if (error) return handleError(error)
      const rows = (data || []).map((row) => ({
        ...row,
        customer:
          row.customers?.name ||
          row.customers?.company ||
          row.customer ||
          null,
      }))
      return handleSuccess(rows)
    },

    create: async (opportunity) => {
      const { data, error } = await supabase
        .from('opportunities')
        .insert([opportunity])
        .select()
        .single()
      if (error) return handleError(error)
      return handleSuccess(data)
    },

    update: async (id, updates) => {
      const { data, error } = await supabase
        .from('opportunities')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) return handleError(error)
      return handleSuccess(data)
    },

    moveStage: async (id, newStage) => {
      const { data, error } = await supabase
        .from('opportunities')
        .update({ stage: newStage })
        .eq('id', id)
        .select()
        .single()
      if (error) return handleError(error)
      return handleSuccess(data)
    },

    delete: async (id) => {
      const { error } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', id)
      if (error) return handleError(error)
      return handleSuccess({ deleted: true })
    }
  },

  // PRODUCTS
  products: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) return handleError(error)
      return handleSuccess(data)
    },

    getById: async (id) => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()
      if (error) return handleError(error)
      return handleSuccess(data)
    },

    create: async (product) => {
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single()
      if (error) return handleError(error)
      return handleSuccess(data)
    },

    update: async (id, updates) => {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) return handleError(error)
      return handleSuccess(data)
    },

    delete: async (id) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
      if (error) return handleError(error)
      return handleSuccess({ deleted: true })
    }
  },

  // QUOTATIONS
  quotations: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('quotations')
        .select('*, customers(name, company)')
        .order('created_at', { ascending: false })
      if (error) return handleError(error)
      const rows = (data || []).map((row) => ({
        ...row,
        quote_number: row.number,
        customer_name:
          row.customers?.name || row.customers?.company || '—',
        valid_until: row.validity,
      }))
      return handleSuccess(rows)
    },

    create: async (quotation) => {
      const { data, error } = await supabase
        .from('quotations')
        .insert([quotation])
        .select()
        .single()
      if (error) return handleError(error)
      return handleSuccess(data)
    },

    update: async (id, updates) => {
      const { data, error } = await supabase
        .from('quotations')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) return handleError(error)
      return handleSuccess(data)
    },

    delete: async (id) => {
      const { error } = await supabase
        .from('quotations')
        .delete()
        .eq('id', id)
      if (error) return handleError(error)
      return handleSuccess({ deleted: true })
    }
  },

  // ORDERS
  orders: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, customers(name, company)')
        .order('created_at', { ascending: false })
      if (error) return handleError(error)
      const rows = (data || []).map((row) => ({
        ...row,
        order_number: row.number,
        customer_name:
          row.customers?.name || row.customers?.company || '—',
      }))
      return handleSuccess(rows)
    },

    create: async (order) => {
      const { data, error } = await supabase
        .from('orders')
        .insert([order])
        .select()
        .single()
      if (error) return handleError(error)
      return handleSuccess(data)
    },

    update: async (id, updates) => {
      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) return handleError(error)
      return handleSuccess(data)
    },

    delete: async (id) => {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id)
      if (error) return handleError(error)
      return handleSuccess({ deleted: true })
    }
  },

  supportTickets: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) return handleError(error)
      return handleSuccess(data)
    },
    create: async (row) => {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert([row])
        .select()
        .single()
      if (error) return handleError(error)
      return handleSuccess(data)
    },
    update: async (id, updates) => {
      const { data, error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) return handleError(error)
      return handleSuccess(data)
    },

    delete: async (id) => {
      const { error } = await supabase
        .from('support_tickets')
        .delete()
        .eq('id', id)
      if (error) return handleError(error)
      return handleSuccess({ deleted: true })
    }
  },

  userPreferences: {
    get: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { success: false, error: 'No session' }
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      if (error) return handleError(error)
      return handleSuccess(data)
    },
    upsert: async (prefs) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { success: false, error: 'No session' }
      const payload = {
        user_id: user.id,
        ai_assistant_enabled: prefs.ai_assistant_enabled ?? false,
        notification_flags: prefs.notification_flags ?? {},
        updated_at: new Date().toISOString()
      }
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .single()
      if (error) return handleError(error)
      return handleSuccess(data)
    }
  },

  automationRules: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('automation_rules')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) return handleError(error)
      return handleSuccess(data)
    },
    create: async (row) => {
      const { data, error } = await supabase
        .from('automation_rules')
        .insert([row])
        .select()
        .single()
      if (error) return handleError(error)
      return handleSuccess(data)
    },
    update: async (id, updates) => {
      const { data, error } = await supabase
        .from('automation_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) return handleError(error)
      return handleSuccess(data)
    },
    delete: async (id) => {
      const { error } = await supabase
        .from('automation_rules')
        .delete()
        .eq('id', id)
      if (error) return handleError(error)
      return handleSuccess({ deleted: true })
    }
  },

  appNotifications: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) return handleError(error)
      return handleSuccess(data)
    },
    markRead: async (id) => {
      const { data, error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) return handleError(error)
      return handleSuccess(data)
    },
    markAllRead: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { success: false, error: 'No session' }
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null)
      if (error) return handleError(error)
      return handleSuccess({ ok: true })
    }
  },

  search: {
    crm: async (searchQuery) => {
      const q = (searchQuery || '').trim()
      if (!q) return handleSuccess([])
      const { data, error } = await supabase.rpc('search_crm', { search_query: q })
      if (error) return handleError(error)
      return handleSuccess(data || [])
    }
  }
}

export default api

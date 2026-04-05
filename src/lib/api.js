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
        .select('*')
        .order('created_at', { ascending: false })
      if (error) return handleError(error)
      return handleSuccess(data)
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
        .select('*')
        .order('created_at', { ascending: false })
      if (error) return handleError(error)
      return handleSuccess(data)
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
    }
  },

  // ORDERS
  orders: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) return handleError(error)
      return handleSuccess(data)
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
    }
  }
}

export default api

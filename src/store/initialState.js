import { isSupabaseConfigured } from '../lib/supabase';
import {
  CUSTOMERS,
  LEADS,
  PRODUCTS,
  PIPELINE_DATA,
  QUOTATIONS,
  ORDERS,
} from '../data/mockData';

/** Pipeline vacío con todas las etapas que usa el store / embudo */
export const EMPTY_PIPELINE = {
  lead: [],
  contact: [],
  qualification: [],
  proposal: [],
  negotiation: [],
  closed_won: [],
  closed_lost: [],
};

/**
 * Estado inicial de entidades CRM: vacío si hay Supabase (solo datos remotos tras fetch);
 * mock solo cuando no hay API (desarrollo offline).
 */
export function getInitialEntityState() {
  if (isSupabaseConfigured()) {
    return {
      customers: [],
      leads: [],
      products: [],
      pipeline: { ...EMPTY_PIPELINE },
      quotations: [],
      orders: [],
    };
  }
  return {
    customers: CUSTOMERS,
    leads: LEADS,
    products: PRODUCTS,
    pipeline: { ...PIPELINE_DATA, closed_lost: PIPELINE_DATA.closed_lost ?? [] },
    quotations: QUOTATIONS,
    orders: ORDERS,
  };
}

/**
 * Métricas derivadas de los datos del CRM (Supabase / store), sin cifras inventadas.
 */

function parseDate(d) {
  if (!d) return null;
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? null : t;
}

export function isInRange(dateStr, from, to) {
  const t = parseDate(dateStr);
  if (!t || !from || !to) return true;
  return t >= from && t <= to;
}

export function getRangeFromPreset(preset) {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  let start;
  if (preset === '7d') {
    start = new Date(end);
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
  } else if (preset === '30d') {
    start = new Date(end);
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
  } else if (preset === '90d') {
    start = new Date(end);
    start.setDate(start.getDate() - 90);
    start.setHours(0, 0, 0, 0);
  } else {
    start = new Date(0);
  }
  return { from: start, to: end };
}

export function sumOrdersTotal(orders, range) {
  return (orders || []).reduce((s, o) => {
    if (range && !isInRange(o.created_at, range.from, range.to)) return s;
    return s + (Number(o.total) || 0);
  }, 0);
}

export function countEntities(rows, range) {
  if (!range) return (rows || []).length;
  return (rows || []).filter((r) => isInRange(r.created_at, range.from, range.to)).length;
}

export function pipelineTotals(pipeline) {
  let count = 0;
  let value = 0;
  Object.values(pipeline || {}).forEach((arr) => {
    (arr || []).forEach((o) => {
      count += 1;
      value += Number(o.value) || 0;
    });
  });
  return { count, value };
}

export function leadsByStatus(leads) {
  const m = { new: 0, contacted: 0, qualified: 0, converted: 0, lost: 0 };
  (leads || []).forEach((l) => {
    if (m[l.status] !== undefined) m[l.status] += 1;
  });
  return m;
}

export function formatCurrency(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n || 0).toLocaleString('es-CO')}`;
}

/** Últimos 6 meses calendario con suma de total de pedidos por mes */
export function buildLast6MonthsOrderTrend(orders) {
  const now = new Date();
  const out = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('es-CO', { month: 'short' });
    const y = d.getFullYear();
    const m = d.getMonth();
    const sum = (orders || []).reduce((s, o) => {
      const t = parseDate(o.created_at);
      if (!t) return s;
      if (t.getFullYear() === y && t.getMonth() === m) return s + (Number(o.total) || 0);
      return s;
    }, 0);
    out.push({ date: label, amount: sum });
  }
  return out;
}

export function buildFunnelRows(leads, pipeline) {
  const lb = leadsByStatus(leads);
  const leadCount = (leads || []).length;
  const contacted = lb.contacted + lb.qualified + lb.converted + (lb.lost || 0);
  const qualified = lb.qualified + lb.converted;
  const proposals = (pipeline?.proposal || []).length + (pipeline?.negotiation || []).length + (pipeline?.closed_won || []).length;
  const closed = (pipeline?.closed_won || []).length + lb.converted;

  const rows = [
    { stage: 'Leads', count: leadCount, pct: leadCount ? 100 : 0 },
    { stage: 'Contactados', count: Math.max(contacted, 0), pct: leadCount ? Math.round((contacted / leadCount) * 100) : 0 },
    { stage: 'Calificados', count: qualified, pct: leadCount ? Math.round((qualified / leadCount) * 100) : 0 },
    { stage: 'Pipeline activo', count: proposals, pct: leadCount ? Math.min(100, Math.round((proposals / Math.max(leadCount, 1)) * 100)) : 0 },
    { stage: 'Cierres / convertidos', count: closed, pct: leadCount ? Math.round((closed / leadCount) * 100) : 0 },
  ];
  return rows;
}

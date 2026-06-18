const PAGE_TITLES = {
  dashboard: { title: 'Dashboard', subtitle: 'Resumen de tu gestión comercial' },
  customers: { title: 'Clientes', subtitle: 'Gestión de clientes' },
  leads: { title: 'Dirige', subtitle: 'Gestión de prospectos' },
  pipeline: { title: 'Embudo de Ventas', subtitle: 'Pipeline de oportunidades' },
  products: { title: 'Productos', subtitle: 'Catálogo de productos' },
  quotations: { title: 'Cotizaciones', subtitle: 'Gestión de cotizaciones' },
  orders: { title: 'Pedidos', subtitle: 'Gestión de pedidos' },
  automations: { title: 'Automatizaciones', subtitle: 'Workflow automation' },
  meta: { title: 'Meta', subtitle: 'Lead Ads, WhatsApp y webhooks' },
  reports: { title: 'Reportes', subtitle: 'Analytics y métricas' },
  ai: { title: 'IA Comercial', subtitle: 'Inteligencia artificial' },
  postsale: { title: 'Postventa', subtitle: 'Soporte y seguimiento' },
  settings: { title: 'Configuración', subtitle: 'Ajustes del sistema' },
  users: { title: 'Usuarios', subtitle: 'Gestión de equipo' },
};

const STAGE_COLORS = {
  lead: '#94a3b8',
  contact: '#3b82f6',
  qualification: '#8b5cf6',
  proposal: '#a78bfa',
  negotiation: '#f59e0b',
  closed_won: '#10b981',
};

export { PAGE_TITLES, STAGE_COLORS };

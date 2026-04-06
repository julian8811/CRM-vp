import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAuth } from './contexts/AuthContext';
import { useCrmModal } from './contexts/CrmModalContext';
import { CrmModalsHost } from './components/CrmModalsHost';
import { Layout } from './components/layout/Layout';
import { Button } from './components/ui/Button';
import { Card, CardContent } from './components/ui/Card';
import { Badge } from './components/ui/Badge';
import { Avatar } from './components/ui/Avatar';
import { DataTable } from './components/ui/DataTable';
import { Input } from './components/ui/Input';
import { Label } from './components/ui/Label';
import { Loader2, Plus, TrendingUp, DollarSign, Users, Target, ShoppingCart, GripVertical, MapPin, Building2, Mail, Phone, Edit2, Trash2, ArrowRightCircle, Package, AlertTriangle, FileText, Clock, CheckCircle, XCircle, Send, BarChart3, PieChart, Activity, Zap, Settings, UserPlus, Wrench, Headphones, Download, Filter, Eye, FileDown, Calendar, RefreshCw, Copy, Check, X, ChevronRight, Sparkles, Bot, Lightbulb, TrendingDown, UsersRound, Receipt, CreditCard, FileCheck, Workflow, Play, Pause, Clock3, Bell } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from './store/useStore';
import {
  formatCurrency,
  getRangeFromPreset,
  isInRange,
  pipelineTotals,
  sumOrdersTotal,
  buildFunnelRows,
  buildLast6MonthsOrderTrend,
  countEntities,
} from './lib/crmMetrics';
import { exportWorkbook } from './lib/exportExcel';
import { invokeCrmAi } from './lib/crmAi';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { updateProfile } from './lib/auth';

const PAGE_TITLES = {
  dashboard: { title: 'Dashboard', subtitle: 'Resumen de tu gestión comercial' },
  customers: { title: 'Clientes', subtitle: 'Gestión de clientes' },
  leads: { title: 'Leads', subtitle: 'Gestión de prospectos' },
  pipeline: { title: 'Embudo de Ventas', subtitle: 'Pipeline de oportunidades' },
  products: { title: 'Productos', subtitle: 'Catálogo de productos' },
  quotations: { title: 'Cotizaciones', subtitle: 'Gestión de cotizaciones' },
  orders: { title: 'Pedidos', subtitle: 'Gestión de pedidos' },
  automations: { title: 'Automatizaciones', subtitle: 'Workflow automation' },
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

function DashboardContent() {
  const { openModal } = useCrmModal();
  const pipeline = useStore(state => state.pipeline) || {};
  const customers = useStore(state => state.customers);
  const leads = useStore(state => state.leads);
  const orders = useStore(state => state.orders);
  const range30 = useMemo(() => getRangeFromPreset('30d'), []);

  const pt = useMemo(() => pipelineTotals(pipeline), [pipeline]);
  const sales30 = useMemo(() => sumOrdersTotal(orders, range30), [orders, range30]);
  const newLeadsCount = useMemo(
    () =>
      (leads || []).filter(
        (l) => l.status === 'new' && isInRange(l.created_at, range30.from, range30.to)
      ).length,
    [leads, range30]
  );
  const ordersInRange = useMemo(
    () =>
      (orders || []).filter((o) => isInRange(o.created_at, range30.from, range30.to)).length,
    [orders, range30]
  );
  const avgTicket = ordersInRange > 0 ? sales30 / ordersInRange : 0;
  const leadTotal = (leads || []).filter((l) => isInRange(l.created_at, range30.from, range30.to)).length;
  const convPct = leadTotal > 0 ? Math.round(((leads || []).filter((l) => l.status === 'converted').length / Math.max(leadTotal, 1)) * 100) : 0;

  const stats = [
    { icon: DollarSign, label: 'Ventas (30 días)', value: formatCurrency(sales30), change: null, color: 'blue' },
    { icon: TrendingUp, label: 'Conversión (aprox.)', value: `${convPct}%`, change: null, color: 'green' },
    { icon: ShoppingCart, label: 'Ticket prom. (30d)', value: formatCurrency(avgTicket), change: null, color: 'purple' },
    { icon: Users, label: 'Leads nuevos (30d)', value: String(newLeadsCount), change: null, color: 'amber' },
    { icon: Target, label: 'Pipeline (valor)', value: formatCurrency(pt.value), change: null, color: 'indigo' },
  ];

  const salesTrend = useMemo(() => buildLast6MonthsOrderTrend(orders), [orders]);

  const pipelineSummary = Object.entries(pipeline).map(([stage, opps]) => ({
    stage,
    count: opps?.length || 0,
    value: (opps || []).reduce((s, o) => s + (o.value || 0), 0),
  }));

  const topSellers = useMemo(() => {
    if (pt.count === 0 && (orders || []).length === 0) return [];
    return [
      {
        name: 'Resumen operativo',
        deals: pt.count,
        total: pt.value || sales30,
      },
    ];
  }, [pt, orders, sales30]);

  const quickActions = [
    { id: 'customer', icon: Users, label: 'Nuevo cliente', color: 'bg-blue-500' },
    { id: 'lead', icon: Target, label: 'Nuevo lead', color: 'bg-emerald-500' },
    { id: 'quotation', icon: DollarSign, label: 'Nueva cotización', color: 'bg-violet-500' },
    { id: 'order', icon: ShoppingCart, label: 'Nuevo pedido', color: 'bg-amber-500' },
  ];

  const openQuick = (id) => {
    const map = { customer: 'customer', lead: 'lead', quotation: 'quotation', order: 'order' };
    const name = map[id];
    if (name) openModal(name);
  };

  return (
    <div className="space-y-6">
      {customers.length === 0 && leads.length === 0 && orders.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          Todavía no hay datos cargados: las cifras de este panel salen de <strong>clientes, leads y pedidos</strong> en tu base (Supabase). Creá registros o importá desde las secciones del menú.
        </div>
      )}
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx} hover>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-xl bg-${stat.color}-500/10`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
                </div>
                {stat.change && (
                  <Badge variant="green">{stat.change}</Badge>
                )}
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Tendencia de Ventas</h3>
                <p className="text-sm text-slate-500">Últimos 6 meses</p>
              </div>
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => (v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : `$${Math.round(v / 1e3)}k`)} />
                  <Tooltip formatter={(v) => [`$${Number(v).toLocaleString('es-CO')}`, 'Ventas']} />
                  <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Embudo</h3>
                <p className="text-sm text-slate-500">
                  {Object.values(pipeline).flat().length} oportunidades
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {pipelineSummary.filter(s => s.stage !== 'closed_lost').map(s => {
                const maxC = Math.max(...pipelineSummary.map(p => p.count), 1);
                return (
                  <div key={s.stage}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">{s.stage}</span>
                      <span className="text-slate-500">{s.count}</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${(s.count / maxC) * 100}%`, backgroundColor: STAGE_COLORS[s.stage] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Sellers */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Pipeline y ventas</h3>
            <div className="space-y-4">
              {topSellers.length === 0 ? (
                <p className="text-sm text-slate-500">Sin datos de oportunidades ni pedidos todavía.</p>
              ) : (
                topSellers.map((seller, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500">
                      {idx + 1}
                    </span>
                    <Avatar name={seller.name} size="sm" />
                    <div className="flex-1">
                      <div className="font-medium text-slate-900 dark:text-white">{seller.name}</div>
                      <div className="text-xs text-slate-500">{seller.deals} oportunidades en pipeline (periodo actual)</div>
                    </div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(seller.total)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Acciones Rápidas</h3>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map(action => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => openQuick(action.id)}
                  className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                >
                  <div className={`p-2 rounded-lg ${action.color}`}>
                    <action.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Login Page Component
function LoginPage() {
  const { login, register, error, loading, isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [registerError, setRegisterError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRegisterError('');
    
    if (isRegistering) {
      const { error: regError } = await register(email, password, firstName, lastName);
      if (regError) {
        setRegisterError(regError.message);
      } else {
        setRegisterSuccess(true);
      }
    } else {
      await login(email, password);
    }
  };

  if (!isConfigured) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#1B3A5C] via-[#162F4A] to-[#0f2035] lg:flex-row">
        <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
          <div className="max-w-md">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-white">CRM-VP</span>
            </div>
            <h1 className="mb-4 text-3xl font-bold text-white sm:text-4xl">Sistema CRM Innovador</h1>
            <p className="mb-8 text-blue-200">Gestiona tu ciclo comercial con inteligencia artificial.</p>
            <div className="rounded-xl bg-white/10 p-6 text-sm text-blue-200 backdrop-blur">
              <p className="mb-2 font-semibold text-white">Configuración requerida:</p>
              <ol className="list-inside list-decimal space-y-1">
                <li>Crea un proyecto en Supabase</li>
                <li>Ejecuta el schema SQL</li>
                <li>Configura .env.local</li>
              </ol>
            </div>
          </div>
        </div>
        <div className="flex w-full items-center justify-center bg-white p-8 dark:bg-slate-800 sm:p-12 lg:w-[480px] lg:max-w-none lg:flex-shrink-0">
          <div className="w-full max-w-sm text-center">
            <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">Configuración Requerida</h2>
            <p className="mb-6 text-slate-500">Completá las variables de entorno</p>
          </div>
        </div>
      </div>
    );
  }

  if (registerSuccess) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#1B3A5C] via-[#162F4A] to-[#0f2035] lg:flex-row">
        <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
          <div className="max-w-md">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-white">CRM-VP</span>
            </div>
            <h1 className="mb-4 text-3xl font-bold text-white sm:text-4xl">Sistema CRM Innovador</h1>
            <p className="text-blue-200">Gestiona tu ciclo comercial.</p>
          </div>
        </div>
        <div className="flex w-full items-center justify-center bg-white p-8 dark:bg-slate-800 sm:p-12 lg:w-[480px] lg:max-w-none lg:flex-shrink-0">
          <div className="w-full max-w-sm text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">¡Registro Exitoso!</h2>
            <p className="mb-6 text-slate-500">Verificá tu correo electrónico.</p>
            <Button onClick={() => setRegisterSuccess(false)} className="w-full">
              Volver al login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#1B3A5C] via-[#162F4A] to-[#0f2035] lg:flex-row">
      {/* Left - Branding */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden p-6 sm:p-12">
        <div className="absolute left-10 top-16 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl sm:left-20 sm:top-20" />
        <div className="absolute bottom-16 right-10 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl sm:bottom-20 sm:right-20" />
        <div className="relative z-10 max-w-md">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-500/30">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">CRM-VP</span>
          </div>
          <h1 className="mb-4 text-3xl font-bold leading-tight text-white sm:text-4xl">
            Sistema CRM Innovador para Ventas
          </h1>
          <p className="text-lg text-blue-200">
            Gestiona tu ciclo comercial con inteligencia artificial, automatización y analítica avanzada.
          </p>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex w-full items-center justify-center bg-white p-6 dark:bg-slate-800 sm:p-12 lg:w-[480px] lg:max-w-none lg:flex-shrink-0">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {isRegistering ? 'Crear Cuenta' : 'Bienvenido'}
          </h2>
          <p className="text-slate-500 mb-6">
            {isRegistering ? 'Regístrate para comenzar' : 'Inicia sesión para continuar'}
          </p>

          {(error || registerError) && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
              {registerError || error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label required>Nombre</Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Juan"
                  />
                </div>
                <div>
                  <Label required>Apellido</Label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Pérez"
                  />
                </div>
              </div>
            )}

            <div>
              <Label required>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juan@empresa.com"
              />
            </div>

            <div>
              <Label required>Contraseña</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {isRegistering ? '¿Ya tenés cuenta? Iniciá sesión' : '¿No tenés cuenta? Registrate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading Screen
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
        <p className="text-slate-500">Cargando...</p>
      </div>
    </div>
  );
}

// Main App
export default function App() {
  const { user, profile, loading: authLoading, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // Fetch data when user logs in
  const fetchCustomers = useStore(state => state.fetchCustomers);
  const fetchLeads = useStore(state => state.fetchLeads);
  const fetchProducts = useStore(state => state.fetchProducts);
  const fetchOpportunities = useStore(state => state.fetchOpportunities);
  const fetchQuotations = useStore(state => state.fetchQuotations);
  const fetchOrders = useStore(state => state.fetchOrders);
  const fetchTickets = useStore(state => state.fetchTickets);
  const fetchAutomations = useStore(state => state.fetchAutomations);
  const fetchPreferences = useStore(state => state.fetchPreferences);
  const fetchAppNotifications = useStore(state => state.fetchAppNotifications);
  
  useEffect(() => {
    if (user) {
      fetchCustomers();
      fetchLeads();
      fetchProducts();
      fetchOpportunities();
      fetchQuotations();
      fetchOrders();
      fetchTickets();
      fetchAutomations();
      fetchPreferences();
      fetchAppNotifications();
    }
  }, [user, fetchCustomers, fetchLeads, fetchProducts, fetchOpportunities, fetchQuotations, fetchOrders, fetchTickets, fetchAutomations, fetchPreferences, fetchAppNotifications]);

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoginPage />;
  }

  const pageInfo = PAGE_TITLES[currentPage] || { title: currentPage, subtitle: '' };
  const meta = user.user_metadata || {};
  const layoutUser = {
    first_name: profile?.first_name ?? meta.first_name ?? user.email?.split('@')[0] ?? '',
    last_name: profile?.last_name ?? meta.last_name ?? '',
    role: profile?.role ?? meta.role ?? 'sales',
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardContent />;
      case 'customers':
        return <CustomersContent />;
      case 'leads':
        return <LeadsContent />;
      case 'pipeline':
        return <PipelineContent />;
      case 'products':
        return <ProductsContent />;
      case 'quotations':
        return <QuotationsContent />;
      case 'orders':
        return <OrdersContent />;
      case 'automations':
        return <AutomationsContent />;
      case 'reports':
        return <ReportsContent />;
      case 'ai':
        return <AIContent />;
      case 'postsale':
        return <PostsaleContent />;
      case 'settings':
        return <SettingsContent />;
      case 'users':
        return <UsersContent />;
      default:
        return (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{pageInfo.title}</h3>
              <p className="text-slate-500">Módulo en desarrollo</p>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <Layout
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        user={layoutUser}
        onLogout={logout}
        title={pageInfo.title}
        subtitle={pageInfo.subtitle}
      >
        {renderPage()}
      </Layout>
      <CrmModalsHost />
    </>
  );
}

// Customers Page
function CustomersContent() {
  const { openModal } = useCrmModal();
  const customers = useStore(state => state.customers);
  const deleteCustomer = useStore(state => state.deleteCustomer);
  
  const columns = [
    { key: 'name', header: 'Cliente', sortable: true, render: (val, row) => (
      <div className="flex items-center gap-3">
        <Avatar name={val} size="sm" />
        <div>
          <div className="font-medium text-slate-900 dark:text-white">{val}</div>
          <div className="text-xs text-slate-500">{row.email}</div>
        </div>
      </div>
    )},
    { key: 'company', header: 'Empresa', render: (val) => (
      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
        <Building2 className="w-4 h-4 text-slate-400" />
        {val}
      </div>
    )},
    { key: 'city', header: 'Ciudad', render: (val) => (
      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
        <MapPin className="w-4 h-4 text-slate-400" />
        {val}
      </div>
    )},
    { key: 'customer_type', header: 'Tipo', render: (val) => (
      <Badge variant={val === 'corporate' ? 'blue' : 'gray'}>
        {val === 'corporate' ? 'Corporativo' : 'PYME'}
      </Badge>
    )},
    { key: 'score', header: 'Score', sortable: true, render: (val) => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${val}%`, background: val >= 70 ? '#10b981' : val >= 40 ? '#f59e0b' : '#ef4444' }} />
        </div>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{val}</span>
      </div>
    )},
    { key: 'lifetime_value', header: 'Valor total', sortable: true, render: (val) => (
      <span className="font-semibold text-slate-900 dark:text-white">${Math.round(val).toLocaleString()}</span>
    )},
    { key: 'actions', header: '', render: (val, row) => (
      <div className="flex items-center gap-2 justify-end">
        <button type="button" onClick={() => openModal('customer', { customer: row })} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-500 transition-colors">
          <Edit2 className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => deleteCustomer(row.id)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-red-500 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )},
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Clientes</h2>
          <p className="text-sm text-slate-500">{customers.length} clientes registrados</p>
        </div>
        <Button type="button" onClick={() => openModal('customer')} className="w-full justify-center sm:w-auto">
          <Plus className="w-4 h-4" />
          Nuevo Cliente
        </Button>
      </div>
      <DataTable columns={columns} data={customers} searchPlaceholder="Buscar clientes..." pageName="customers" />
    </div>
  );
}

// Leads Page
function LeadsContent() {
  const { openModal } = useCrmModal();
  const leads = useStore(state => state.leads);
  const convertLead = useStore(state => state.convertLead);
  
  const columns = [
    { key: 'name', header: 'Lead', sortable: true, render: (val, row) => (
      <div className="flex items-center gap-3">
        <Avatar name={`${row.first_name} ${row.last_name}`} size="sm" />
        <div>
          <div className="font-medium text-slate-900 dark:text-white">{row.first_name} {row.last_name}</div>
          <div className="text-xs text-slate-500">{row.email}</div>
        </div>
      </div>
    )},
    { key: 'company', header: 'Empresa' },
    { key: 'source', header: 'Fuente', render: (val) => <Badge variant="gray">{val}</Badge> },
    { key: 'interest', header: 'Interés', render: (val) => {
      const styles = { hot: 'red', warm: 'amber', cold: 'blue' };
      const labels = { hot: '🔥 Caliente', warm: '🌤 Tibio', cold: '❄️ Frío' };
      return <Badge variant={styles[val] || 'gray'}>{labels[val] || val}</Badge>;
    }},
    { key: 'status', header: 'Estado', render: (val) => {
      const variants = { new: 'blue', contacted: 'amber', qualified: 'green', converted: 'purple', lost: 'gray' };
      return <Badge variant={variants[val] || 'gray'}>{val}</Badge>;
    }},
    { key: 'score', header: 'Score', sortable: true, render: (val) => (
      <span className={`font-bold ${val >= 70 ? 'text-emerald-600' : val >= 40 ? 'text-amber-600' : 'text-slate-400'}`}>{val}</span>
    )},
    { key: 'budget', header: 'Presupuesto', render: (val) => val ? <span className="text-slate-600 dark:text-slate-400">${Math.round(val).toLocaleString()}</span> : '—' },
    { key: 'actions', header: '', render: (val, row) => (
      <div className="flex justify-center">
        {row.status !== 'converted' ? (
          <Button size="sm" variant="outline" type="button" onClick={() => convertLead(row.id)}>
            <ArrowRightCircle className="w-3 h-3" />
            Convertir
          </Button>
        ) : <Badge variant="purple">✓ Convertido</Badge>}
      </div>
    )},
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Leads</h2>
          <p className="text-sm text-slate-500">{leads.length} leads registrados</p>
        </div>
        <Button type="button" onClick={() => openModal('lead')} className="w-full justify-center sm:w-auto">
          <Plus className="w-4 h-4" />
          Nuevo Lead
        </Button>
      </div>
      <DataTable columns={columns} data={leads} searchPlaceholder="Buscar leads..." pageName="leads" />
    </div>
  );
}

// Products Page
function ProductsContent() {
  const { openModal } = useCrmModal();
  const products = useStore(state => state.products);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Productos</h2>
          <p className="text-sm text-slate-500">{products.length} productos en catálogo</p>
        </div>
        <Button type="button" onClick={() => openModal('product')} className="w-full justify-center sm:w-auto">
          <Plus className="w-4 h-4" />
          Nuevo Producto
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map(product => (
          <Card key={product.id} hover className="overflow-hidden">
            <div className="h-24 bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center relative">
              <Package className="w-10 h-10 text-slate-300" />
              {product.stock <= 5 && (
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs px-2 py-1 rounded-full font-medium">
                  <AlertTriangle className="w-3 h-3" /> Stock bajo
                </div>
              )}
              <div className="absolute top-2 left-2">
                <Badge variant="green">Activo</Badge>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="text-xs text-slate-500 font-mono mb-1">{product.sku}</div>
              <div className="font-semibold text-slate-900 dark:text-white mb-2 line-clamp-2">{product.name}</div>
              <div className="flex items-baseline gap-2 mb-3">
                {product.discount_price ? (
                  <>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">${Math.round(product.discount_price).toLocaleString()}</span>
                    <span className="text-sm text-slate-400 line-through">${Math.round(product.price).toLocaleString()}</span>
                  </>
                ) : (
                  <span className="text-lg font-bold text-slate-900 dark:text-white">${Math.round(product.price).toLocaleString()}</span>
                )}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Stock: <span className={`font-medium ${product.stock <= 5 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>{product.stock}</span></span>
                <span className="text-slate-500">Margen: <span className="font-medium text-slate-700 dark:text-slate-300">{product.margin}%</span></span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Componente de tarjeta de oportunidad en el Pipeline
function OpportunityCard({ opp, stage }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: opp.id,
    data: { type: 'opportunity', opp, stage },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-slate-900 dark:text-white mb-1 truncate">{opp.name}</div>
          {opp.customer && (
            <div className="text-xs text-slate-500 mb-2 truncate">{opp.customer}</div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              ${(opp.value / 1000000).toFixed(1)}M
            </span>
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
              opp.probability >= 70 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
              opp.probability >= 40 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {opp.probability}%
            </span>
          </div>
          {opp.assignee && (
            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
              <Avatar name={opp.assignee} size="xs" />
              <span className="text-xs text-slate-500">{opp.assignee}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Columna del Kanban
function PipelineColumn({ stage, opps }) {
  const {
    setNodeRef,
    isOver,
  } = useSortable({
    id: stage,
    data: { type: 'column', stage },
  });

  const total = opps.reduce((s, o) => s + (o.value || 0), 0);

  return (
    <div className="flex-shrink-0 w-72">
      <div className={`bg-slate-100 dark:bg-slate-800 rounded-t-xl p-3 flex items-center justify-between transition-colors ${isOver ? 'bg-blue-100 dark:bg-blue-900/30' : ''}`}>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STAGE_COLORS[stage] }} />
          <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">{stage.replace('_', ' ')}</span>
          <span className="text-xs bg-white dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-500">{opps.length}</span>
        </div>
        <span className="text-xs text-slate-500">${(total / 1000000).toFixed(1)}M</span>
      </div>
      <div
        ref={setNodeRef}
        className={`bg-slate-50 dark:bg-slate-900/50 rounded-b-xl p-2 min-h-[400px] space-y-2 transition-colors ${isOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
      >
        <SortableContext items={opps.map(o => o.id)} strategy={verticalListSortingStrategy}>
          {opps.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-400">Sin oportunidades</div>
          ) : (
            opps.map(opp => (
              <OpportunityCard key={opp.id} opp={opp} stage={stage} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

function PipelineContent() {
  const { openModal } = useCrmModal();
  const pipeline = useStore(state => state.pipeline) || {};
  const movePipelineOpportunity = useStore(state => state.movePipelineOpportunity);
  const stages = useMemo(
    () => ['lead', 'contact', 'qualification', 'proposal', 'negotiation', 'closed_won'],
    []
  );

  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Encontrar la oportunidad activa
  const activeOppData = useMemo(() => {
    if (!activeId) return null;
    for (const stage of stages) {
      const opps = pipeline[stage] || [];
      const found = opps.find(o => o.id === activeId);
      if (found) return { ...found, stage };
    }
    return null;
  }, [activeId, pipeline, stages]);

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeData = active.data.current;
    const overData = over.data.current;

    let fromStage = activeData?.stage;
    let toStage = overData?.stage;

    // Si es un sortable dentro de la misma columna
    if (!toStage && overData?.type === 'opportunity') {
      // Buscar en qué etapa está el destino
      for (const stage of stages) {
        const opps = pipeline[stage] || [];
        if (opps.some(o => o.id === over.id)) {
          toStage = stage;
          break;
        }
      }
    }

    // Si arrastramos sobre una columna
    if (overData?.type === 'column') {
      toStage = overData.stage;
    }

    if (fromStage && toStage && fromStage !== toStage) {
      movePipelineOpportunity(active.id, fromStage, toStage);
    }

    setActiveId(null);
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Embudo de Ventas</h2>
          <p className="text-sm text-slate-500">Arrastrá las oportunidades entre etapas</p>
        </div>
        <Button type="button" onClick={() => openModal('opportunity')} className="w-full justify-center sm:w-auto">
          <Plus className="w-4 h-4" />
          Nueva Oportunidad
        </Button>
      </div>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map(stage => (
            <PipelineColumn key={stage} stage={stage} opps={pipeline[stage] || []} />
          ))}
        </div>
        <DragOverlay>
          {activeOppData ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-xl cursor-grabbing w-72">
              <div className="font-medium text-sm text-slate-900 dark:text-white mb-1">{activeOppData.name}</div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">${(activeOppData.value / 1000000).toFixed(1)}M</span>
                <span className="text-slate-400">{activeOppData.probability}%</span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

// Quotations Page
function QuotationsContent() {
  const { openModal } = useCrmModal();
  const quotations = useStore(state => state.quotations);
  
  const columns = [
    { key: 'quote_number', header: 'Número', sortable: true, render: (val) => <span className="font-mono text-sm font-medium text-slate-900 dark:text-white">{val}</span> },
    { key: 'customer_name', header: 'Cliente', render: (val) => (
      <div className="flex items-center gap-2">
        <Avatar name={val} size="sm" />
        <span className="font-medium text-slate-900 dark:text-white">{val}</span>
      </div>
    )},
    { key: 'total', header: 'Total', sortable: true, render: (val) => <span className="font-semibold text-slate-900 dark:text-white">${Math.round(val).toLocaleString()}</span> },
    { key: 'status', header: 'Estado', render: (val) => {
      const variants = { draft: 'gray', sent: 'blue', approved: 'green', reviewed: 'amber', rejected: 'red' };
      const labels = { draft: 'Borrador', sent: 'Enviada', approved: 'Aprobada', reviewed: 'Revisada', rejected: 'Rechazada' };
      return <Badge variant={variants[val] || 'gray'}>{labels[val] || val}</Badge>;
    }},
    { key: 'valid_until', header: 'Válida hasta', render: (val) => val ? new Date(val).toLocaleDateString('es-CO') : '—' },
    { key: 'created_at', header: 'Fecha', render: (val) => new Date(val).toLocaleDateString('es-CO') },
    { key: 'actions', header: '', render: () => (
      <div className="flex items-center gap-2 justify-end">
        <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-500 transition-colors">
          <Eye className="w-4 h-4" />
        </button>
        <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-green-500 transition-colors">
          <Send className="w-4 h-4" />
        </button>
        <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
          <FileDown className="w-4 h-4" />
        </button>
      </div>
    )},
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Cotizaciones</h2>
          <p className="text-sm text-slate-500">{quotations.length} cotizaciones</p>
        </div>
        <Button type="button" onClick={() => openModal('quotation')} className="w-full justify-center sm:w-auto">
          <Plus className="w-4 h-4" />
          Nueva Cotización
        </Button>
      </div>
      <DataTable columns={columns} data={quotations} searchPlaceholder="Buscar cotizaciones..." pageName="quotations" />
    </div>
  );
}

// Orders Page
function OrdersContent() {
  const { openModal } = useCrmModal();
  const orders = useStore(state => state.orders);
  
  const columns = [
    { key: 'order_number', header: 'Pedido', sortable: true, render: (val) => <span className="font-mono text-sm font-medium text-slate-900 dark:text-white">{val}</span> },
    { key: 'customer_name', header: 'Cliente', render: (val) => (
      <div className="flex items-center gap-2">
        <Avatar name={val} size="sm" />
        <span className="font-medium text-slate-900 dark:text-white">{val}</span>
      </div>
    )},
    { key: 'total', header: 'Total', sortable: true, render: (val) => <span className="font-semibold text-slate-900 dark:text-white">${Math.round(val).toLocaleString()}</span> },
    { key: 'status', header: 'Estado', render: (val) => {
      const variants = { confirmed: 'amber', preparing: 'blue', shipped: 'purple', delivered: 'green', returned: 'red' };
      const labels = { confirmed: 'Confirmado', preparing: 'Preparando', shipped: 'Enviado', delivered: 'Entregado', returned: 'Devuelto' };
      return <Badge variant={variants[val] || 'gray'}>{labels[val] || val}</Badge>;
    }},
    { key: 'carrier', header: 'Transporte', render: (val) => val || '—' },
    { key: 'created_at', header: 'Fecha', render: (val) => new Date(val).toLocaleDateString('es-CO') },
    { key: 'actions', header: '', render: () => (
      <div className="flex items-center gap-2 justify-end">
        <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-500 transition-colors">
          <Eye className="w-4 h-4" />
        </button>
        <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-green-500 transition-colors">
          <FileCheck className="w-4 h-4" />
        </button>
      </div>
    )},
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Pedidos</h2>
          <p className="text-sm text-slate-500">{orders.length} pedidos</p>
        </div>
        <Button type="button" onClick={() => openModal('order')} className="w-full justify-center sm:w-auto">
            <Plus className="w-4 h-4" />
            Nuevo Pedido
          </Button>
      </div>
      <DataTable columns={columns} data={orders} searchPlaceholder="Buscar pedidos..." pageName="orders" />
    </div>
  );
}

function triggerActionLabel(row) {
  const tr = row.trigger_config || {};
  const ac = row.action_config || {};
  return {
    trigger: tr.label || tr.type || JSON.stringify(tr).slice(0, 40),
    action: ac.label || ac.type || JSON.stringify(ac).slice(0, 40),
    lastRun: row.updated_at ? new Date(row.updated_at).toLocaleDateString('es-CO') : '—',
  };
}

// Automatizaciones (Supabase automation_rules; ejecución vía Edge run-automations + cron)
function AutomationsContent() {
  const automations = useStore((s) => s.automations);
  const updateAutomationRule = useStore((s) => s.updateAutomationRule);
  const addAutomationRule = useStore((s) => s.addAutomationRule);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', trigger: '', action: '' });
  const [info, setInfo] = useState('');

  const toggleStatus = (id, status) => {
    const next = status === 'active' ? 'paused' : 'active';
    updateAutomationRule(id, { status: next });
  };

  const submitNew = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    await addAutomationRule({
      name: form.name.trim(),
      trigger_config: { label: form.trigger.trim() || 'Personalizado' },
      action_config: { label: form.action.trim() || 'Notificación' },
      status: 'active',
    });
    setForm({ name: '', trigger: '', action: '' });
    setModalOpen(false);
    setInfo('Regla creada. Programá la función Edge run-automations con CRON_SECRET para generar notificaciones.');
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Automatizaciones</h2>
          <p className="text-sm text-slate-500">
            {automations.filter((a) => a.status === 'active').length} activas · Datos en Supabase. Motor: Edge Function{' '}
            <code className="text-xs">run-automations</code>.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => setModalOpen(true)} className="w-full justify-center sm:w-auto">
          <Plus className="w-4 h-4" />
          Nueva Automatización
        </Button>
      </div>

      {info && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 px-3 py-2 text-sm text-blue-900 dark:text-blue-100">
          {info}{' '}
          <button type="button" className="underline" onClick={() => setInfo('')}>
            Cerrar
          </button>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-white">Nueva regla</h3>
            <form onSubmit={submitNew} className="space-y-3">
              <div>
                <Label>Nombre</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. Notificar nuevo lead" />
              </div>
              <div>
                <Label>Disparador (texto)</Label>
                <Input value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value })} placeholder="Ej. Nuevo lead" />
              </div>
              <div>
                <Label>Acción (texto)</Label>
                <Input value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} placeholder="Ej. Enviar email" />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Guardar</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {automations.length === 0 ? (
          <p className="text-sm text-slate-500 col-span-full">No hay reglas. Creá la primera con el botón superior.</p>
        ) : (
          automations.map((auto) => {
            const { trigger, action, lastRun } = triggerActionLabel(auto);
            return (
              <Card key={auto.id} hover>
                <CardContent className="p-5">
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`flex-shrink-0 rounded-xl p-2 ${auto.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
                        <Workflow className={`h-5 w-5 ${auto.status === 'active' ? 'text-emerald-600' : 'text-slate-400'}`} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 dark:text-white">{auto.name}</h3>
                        <div className="break-words text-sm text-slate-500">
                          {trigger} → {action}
                        </div>
                      </div>
                    </div>
                    <Badge className="w-fit flex-shrink-0" variant={auto.status === 'active' ? 'green' : 'gray'}>{auto.status === 'active' ? 'Activa' : 'Pausada'}</Badge>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-xs text-slate-400">Último cambio: {lastRun}</span>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => toggleStatus(auto.id, auto.status)}
                        title={auto.status === 'active' ? 'Pausar' : 'Activar'}
                      >
                        {auto.status === 'active' ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

// Reports Page
function ReportsContent() {
  const [filterPreset, setFilterPreset] = useState('30d');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRootRef = useRef(null);
  const range = useMemo(() => getRangeFromPreset(filterPreset), [filterPreset]);

  useEffect(() => {
    if (!filterOpen) return;
    const onDown = (e) => {
      if (filterRootRef.current && !filterRootRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [filterOpen]);

  const customers = useStore((s) => s.customers);
  const leads = useStore((s) => s.leads);
  const orders = useStore((s) => s.orders);
  const quotations = useStore((s) => s.quotations);
  const pipeline = useStore((s) => s.pipeline) || {};

  const salesInRange = useMemo(() => sumOrdersTotal(orders, range), [orders, range]);
  const customersInRange = useMemo(() => countEntities(customers, range), [customers, range]);
  const leadsInRange = useMemo(() => countEntities(leads, range), [leads, range]);
  const quotesInRange = useMemo(() => countEntities(quotations, range), [quotations, range]);
  const pt = useMemo(() => pipelineTotals(pipeline), [pipeline]);
  const funnelRows = useMemo(() => buildFunnelRows(leads, pipeline), [leads, pipeline]);

  const ordersInRange = useMemo(
    () => (orders || []).filter((o) => isInRange(o.created_at, range.from, range.to)),
    [orders, range]
  );
  const avgTicket = ordersInRange.length ? salesInRange / ordersInRange.length : 0;

  const reportCards = [
    { title: 'Ventas (periodo)', icon: BarChart3, color: 'blue', value: formatCurrency(salesInRange), sub: filterPreset },
    { title: 'Clientes nuevos (periodo)', icon: Users, color: 'green', value: String(customersInRange), sub: filterPreset },
    { title: 'Leads (periodo)', icon: Target, color: 'purple', value: String(leadsInRange), sub: filterPreset },
    { title: 'Cotizaciones (periodo)', icon: FileText, color: 'amber', value: String(quotesInRange), sub: filterPreset },
    { title: 'Ticket promedio', icon: DollarSign, color: 'emerald', value: formatCurrency(avgTicket), sub: 'pedidos en periodo' },
    { title: 'Valor pipeline', icon: PieChart, color: 'indigo', value: formatCurrency(pt.value), sub: `${pt.count} op.` },
  ];

  const handleExport = useCallback(() => {
    const summary = [
      { metric: 'Ventas periodo', value: salesInRange, note: filterPreset },
      { metric: 'Clientes (periodo)', value: customersInRange, note: filterPreset },
      { metric: 'Leads (periodo)', value: leadsInRange, note: filterPreset },
      { metric: 'Cotizaciones (periodo)', value: quotesInRange, note: filterPreset },
      { metric: 'Pipeline valor', value: pt.value, note: 'actual' },
    ];
    const funnelExport = funnelRows.map((r) => ({ stage: r.stage, count: r.count, pct: r.pct }));
    exportWorkbook('Reportes_CRM', [
      {
        sheetName: 'Resumen',
        data: summary,
        columns: [
          { key: 'metric', header: 'Métrica' },
          { key: 'value', header: 'Valor' },
          { key: 'note', header: 'Filtro' },
        ],
      },
      {
        sheetName: 'Embudo',
        data: funnelExport,
        columns: [
          { key: 'stage', header: 'Etapa' },
          { key: 'count', header: 'Cantidad' },
          { key: 'pct', header: '% ref.' },
        ],
      },
    ]);
  }, [salesInRange, customersInRange, leadsInRange, quotesInRange, filterPreset, pt, funnelRows]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Reportes</h2>
          <p className="text-sm text-slate-500">Métricas calculadas desde tus datos (no son cifras de demostración).</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center relative">
          <div className="relative z-50" ref={filterRootRef} data-reports-filter-root>
            <Button type="button" variant="outline" onClick={() => setFilterOpen((v) => !v)}>
              <Filter className="w-4 h-4" />
              Periodo: {filterPreset === '7d' ? '7 días' : filterPreset === '30d' ? '30 días' : filterPreset === '90d' ? '90 días' : 'Todo'}
            </Button>
            {filterOpen && (
              <div className="absolute left-0 right-0 top-full z-[100] mt-1 min-w-[200px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-800 sm:left-auto sm:right-0">
                {[
                  { id: '7d', label: 'Últimos 7 días' },
                  { id: '30d', label: 'Últimos 30 días' },
                  { id: '90d', label: 'Últimos 90 días' },
                  { id: 'all', label: 'Todo el historial' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
                    onClick={() => {
                      setFilterPreset(opt.id);
                      setFilterOpen(false);
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button type="button" variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Exportar Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportCards.map((report, idx) => (
          <Card key={idx} hover>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl bg-${report.color}-500/10`}>
                  <report.icon className={`w-5 h-5 text-${report.color}-500`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{report.value}</div>
              <div className="text-sm text-slate-500">{report.title}</div>
              <div className="text-xs text-slate-400 mt-1">{report.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Pedidos en el periodo</h3>
            {ordersInRange.length === 0 ? (
              <p className="text-sm text-slate-500">No hay pedidos en el rango seleccionado.</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {ordersInRange.slice(0, 20).map((o) => (
                  <div key={o.id} className="flex justify-between text-sm border-b border-slate-100 dark:border-slate-700 pb-2">
                    <span className="font-mono text-slate-600 dark:text-slate-300">{o.order_number || o.number}</span>
                    <span className="font-medium">{formatCurrency(Number(o.total) || 0)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Embudo (datos actuales)</h3>
            <div className="space-y-3">
              {funnelRows.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 dark:text-slate-400">{item.stage}</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {item.count} ({item.pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                      style={{ width: `${Math.min(100, item.pct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// AI Page (preferencias en user_preferences; modelo vía Edge Function crm-ai)
function AIContent() {
  const userPreferences = useStore((s) => s.userPreferences);
  const savePreferences = useStore((s) => s.savePreferences);
  const assistantOn = Boolean(userPreferences?.ai_assistant_enabled);

  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiErr, setAiErr] = useState('');

  const toggleAssistant = async () => {
    const flags = userPreferences?.notification_flags || {};
    await savePreferences({
      ai_assistant_enabled: !assistantOn,
      notification_flags: flags,
    });
  };

  const sendAi = async (e) => {
    e.preventDefault();
    if (!aiInput.trim() || !assistantOn) return;
    if (!isSupabaseConfigured()) {
      setAiErr('Configurá Supabase para usar el asistente.');
      return;
    }
    const userMsg = aiInput.trim();
    setAiInput('');
    setAiErr('');
    setAiMessages((m) => [...m, { role: 'user', text: userMsg }]);
    setAiLoading(true);
    const { data, error } = await invokeCrmAi(userMsg);
    setAiLoading(false);
    if (error) {
      setAiErr(error.message || 'Error al invocar la función');
      return;
    }
    const reply = data?.reply || data?.error || 'Sin respuesta';
    setAiMessages((m) => [...m, { role: 'assistant', text: typeof reply === 'string' ? reply : JSON.stringify(reply) }]);
  };

  const aiFeatures = [
    { name: 'Predicción de cierre', desc: 'Resúmenes con el asistente cuando está activo.', icon: TrendingUp, active: assistantOn },
    { name: 'Scoring automático', desc: 'Usá preguntas al asistente sobre tus leads.', icon: Target, active: assistantOn },
    { name: 'Asistente de email', desc: 'Borradores y tono con IA (Edge + OpenAI).', icon: Mail, active: assistantOn },
    { name: 'Análisis de conversaciones', desc: 'Pendiente de integrar transcripciones.', icon: Bot, active: assistantOn },
    { name: 'Recomendaciones de productos', desc: 'Consultá al asistente con contexto de negocio.', icon: Lightbulb, active: assistantOn },
    { name: 'Alertas de churn', desc: 'Combiná notificaciones del CRM + IA.', icon: AlertTriangle, active: assistantOn },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">IA Comercial</h2>
          <p className="text-sm text-slate-500">Preferencia guardada en Supabase. Desplegá la Edge Function crm-ai y OPENAI_API_KEY en el proyecto.</p>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 border-0">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">CRM AI Assistant</h3>
          <p className="text-blue-100 mb-6 max-w-md mx-auto">
            {assistantOn
              ? 'Asistente activado. Chat abajo usa la función Edge con tu sesión.'
              : 'Activá el asistente para habilitar el chat y las tarjetas inferiores.'}
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={toggleAssistant}
            className={`relative z-10 cursor-pointer ${assistantOn ? '!bg-white/20 !text-white border border-white/40 hover:!bg-white/30' : '!bg-white !text-blue-600 hover:!bg-blue-50'}`}
          >
            <Bot className="w-4 h-4" />
            {assistantOn ? 'Desactivar assistant' : 'Activar Assistant'}
          </Button>
        </CardContent>
      </Card>

      {assistantOn && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Chat</h3>
            {aiErr && <p className="text-sm text-red-600 dark:text-red-400 mb-2">{aiErr}</p>}
            <div className="max-h-64 overflow-y-auto space-y-2 mb-3 text-sm">
              {aiMessages.length === 0 ? (
                <p className="text-slate-500">Escribí una pregunta para el asistente comercial.</p>
              ) : (
                aiMessages.map((m, i) => (
                  <div key={i} className={m.role === 'user' ? 'text-right text-slate-800 dark:text-slate-100' : 'text-left text-slate-600 dark:text-slate-300'}>
                    <span className="inline-block rounded-lg px-3 py-2 bg-slate-100 dark:bg-slate-800">{m.text}</span>
                  </div>
                ))
              )}
              {aiLoading && (
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Pensando…
                </div>
              )}
            </div>
            <form onSubmit={sendAi} className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <Input value={aiInput} onChange={(e) => setAiInput(e.target.value)} placeholder="Ej. Cómo priorizo leads esta semana?" className="min-w-0 flex-1" />
              <Button type="submit" disabled={aiLoading} className="w-full shrink-0 sm:w-auto">
                Enviar
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {aiFeatures.map((feature, idx) => (
          <Card key={idx} hover className={!assistantOn ? 'opacity-60' : ''}>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${feature.active ? 'bg-emerald-500/15' : 'bg-slate-500/10'}`}>
                  <feature.icon className={`w-6 h-6 ${feature.active ? 'text-emerald-600' : 'text-slate-400'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    {feature.name}
                    {feature.active && (
                      <Badge variant="green" className="text-[10px]">
                        On
                      </Badge>
                    )}
                  </h3>
                  <p className="text-sm text-slate-500">{feature.desc}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ticketDisplay(t) {
  const status = t.status || 'open';
  const uiStatus =
    status === 'in_progress' ? 'pending' : status === 'closed' || status === 'resolved' ? 'resolved' : status === 'open' ? 'open' : 'pending';
  return {
    ...t,
    priority: t.priority || 'medium',
    uiStatus,
    label: t.subject,
    customer: t.customer_label || t.customer_name || '—',
    date: t.created_at ? new Date(t.created_at).toLocaleDateString('es-CO') : t.date,
  };
}

// Postsale (support_tickets en Supabase)
function PostsaleContent() {
  const tickets = useStore((s) => s.tickets);
  const addTicket = useStore((s) => s.addTicket);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ customer: '', subject: '', priority: 'medium' });

  const rows = (tickets || []).map(ticketDisplay);
  const openCount = rows.filter((t) => t.uiStatus === 'open').length;
  const pendingCount = rows.filter((t) => t.uiStatus === 'pending').length;
  const resolvedCount = rows.filter((t) => t.uiStatus === 'resolved').length;

  const submitTicket = async (e) => {
    e.preventDefault();
    if (!form.subject.trim()) return;
    await addTicket({
      subject: form.subject.trim(),
      body: null,
      customer_label: form.customer || 'Cliente',
      priority: form.priority,
    });
    setForm({ customer: '', subject: '', priority: 'medium' });
    setModalOpen(false);
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Postventa</h2>
          <p className="text-sm text-slate-500">Tickets en la tabla support_tickets (Supabase).</p>
        </div>
        <Button type="button" onClick={() => setModalOpen(true)} className="w-full justify-center sm:w-auto">
          <Plus className="w-4 h-4" />
          Nuevo Ticket
        </Button>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-white">Nuevo ticket</h3>
            <form onSubmit={submitTicket} className="space-y-3">
              <div>
                <Label>Cliente / empresa</Label>
                <Input value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} placeholder="Nombre" />
              </div>
              <div>
                <Label>Asunto</Label>
                <Input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Describe el problema" />
              </div>
              <div>
                <Label>Prioridad</Label>
                <select
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Crear</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-red-500">{openCount}</div>
            <div className="text-sm text-slate-500">Tickets abiertos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-amber-500">{pendingCount}</div>
            <div className="text-sm text-slate-500">Pendientes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-500">{resolvedCount}</div>
            <div className="text-sm text-slate-500">Resueltos</div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {rows.map((ticket) => (
              <div key={ticket.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                      <Wrench className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">{ticket.label}</div>
                      <div className="text-sm text-slate-500">{ticket.customer} • {String(ticket.id).slice(0, 8)}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Badge variant={ticket.priority === 'high' ? 'red' : ticket.priority === 'medium' ? 'amber' : 'gray'}>
                      {ticket.priority === 'high' ? 'Alta' : ticket.priority === 'medium' ? 'Media' : 'Baja'}
                    </Badge>
                    <Badge variant={ticket.uiStatus === 'open' ? 'blue' : ticket.uiStatus === 'pending' ? 'amber' : 'green'}>
                      {ticket.uiStatus === 'open' ? 'Abierto' : ticket.uiStatus === 'pending' ? 'Pendiente' : 'Resuelto'}
                    </Badge>
                    <span className="text-sm text-slate-400">{ticket.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Settings Page
function SettingsContent() {
  const { user, profile } = useAuth();
  const meta = user?.user_metadata || {};
  const userPreferences = useStore((s) => s.userPreferences);
  const savePreferences = useStore((s) => s.savePreferences);
  const avatarInputRef = useRef(null);
  const [avatarErr, setAvatarErr] = useState('');

  const defaultFlags = { leadEmail: true, reminders: true, quoteAlerts: false, weekly: true };
  const flags = { ...defaultFlags, ...(userPreferences?.notification_flags || {}) };

  const toggle = async (key) => {
    const nextFlags = { ...flags, [key]: !flags[key] };
    await savePreferences({
      ai_assistant_enabled: Boolean(userPreferences?.ai_assistant_enabled),
      notification_flags: nextFlags,
    });
  };

  const onAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setAvatarErr('');
    const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (upErr) {
      setAvatarErr(upErr.message);
      return;
    }
    const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
    const { error: pErr } = await updateProfile(user.id, { avatar_url: pub.publicUrl });
    if (pErr) setAvatarErr(pErr.message);
    else window.location.reload();
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Configuración</h2>
        <p className="text-sm text-slate-500">Perfil y preferencias en Supabase (tabla user_preferences).</p>
      </div>
      
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Perfil (sesión actual)</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar src={profile?.avatar_url} name={`${meta.first_name || user?.email || '?'} ${meta.last_name || ''}`} size="lg" />
                <div>
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" id="avatar-upload" onChange={onAvatar} />
                  <Button type="button" variant="outline" size="sm" onClick={() => avatarInputRef.current?.click()}>
                    Cambiar foto
                  </Button>
                  {avatarErr && <p className="text-xs text-red-600 mt-1">{avatarErr}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>Nombre</Label>
                  <Input readOnly value={meta.first_name || ''} placeholder="—" />
                </div>
                <div>
                  <Label>Apellido</Label>
                  <Input readOnly value={meta.last_name || ''} placeholder="—" />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input readOnly type="email" value={user?.email || ''} />
              </div>
              {profile?.role && (
                <div>
                  <Label>Rol (perfil)</Label>
                  <Input readOnly value={profile.role} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Notificaciones</h3>
            <div className="space-y-3">
              {[
                { key: 'leadEmail', label: 'Email cuando llega un nuevo lead' },
                { key: 'reminders', label: 'Recordatorios de seguimiento' },
                { key: 'quoteAlerts', label: 'Alertas de cotización expirando' },
                { key: 'weekly', label: 'Resumen semanal de ventas' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                  <button
                    type="button"
                    onClick={() => toggle(item.key)}
                    className={`w-11 h-6 rounded-full transition-colors ${flags[item.key] ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${flags[item.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Integraciones</h3>
            <div className="space-y-3">
              {[
                { name: 'Supabase', status: 'connected', icon: '🗄️' },
                { name: 'Google Calendar', status: 'disconnected', icon: '📅' },
                { name: 'Slack', status: 'disconnected', icon: '💬' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.name}</span>
                  </div>
                  <Badge variant={item.status === 'connected' ? 'green' : 'gray'}>
                    {item.status === 'connected' ? 'Conectado' : 'No conectado'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Users Page
function UsersContent() {
  const { user, profile } = useAuth();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState('');

  const sendInvite = async () => {
    setInviteStatus('');
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      setInviteStatus('Ingresá un email válido.');
      return;
    }
    const { error } = await supabase.functions.invoke('invite-user', {
      body: { email: inviteEmail.trim() },
    });
    if (error) setInviteStatus(error.message || 'Error al invitar');
    else setInviteStatus(`Invitación enviada a ${inviteEmail.trim()}.`);
  };

  const users = profile
    ? [
        {
          name: `${user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Usuario'} ${user?.user_metadata?.last_name || ''}`.trim(),
          email: user?.email || '—',
          role: profile.role || 'sales',
          team: profile.team || '—',
          status: 'active',
        },
      ]
    : [];
  
  const columns = [
    { key: 'name', header: 'Usuario', render: (val, row) => (
      <div className="flex items-center gap-3">
        <Avatar name={val} size="sm" />
        <div>
          <div className="font-medium text-slate-900 dark:text-white">{val}</div>
          <div className="text-xs text-slate-500">{row.email}</div>
        </div>
      </div>
    )},
    { key: 'role', header: 'Rol', render: (val) => {
      const variants = { admin: 'purple', manager: 'blue', sales: 'gray' };
      const labels = { admin: 'Admin', manager: 'Gerente', sales: 'Vendedor' };
      return <Badge variant={variants[val] || 'gray'}>{labels[val] || val}</Badge>;
    }},
    { key: 'team', header: 'Equipo' },
    { key: 'status', header: 'Estado', render: (val) => (
      <Badge variant={val === 'active' ? 'green' : 'gray'}>
        {val === 'active' ? 'Activo' : 'Inactivo'}
      </Badge>
    )},
    { key: 'actions', header: '', render: () => (
      <div className="flex items-center gap-2 justify-end">
        <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-500 transition-colors">
          <Edit2 className="w-4 h-4" />
        </button>
      </div>
    )},
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Usuarios</h2>
          <p className="text-sm text-slate-500">
            {users.length ? `${users.length} usuario en sesión` : 'Sin listado de equipo'} · El alta de usuarios se gestiona en Supabase Auth.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          {profile?.role === 'admin' && (
            <>
              <Input
                type="email"
                placeholder="email@empresa.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full min-w-0 sm:w-56"
              />
              <Button type="button" variant="outline" onClick={sendInvite} className="w-full justify-center sm:w-auto">
                <UserPlus className="w-4 h-4" />
                Invitar
              </Button>
            </>
          )}
          <Button
            type="button"
            variant="outline"
            className="w-full justify-center sm:w-auto"
            onClick={() => window.open('https://supabase.com/dashboard/project/_/auth/users', '_blank', 'noopener')}
          >
            Gestionar en Supabase
          </Button>
        </div>
      </div>
      {inviteStatus && <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{inviteStatus}</p>}
      {!users.length ? (
        <p className="text-sm text-slate-500">No hay perfil extendido cargado. Iniciá sesión con un usuario que tenga fila en <code className="text-xs">profiles</code>.</p>
      ) : (
        <DataTable columns={columns} data={users} searchPlaceholder="Buscar usuarios..." pageName="users" />
      )}
    </div>
  );
}

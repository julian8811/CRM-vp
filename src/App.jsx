import { useState, useMemo, useEffect } from "react";
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
import { Layout } from './components/layout/Layout';
import { Button } from './components/ui/Button';
import { Card, CardContent } from './components/ui/Card';
import { Badge } from './components/ui/Badge';
import { Avatar } from './components/ui/Avatar';
import { DataTable } from './components/ui/DataTable';
import { Modal } from './components/ui/Modal';
import { Input } from './components/ui/Input';
import { Label } from './components/ui/Label';
import { Loader2, Plus, TrendingUp, DollarSign, Users, Target, ShoppingCart, GripVertical, MapPin, Building2, Mail, Phone, Edit2, Trash2, ArrowRightCircle, Package, AlertTriangle, FileText, Clock, CheckCircle, XCircle, Send, BarChart3, PieChart, Activity, Zap, Settings, UserPlus, Wrench, Headphones, Download, Filter, Eye, FileDown, Calendar, RefreshCw, Copy, Check, X, ChevronRight, Sparkles, Bot, Lightbulb, TrendingDown, UsersRound, Receipt, CreditCard, FileCheck, Workflow, Play, Pause, Clock3, Bell } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from './store/useStore';
import { exportCurrentPage } from './lib/exportExcel';

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
  const pipeline = useStore(state => state.pipeline) || {};
  const customers = useStore(state => state.customers);
  const leads = useStore(state => state.leads);
  
  const stats = [
    { icon: DollarSign, label: 'Ventas del mes', value: '$165M', change: '+50%', color: 'blue' },
    { icon: TrendingUp, label: 'Tasa conversión', value: '12.5%', change: '+2.3%', color: 'green' },
    { icon: ShoppingCart, label: 'Ticket promedio', value: '$20.6M', change: '+8%', color: 'purple' },
    { icon: Users, label: 'Leads nuevos', value: '7', change: '+3', color: 'amber' },
    { icon: Target, label: 'Pipeline', value: '$98.7M', change: '+15%', color: 'indigo' },
  ];

  const salesTrend = [
    { date: 'Oct', amount: 45000000 },
    { date: 'Nov', amount: 62000000 },
    { date: 'Dic', amount: 78000000 },
    { date: 'Ene', amount: 95000000 },
    { date: 'Feb', amount: 120000000 },
    { date: 'Mar', amount: 165000000 },
  ];

  const pipelineSummary = Object.entries(pipeline).map(([stage, opps]) => ({
    stage,
    count: opps?.length || 0,
    value: (opps || []).reduce((s, o) => s + (o.value || 0), 0),
  }));

  const topSellers = [
    { name: 'María López', deals: 3, total: 143000000 },
    { name: 'Andrés Martínez', deals: 2, total: 72000000 },
    { name: 'Laura Ramírez', deals: 1, total: 27500000 },
  ];

  const quickActions = [
    { id: 'customer', icon: Users, label: 'Nuevo cliente', color: 'bg-blue-500' },
    { id: 'lead', icon: Target, label: 'Nuevo lead', color: 'bg-emerald-500' },
    { id: 'quote', icon: DollarSign, label: 'Nueva cotización', color: 'bg-violet-500' },
    { id: 'order', icon: ShoppingCart, label: 'Nuevo pedido', color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-6">
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
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `$${v/1000000}M`} />
                  <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, 'Ventas']} />
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
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Top Vendedores</h3>
            <div className="space-y-4">
              {topSellers.map((seller, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500">
                    {idx + 1}
                  </span>
                  <Avatar name={seller.name} size="sm" />
                  <div className="flex-1">
                    <div className="font-medium text-slate-900 dark:text-white">{seller.name}</div>
                    <div className="text-xs text-slate-500">{seller.deals} cierres</div>
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    ${(seller.total / 1000000).toFixed(1)}M
                  </div>
                </div>
              ))}
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
      <div className="min-h-screen flex bg-gradient-to-br from-[#1B3A5C] via-[#162F4A] to-[#0f2035]">
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-white">CRM-VP</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Sistema CRM Innovador</h1>
            <p className="text-blue-200 mb-8">Gestiona tu ciclo comercial con inteligencia artificial.</p>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-sm text-blue-200">
              <p className="font-semibold text-white mb-2">Configuración requerida:</p>
              <ol className="space-y-1 list-decimal list-inside">
                <li>Crea un proyecto en Supabase</li>
                <li>Ejecuta el schema SQL</li>
                <li>Configura .env.local</li>
              </ol>
            </div>
          </div>
        </div>
        <div className="w-[480px] bg-white dark:bg-slate-800 flex items-center justify-center p-12">
          <div className="w-full max-w-sm text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Configuración Requerida</h2>
            <p className="text-slate-500 mb-6">Completá las variables de entorno</p>
          </div>
        </div>
      </div>
    );
  }

  if (registerSuccess) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-[#1B3A5C] via-[#162F4A] to-[#0f2035]">
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-white">CRM-VP</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Sistema CRM Innovador</h1>
            <p className="text-blue-200">Gestiona tu ciclo comercial.</p>
          </div>
        </div>
        <div className="w-[480px] bg-white dark:bg-slate-800 flex items-center justify-center p-12">
          <div className="w-full max-w-sm text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">¡Registro Exitoso!</h2>
            <p className="text-slate-500 mb-6">Verificá tu correo electrónico.</p>
            <Button onClick={() => setRegisterSuccess(false)} className="w-full">
              Volver al login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#1B3A5C] via-[#162F4A] to-[#0f2035]">
      {/* Left - Branding */}
      <div className="flex-1 flex items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-20 left-20 w-48 h-48 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-20 right-20 w-64 h-64 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">CRM-VP</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Sistema CRM Innovador para Ventas
          </h1>
          <p className="text-blue-200 text-lg">
            Gestiona tu ciclo comercial con inteligencia artificial, automatización y analítica avanzada.
          </p>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="w-[480px] bg-white dark:bg-slate-800 flex items-center justify-center p-12">
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
              <div className="grid grid-cols-2 gap-3">
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
  const { user, loading: authLoading, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // Fetch data when user logs in
  const fetchCustomers = useStore(state => state.fetchCustomers);
  const fetchLeads = useStore(state => state.fetchLeads);
  const fetchProducts = useStore(state => state.fetchProducts);
  const fetchOpportunities = useStore(state => state.fetchOpportunities);
  const fetchQuotations = useStore(state => state.fetchQuotations);
  const fetchOrders = useStore(state => state.fetchOrders);
  
  useEffect(() => {
    if (user) {
      // Fetch all data from Supabase
      fetchCustomers();
      fetchLeads();
      fetchProducts();
      fetchOpportunities();
      fetchQuotations();
      fetchOrders();
    }
  }, [user]);

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoginPage />;
  }

  const pageInfo = PAGE_TITLES[currentPage] || { title: currentPage, subtitle: '' };
  const profile = user.user_metadata || {};

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
    <Layout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      user={{ first_name: profile.first_name || user.email?.split('@')[0], last_name: profile.last_name || '', role: profile.role || 'sales' }}
      onLogout={logout}
      title={pageInfo.title}
      subtitle={pageInfo.subtitle}
    >
      {renderPage()}
    </Layout>
  );
}

// Customers Page
function CustomersContent() {
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
        <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-500 transition-colors">
          <Edit2 className="w-4 h-4" />
        </button>
        <button onClick={() => deleteCustomer(row.id)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-red-500 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )},
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Clientes</h2>
          <p className="text-sm text-slate-500">{customers.length} clientes registrados</p>
        </div>
        <Button>
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
          <Button size="sm" variant="outline" onClick={() => convertLead(row.id)}>
            <ArrowRightCircle className="w-3 h-3" />
            Convertir
          </Button>
        ) : <Badge variant="purple">✓ Convertido</Badge>}
      </div>
    )},
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Leads</h2>
          <p className="text-sm text-slate-500">{leads.length} leads registrados</p>
        </div>
        <Button>
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
  const products = useStore(state => state.products);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Productos</h2>
          <p className="text-sm text-slate-500">{products.length} productos en catálogo</p>
        </div>
        <Button>
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
  const pipeline = useStore(state => state.pipeline) || {};
  const movePipelineOpportunity = useStore(state => state.movePipelineOpportunity);
  const stages = ['lead', 'contact', 'qualification', 'proposal', 'negotiation', 'closed_won'];

  const [activeId, setActiveId] = useState(null);
  const [activeOpp, setActiveOpp] = useState(null);

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
    
    // Buscar la oportunidad
    for (const stage of stages) {
      const opps = pipeline[stage] || [];
      const found = opps.find(o => o.id === active.id);
      if (found) {
        setActiveOpp({ ...found, stage });
        break;
      }
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      setActiveOpp(null);
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
    setActiveOpp(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Embudo de Ventas</h2>
          <p className="text-sm text-slate-500">Arrastrá las oportunidades entre etapas</p>
        </div>
        <Button>
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
  const quotations = useStore(state => state.quotations);
  
  const columns = [
    { key: 'quote_number', header: 'Número', sortable: true, render: (val) => <span className="font-mono text-sm font-medium text-slate-900 dark:text-white">{val}</span> },
    { key: 'customer_name', header: 'Cliente', render: (val, row) => (
      <div className="flex items-center gap-2">
        <Avatar name={val} size="sm" />
        <span className="font-medium text-slate-900 dark:text-white">{val}</span>
      </div>
    )},
    { key: 'total', header: 'Total', sortable: true, render: (val) => <span className="font-semibold text-slate-900 dark:text-white">${Math.round(val).toLocaleString()}</span> },
    { key: 'status', header: 'Estado', render: (val) => {
      const variants = { draft: 'gray', sent: 'blue', viewed: 'amber', accepted: 'green', rejected: 'red', expired: 'gray' };
      const labels = { draft: 'Borrador', sent: 'Enviada', viewed: 'Vista', accepted: 'Aceptada', rejected: 'Rechazada', expired: 'Expirada' };
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Cotizaciones</h2>
          <p className="text-sm text-slate-500">{quotations.length} cotizaciones</p>
        </div>
        <Button>
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
      const variants = { pending: 'amber', processing: 'blue', shipped: 'purple', delivered: 'green', cancelled: 'red' };
      const labels = { pending: 'Pendiente', processing: 'Procesando', shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado' };
      return <Badge variant={variants[val] || 'gray'}>{labels[val] || val}</Badge>;
    }},
    { key: 'payment_status', header: 'Pago', render: (val) => {
      const variants = { pending: 'amber', paid: 'green', failed: 'red', refunded: 'gray' };
      return <Badge variant={variants[val] || 'gray'}>{val}</Badge>;
    }},
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Pedidos</h2>
          <p className="text-sm text-slate-500">{orders.length} pedidos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
          <Button>
            <Plus className="w-4 h-4" />
            Nuevo Pedido
          </Button>
        </div>
      </div>
      <DataTable columns={columns} data={orders} searchPlaceholder="Buscar pedidos..." pageName="orders" />
    </div>
  );
}

// Automations Page
function AutomationsContent() {
  const automations = [
    { id: 1, name: 'Notificar nuevo lead', trigger: 'Nuevo lead', action: 'Enviar email', status: 'active', lastRun: '2026-04-05' },
    { id: 2, name: 'Seguimiento automático', trigger: 'Lead sin actividad 3 días', action: 'Crear tarea', status: 'active', lastRun: '2026-04-04' },
    { id: 3, name: 'Recordatorio de cita', trigger: 'Cita mañana', action: 'Enviar recordatorio', status: 'active', lastRun: '2026-04-05' },
    { id: 4, name: 'Cotización expirando', trigger: 'Cotización por expirar', action: 'Notificar cliente', status: 'paused', lastRun: '2026-04-01' },
    { id: 5, name: 'Bienvenida nuevo cliente', trigger: 'Nuevo cliente', action: 'Enviar serie onboarding', status: 'active', lastRun: '2026-04-05' },
  ];
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Automatizaciones</h2>
          <p className="text-sm text-slate-500">{automations.filter(a => a.status === 'active').length} automatizaciones activas</p>
        </div>
        <Button>
          <Plus className="w-4 h-4" />
          Nueva Automatización
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {automations.map(auto => (
          <Card key={auto.id} hover>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${auto.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
                    <Workflow className={`w-5 h-5 ${auto.status === 'active' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{auto.name}</h3>
                    <div className="text-sm text-slate-500">{auto.trigger} → {auto.action}</div>
                  </div>
                </div>
                <Badge variant={auto.status === 'active' ? 'green' : 'gray'}>
                  {auto.status === 'active' ? 'Activa' : 'Pausada'}
                </Badge>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                <span className="text-xs text-slate-400">Última ejecución: {auto.lastRun}</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline">
                    {auto.status === 'active' ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  </Button>
                  <Button size="sm" variant="outline">
                    <Settings className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Reports Page
function ReportsContent() {
  const reportCards = [
    { title: 'Ventas por mes', icon: BarChart3, color: 'blue', value: '$165M', change: '+15%' },
    { title: 'Conversión por etapa', icon: PieChart, color: 'purple', value: '12.5%', change: '+2.3%' },
    { title: 'Ticket promedio', icon: DollarSign, color: 'green', value: '$20.6M', change: '+8%' },
    { title: 'Tiempo de cierre', icon: Clock3, color: 'amber', value: '23 días', change: '-3 días' },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Reportes</h2>
          <p className="text-sm text-slate-500">Analytics y métricas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="w-4 h-4" />
            Filtrar
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportCards.map((report, idx) => (
          <Card key={idx} hover>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl bg-${report.color}-500/10`}>
                  <report.icon className={`w-5 h-5 text-${report.color}-500`} />
                </div>
                <Badge variant="green">{report.change}</Badge>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{report.value}</div>
              <div className="text-sm text-slate-500">{report.title}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Ventas por vendedor</h3>
            <div className="space-y-4">
              {['María López', 'Andrés Martínez', 'Laura Ramírez'].map((name, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Avatar name={name} size="sm" />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{name}</span>
                      <span className="font-semibold text-slate-900 dark:text-white">${(120 - idx * 35).toLocaleString()}M</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${100 - idx * 25}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Conversion funnel</h3>
            <div className="space-y-3">
              {[
                { stage: 'Leads', count: 150, pct: 100 },
                { stage: 'Contactados', count: 95, pct: 63 },
                { stage: 'Calificados', count: 62, pct: 41 },
                { stage: 'Propuestas', count: 38, pct: 25 },
                { stage: 'Cerrados', count: 19, pct: 13 },
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 dark:text-slate-400">{item.stage}</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.count} ({item.pct}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" style={{ width: `${item.pct}%` }} />
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

// AI Page
function AIContent() {
  const aiFeatures = [
    { name: 'Predicción de cierre', desc: 'IA predice probabilidad de cierre basada en historial', icon: TrendingUp },
    { name: 'Scoring automático', desc: 'Score de leads calculado con ML', icon: Target },
    { name: 'Asistente de email', desc: 'Genera respuestas automatically', icon: Mail },
    { name: 'Análisis de conversaciones', desc: 'Transcribe y analiza llamadas', icon: Bot },
    { name: ' Recomendaciones de productos', desc: 'Sugiere productos por cliente', icon: Lightbulb },
    { name: 'Alertas de churn', desc: 'Detecta clientes en riesgo', icon: AlertTriangle },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">IA Comercial</h2>
          <p className="text-sm text-slate-500">Inteligencia artificial para ventas</p>
        </div>
      </div>
      
      <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 border-0">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">CRM AI Assistant</h3>
          <p className="text-blue-100 mb-6 max-w-md mx-auto">
            Tu asistente de inteligencia artificial te ayuda a cerrar más ventas con predicciones, recomendaciones y automatizaciones inteligentes.
          </p>
          <Button className="bg-white text-blue-600 hover:bg-blue-50">
            <Bot className="w-4 h-4" />
            Activar Assistant
          </Button>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {aiFeatures.map((feature, idx) => (
          <Card key={idx} hover>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <feature.icon className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{feature.name}</h3>
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

// Postsale Page
function PostsaleContent() {
  const tickets = [
    { id: 'TK-001', customer: 'Empresa ABC', subject: 'Problema con facturación', priority: 'high', status: 'open', date: '2026-04-05' },
    { id: 'TK-002', customer: 'Tech Solutions', subject: 'Consulta sobre garantía', priority: 'medium', status: 'pending', date: '2026-04-04' },
    { id: 'TK-003', customer: 'Corp Colombia', subject: 'Solicitud de refund', priority: 'low', status: 'resolved', date: '2026-04-03' },
  ];
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Postventa</h2>
          <p className="text-sm text-slate-500">Soporte y seguimiento</p>
        </div>
        <Button>
          <Plus className="w-4 h-4" />
          Nuevo Ticket
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-red-500">3</div>
            <div className="text-sm text-slate-500">Tickets abiertos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-amber-500">2</div>
            <div className="text-sm text-slate-500">Pendientes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-500">12</div>
            <div className="text-sm text-slate-500">Resueltos este mes</div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {tickets.map(ticket => (
              <div key={ticket.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                      <Wrench className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">{ticket.subject}</div>
                      <div className="text-sm text-slate-500">{ticket.customer} • {ticket.id}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={ticket.priority === 'high' ? 'red' : ticket.priority === 'medium' ? 'amber' : 'gray'}>
                      {ticket.priority === 'high' ? 'Alta' : ticket.priority === 'medium' ? 'Media' : 'Baja'}
                    </Badge>
                    <Badge variant={ticket.status === 'open' ? 'blue' : ticket.status === 'pending' ? 'amber' : 'green'}>
                      {ticket.status === 'open' ? 'Abierto' : ticket.status === 'pending' ? 'Pendiente' : 'Resuelto'}
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
  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Configuración</h2>
        <p className="text-sm text-slate-500">Ajustes del sistema</p>
      </div>
      
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Perfil</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar name="Usuario" size="lg" />
                <Button variant="outline" size="sm">Cambiar foto</Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre</Label>
                  <Input placeholder="Juan" />
                </div>
                <div>
                  <Label>Apellido</Label>
                  <Input placeholder="Pérez" />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" placeholder="juan@empresa.com" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Notificaciones</h3>
            <div className="space-y-3">
              {[
                { label: 'Email cuando llega un nuevo lead', enabled: true },
                { label: 'Recordatorios de seguimiento', enabled: true },
                { label: 'Alertas de cotización expirando', enabled: false },
                { label: 'Resumen semanal de ventas', enabled: true },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                  <button className={`w-11 h-6 rounded-full transition-colors ${item.enabled ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${item.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
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
  const users = [
    { name: 'Juan Pérez', email: 'juan@crmvp.com', role: 'admin', team: 'Ventas', status: 'active' },
    { name: 'María López', email: 'maria@crmvp.com', role: 'sales', team: 'Ventas', status: 'active' },
    { name: 'Andrés Martínez', email: 'andres@crmvp.com', role: 'sales', team: 'Ventas', status: 'active' },
    { name: 'Laura Ramírez', email: 'laura@crmvp.com', role: 'manager', team: 'Ventas', status: 'active' },
  ];
  
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Usuarios</h2>
          <p className="text-sm text-slate-500">{users.length} usuarios</p>
        </div>
        <Button>
          <UserPlus className="w-4 h-4" />
          Nuevo Usuario
        </Button>
      </div>
      <DataTable columns={columns} data={users} searchPlaceholder="Buscar usuarios..." pageName="users" />
    </div>
  );
}

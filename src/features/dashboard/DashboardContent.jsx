import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '@/contexts/AuthContext';
import { useCrmModal } from '@/contexts/CrmModalContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { DataTable } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Loader2, Plus, TrendingUp, DollarSign, Users, Target, ShoppingCart, GripVertical, MapPin, Building2, Mail, Phone, Edit2, Trash2, ArrowRightCircle, Package, AlertTriangle, FileText, Clock, CheckCircle, XCircle, Send, BarChart3, PieChart, Activity, Zap, Settings, UserPlus, Wrench, Headphones, Download, Filter, Eye, FileDown, Calendar, RefreshCw, Copy, Check, X, ChevronRight, Sparkles, Bot, Lightbulb, TrendingDown, UsersRound, Receipt, CreditCard, FileCheck, Workflow, Play, Pause, Clock3, Bell } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '@/store/useStore';
import {
  formatCurrency,
  getRangeFromPreset,
  isInRange,
  pipelineTotals,
  sumOrdersTotal,
  buildFunnelRows,
  buildLast6MonthsOrderTrend,
  countEntities,
} from '@/lib/crmMetrics';
import { exportWorkbook } from '@/lib/exportExcel';
import { invokeCrmAi } from '@/lib/crmAi';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { updateProfile } from '@/lib/auth';
import { confirmDelete } from '@/lib/confirmDelete';
import { PAGE_TITLES, STAGE_COLORS } from '@/config/crm';


export function DashboardContent() {
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
    { id: 'lead', icon: Target, label: 'Nuevo prospecto', color: 'bg-emerald-500' },
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

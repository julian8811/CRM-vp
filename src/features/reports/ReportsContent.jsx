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


// Reports Page
export function ReportsContent() {
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

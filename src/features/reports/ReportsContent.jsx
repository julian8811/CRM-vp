import { useState, useMemo, useCallback } from 'react';
import {
  BarChart3, Users, Target, FileText, DollarSign, PieChart as PieChartIcon, Download,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Button } from '@/components/ui/Button';
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
import {
  StitchKpiCard,
  StitchChartTooltip,
  StitchPeriodPills,
} from '@/components/stitch/StitchChart';
import { PageContainer } from '@/components/stitch/PageContainer';

const CHART_COLORS = ['#5f8bff', '#4ade80', '#fbbf24', '#a78bfa', '#f87171', '#38bdf8'];

const PERIOD_OPTIONS = [
  { id: '7d', label: '7D' },
  { id: '30d', label: '30D' },
  { id: '90d', label: '90D' },
  { id: 'all', label: 'TODO' },
];

function pctChange(curr, prev) {
  if (!prev) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}

export function ReportsContent() {
  const [filterPreset, setFilterPreset] = useState('30d');
  const range = useMemo(() => getRangeFromPreset(filterPreset), [filterPreset]);
  const prevRange = useMemo(() => {
    if (filterPreset === 'all') return null;
    const days = filterPreset === '7d' ? 7 : filterPreset === '30d' ? 30 : 90;
    const end = new Date(range.from);
    end.setMilliseconds(-1);
    const start = new Date(end);
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    return { from: start, to: end };
  }, [filterPreset, range]);

  const customers = useStore((s) => s.customers);
  const leads = useStore((s) => s.leads);
  const orders = useStore((s) => s.orders);
  const quotations = useStore((s) => s.quotations);
  const pipeline = useStore((s) => s.pipeline) ?? {};

  const salesInRange = useMemo(() => sumOrdersTotal(orders, range), [orders, range]);
  const salesPrev = useMemo(
    () => (prevRange ? sumOrdersTotal(orders, prevRange) : 0),
    [orders, prevRange]
  );
  const customersInRange = useMemo(() => countEntities(customers, range), [customers, range]);
  const customersPrev = useMemo(
    () => (prevRange ? countEntities(customers, prevRange) : 0),
    [customers, prevRange]
  );
  const leadsInRange = useMemo(() => countEntities(leads, range), [leads, range]);
  const leadsPrev = useMemo(
    () => (prevRange ? countEntities(leads, prevRange) : 0),
    [leads, prevRange]
  );
  const quotesInRange = useMemo(() => countEntities(quotations, range), [quotations, range]);
  const pt = useMemo(() => pipelineTotals(pipeline), [pipeline]);
  const funnelRows = useMemo(() => buildFunnelRows(leads, pipeline), [leads, pipeline]);
  const salesTrend = useMemo(() => buildLast6MonthsOrderTrend(orders), [orders]);
  const sparkData = salesTrend.map((d) => ({ v: d.amount || 0 }));

  const ordersInRange = useMemo(
    () => (orders || []).filter((o) => isInRange(o.created_at, range.from, range.to)),
    [orders, range]
  );
  const avgTicket = ordersInRange.length ? salesInRange / ordersInRange.length : 0;

  const leadStatusData = useMemo(() => {
    const counts = { new: 0, contacted: 0, qualified: 0, converted: 0, lost: 0 };
    (leads || []).forEach((l) => {
      if (counts[l.status] !== undefined) counts[l.status] += 1;
    });
    return Object.entries(counts)
      .filter(([, c]) => c > 0)
      .map(([status, count], i) => ({
        name: status,
        count,
        fill: CHART_COLORS[i % CHART_COLORS.length],
      }));
  }, [leads]);

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
    <PageContainer className="space-y-4 sm:space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-stitch-text tracking-tight">Reportes y Analítica</h2>
          <p className="text-xs sm:text-sm text-stitch-muted mt-1">
            Métricas en tiempo real calculadas desde tus datos.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
          <div className="overflow-x-auto -mx-1 px-1 pb-1 sm:pb-0 sm:overflow-visible">
            <StitchPeriodPills value={filterPreset} onChange={setFilterPreset} options={PERIOD_OPTIONS} />
          </div>
          <Button type="button" variant="outline" onClick={handleExport} className="w-full sm:w-auto border-stitch-border text-stitch-text hover:bg-stitch-surface-elevated shrink-0">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StitchKpiCard
          icon={BarChart3}
          label="Ventas (periodo)"
          value={formatCurrency(salesInRange)}
          trend={prevRange ? pctChange(salesInRange, salesPrev) : null}
          sparkData={sparkData}
          sparkColor="#5f8bff"
          largeIcon
        />
        <StitchKpiCard
          icon={Users}
          label="Clientes nuevos"
          value={String(customersInRange)}
          trend={prevRange ? pctChange(customersInRange, customersPrev) : null}
          sparkData={sparkData}
          sparkColor="#4ade80"
          largeIcon
        />
        <StitchKpiCard
          icon={Target}
          label="Leads (periodo)"
          value={String(leadsInRange)}
          trend={prevRange ? pctChange(leadsInRange, leadsPrev) : null}
          sparkData={sparkData}
          sparkColor="#fbbf24"
          largeIcon
        />
        <StitchKpiCard
          icon={FileText}
          label="Cotizaciones"
          value={String(quotesInRange)}
          trend={null}
          sparkData={sparkData}
          sparkColor="#a78bfa"
          largeIcon
        />
        <StitchKpiCard
          icon={DollarSign}
          label="Ticket promedio"
          value={formatCurrency(avgTicket)}
          trend={null}
          sparkData={sparkData}
          sparkColor="#38bdf8"
          largeIcon
        />
        <StitchKpiCard
          icon={PieChartIcon}
          label="Valor pipeline"
          value={formatCurrency(pt.value)}
          trend={pt.count > 0 ? 12 : 0}
          sparkData={sparkData}
          sparkColor="#5f8bff"
          largeIcon
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 stitch-panel">
          <div className="p-4 border-b border-stitch-border flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-stitch-text text-lg">Ingresos en el tiempo</h3>
              <p className="text-xs font-mono text-stitch-muted mt-0.5 uppercase">Últimos 6 meses</p>
            </div>
          </div>
          <div className="p-3 sm:p-4 chart-h-sm min-h-[13rem]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend}>
                <defs>
                  <linearGradient id="reportsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5f8bff" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#5f8bff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8c90a1' }} axisLine={{ stroke: '#1e293b' }} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#8c90a1' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatCurrency(v)}
                />
                <Tooltip
                  content={({ active, payload, label }) => (
                    <StitchChartTooltip
                      active={active}
                      payload={payload}
                      label={label}
                      formatter={(v) => [`$${Number(v).toLocaleString('es-CO')}`, 'Ventas']}
                    />
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#5f8bff"
                  strokeWidth={2}
                  fill="url(#reportsGradient)"
                  dot={{ r: 3, fill: '#031427', stroke: '#5f8bff', strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: '#5f8bff' }}
                  isAnimationActive
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="stitch-panel">
          <div className="p-4 border-b border-stitch-border">
            <h3 className="font-semibold text-stitch-text">Leads por estado</h3>
          </div>
          <div className="p-3 sm:p-4 chart-h-sm min-h-[13rem]">
            {leadStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadStatusData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    isAnimationActive
                  >
                    {leadStatusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<StitchChartTooltip formatter={(v, n) => [`${v} leads`, n]} />} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} formatter={(v) => <span className="text-stitch-muted capitalize">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-stitch-muted text-center py-12">Sin leads registrados</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="stitch-panel">
          <div className="p-4 border-b border-stitch-border">
            <h3 className="font-semibold text-stitch-text">Pedidos en el periodo</h3>
            <p className="text-xs text-stitch-muted">{ordersInRange.length} pedidos</p>
          </div>
          <div className="p-4 max-h-72 overflow-y-auto custom-scrollbar">
            {ordersInRange.length === 0 ? (
              <p className="text-sm text-stitch-muted">No hay pedidos en el rango seleccionado.</p>
            ) : (
              <div className="space-y-2">
                {ordersInRange.slice(0, 20).map((o) => (
                  <div
                    key={o.id}
                    className="flex justify-between items-center text-sm py-2 border-b border-stitch-border/30 last:border-0 hover:bg-stitch-surface-elevated/50 px-2 rounded transition-colors"
                  >
                    <span className="font-mono text-stitch-muted">{o.order_number || o.number}</span>
                    <span className="font-semibold text-stitch-text">{formatCurrency(Number(o.total) || 0)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="stitch-panel">
          <div className="p-4 border-b border-stitch-border">
            <h3 className="font-semibold text-stitch-text">Embudo comercial</h3>
            <p className="text-xs text-stitch-muted">Conversión por etapa</p>
          </div>
          <div className="p-3 sm:p-4 chart-h-sm min-h-[13rem]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelRows} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#8c90a1' }} />
                <YAxis
                  type="category"
                  dataKey="stage"
                  tick={{ fontSize: 10, fill: '#8c90a1' }}
                  width={100}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<StitchChartTooltip formatter={(v, n) => [`${v}`, n]} />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} isAnimationActive>
                  {funnelRows.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

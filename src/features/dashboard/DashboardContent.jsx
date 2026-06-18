import { useState, useMemo } from 'react';
import {
  DollarSign, Users, Target, ShoppingCart,
  Percent, Receipt, GitBranch, Sparkles,
  TrendingDown, TrendingUp, Minus, ArrowUpRight,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, RadialBarChart, RadialBar,
} from 'recharts';
import { useCrmModal } from '@/contexts/CrmModalContext';
import { Avatar } from '@/components/ui/Avatar';
import { useStore } from '@/store/useStore';
import {
  formatCurrency,
  getRangeFromPreset,
  isInRange,
  pipelineTotals,
  sumOrdersTotal,
  buildLast6MonthsOrderTrend,
} from '@/lib/crmMetrics';
import { STAGE_COLORS } from '@/config/crm';
import { PageContainer } from '@/components/stitch/PageContainer';

const CHART_COLORS = ['#5f8bff', '#4ade80', '#fbbf24', '#a78bfa', '#f87171', '#38bdf8'];

function MiniSparkline({ data, color = '#5f8bff' }) {
  if (!data?.length) return null;
  return (
    <div className="w-16 h-6">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <Bar dataKey="v" fill={color} radius={[2, 2, 0, 0]} isAnimationActive />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, trend, sparkData, sparkColor }) {
  const trendUp = trend > 0;
  const trendDown = trend < 0;
  const TrendIcon = trendUp ? TrendingUp : trendDown ? TrendingDown : Minus;
  const trendColor = trendUp
    ? 'text-stitch-success bg-stitch-success/10'
    : trendDown
      ? 'text-stitch-danger bg-stitch-danger/10'
      : 'text-stitch-muted bg-stitch-surface-elevated';

  return (
    <div className="stitch-kpi group">
      <div className="absolute inset-0 bg-gradient-to-br from-stitch-primary-bright/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative">
        <div className="flex justify-between items-start mb-2">
          <p className="text-[11px] font-mono uppercase tracking-wider text-stitch-muted">{label}</p>
          <Icon className="w-4 h-4 text-stitch-primary-bright" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-stitch-text tracking-tight">{value}</h2>
        <div className="mt-3 flex items-center justify-between">
          {trend !== null && (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium ${trendColor}`}>
              <TrendIcon className="w-3 h-3" />
              {trend > 0 ? '+' : ''}{trend}%
            </div>
          )}
          <MiniSparkline data={sparkData} color={sparkColor} />
        </div>
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-stitch-border bg-stitch-surface px-3 py-2 shadow-xl">
      <p className="text-[11px] font-mono text-stitch-muted mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-sm font-semibold text-stitch-text">
          {formatter ? formatter(p.value, p.name) : `${p.name}: ${p.value}`}
        </p>
      ))}
    </div>
  );
}

export function DashboardContent() {
  const { openModal } = useCrmModal();
  const pipeline = useStore((state) => state.pipeline) || {};
  const customers = useStore((state) => state.customers);
  const leads = useStore((state) => state.leads);
  const orders = useStore((state) => state.orders);

  const [chartRange, setChartRange] = useState('6m');
  const range30 = useMemo(() => getRangeFromPreset('30d'), []);
  const rangePrev30 = useMemo(() => {
    const end = new Date(range30.from);
    end.setMilliseconds(-1);
    const start = new Date(end);
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    return { from: start, to: end };
  }, [range30]);

  const pt = useMemo(() => pipelineTotals(pipeline), [pipeline]);
  const sales30 = useMemo(() => sumOrdersTotal(orders, range30), [orders, range30]);
  const salesPrev30 = useMemo(() => sumOrdersTotal(orders, rangePrev30), [orders, rangePrev30]);
  const newLeadsCount = useMemo(
    () => (leads || []).filter((l) => l.status === 'new' && isInRange(l.created_at, range30.from, range30.to)).length,
    [leads, range30]
  );
  const prevLeadsCount = useMemo(
    () => (leads || []).filter((l) => l.status === 'new' && isInRange(l.created_at, rangePrev30.from, rangePrev30.to)).length,
    [leads, rangePrev30]
  );
  const ordersInRange = useMemo(
    () => (orders || []).filter((o) => isInRange(o.created_at, range30.from, range30.to)).length,
    [orders, range30]
  );
  const avgTicket = ordersInRange > 0 ? sales30 / ordersInRange : 0;
  const leadTotal = (leads || []).filter((l) => isInRange(l.created_at, range30.from, range30.to)).length;
  const convPct = leadTotal > 0
    ? Math.round(((leads || []).filter((l) => l.status === 'converted' && isInRange(l.created_at, range30.from, range30.to)).length / leadTotal) * 100)
    : 0;

  const pctChange = (curr, prev) => {
    if (!prev) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  const salesTrend = useMemo(() => buildLast6MonthsOrderTrend(orders), [orders]);
  const sparkFromTrend = (key) => salesTrend.map((d) => ({ v: d[key] || d.amount || 0 }));

  const pipelineSummary = useMemo(
    () =>
      Object.entries(pipeline)
        .filter(([stage]) => stage !== 'closed_lost')
        .map(([stage, opps]) => ({
          stage,
          name: stage.replace(/_/g, ' '),
          count: opps?.length || 0,
          value: (opps || []).reduce((s, o) => s + (o.value || 0), 0),
          fill: STAGE_COLORS[stage] || CHART_COLORS[0],
        })),
    [pipeline]
  );

  const pieData = pipelineSummary.filter((s) => s.count > 0);

  const recentActivity = useMemo(() => {
    const items = [];
    (orders || []).slice(0, 5).forEach((o) => {
      items.push({
        id: `order-${o.id}`,
        label: o.customer_name || 'Pedido',
        type: 'Pedido',
        value: formatCurrency(o.total),
        date: o.created_at,
        badge: 'success',
      });
    });
    (leads || []).slice(0, 3).forEach((l) => {
      items.push({
        id: `lead-${l.id}`,
        label: l.company_name || l.contact_name || 'Lead',
        type: 'Lead',
        value: l.status,
        date: l.created_at,
        badge: 'primary',
      });
    });
    return items
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6);
  }, [orders, leads]);

  const quickActions = [
    { id: 'customer', icon: Users, label: 'Nuevo cliente', color: 'bg-stitch-action' },
    { id: 'lead', icon: Target, label: 'Nuevo prospecto', color: 'bg-stitch-success' },
    { id: 'quotation', icon: DollarSign, label: 'Nueva cotización', color: 'bg-violet-500' },
    { id: 'order', icon: ShoppingCart, label: 'Nuevo pedido', color: 'bg-stitch-warning' },
  ];

  const openQuick = (id) => {
    const map = { customer: 'customer', lead: 'lead', quotation: 'quotation', order: 'order' };
    if (map[id]) openModal(map[id]);
  };

  const convRadial = [{ name: 'Conversión', value: convPct, fill: '#5f8bff' }];

  const isEmpty = customers.length === 0 && leads.length === 0 && orders.length === 0;

  return (
    <PageContainer className="space-y-4">
      {isEmpty && (
        <div className="rounded-lg border border-stitch-warning/30 bg-stitch-warning/10 px-4 py-3 text-sm text-stitch-text">
          Todavía no hay datos cargados: las cifras de este panel salen de <strong>clientes, leads y pedidos</strong> en tu base. Creá registros desde las secciones del menú.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <KpiCard
          icon={DollarSign}
          label="Ventas (30d)"
          value={formatCurrency(sales30)}
          trend={pctChange(sales30, salesPrev30)}
          sparkData={sparkFromTrend('amount')}
          sparkColor="#5f8bff"
        />
        <KpiCard
          icon={Percent}
          label="Conversión"
          value={`${convPct}%`}
          trend={null}
          sparkData={sparkFromTrend('amount')}
          sparkColor="#4ade80"
        />
        <KpiCard
          icon={Users}
          label="Leads nuevos"
          value={String(newLeadsCount)}
          trend={pctChange(newLeadsCount, prevLeadsCount)}
          sparkData={sparkFromTrend('amount')}
          sparkColor="#fbbf24"
        />
        <KpiCard
          icon={Receipt}
          label="Ticket prom."
          value={formatCurrency(avgTicket)}
          trend={null}
          sparkData={sparkFromTrend('amount')}
          sparkColor="#a78bfa"
        />
        <KpiCard
          icon={GitBranch}
          label="Pipeline"
          value={formatCurrency(pt.value)}
          trend={pt.count > 0 ? 12 : 0}
          sparkData={sparkFromTrend('amount')}
          sparkColor="#38bdf8"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 stitch-panel flex flex-col">
          <div className="p-4 border-b border-stitch-border flex flex-wrap justify-between items-center gap-2">
            <div>
              <h3 className="font-semibold text-stitch-text text-lg">Tendencia de ventas</h3>
              <p className="text-xs font-mono text-stitch-muted mt-0.5 uppercase tracking-wider">Últimos 6 meses</p>
            </div>
            <div className="flex items-center gap-1">
              {['1m', '6m', 'all'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setChartRange(r)}
                  className={`px-3 py-1 text-xs font-mono rounded border transition-colors ${
                    chartRange === r
                      ? 'border-stitch-primary-bright/50 bg-stitch-primary-bright/10 text-stitch-primary'
                      : 'border-stitch-border bg-stitch-surface-elevated text-stitch-muted hover:text-stitch-text'
                  }`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="p-3 sm:p-4 chart-h-sm min-h-[13rem]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend} margin={{ top: 10, right: 4, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5f8bff" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#5f8bff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8c90a1' }} axisLine={{ stroke: '#1e293b' }} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#8c90a1' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `$${Math.round(v / 1e3)}k` : `$${v}`)}
                />
                <Tooltip
                  content={({ active, payload, label }) => (
                    <ChartTooltip
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
                  fill="url(#salesGradient)"
                  dot={{ r: 4, fill: '#031427', stroke: '#5f8bff', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#5f8bff', stroke: '#fff', strokeWidth: 2 }}
                  isAnimationActive
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="stitch-panel flex-1">
            <div className="p-3 border-b border-stitch-border flex justify-between items-center">
              <h3 className="text-xs font-mono font-semibold text-stitch-text uppercase tracking-wider">Embudo</h3>
              <span className="text-xs text-stitch-muted">{Object.values(pipeline).flat().length} opps</span>
            </div>
            <div className="p-3 sm:p-4 chart-h-md min-h-[11rem]">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      isAnimationActive
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={entry.stage} fill={entry.fill || CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip formatter={(v, n) => [`${v} oportunidades`, n]} />} />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', color: '#8c90a1' }}
                      formatter={(value) => <span className="text-stitch-muted capitalize">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-stitch-muted text-center py-8">Sin oportunidades en pipeline</p>
              )}
            </div>
          </div>

          <div className="stitch-panel">
            <div className="p-3 border-b border-stitch-border flex justify-between items-center">
              <h3 className="text-xs font-mono font-semibold text-stitch-text uppercase tracking-wider">Conversión</h3>
              <Sparkles className="w-4 h-4 text-stitch-primary-bright" />
            </div>
            <div className="p-3 sm:p-4 h-32 sm:h-36 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="100%"
                  barSize={12}
                  data={convRadial}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    background={{ fill: '#1e293b' }}
                    dataKey="value"
                    cornerRadius={6}
                    isAnimationActive
                  />
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-stitch-text text-2xl font-bold">
                    {convPct}%
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 stitch-panel">
          <div className="p-4 border-b border-stitch-border">
            <h3 className="font-semibold text-stitch-text">Etapas del embudo</h3>
            <p className="text-xs text-stitch-muted mt-0.5">Distribución por etapa</p>
          </div>
          <div className="p-3 sm:p-4 chart-h-md min-h-[11rem]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineSummary} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#8c90a1' }} axisLine={{ stroke: '#1e293b' }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#8c90a1' }}
                  axisLine={false}
                  tickLine={false}
                  width={90}
                />
                <Tooltip content={<ChartTooltip formatter={(v) => [`${v} opps`, 'Cantidad']} />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} isAnimationActive>
                  {pipelineSummary.map((entry) => (
                    <Cell key={entry.stage} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="stitch-panel">
          <div className="p-3 border-b border-stitch-border">
            <h3 className="text-xs font-mono font-semibold text-stitch-text uppercase tracking-wider">Acciones rápidas</h3>
          </div>
          <div className="p-3 grid grid-cols-1 gap-2">
            {quickActions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => openQuick(action.id)}
                className="flex items-center gap-3 p-3 rounded-lg border border-stitch-border/50 hover:border-stitch-primary-bright/40 hover:bg-stitch-surface-elevated transition-all group text-left"
              >
                <div className={`p-2 rounded-lg ${action.color}`}>
                  <action.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-stitch-text group-hover:text-stitch-primary flex-1">
                  {action.label}
                </span>
                <ArrowUpRight className="w-4 h-4 text-stitch-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="stitch-panel overflow-hidden">
        <div className="p-4 border-b border-stitch-border flex justify-between items-center bg-stitch-surface-elevated/60">
          <h3 className="font-semibold text-stitch-text">Actividad reciente</h3>
          <span className="text-[11px] font-mono text-stitch-muted uppercase">Últimos movimientos</span>
        </div>
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr className="bg-stitch-surface-elevated">
                <th className="p-3 text-[11px] font-mono text-stitch-muted uppercase tracking-wider border-b border-stitch-border">Cuenta</th>
                <th className="p-3 text-[11px] font-mono text-stitch-muted uppercase tracking-wider border-b border-stitch-border">Tipo</th>
                <th className="p-3 text-[11px] font-mono text-stitch-muted uppercase tracking-wider border-b border-stitch-border">Valor</th>
                <th className="p-3 text-[11px] font-mono text-stitch-muted uppercase tracking-wider border-b border-stitch-border text-right">Fecha</th>
              </tr>
            </thead>
            <tbody className="text-sm text-stitch-text">
              {recentActivity.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-stitch-muted text-sm">
                    Sin actividad registrada
                  </td>
                </tr>
              ) : (
                recentActivity.map((row) => (
                  <tr key={row.id} className="hover:bg-stitch-surface-elevated/50 transition-colors border-b border-stitch-border/30 last:border-0">
                    <td className="p-3 font-medium flex items-center gap-2">
                      <Avatar name={row.label} size="sm" />
                      {row.label}
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border ${
                        row.badge === 'success'
                          ? 'text-stitch-success bg-stitch-success/10 border-stitch-success/20'
                          : 'text-stitch-primary bg-stitch-primary-bright/10 border-stitch-primary-bright/20'
                      }`}>
                        {row.type}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-stitch-muted">{row.value}</td>
                    <td className="p-3 text-right text-[11px] font-mono text-stitch-muted">
                      {row.date ? new Date(row.date).toLocaleDateString('es-CO') : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}

import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { BarChart, Bar } from 'recharts';
import { StitchResponsiveContainer } from '@/components/stitch/StitchResponsiveContainer';

function formatTooltipValue(formatter, value, name) {
  if (!formatter) return `${name}: ${value}`;
  const result = formatter(value, name);
  if (Array.isArray(result)) return result.filter(Boolean).join(' · ');
  return result;
}

export function StitchChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-stitch-border bg-stitch-surface px-3 py-2 shadow-xl">
      {label && <p className="text-[11px] font-mono text-stitch-muted mb-1">{label}</p>}
      {payload.map((p) => (
        <p key={p.dataKey} className="text-sm font-semibold text-stitch-text">
          {formatTooltipValue(formatter, p.value, p.name)}
        </p>
      ))}
    </div>
  );
}

export function StitchMiniSparkline({ data, color = '#5f8bff' }) {
  if (!data?.length) return null;
  return (
    <div className="w-16 h-6">
      <StitchResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <Bar dataKey="v" fill={color} radius={[2, 2, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </StitchResponsiveContainer>
    </div>
  );
}

export function StitchKpiCard({ icon, label, value, trend, sparkData, sparkColor, largeIcon }) {
  const Icon = icon;
  const trendUp = trend > 0;
  const trendDown = trend < 0;
  const TrendIcon = trendUp ? TrendingUp : trendDown ? TrendingDown : Minus;
  const trendColor = trendUp
    ? 'text-stitch-success bg-stitch-success/10 border-stitch-success/20'
    : trendDown
      ? 'text-stitch-danger bg-stitch-danger/10 border-stitch-danger/20'
      : 'text-stitch-muted bg-stitch-surface-elevated border-stitch-border';

  return (
    <div className="stitch-kpi group">
      {largeIcon && (
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
          <Icon className="w-16 h-16 text-stitch-primary-bright" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-stitch-primary-bright/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative">
        <div className="flex justify-between items-start mb-2">
          <p className="text-[11px] font-mono uppercase tracking-wider text-stitch-muted">{label}</p>
          {!largeIcon && <Icon className="w-4 h-4 text-stitch-primary-bright" />}
        </div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-stitch-text tracking-tight break-words">{value}</h2>
        <div className="mt-3 flex items-center justify-between">
          {trend !== null && trend !== undefined ? (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${trendColor}`}>
              <TrendIcon className="w-3 h-3" />
              {trend > 0 ? '+' : ''}{trend}%
            </div>
          ) : (
            <span />
          )}
          {sparkData && <StitchMiniSparkline data={sparkData} color={sparkColor} />}
        </div>
      </div>
    </div>
  );
}

export function StitchPeriodPills({ value, onChange, options }) {
  return (
    <div className="flex items-center bg-stitch-surface-elevated border border-stitch-border/30 rounded p-1 w-max max-w-full shrink-0">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`px-2.5 sm:px-3 py-1.5 rounded text-xs font-mono transition-colors whitespace-nowrap shrink-0 ${
            value === opt.id
              ? 'bg-stitch-surface-elevated text-stitch-text border border-stitch-border/20 shadow-sm'
              : 'text-stitch-muted hover:text-stitch-text'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

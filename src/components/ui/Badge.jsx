import { cn } from '@/lib/utils';

const Badge = ({ variant = 'gray', children, className }) => {
  const variants = {
    gray: 'bg-stitch-surface-elevated text-stitch-muted border-stitch-border/30',
    blue: 'bg-stitch-primary-bright/10 text-stitch-primary border-stitch-primary-bright/20',
    green: 'bg-stitch-success/10 text-stitch-success border-stitch-success/20',
    red: 'bg-stitch-danger/10 text-stitch-danger border-stitch-danger/20',
    amber: 'bg-stitch-warning/10 text-stitch-warning border-stitch-warning/20',
    purple: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  };

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono font-medium border', variants[variant], className)}>
      {children}
    </span>
  );
};

export { Badge };

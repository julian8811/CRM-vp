import { cn } from '@/lib/utils';

function StitchPageHeader({ title, subtitle, actions, className }) {
  return (
    <div className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div>
        <h2 className="text-2xl font-bold text-stitch-text tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-stitch-muted mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 items-center">{actions}</div>}
    </div>
  );
}

export { StitchPageHeader };

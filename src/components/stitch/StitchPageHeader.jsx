import { cn } from '@/lib/utils';

function StitchPageHeader({ title, subtitle, actions, className }) {
  return (
    <div
      className={cn(
        'mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-start sm:justify-between',
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <h2 className="text-xl sm:text-2xl font-bold text-stitch-text tracking-tight break-words">{title}</h2>
        {subtitle && (
          <p className="text-xs sm:text-sm text-stitch-muted mt-1 break-words">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

export { StitchPageHeader };

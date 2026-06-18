import { cn } from '@/lib/utils';

function CrmLogo({ size = 'md', showText = true, className }) {
  const sizes = {
    sm: { img: 'w-8 h-8', title: 'text-base', subtitle: 'text-[10px]' },
    md: { img: 'w-10 h-10', title: 'text-lg', subtitle: 'text-[11px]' },
    lg: { img: 'w-12 h-12', title: 'text-2xl', subtitle: 'text-xs' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <img
        src="/assets/stitch/logo.svg"
        alt="CRM-VP"
        className={cn(s.img, 'shrink-0')}
      />
      {showText && (
        <div className="min-w-0">
          <div className={cn(s.title, 'font-bold text-white tracking-tight leading-tight')}>
            CRM-VP
          </div>
          <div className={cn(s.subtitle, 'font-mono uppercase tracking-wider text-stitch-muted')}>
            Enterprise Hub
          </div>
        </div>
      )}
    </div>
  );
}

export { CrmLogo };

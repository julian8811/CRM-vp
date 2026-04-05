import { cn } from '@/lib/utils';

const Badge = ({ variant = 'gray', children, className }) => {
  const variants = {
    gray: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    red: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    purple: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  };

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', variants[variant], className)}>
      {children}
    </span>
  );
};

export { Badge };

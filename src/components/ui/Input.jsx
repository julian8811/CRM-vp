import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Input = forwardRef(({ className, type = 'text', error, ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      className={cn(
        'w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all text-sm',
        error && 'border-red-500 focus:ring-red-500/50',
        className
      )}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export { Input };

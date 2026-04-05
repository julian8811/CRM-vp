import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const Label = forwardRef(({ className, children, required, ...props }, ref) => {
  return (
    <label ref={ref} className={cn('text-sm font-medium text-slate-700 dark:text-slate-300', className)} {...props}>
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
});

Label.displayName = 'Label';

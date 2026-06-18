import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Input = forwardRef(({ className, type = 'text', error, ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      className={cn(
        'w-full px-4 py-2.5 rounded-lg border border-stitch-border/40 bg-stitch-surface-elevated text-stitch-text',
        'placeholder:text-stitch-muted focus:outline-none focus:ring-1 focus:ring-stitch-primary-bright/50 focus:border-stitch-primary-bright/50 transition-all text-sm',
        error && 'border-stitch-danger focus:ring-stitch-danger/50',
        className
      )}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export { Input };

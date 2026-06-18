import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Button = forwardRef(({
  className,
  variant = 'primary',
  size = 'md',
  children,
  ...props
}, ref) => {
  const variants = {
    primary: 'bg-stitch-primary-bright text-[#031427] hover:bg-stitch-primary font-semibold',
    secondary: 'bg-stitch-surface-elevated text-stitch-text hover:bg-stitch-surface border border-stitch-border',
    outline: 'border border-stitch-border bg-transparent text-stitch-text hover:bg-stitch-surface-elevated hover:border-stitch-primary-bright/40',
    ghost: 'bg-transparent text-stitch-muted hover:bg-stitch-surface-elevated hover:text-stitch-text',
    danger: 'bg-stitch-danger/90 text-white hover:bg-stitch-danger',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export { Button };

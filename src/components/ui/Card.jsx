import { cn } from '@/lib/utils';

function Card({ className, children, hover = false, ...props }) {
  return (
    <div
      className={cn(
        'stitch-panel transition-all',
        hover && 'hover:border-stitch-primary-bright/30 hover:shadow-glow cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn('px-6 py-4 border-b border-stitch-border', className)} {...props}>
      {children}
    </div>
  );
}

function CardContent({ className, children, ...props }) {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  );
}

export { Card, CardHeader, CardContent };

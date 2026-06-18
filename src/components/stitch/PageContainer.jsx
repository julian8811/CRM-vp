import { cn } from '@/lib/utils';

function PageContainer({ children, className, size = 'wide' }) {
  return (
    <div
      className={cn(
        'w-full min-w-0 mx-auto',
        size === 'wide' && 'max-w-[1440px]',
        size === 'narrow' && 'max-w-3xl',
        size === 'full' && 'max-w-none',
        className
      )}
    >
      {children}
    </div>
  );
}

export { PageContainer };

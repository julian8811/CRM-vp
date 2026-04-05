import { cn } from '@/lib/utils';

function Avatar({ name, size = 'md', className }) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const initials = name
    ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-purple-500',
    'bg-pink-500', 'bg-indigo-500', 'bg-cyan-500'
  ];
  
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;

  return (
    <div className={cn(
      'rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0',
      sizes[size],
      colors[colorIndex],
      className
    )}>
      {initials}
    </div>
  );
}

export { Avatar };

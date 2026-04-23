import { cn } from '@/utils/cn';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full font-medium transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'bg-slate-700 text-slate-300',
        primary: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
        success: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
        warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
        danger: 'bg-red-500/20 text-red-400 border border-red-500/30',
        info: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-1.5 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'sm',
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  pulse?: boolean;
}

export function Badge({ className, variant, size, pulse, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), pulse && 'animate-pulse', className)} {...props}>
      {children}
    </span>
  );
}

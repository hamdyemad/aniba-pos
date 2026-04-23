import React from 'react';
import { cn } from '@/utils/cn';
import { Search } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  isSearch?: boolean;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, isSearch, error, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {(icon || isSearch) && (
          <div className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
            {icon || <Search className="w-5 h-5" />}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full h-12 bg-slate-900/80 border border-slate-700 rounded-xl px-4 text-white text-base th-bg-input th-text',
            'placeholder:text-slate-500 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500',
            'hover:border-slate-600',
            (icon || isSearch) && 'ps-11',
            error && 'border-red-500 focus:ring-red-500/50',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

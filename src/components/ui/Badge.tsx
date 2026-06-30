import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'blue' | 'green' | 'red' | 'yellow' | 'slate';
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Komponen Badge untuk menampilkan label berwarna.
 */
export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}: BadgeProps) {
  const variantClasses = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
    blue: 'bg-rose-50 text-rose-700 border border-rose-200',
    green: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    red: 'bg-rose-50 text-rose-700 border border-rose-200',
    yellow: 'bg-amber-50 text-amber-700 border border-amber-200',
    slate: 'bg-slate-50 text-slate-700 border border-slate-200',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-semibold
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

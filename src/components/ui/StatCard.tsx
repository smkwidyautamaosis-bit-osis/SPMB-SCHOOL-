import React from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  accent?: 'blue' | 'yellow' | 'green' | 'red' | 'slate';
  subLabel?: string;
}

const accentConfig = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    iconBg: 'bg-blue-100',
    iconText: 'text-blue-700',
    valueText: 'text-blue-900',
    labelText: 'text-blue-600',
  },
  yellow: {
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-700',
    valueText: 'text-amber-900',
    labelText: 'text-amber-600',
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-100',
    iconBg: 'bg-green-100',
    iconText: 'text-green-700',
    valueText: 'text-green-900',
    labelText: 'text-green-600',
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-100',
    iconBg: 'bg-red-100',
    iconText: 'text-red-700',
    valueText: 'text-red-900',
    labelText: 'text-red-600',
  },
  slate: {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    iconBg: 'bg-slate-100',
    iconText: 'text-slate-600',
    valueText: 'text-slate-900',
    labelText: 'text-slate-500',
  },
};

/**
 * Komponen StatCard untuk menampilkan angka statistik di dashboard admin.
 * Mendukung 5 accent color sesuai palet status pendaftaran.
 */
export function StatCard({
  label,
  value,
  icon,
  accent = 'slate',
  subLabel,
}: StatCardProps) {
  const cfg = accentConfig[accent];

  return (
    <div
      className={`
        rounded-2xl border p-5 flex items-center gap-4
        transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
        ${cfg.bg} ${cfg.border}
      `}
    >
      {icon && (
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.iconBg} ${cfg.iconText}`}
        >
          {icon}
        </div>
      )}
      <div>
        <p className={`text-3xl font-black ${cfg.valueText}`}>{value}</p>
        <p className={`text-sm font-medium ${cfg.labelText}`}>{label}</p>
        {subLabel && (
          <p className="text-xs text-slate-400 mt-0.5">{subLabel}</p>
        )}
      </div>
    </div>
  );
}

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
    iconBg: 'bg-rose-50/80',
    valueText: 'text-rose-950',
  },
  yellow: {
    iconBg: 'bg-amber-50/80',
    valueText: 'text-rose-950',
  },
  green: {
    iconBg: 'bg-emerald-50/80', 
    valueText: 'text-rose-950',
  },
  red: {
    iconBg: 'bg-rose-50/80',
    valueText: 'text-rose-950',
  },
  slate: {
    iconBg: 'bg-slate-50/80',
    valueText: 'text-rose-950',
  },
};

/**
 * Komponen StatCard untuk menampilkan angka statistik di dashboard admin.
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
        bg-white rounded-2xl p-4 flex items-center justify-between
        shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5
      `}
    >
      <div className="flex flex-col">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
        <p className={`text-2xl font-black ${cfg.valueText} tracking-tight leading-none`}>{value}</p>
        {subLabel && (
          <p className="text-[10px] font-medium text-slate-400 mt-1">{subLabel}</p>
        )}
      </div>
      {icon && (
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.iconBg} ml-3`}
        >
          {icon}
        </div>
      )}
    </div>
  );
}

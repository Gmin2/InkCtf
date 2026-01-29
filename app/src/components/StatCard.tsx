import type { FC, ReactNode } from 'react';

export type StatVariant = 'default' | 'success' | 'error' | 'warning';

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: ReactNode;
  variant?: StatVariant;
  sublabel?: string;
}

const variantStyles: Record<StatVariant, string> = {
  default: 'text-(--text-primary)',
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
};

export const StatCard: FC<StatCardProps> = ({
  label,
  value,
  icon,
  variant = 'default',
  sublabel,
}) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-(--border-color) last:border-b-0">
      <div className="flex items-center gap-3">
        {icon && <span className="text-(--text-secondary)">{icon}</span>}
        <div>
          <span className="text-sm text-(--text-secondary)">{label}</span>
          {sublabel && (
            <span className="block text-[10px] text-(--text-secondary) opacity-60 mono">
              {sublabel}
            </span>
          )}
        </div>
      </div>
      <span className={`text-xl font-black mono ${variantStyles[variant]}`}>
        {value}
      </span>
    </div>
  );
};

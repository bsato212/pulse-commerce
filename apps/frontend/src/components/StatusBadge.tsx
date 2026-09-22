import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getColors = () => {
    switch (status.toUpperCase()) {
      case 'CONFIRMED':
      case 'PAID':
      case 'FULFILLED':
      case 'DELIVERED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'PENDING':
      case 'ALLOCATING':
      case 'AUTHORIZED':
      case 'IN_TRANSIT':
      case 'SHIPPED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'CANCELLED':
      case 'FAILED':
      case 'REFUNDED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'DRAFT':
      case 'UNFULFILLED':
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getColors()}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-75 animate-pulse" />
      {status}
    </span>
  );
};

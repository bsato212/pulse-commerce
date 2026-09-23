import React from 'react';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { TrendingUp, PackageCheck, AlertTriangle, Clock, ArrowUpRight, Truck } from 'lucide-react';

interface DashboardPageProps {
  onNavigateOrders: () => void;
  onNavigateInventory: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateOrders,
  onNavigateInventory,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-gradient-to-r from-indigo-950/60 to-slate-900 border border-indigo-900/40 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Operations Command Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time fulfillment metrics, multi-warehouse routing, and active dispatch pipeline.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateOrders}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            <span>Process Orders</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Daily Gross Volume"
          value="$128,450.00"
          change="+18.4%"
          isPositive={true}
          icon={TrendingUp}
          subtitle="Across 2 active tenants"
        />
        <StatCard
          title="Fulfillment Rate"
          value="98.2%"
          change="+1.2%"
          isPositive={true}
          icon={PackageCheck}
          subtitle="Avg dispatch: 4.2 hours"
        />
        <StatCard
          title="Pending Allocation"
          value="14 Orders"
          change="3 awaiting stock"
          isPositive={false}
          icon={Clock}
          subtitle="Newark & Reno hubs"
        />
        <StatCard
          title="Low Stock Alerts"
          value="2 Items"
          change="Reorder point reached"
          isPositive={false}
          icon={AlertTriangle}
          subtitle="Headphones & Desk Chairs"
        />
      </div>

      {/* Main Content Split: Recent Activity & Warehouse Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Order Activity */}
        <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700/60 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">Live Fulfillment Stream</h2>
              <p className="text-xs text-slate-400">
                Latest orders routed through allocation engine
              </p>
            </div>
            <button
              onClick={onNavigateOrders}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              View all
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs text-slate-400 uppercase bg-slate-800/60 border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Order Number</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Warehouse</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr className="hover:bg-slate-800/30">
                  <td className="py-3 px-3 font-mono text-white text-xs">ORD-2026-1001</td>
                  <td className="py-3 px-3">Jane Smith</td>
                  <td className="py-3 px-3">
                    <StatusBadge status="CONFIRMED" />
                  </td>
                  <td className="py-3 px-3 text-xs text-slate-400">WH-USEAST-01</td>
                  <td className="py-3 px-3 text-right font-medium text-white">$408.65</td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="py-3 px-3 font-mono text-white text-xs">ORD-2026-1002</td>
                  <td className="py-3 px-3">Jane Smith</td>
                  <td className="py-3 px-3">
                    <StatusBadge status="PENDING" />
                  </td>
                  <td className="py-3 px-3 text-xs text-slate-400">WH-USWEST-01</td>
                  <td className="py-3 px-3 text-right font-medium text-white">$533.25</td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="py-3 px-3 font-mono text-white text-xs">ORD-2026-0988</td>
                  <td className="py-3 px-3">Enterprise Client</td>
                  <td className="py-3 px-3">
                    <StatusBadge status="SHIPPED" />
                  </td>
                  <td className="py-3 px-3 text-xs text-slate-400">WH-USEAST-01</td>
                  <td className="py-3 px-3 text-right font-medium text-white">$1,450.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Warehouse Capacity & Carrier Health */}
        <div className="space-y-6">
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5">
            <h2 className="text-base font-semibold text-white mb-3">Warehouse Hubs</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">WH-USEAST-01 (Newark)</span>
                  <span className="text-slate-400">74% capacity</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '74%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">WH-USWEST-01 (Reno)</span>
                  <span className="text-slate-400">58% capacity</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '58%' }} />
                </div>
              </div>
            </div>

            <button
              onClick={onNavigateInventory}
              className="mt-5 w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-lg transition"
            >
              Manage Warehouse Stock
            </button>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-white">Active 3PL Logistics</h2>
              <Truck className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-slate-800/60 border border-slate-700/40">
                <span className="font-medium text-slate-200">Internal Dedicated Fleet</span>
                <span className="text-emerald-400 font-mono">ONLINE</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-800/60 border border-slate-700/40">
                <span className="font-medium text-slate-200">ShipBob 3PL Carrier</span>
                <span className="text-amber-400 font-mono">EXTENSION READY</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

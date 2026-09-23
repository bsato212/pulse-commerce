import React from 'react';
import { LayoutDashboard, ShoppingCart, Boxes, Package, Layers, Sparkles } from 'lucide-react';

export type ActiveTab = 'dashboard' | 'orders' | 'inventory' | 'products' | 'extensions';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders & Fulfillment', icon: ShoppingCart },
    { id: 'inventory', label: 'Multi-Warehouse', icon: Boxes },
    { id: 'products', label: 'Catalog Products', icon: Package },
    { id: 'extensions', label: 'PR & CR Playground', icon: Sparkles, badge: 'Evaluation' },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between shrink-0">
      <nav className="space-y-1.5">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
          Fulfillment Suite
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id as ActiveTab)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl text-xs text-slate-400">
        <div className="flex items-center space-x-2 text-slate-300 font-medium mb-1">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>Evaluation Stack</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Fullstack OMS configured for AI Agent PR generation & Code Review validation.
        </p>
      </div>
    </aside>
  );
};

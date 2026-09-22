import React from 'react';
import { Activity, Bell, Database, Server } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-6 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/30">
          ⚡
        </div>
        <div>
          <span className="font-bold text-lg tracking-tight text-white">PulseCommerce</span>
          <span className="ml-2 text-xs font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            OMS Core
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
          <Database className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-slate-300">PostgreSQL</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </div>

        <div className="flex items-center space-x-2 text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
          <Server className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-slate-300">Valkey Cache</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </div>

        <div className="flex items-center space-x-2 text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Tenant: <strong className="text-white">Acme Retail Corp</strong></span>
        </div>

        <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition">
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

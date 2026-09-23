import React, { useState } from 'react';
import { fetchApi } from '../api/client';
import { Sliders, Layers, Send } from 'lucide-react';

export const ExtensionHooksPage: React.FC = () => {
  const [outboxResult, setOutboxResult] = useState<any | null>(null);
  const [runningOutbox, setRunningOutbox] = useState<boolean>(false);

  const handleProcessOutbox = async () => {
    setRunningOutbox(true);
    try {
      const res = await fetchApi<any>('/fulfillment/outbox/process', { method: 'POST' });
      setOutboxResult(res);
    } catch (err: any) {
      setOutboxResult({ status: 'error', message: err.message });
    } finally {
      setRunningOutbox(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border border-indigo-700/50 rounded-2xl">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Sliders className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            System Extensions & Integrations
          </h1>
        </div>
        <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
          Modular architecture extension interfaces for pluggable 3PL logistics adapters, dynamic
          promotional pricing strategies, and asynchronous event workers.
        </p>
      </div>

      {/* Extension Interfaces Grid */}
      <div>
        <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <span>Modular Extension Interfaces</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Hook 1: ShipBob 3PL */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  Carrier Adapter
                </span>
                <span className="text-xs text-amber-400 font-mono">STUB INTERFACE</span>
              </div>
              <h3 className="font-bold text-white text-base">ShipBob 3PL Carrier Adapter</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Connect external 3PL logistics provider to replace mock fleet. Implements rates,
                labels, and tracking webhooks.
              </p>
              <div className="mt-3 p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400">
                apps/backend/src/modules/fulfillment/carriers/shipbob.carrier.ts
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
              <strong>Interface Contract:</strong> Implements <code>CarrierAdapter</code> interface
              with rates, shipment label generation, and webhook ingestion.
            </div>
          </div>

          {/* Hook 2: Tiered Promotions */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  Pricing Engine
                </span>
                <span className="text-xs text-amber-400 font-mono">STRATEGY PATTERN</span>
              </div>
              <h3 className="font-bold text-white text-base">Tiered Promotions Engine</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Expand checkout pricing with strategy-pattern discount rules: BOGO, volume tiers,
                and category exclusives.
              </p>
              <div className="mt-3 p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400">
                apps/backend/src/modules/orders/promotions/promotion-engine.service.ts
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
              <strong>Interface Contract:</strong> Implements <code>PromotionRuleStrategy</code>{' '}
              classes plugged into the transactional order calculation engine.
            </div>
          </div>

          {/* Hook 3: Webhook Dispatcher */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  Event Dispatcher
                </span>
                <span className="text-xs text-amber-400 font-mono">HMAC PIPELINE</span>
              </div>
              <h3 className="font-bold text-white text-base">Tenant Webhook Worker</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Outbound event broadcaster signing payloads with HMAC-SHA256 and retrying on network
                drops.
              </p>
              <div className="mt-3 p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400">
                apps/backend/src/modules/hooks-pending/webhooks/
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
              <strong>Interface Contract:</strong> Dispatches tenant webhooks with HMAC-SHA256
              signatures and exponential backoff retry policies.
            </div>
          </div>
        </div>
      </div>

      {/* Live Pipeline Test Runner */}
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-white text-base">Transactional Outbox Event Trigger</h3>
            <p className="text-xs text-slate-400">
              Trigger processing of pending transactional outbox events to test worker dispatching.
            </p>
          </div>
          <button
            onClick={handleProcessOutbox}
            disabled={runningOutbox}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{runningOutbox ? 'Dispatching...' : 'Dispatch Outbox Batch'}</span>
          </button>
        </div>

        {outboxResult && (
          <div className="mt-3 p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-300">
            <pre>{JSON.stringify(outboxResult, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

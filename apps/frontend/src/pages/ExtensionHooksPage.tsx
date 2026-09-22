import React, { useState } from 'react';
import { fetchApi } from '../api/client';
import {
  Sparkles,
  GitPullRequest,
  CheckCircle,
  Code2,
  Terminal,
  Send,
  Layers,
} from 'lucide-react';

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
            <Sparkles className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AI Evaluation Playground</h1>
        </div>
        <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
          This fullstack repository is pre-configured with standardized architectural hooks for evaluating
          <strong> AI Draft PR generation</strong> and <strong>AI Code Review (CR)</strong> agents.
        </p>
      </div>

      {/* Draft PR Targets Grid */}
      <div>
        <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <GitPullRequest className="w-5 h-5 text-indigo-400" />
          <span>Pending Feature Extension Hooks (For Draft PR Testing)</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Hook 1: ShipBob 3PL */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  Feature Hook A
                </span>
                <span className="text-xs text-amber-400 font-mono">STUB READY</span>
              </div>
              <h3 className="font-bold text-white text-base">ShipBob 3PL Carrier Adapter</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Connect external 3PL logistics provider to replace mock fleet. Implements rates, labels, and tracking webhooks.
              </p>
              <div className="mt-3 p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400">
                apps/backend/src/modules/fulfillment/carriers/shipbob.carrier.ts
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
              <strong>Evaluation Goal:</strong> Agent should implement `CarrierAdapter` interface, mock HTTP API calls, and add unit tests.
            </div>
          </div>

          {/* Hook 2: Tiered Promotions */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  Feature Hook B
                </span>
                <span className="text-xs text-amber-400 font-mono">STRATEGY READY</span>
              </div>
              <h3 className="font-bold text-white text-base">Tiered Promotions Engine</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Expand checkout pricing with strategy-pattern discount rules: BOGO, volume tiers, and category exclusives.
              </p>
              <div className="mt-3 p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400">
                apps/backend/src/modules/orders/promotions/promotion-engine.service.ts
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
              <strong>Evaluation Goal:</strong> Agent should implement `PromotionRuleStrategy` classes and wire them into order calculation.
            </div>
          </div>

          {/* Hook 3: Webhook Dispatcher */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  Feature Hook C
                </span>
                <span className="text-xs text-amber-400 font-mono">HMAC READY</span>
              </div>
              <h3 className="font-bold text-white text-base">Tenant Webhook Worker</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Outbound event broadcaster signing payloads with HMAC-SHA256 and retrying on network drops.
              </p>
              <div className="mt-3 p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400">
                apps/backend/src/modules/hooks-pending/webhooks/
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
              <strong>Evaluation Goal:</strong> Agent should implement an exponential backoff loop and delivery event status updates.
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
              Test execution of the outbox processor pipeline against the backend API.
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

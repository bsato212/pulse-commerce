import React, { useState, useEffect } from 'react';
import { fetchApi } from '../api/client';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface WarehouseStock {
  id: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderPoint: number;
  isLowStock: boolean;
}

export const InventoryPage: React.FC = () => {
  const [stocks, setStocks] = useState<WarehouseStock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [adjustModal, setAdjustModal] = useState<WarehouseStock | null>(null);
  const [delta, setDelta] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<string>('RECEIVING');
  const [reserveModal, setReserveModal] = useState<WarehouseStock | null>(null);
  const [reserveQty, setReserveQty] = useState<number>(1);
  const [notification, setNotification] = useState<string | null>(null);

  const loadStocks = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<WarehouseStock[]>('/inventory/stocks');
      setStocks(data);
    } catch {
      // Fallback mock data
      setStocks([
        {
          id: 'f0000000-0000-0000-0000-000000000001',
          warehouseId: 'b0000000-0000-0000-0000-000000000001',
          warehouseName: 'Newark Distribution Hub',
          warehouseCode: 'WH-USEAST-01',
          productId: 'c0000000-0000-0000-0000-000000000001',
          productName: 'Pulse ANC Pro Wireless Headphones',
          sku: 'AUDIO-ANC-PRO',
          quantity: 150,
          reservedQuantity: 12,
          availableQuantity: 138,
          reorderPoint: 25,
          isLowStock: false,
        },
        {
          id: 'f0000000-0000-0000-0000-000000000002',
          warehouseId: 'b0000000-0000-0000-0000-000000000002',
          warehouseName: 'Reno Fulfillment Center',
          warehouseCode: 'WH-USWEST-01',
          productId: 'c0000000-0000-0000-0000-000000000001',
          productName: 'Pulse ANC Pro Wireless Headphones',
          sku: 'AUDIO-ANC-PRO',
          quantity: 200,
          reservedQuantity: 5,
          availableQuantity: 195,
          reorderPoint: 30,
          isLowStock: false,
        },
        {
          id: 'f0000000-0000-0000-0000-000000000003',
          warehouseId: 'b0000000-0000-0000-0000-000000000001',
          warehouseName: 'Newark Distribution Hub',
          warehouseCode: 'WH-USEAST-01',
          productId: 'c0000000-0000-0000-0000-000000000002',
          productName: 'Pulse Mini USB-C HiFi DAC',
          sku: 'AUDIO-DAC-MINI',
          quantity: 80,
          reservedQuantity: 2,
          availableQuantity: 78,
          reorderPoint: 15,
          isLowStock: false,
        },
        {
          id: 'f0000000-0000-0000-0000-000000000004',
          warehouseId: 'b0000000-0000-0000-0000-000000000002',
          warehouseName: 'Reno Fulfillment Center',
          warehouseCode: 'WH-USWEST-01',
          productId: 'c0000000-0000-0000-0000-000000000003',
          productName: 'ErgoPulse Mesh Desk Chair',
          sku: 'FURN-ERGO-CHAIR',
          quantity: 12,
          reservedQuantity: 4,
          availableQuantity: 8,
          reorderPoint: 10,
          isLowStock: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStocks();
  }, []);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModal) return;

    try {
      await fetchApi('/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify({
          warehouseId: adjustModal.warehouseId,
          productId: adjustModal.productId,
          quantityDelta: Number(delta),
          reason: adjustReason,
        }),
      });
      setNotification(`Stock updated for ${adjustModal.sku} by ${delta > 0 ? `+${delta}` : delta}`);
      setAdjustModal(null);
      loadStocks();
    } catch (err: any) {
      alert(`Adjustment error: ${err.message}`);
    }
  };

  const handleReserveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reserveModal) return;

    try {
      const res = await fetchApi<any>('/inventory/reserve', {
        method: 'POST',
        body: JSON.stringify({
          warehouseId: reserveModal.warehouseId,
          productId: reserveModal.productId,
          quantity: Number(reserveQty),
        }),
      });
      setNotification(`Stock reserved successfully! Reservation: ${res.reservationId}`);
      setReserveModal(null);
      loadStocks();
    } catch (err: any) {
      alert(`Reservation error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Multi-Warehouse Inventory
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time stock balancing, reservation hold states, and cycle count adjustments.
          </p>
        </div>

        <button
          onClick={loadStocks}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-medium text-slate-200 rounded-lg transition flex items-center gap-2 self-start"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Stock</span>
        </button>
      </div>

      {notification && (
        <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-xs text-emerald-300 flex items-center justify-between">
          <span>{notification}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-emerald-200 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stock Matrix Table */}
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-slate-800/80 border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Warehouse</th>
                <th className="py-3 px-4">SKU / Item</th>
                <th className="py-3 px-4 text-right">Physical On-Hand</th>
                <th className="py-3 px-4 text-right">Reserved Hold</th>
                <th className="py-3 px-4 text-right">Available to Promise</th>
                <th className="py-3 px-4 text-center">Reorder Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Querying multi-warehouse stock records...
                  </td>
                </tr>
              ) : (
                stocks.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-white text-xs">{item.warehouseName}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {item.warehouseCode}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-xs text-indigo-300">{item.sku}</div>
                      <div className="text-xs text-slate-300">{item.productName}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-200">
                      {item.quantity}
                    </td>
                    <td className="py-3.5 px-4 text-right text-amber-400 font-medium">
                      {item.reservedQuantity}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                      {item.availableQuantity}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {item.isLowStock ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Low Stock ({item.reorderPoint})
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Normal</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => {
                            setAdjustModal(item);
                            setDelta(10);
                          }}
                          className="px-2 py-1 bg-slate-700/60 hover:bg-slate-700 text-slate-200 rounded text-xs transition"
                        >
                          Adjust
                        </button>
                        <button
                          onClick={() => {
                            setReserveModal(item);
                            setReserveQty(1);
                          }}
                          className="px-2 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 rounded text-xs transition"
                        >
                          Reserve
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {adjustModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleAdjustSubmit}
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <h3 className="font-bold text-lg text-white">Adjust Warehouse Stock</h3>
            <p className="text-xs text-slate-400">
              {adjustModal.productName} ({adjustModal.sku}) at {adjustModal.warehouseCode}
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Adjustment Delta (+ or -)</label>
                <input
                  type="number"
                  value={delta}
                  onChange={(e) => setDelta(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Reason</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="RECEIVING">Purchase Order Receiving</option>
                  <option value="CYCLE_COUNT">Cycle Count Correction</option>
                  <option value="DAMAGE">Damaged / Written-Off</option>
                  <option value="MANUAL_CORRECTION">Manual Inventory Adjustment</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAdjustModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
              >
                Apply Adjustment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reserve Stock Modal */}
      {reserveModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleReserveSubmit}
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <h3 className="font-bold text-lg text-white">Create Stock Reservation</h3>
            <p className="text-xs text-slate-400">
              Hold units for product {reserveModal.sku} in {reserveModal.warehouseCode}
            </p>

            <div className="text-xs">
              <label className="block text-slate-300 mb-1">Quantity to Hold</label>
              <input
                type="number"
                min="1"
                max={reserveModal.availableQuantity}
                value={reserveQty}
                onChange={(e) => setReserveQty(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                required
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Current Available: {reserveModal.availableQuantity} units
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReserveModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
              >
                Confirm Hold
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

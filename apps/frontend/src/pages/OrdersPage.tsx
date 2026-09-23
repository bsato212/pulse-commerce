import React, { useState, useEffect } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { fetchApi } from '../api/client';
import { FileText, Truck } from 'lucide-react';

interface OrderItem {
  id: string;
  sku: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerEmail: string;
  status: string;
  fulfillmentStatus: string;
  paymentStatus: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingTotal: number;
  grandTotal: number;
  currency: string;
  createdAt: string;
  items?: OrderItem[];
}

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [invoiceModal, setInvoiceModal] = useState<any | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<Order[]>('/orders');
      setOrders(data);
    } catch {
      // Fallback seed orders if backend is not currently running
      setOrders([
        {
          id: 'd0000000-0000-0000-0000-000000000001',
          orderNumber: 'ORD-2026-1001',
          customerEmail: 'jane.smith@example.com',
          status: 'CONFIRMED',
          fulfillmentStatus: 'PARTIALLY_FULFILLED',
          paymentStatus: 'PAID',
          subtotal: 389.49,
          discountTotal: 25.0,
          taxTotal: 29.16,
          shippingTotal: 15.0,
          grandTotal: 408.65,
          currency: 'USD',
          createdAt: new Date().toISOString(),
          items: [
            {
              id: 'e0000000-0000-0000-0000-000000000001',
              sku: 'AUDIO-ANC-PRO',
              productName: 'Pulse ANC Pro Wireless Headphones',
              unitPrice: 299.99,
              quantity: 1,
              subtotal: 279.99,
            },
            {
              id: 'e0000000-0000-0000-0000-000000000002',
              sku: 'AUDIO-DAC-MINI',
              productName: 'Pulse Mini USB-C HiFi DAC',
              unitPrice: 89.5,
              quantity: 1,
              subtotal: 84.5,
            },
          ],
        },
        {
          id: 'd0000000-0000-0000-0000-000000000002',
          orderNumber: 'ORD-2026-1002',

          customerEmail: 'jane.smith@example.com',
          status: 'PENDING',
          fulfillmentStatus: 'UNFULFILLED',
          paymentStatus: 'AUTHORIZED',
          subtotal: 450.0,
          discountTotal: 0.0,
          taxTotal: 38.25,
          shippingTotal: 45.0,
          grandTotal: 533.25,
          currency: 'USD',
          createdAt: new Date().toISOString(),
          items: [
            {
              id: 'item-3',
              sku: 'FURN-ERGO-CHAIR',
              productName: 'ErgoPulse Mesh Desk Chair',
              unitPrice: 450.0,
              quantity: 1,
              subtotal: 450.0,
            },
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleAdvanceStatus = async (orderId: string, nextStatus: string) => {
    try {
      await fetchApi(`/orders/${orderId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: nextStatus }),
      });
      setActionMessage(`Order transitioned to ${nextStatus}`);
      loadOrders();
    } catch (err: any) {
      setActionMessage(`Failed to transition status: ${err.message}`);
    }
  };

  const handleFetchInvoice = async (orderId: string) => {
    try {
      const invoice = await fetchApi<any>(`/orders/${orderId}/invoice`);
      setInvoiceModal(invoice);
    } catch (err: any) {
      alert(`Could not fetch invoice: ${err.message}`);
    }
  };

  const filtered = orders.filter((o) =>
    filterStatus === 'ALL' ? true : o.status === filterStatus,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Orders & Fulfillment</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage order lifecycles, state machine transitions, and invoice dispatching.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="ALLOCATING">Allocating</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
          </select>
          <button
            onClick={loadOrders}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-medium text-slate-200 rounded-lg transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-lg bg-indigo-900/40 border border-indigo-700/60 text-xs text-indigo-300 flex items-center justify-between">
          <span>{actionMessage}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-indigo-200 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-slate-800/80 border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Order Number</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Fulfillment</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading orders from database...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No orders matching filter.
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-medium text-white text-xs">
                      {order.orderNumber}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">{order.customerEmail}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="text-slate-400">{order.fulfillmentStatus}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-white">
                      ${order.grandTotal.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {order.status === 'PENDING' && (
                          <button
                            onClick={() => handleAdvanceStatus(order.id, 'CONFIRMED')}
                            className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 rounded text-xs transition"
                          >
                            Confirm
                          </button>
                        )}
                        {order.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleAdvanceStatus(order.id, 'ALLOCATING')}
                            className="px-2 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded text-xs transition"
                          >
                            Allocate
                          </button>
                        )}
                        {order.status === 'ALLOCATING' && (
                          <button
                            onClick={() => handleAdvanceStatus(order.id, 'SHIPPED')}
                            className="px-2 py-1 bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/30 rounded text-xs transition flex items-center gap-1"
                          >
                            <Truck className="w-3 h-3" />
                            Ship
                          </button>
                        )}
                        <button
                          onClick={() => handleFetchInvoice(order.id)}
                          title="View PDF Invoice"
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded transition"
                        >
                          <FileText className="w-4 h-4" />
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

      {/* Invoice Viewer Modal */}
      {invoiceModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-lg text-white">{invoiceModal.invoiceNumber}</h3>
                <p className="text-xs text-slate-400">
                  Date: {new Date(invoiceModal.date).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setInvoiceModal(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-1 text-slate-300">
              <p>
                <strong>Tenant:</strong> {invoiceModal.tenant?.name}
              </p>
              <p>
                <strong>Customer:</strong> {invoiceModal.customer?.name} (
                {invoiceModal.customer?.email})
              </p>
            </div>

            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-slate-300">
                <thead className="bg-slate-800/80 uppercase text-[10px] text-slate-400">
                  <tr>
                    <th className="p-2 text-left">SKU</th>
                    <th className="p-2 text-left">Product</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {invoiceModal.lineItems?.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="p-2 font-mono text-slate-400">{item.sku}</td>
                      <td className="p-2 font-medium">{item.name}</td>
                      <td className="p-2 text-right">{item.quantity}</td>
                      <td className="p-2 text-right font-medium">${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${invoiceModal.pricing?.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Discount:</span>
                <span>-${invoiceModal.pricing?.discount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>${invoiceModal.pricing?.tax?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>${invoiceModal.pricing?.shipping?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-white text-sm pt-1 border-t border-slate-800">
                <span>Grand Total:</span>
                <span>${invoiceModal.pricing?.grandTotal?.toFixed(2)} USD</span>
              </div>
            </div>

            <button
              onClick={() => setInvoiceModal(null)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
            >
              Close Invoice
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

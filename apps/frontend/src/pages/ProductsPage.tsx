import React, { useState, useEffect } from 'react';
import { fetchApi } from '../api/client';
import { Search, Server } from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  costPrice: number;
  categoryName?: string;
  active: boolean;
  totalAvailableStock?: number;
}

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState<string>('');
  const [priceModal, setPriceModal] = useState<Product | null>(null);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadProducts = async () => {
    try {
      const res = await fetchApi<{ data: Product[] }>(
        `/products?search=${encodeURIComponent(search)}`,
      );
      setProducts(res.data);
    } catch {
      // Fallback seed catalog
      setProducts([
        {
          id: 'c0000000-0000-4000-8000-000000000001',
          sku: 'AUDIO-ANC-PRO',
          name: 'Pulse ANC Pro Wireless Headphones',
          description: 'Studio-grade noise cancelling wireless headphones with 40h battery life',
          price: 299.99,
          costPrice: 120.0,
          categoryName: 'Electronics & Audio',
          active: true,
          totalAvailableStock: 333,
        },
        {
          id: 'c0000000-0000-4000-8000-000000000002',
          sku: 'AUDIO-DAC-MINI',
          name: 'Pulse Mini USB-C HiFi DAC',
          description: 'Lossless 32-bit/384kHz digital audio converter',
          price: 89.5,
          costPrice: 32.0,
          categoryName: 'Electronics & Audio',
          active: true,
          totalAvailableStock: 188,
        },
        {
          id: 'c0000000-0000-4000-8000-000000000003',
          sku: 'FURN-ERGO-CHAIR',
          name: 'ErgoPulse Mesh Desk Chair',
          description: 'High-back lumbar support ergonomic task chair',
          price: 450.0,
          costPrice: 195.0,
          categoryName: 'Office Equipment',
          active: true,
          totalAvailableStock: 66,
        },
      ]);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [search]);

  const handleUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceModal) return;

    try {
      await fetchApi(`/products/${priceModal.id}/price`, {
        method: 'PUT',
        body: JSON.stringify({ price: Number(newPrice) }),
      });
      setFeedback(`Price updated for ${priceModal.sku} to $${newPrice}`);
      setPriceModal(null);
      loadProducts();
    } catch (err: any) {
      alert(`Price update failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Catalog Management</h1>
          <p className="text-sm text-slate-400 mt-1">
            Global SKU definitions, price lists, and Valkey cache-accelerated catalog lookups.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search SKU or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-950/40 border border-purple-800/50 text-purple-300 text-xs">
            <Server className="w-3.5 h-3.5" />
            <span>Valkey TTL: 600s</span>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-xs text-emerald-300 flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-emerald-200 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Catalog Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 flex flex-col justify-between hover:border-slate-600 transition"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-mono text-xs text-indigo-400 font-semibold px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                  {product.sku}
                </span>
                <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {product.categoryName || 'General'}
                </span>
              </div>
              <h3 className="font-bold text-base text-white mt-1">{product.name}</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{product.description}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Unit Price</span>
                <span className="text-xl font-bold text-white">
                  ${Number(product.price ?? 0).toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Cost: ${Number(product.costPrice ?? 0).toFixed(2)}
                </span>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className="text-xs text-emerald-400 font-medium">
                  {product.totalAvailableStock || 0} in stock
                </span>
                <button
                  onClick={() => {
                    setPriceModal(product);
                    setNewPrice(product.price);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition"
                >
                  Adjust Price
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Price Modal */}
      {priceModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleUpdatePrice}
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4"
          >
            <h3 className="font-bold text-lg text-white">Adjust Price</h3>
            <p className="text-xs text-slate-400">
              Update catalog retail price for <strong>{priceModal.sku}</strong>.
            </p>

            <div className="text-xs">
              <label className="block text-slate-300 mb-1">New Retail Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPriceModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
              >
                Save New Price
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

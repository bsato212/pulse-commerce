import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { OrdersPage } from './pages/OrdersPage';
import { InventoryPage } from './pages/InventoryPage';
import { ProductsPage } from './pages/ProductsPage';
import { ExtensionHooksPage } from './pages/ExtensionHooksPage';
import { ErrorBoundary } from './components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            <ErrorBoundary>
              {activeTab === 'dashboard' && (
                <DashboardPage
                  onNavigateOrders={() => setActiveTab('orders')}
                  onNavigateInventory={() => setActiveTab('inventory')}
                />
              )}
              {activeTab === 'orders' && <OrdersPage />}
              {activeTab === 'inventory' && <InventoryPage />}
              {activeTab === 'products' && <ProductsPage />}
              {activeTab === 'extensions' && <ExtensionHooksPage />}
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;

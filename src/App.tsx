import { useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  PlusCircle,
  FileText,
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useDistributorStore } from './stores/distributorStore';
import DashboardPage from './pages/DashboardPage';
import StockPage from './pages/StockPage';
import OrdersPage from './pages/OrdersPage';
import NewOrderPage from './pages/NewOrderPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ReportPage from './pages/ReportPage';
import ReglagesPage from './pages/ReglagesPage';
import { Settings as SettingsIcon } from 'lucide-react';
import CompanyHeader from './pages/CompayHeader';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Accueil' },
  // { to: '/stock', icon: Package, label: 'Stock' },
  { to: '/orders', icon: ShoppingCart, label: 'Commandes' },
  { to: '/report', icon: FileText, label: 'Rapport' },
  { to: '/settings', icon: SettingsIcon, label: 'Réglages' },
];

export default function App() {
  const loadAll = useDistributorStore((s) => s.loadAll);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return (
    <div style={{ minHeight: '100vh' }}>
      <Toaster position="top-center" reverseOrder={false} />
      <CompanyHeader />
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        {/* <Route path="/stock" element={<StockPage />} /> */}
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/new" element={<NewOrderPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/settings" element={<ReglagesPage />} />
      </Routes>

      <nav className="bottom-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/' || item.to === '/orders'}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}


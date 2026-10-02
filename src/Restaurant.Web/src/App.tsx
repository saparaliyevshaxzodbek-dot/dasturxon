import { Navigate, Route, Routes } from 'react-router';
import type { StaffRole } from './api/types';
import SiteLayout from './pages/site/SiteLayout';
import MenuPage from './pages/site/MenuPage';
import CheckoutPage from './pages/site/CheckoutPage';
import DeliveryPage from './pages/site/DeliveryPage';
import TrackPage, { TrackLookupPage } from './pages/site/TrackPage';
import LoginPage from './pages/admin/LoginPage';
import AdminLayout, { RequireRole } from './pages/admin/AdminLayout';
import DashboardPage from './pages/admin/DashboardPage';
import BoardPage from './pages/admin/BoardPage';
import OrdersPage from './pages/admin/OrdersPage';
import MenuAdminPage from './pages/admin/MenuAdminPage';
import DeliveryZonesPage from './pages/admin/DeliveryZonesPage';
import StaffPage from './pages/admin/StaffPage';

const MANAGEMENT: StaffRole[] = ['Admin', 'Manager'];

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<MenuPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="delivery" element={<DeliveryPage />} />
        <Route path="track" element={<TrackLookupPage />} />
        <Route path="track/:id" element={<TrackPage />} />
      </Route>

      <Route path="admin/login" element={<LoginPage />} />
      <Route
        path="admin"
        element={
          <RequireRole>
            <AdminLayout />
          </RequireRole>
        }
      >
        <Route index element={<RequireRole roles={MANAGEMENT}><DashboardPage /></RequireRole>} />
        <Route path="board" element={<BoardPage />} />
        <Route path="orders" element={<RequireRole roles={MANAGEMENT}><OrdersPage /></RequireRole>} />
        <Route path="menu" element={<RequireRole roles={['Admin', 'Manager', 'Cook']}><MenuAdminPage /></RequireRole>} />
        <Route path="zones" element={<RequireRole roles={MANAGEMENT}><DeliveryZonesPage /></RequireRole>} />
        <Route path="staff" element={<RequireRole roles={['Admin']}><StaffPage /></RequireRole>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

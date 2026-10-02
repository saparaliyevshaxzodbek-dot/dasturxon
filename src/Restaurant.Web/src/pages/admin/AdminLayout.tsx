import { createContext, useContext, useState, type ReactNode } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import type { StaffRole } from '../../api/types';
import { playChime, useStaffOrderEvents, type LiveState } from '../../lib/hub';
import { ROLE_LABEL } from '../../lib/orders';
import { homeFor, useAuth } from '../../store/auth';
import { useToast } from '../../store/toast';
import { Logo } from '../../components/ui';

interface LiveContextValue {
  state: LiveState;
  /** Orders that arrived while this screen was open, highlighted on the board. */
  freshIds: Set<number>;
}

const LiveContext = createContext<LiveContextValue>({ state: 'connecting', freshIds: new Set() });

export const useLive = () => useContext(LiveContext);

export function RequireRole({ roles, children }: { roles?: StaffRole[]; children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;
  return <>{children}</>;
}

const NAV: { to: string; label: string; icon: string; roles: StaffRole[]; end?: boolean }[] = [
  { to: '/admin', label: 'Boshqaruv paneli', icon: '📊', roles: ['Admin', 'Manager'], end: true },
  { to: '/admin/board', label: 'Buyurtmalar oqimi', icon: '🔥', roles: ['Admin', 'Manager', 'Cook', 'Courier'] },
  { to: '/admin/orders', label: 'Buyurtmalar tarixi', icon: '📋', roles: ['Admin', 'Manager'] },
  { to: '/admin/menu', label: 'Menyu', icon: '🍽️', roles: ['Admin', 'Manager', 'Cook'] },
  { to: '/admin/zones', label: 'Yetkazib berish', icon: '🛵', roles: ['Admin', 'Manager'] },
  { to: '/admin/staff', label: 'Xodimlar', icon: '👥', roles: ['Admin'] },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [freshIds, setFreshIds] = useState<Set<number>>(new Set());

  const state = useStaffOrderEvents({
    onCreated: (order) => {
      setFreshIds((current) => new Set(current).add(order.id));
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (user?.role !== 'Courier') {
        playChime();
        toast(`🔔 Yangi buyurtma #${order.id} — ${order.customerName}`, 'info');
      }
    },
    onUpdated: (order) => {
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (user?.role === 'Courier' && order.status === 'Ready' && order.deliveryType === 'Delivery') {
        playChime();
        toast(`🛵 Buyurtma #${order.id} yetkazishga tayyor`, 'info');
      }
    },
  });

  if (!user) return null;
  const items = NAV.filter((item) => item.roles.includes(user.role));

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
      isActive ? 'bg-white/10 text-white' : 'text-stone-400 hover:bg-white/5 hover:text-white'
    }`;

  return (
    <LiveContext.Provider value={{ state, freshIds }}>
      <div className="min-h-screen bg-stone-100 lg:flex">
        <aside className="hidden w-64 shrink-0 flex-col bg-stone-900 p-4 lg:flex lg:h-screen lg:sticky lg:top-0">
          <Link to="/" target="_blank" className="px-2 py-2">
            <Logo light />
          </Link>
          <nav className="mt-6 flex-1 space-y-1">
            {items.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
            <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-stone-400 hover:bg-white/5 hover:text-white">
              <span className="text-lg">🌐</span>
              Saytni ochish
            </a>
          </nav>
          <LiveIndicator state={state} />
          <div className="mt-3 rounded-xl bg-white/5 p-3">
            <p className="truncate text-sm font-semibold text-white">{user.fullName}</p>
            <p className="text-xs text-stone-400">{ROLE_LABEL[user.role]}</p>
            <button onClick={logout} className="mt-2 text-xs font-semibold text-brand-400 hover:text-brand-300">
              Chiqish →
            </button>
          </div>
        </aside>

        <header className="sticky top-0 z-30 bg-stone-900 lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Logo light />
            <div className="flex items-center gap-3">
              <LiveIndicator state={state} compact />
              <button onClick={logout} className="text-xs font-semibold text-stone-300">
                Chiqish
              </button>
            </div>
          </div>
          <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3">
            {items.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={(p) => `${linkClass(p)} shrink-0`}>
                <span>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </LiveContext.Provider>
  );
}

function LiveIndicator({ state, compact = false }: { state: LiveState; compact?: boolean }) {
  const label = state === 'live' ? 'Jonli ulanish' : state === 'connecting' ? 'Ulanmoqda…' : "Aloqa yo'q";
  const dot = state === 'live' ? 'bg-emerald-400 animate-pulse' : state === 'connecting' ? 'bg-amber-400' : 'bg-red-500';
  return (
    <div className={`flex items-center gap-2 text-xs font-medium text-stone-400 ${compact ? '' : 'px-3'}`} title={label}>
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {!compact && label}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-stone-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

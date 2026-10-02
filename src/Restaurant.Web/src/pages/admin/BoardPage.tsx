import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../../api/endpoints';
import type { Order, OrderStatus, StaffRole } from '../../api/types';
import { elapsed, etaTime, mapLink, minutesSince, money, phone, time } from '../../lib/format';
import { DELIVERY_ICON, DELIVERY_LABEL, PAYMENT_LABEL, STATUS_LABEL } from '../../lib/orders';
import { useAuth } from '../../store/auth';
import { EmptyState, ErrorBox, Spinner } from '../../components/ui';
import { IconMap } from '../../components/icons';
import { PageHeader, useLive } from './AdminLayout';
import { OrderActions, useNow } from './orderActions';

const COLUMNS: Record<StaffRole, OrderStatus[]> = {
  Admin: ['New', 'Preparing', 'Ready', 'OnTheWay'],
  Manager: ['New', 'Preparing', 'Ready', 'OnTheWay'],
  Cook: ['New', 'Preparing', 'Ready'],
  Courier: ['Ready', 'OnTheWay'],
};

const COLUMN_STYLE: Record<string, string> = {
  New: 'border-sky-400',
  Preparing: 'border-amber-400',
  Ready: 'border-emerald-500',
  OnTheWay: 'border-violet-500',
};

/** Kitchen and courier screen: live columns of every order still in progress. */
export default function BoardPage() {
  const { user } = useAuth();
  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['orders', 'active'],
    queryFn: ordersApi.active,
    refetchInterval: 60_000,
  });
  const now = useNow();

  if (!user) return null;
  const columns = COLUMNS[user.role];
  // Couriers see deliveries waiting for pickup plus the ones they are carrying.
  const visible = (orders ?? []).filter(
    (o) => user.role !== 'Courier' || (o.deliveryType === 'Delivery' && (o.status === 'Ready' || o.courierId === user.id)),
  );

  return (
    <>
      <PageHeader
        title={user.role === 'Courier' ? 'Mening yetkazishlarim' : 'Buyurtmalar oqimi'}
        subtitle="Yangi buyurtmalar avtomatik paydo bo'ladi va ovozli signal beriladi"
      />
      {isLoading && <Spinner />}
      {error && <ErrorBox error={error} />}
      {orders && (
        <div className={`grid gap-4 md:grid-cols-2 ${columns.length === 4 ? '2xl:grid-cols-4' : columns.length === 3 ? 'xl:grid-cols-3' : ''}`}>
          {columns.map((status) => {
            const list = visible.filter((o) => o.status === status);
            return (
              <section key={status} className={`rounded-3xl border-t-4 bg-sand/70 p-3 ${COLUMN_STYLE[status]}`}>
                <div className="mb-3 flex items-center justify-between px-1">
                  <h2 className="font-extrabold">{STATUS_LABEL[status]}</h2>
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-sm font-extrabold shadow-sm">{list.length}</span>
                </div>
                <div className="space-y-3">
                  {list.length === 0 && <EmptyState icon="✨" title="Bo'sh" />}
                  {list.map((order) => (
                    <Ticket key={order.id} order={order} now={now} showCustomer={user.role !== 'Cook'} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}

function Ticket({ order, now, showCustomer }: { order: Order; now: number; showCustomer: boolean }) {
  const { freshIds } = useLive();
  const waited = minutesSince(order.createdAt, now);
  const late = waited > order.estimatedMinutes && order.status !== 'OnTheWay';

  return (
    <article className={`rounded-2xl bg-white p-4 shadow-card ${freshIds.has(order.id) && order.status === 'New' ? 'animate-flash-new ring-2 ring-brand-400' : 'ring-1 ring-black/5'}`}>
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-2xl font-bold tracking-tight">#{order.id}</p>
          <p className="text-xs font-semibold text-stone-500">
            {DELIVERY_ICON[order.deliveryType]} {DELIVERY_LABEL[order.deliveryType]} · {time(order.createdAt)}
          </p>
        </div>
        <div className="text-right">
          <span className={`inline-block rounded-lg px-2 py-1 text-xs font-extrabold ${late ? 'bg-red-100 text-red-700' : 'bg-stone-100 text-stone-600'}`}>
            ⏱ {elapsed(order.createdAt, now)}
          </span>
          <p className="mt-1 text-[11px] font-semibold text-stone-400">{etaTime(order.createdAt, order.estimatedMinutes)} gacha</p>
        </div>
      </header>

      <ul className="mt-3 space-y-1.5">
        {order.items.map((item) => (
          <li key={item.productName} className="flex gap-2 text-sm">
            <span className="min-w-8 rounded-md bg-ink px-1.5 text-center font-bold text-white">{item.quantity}</span>
            <span className="font-semibold">{item.productName}</span>
          </li>
        ))}
      </ul>

      {order.comment && <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 ring-1 ring-amber-200">💬 {order.comment}</p>}

      {showCustomer && (
        <div className="mt-3 space-y-1 border-t border-stone-100 pt-3 text-sm">
          <p className="font-bold">
            {order.customerName} ·{' '}
            <a href={`tel:${order.customerPhone}`} className="text-brand-700">
              {phone(order.customerPhone)}
            </a>
          </p>
          {order.address && (
            <p className="flex items-start justify-between gap-2 text-stone-600">
              <span>
                📍 {order.address}
                {order.deliveryZoneName && <span className="text-stone-400"> · {order.deliveryZoneName}</span>}
              </span>
              <a href={mapLink(order.address)} target="_blank" rel="noreferrer" className="shrink-0 text-brand-700" aria-label="Xaritada ochish">
                <IconMap size={18} />
              </a>
            </p>
          )}
          <p className="text-xs font-semibold text-stone-500">
            {PAYMENT_LABEL[order.paymentMethod]} · <b className="text-ink">{money(order.totalAmount)}</b>
            {order.courierName && <> · 🛵 {order.courierName}</>}
          </p>
        </div>
      )}

      <div className="mt-4">
        <OrderActions order={order} />
      </div>
    </article>
  );
}

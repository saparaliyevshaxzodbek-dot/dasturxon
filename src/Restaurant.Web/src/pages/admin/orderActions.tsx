import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ordersApi, staffApi } from '../../api/endpoints';
import type { Order, OrderStatus } from '../../api/types';
import { dateTime, etaTime, initials, mapLink, money, phone } from '../../lib/format';
import { DELIVERY_ICON, DELIVERY_LABEL, PAYMENT_LABEL, actionLabel, allowedActions } from '../../lib/orders';
import { useAuth } from '../../store/auth';
import { useToast } from '../../store/toast';
import { ErrorBox, Modal, Spinner, StatusBadge } from '../../components/ui';
import { IconMap } from '../../components/icons';

export function useChangeStatus() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, status, courierId }: { id: number; status: OrderStatus; courierId?: number }) =>
      ordersApi.setStatus(id, status, courierId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => toast(error.message, 'error'),
  });
}

/** Buttons for the status changes the current staff member is allowed to make. */
export function OrderActions({ order, large = false, onDone }: { order: Order; large?: boolean; onDone?: () => void }) {
  const { user } = useAuth();
  const change = useChangeStatus();
  const [pickCourier, setPickCourier] = useState(false);
  if (!user) return null;

  const actions = allowedActions(order, user.role);
  // A courier may only finish deliveries they took themselves.
  const visible = actions.filter((to) => !(user.role === 'Courier' && to === 'Completed' && order.courierId !== user.id));
  if (visible.length === 0) return null;

  const run = (status: OrderStatus) => {
    if (status === 'Cancelled' && !window.confirm(`#${order.id} buyurtmani bekor qilasizmi?`)) return;
    // Admins and managers hand the delivery to a courier; a courier takes it themselves.
    if (status === 'OnTheWay' && user.role !== 'Courier') {
      setPickCourier(true);
      return;
    }
    change.mutate({ id: order.id, status }, { onSuccess: onDone });
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {visible.map((to) => (
          <button
            key={to}
            disabled={change.isPending}
            onClick={() => run(to)}
            className={`${to === 'Cancelled' ? 'btn-danger' : 'btn-primary flex-1'} ${large ? 'py-3.5 text-base' : 'py-2.5'}`}
          >
            {user.role === 'Courier' && to === 'OnTheWay' ? 'Men olib ketaman' : actionLabel(to, order.deliveryType)}
          </button>
        ))}
      </div>
      {pickCourier && (
        <CourierPicker
          order={order}
          onClose={() => setPickCourier(false)}
          onPick={(courierId) =>
            change.mutate(
              { id: order.id, status: 'OnTheWay', courierId },
              {
                onSuccess: () => {
                  setPickCourier(false);
                  onDone?.();
                },
              },
            )
          }
          busy={change.isPending}
        />
      )}
    </>
  );
}

function CourierPicker({ order, onClose, onPick, busy }: {
  order: Order;
  onClose: () => void;
  onPick: (courierId: number) => void;
  busy: boolean;
}) {
  const { data: couriers, isLoading, error } = useQuery({ queryKey: ['couriers'], queryFn: staffApi.couriers });
  return (
    <Modal title={`#${order.id} — kuryerni tanlang`} onClose={onClose}>
      {isLoading && <Spinner />}
      {error && <ErrorBox error={error} />}
      {couriers?.length === 0 && <p className="text-sm text-stone-500">Faol kuryer yo'q. «Xodimlar» bo'limida kuryer qo'shing.</p>}
      <div className="space-y-2">
        {couriers?.map((c) => (
          <button
            key={c.id}
            disabled={busy}
            onClick={() => onPick(c.id)}
            className="flex w-full items-center gap-3 rounded-2xl bg-cream p-3 text-left ring-1 ring-black/5 transition hover:bg-brand-50 hover:ring-brand-300 disabled:opacity-50"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-600 font-bold text-white">{initials(c.fullName)}</span>
            <span>
              <span className="block font-bold">{c.fullName}</span>
              <span className="block text-sm text-stone-500">{phone(c.phoneNumber)}</span>
            </span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

export function OrderDetails({ order, onDone }: { order: Order; onDone?: () => void }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={order.status} />
        <span className="text-sm text-stone-500">
          {DELIVERY_ICON[order.deliveryType]} {DELIVERY_LABEL[order.deliveryType]} · {dateTime(order.createdAt)}
        </span>
      </div>

      <dl className="grid gap-3 rounded-2xl bg-cream p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-stone-500">Mijoz</dt>
          <dd className="font-bold">{order.customerName}</dd>
        </div>
        <div>
          <dt className="text-stone-500">Telefon</dt>
          <dd className="font-bold">
            <a href={`tel:${order.customerPhone}`} className="hover:text-brand-600">
              {phone(order.customerPhone)}
            </a>
          </dd>
        </div>
        {order.address && (
          <div className="sm:col-span-2">
            <dt className="text-stone-500">Manzil {order.deliveryZoneName && `· ${order.deliveryZoneName}`}</dt>
            <dd className="flex flex-wrap items-center gap-2 font-bold">
              {order.address}
              <a href={mapLink(order.address)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-brand-700 ring-1 ring-brand-200">
                <IconMap size={14} /> Xaritada
              </a>
            </dd>
          </div>
        )}
        {order.comment && (
          <div className="sm:col-span-2">
            <dt className="text-stone-500">Izoh</dt>
            <dd className="font-bold text-amber-800">{order.comment}</dd>
          </div>
        )}
        <div>
          <dt className="text-stone-500">To'lov</dt>
          <dd className="font-bold">{PAYMENT_LABEL[order.paymentMethod]}</dd>
        </div>
        <div>
          <dt className="text-stone-500">Va'da qilingan vaqt</dt>
          <dd className="font-bold">{etaTime(order.createdAt, order.estimatedMinutes)} gacha</dd>
        </div>
        {order.courierName && (
          <div className="sm:col-span-2">
            <dt className="text-stone-500">Kuryer</dt>
            <dd className="font-bold">
              {order.courierName} {order.courierPhone && <span className="font-normal text-stone-500">· {phone(order.courierPhone)}</span>}
            </dd>
          </div>
        )}
      </dl>

      <ul className="divide-y divide-stone-100 text-sm">
        {order.items.map((item) => (
          <li key={item.productName} className="flex justify-between gap-4 py-2">
            <span>
              <b>{item.quantity} ×</b> {item.productName}
            </span>
            <span className="font-semibold">{money(item.lineTotal)}</span>
          </li>
        ))}
      </ul>
      <dl className="space-y-1.5 border-t border-stone-200 pt-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-stone-500">Taomlar</dt>
          <dd className="font-semibold">{money(order.subTotal)}</dd>
        </div>
        {order.deliveryType === 'Delivery' && (
          <div className="flex justify-between">
            <dt className="text-stone-500">Yetkazib berish</dt>
            <dd className="font-semibold">{order.deliveryFee === 0 ? 'Bepul' : money(order.deliveryFee)}</dd>
          </div>
        )}
        <div className="flex items-end justify-between pt-1">
          <dt className="font-bold">Jami</dt>
          <dd className="font-display text-xl font-bold">{money(order.totalAmount)}</dd>
        </div>
      </dl>

      <OrderActions order={order} large onDone={onDone} />
    </div>
  );
}

/** Re-renders every 30 seconds so "12 daq" style timers stay current. */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

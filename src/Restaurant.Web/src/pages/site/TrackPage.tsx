import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../../api/endpoints';
import type { OrderTracking } from '../../api/types';
import { etaTime, initials, money, phone as formatPhone, phoneInput, time } from '../../lib/format';
import { useOrderTracking } from '../../lib/hub';
import { DELIVERY_LABEL, PAYMENT_LABEL, statusIndex, trackingSteps } from '../../lib/orders';
import { recentOrders, rememberOrder } from '../../store/cart';
import { ErrorBox, Spinner } from '../../components/ui';
import { IconArrowRight, IconCheck, IconClock, IconPhone, IconScooter } from '../../components/icons';

export function TrackLookupPage() {
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');
  const mine = recentOrders();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const id = Number(orderId.replace(/\D/g, ''));
    if (!id || phoneDigits.length !== 9) return;
    rememberOrder(id, `+998${phoneDigits}`);
    navigate(`/track/${id}`);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-brand-50 text-brand-600">
          <IconScooter size={30} />
        </span>
        <h1 className="mt-5 font-display text-3xl font-bold tracking-tight">Buyurtmani kuzatish</h1>
        <p className="mt-2 text-stone-500">Buyurtma raqami va telefon raqamingizni kiriting.</p>
      </div>

      {mine.length > 0 && (
        <div className="mt-8">
          <p className="mb-2 text-sm font-bold text-stone-500">Sizning buyurtmalaringiz</p>
          <div className="flex flex-wrap gap-2">
            {mine.map((o) => (
              <Link key={o.id} to={`/track/${o.id}`} className="btn-ghost rounded-full px-4 py-2">
                #{o.id}
              </Link>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={submit} className="card mt-6 space-y-4 p-6">
        <div>
          <label className="label" htmlFor="order">
            Buyurtma raqami
          </label>
          <input id="order" className="input" inputMode="numeric" placeholder="Masalan, 125" value={orderId} onChange={(e) => setOrderId(e.target.value.replace(/\D/g, '').slice(0, 9))} />
        </div>
        <div>
          <label className="label" htmlFor="track-phone">
            Telefon raqam
          </label>
          <div className="flex">
            <span className="flex items-center rounded-l-2xl border border-r-0 border-stone-200 bg-stone-50 px-3.5 text-sm font-bold text-stone-600">+998</span>
            <input
              id="track-phone"
              className="input rounded-l-none"
              inputMode="numeric"
              placeholder="90 123 45 67"
              value={phoneInput(phoneDigits)}
              onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, '').slice(0, 9))}
            />
          </div>
        </div>
        <button className="btn-primary w-full rounded-2xl py-3.5" disabled={!orderId || phoneDigits.length !== 9}>
          Kuzatish <IconArrowRight size={18} />
        </button>
      </form>
    </div>
  );
}

export default function TrackPage() {
  const id = Number(useParams().id);
  const phone = recentOrders().find((o) => o.id === id)?.phone ?? null;
  const queryClient = useQueryClient();
  const queryKey = ['track', id];

  const { data: order, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => ordersApi.track(id, phone!),
    enabled: !!phone && Number.isFinite(id) && id > 0,
    refetchInterval: 60_000,
  });

  const live = useOrderTracking(id, phone, (updated: OrderTracking) => queryClient.setQueryData(queryKey, updated));

  if (!phone || !Number.isFinite(id) || id <= 0) return <TrackLookupPage />;
  if (isLoading) return <Spinner className="py-28" />;
  if (error || !order) {
    return (
      <div className="mx-auto max-w-md px-4 py-14">
        <ErrorBox error={error ?? new Error('Buyurtma topilmadi.')} />
        <Link to="/track" className="btn-ghost mt-4 rounded-full">
          Boshqa buyurtmani qidirish
        </Link>
      </div>
    );
  }

  const steps = trackingSteps(order.deliveryType);
  const current = statusIndex(order.status);
  const cancelled = order.status === 'Cancelled';
  const completed = order.status === 'Completed';
  const currentStep = steps.find((s) => s.status === order.status);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <div className="card overflow-hidden">
          <div className="relative isolate overflow-hidden bg-ink px-6 py-7 text-white sm:px-8">
            <div className="absolute -right-16 -top-24 -z-10 h-64 w-64 rounded-full bg-brand-600/40 blur-3xl" />
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white/50">Buyurtma raqami</p>
                <p className="font-display text-5xl font-bold tracking-tight">#{order.id}</p>
              </div>
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${live === 'live' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/10 text-white/60'}`}>
                <span className={`h-2 w-2 rounded-full ${live === 'live' ? 'animate-pulse bg-emerald-400' : 'bg-white/40'}`} />
                {live === 'live' ? 'Jonli kuzatuv' : live === 'connecting' ? 'Ulanmoqda…' : 'Har daqiqada yangilanadi'}
              </span>
            </div>
            <p className="mt-6 font-display text-2xl font-bold">{cancelled ? 'Buyurtma bekor qilindi' : (currentStep?.title ?? '')}</p>
            {!cancelled && !completed && (
              <p className="mt-2 flex items-center gap-2 text-white/70">
                <IconClock size={18} />
                {order.deliveryType === 'Delivery' ? 'Taxminiy yetib kelish' : 'Taxminan tayyor bo\'ladi'}:{' '}
                <b className="text-white">{etaTime(order.createdAt, order.estimatedMinutes)} gacha</b>
              </p>
            )}
          </div>

          <div className="p-6 sm:p-8">
            {cancelled ? (
              <div className="rounded-2xl bg-red-50 p-5 text-center ring-1 ring-red-200">
                <p className="text-3xl">😔</p>
                <p className="mt-2 font-bold text-red-700">Buyurtma bekor qilindi</p>
                <p className="mt-1 text-sm text-red-600">Savollar bo'lsa, biz bilan bog'laning.</p>
              </div>
            ) : (
              <ol className="relative space-y-7">
                {steps.map((step, i) => {
                  const index = statusIndex(step.status);
                  const done = index < current || completed;
                  const active = index === current && !completed;
                  return (
                    <li key={step.status} className="relative flex gap-4">
                      {i < steps.length - 1 && (
                        <span className={`absolute left-[17px] top-10 h-[calc(100%-8px)] w-0.5 rounded ${done ? 'bg-brand-500' : 'bg-stone-200'}`} />
                      )}
                      <span
                        className={`relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-extrabold transition ${
                          done ? 'bg-brand-600 text-white' : active ? 'bg-white text-brand-700 ring-4 ring-brand-200' : 'bg-stone-100 text-stone-400'
                        }`}
                      >
                        {done ? <IconCheck size={18} /> : i + 1}
                        {active && <span className="absolute inset-0 animate-ping rounded-full ring-2 ring-brand-400" />}
                      </span>
                      <div className="pt-1.5">
                        <p className={`font-extrabold ${done || active ? 'text-ink' : 'text-stone-400'}`}>{step.title}</p>
                        {(active || (completed && step.status === 'Completed')) && <p className="text-sm text-stone-500">{step.hint}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          {order.courierName && (order.status === 'OnTheWay' || completed) && (
            <div className="card flex items-center gap-4 p-5">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-600 font-display text-lg font-bold text-white">{initials(order.courierName)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wide text-stone-400">Kuryeringiz</p>
                <p className="truncate font-extrabold">{order.courierName}</p>
                {order.courierPhone && <p className="text-sm text-stone-500">{formatPhone(order.courierPhone)}</p>}
              </div>
              {order.courierPhone && order.status === 'OnTheWay' && (
                <a href={`tel:${order.courierPhone}`} className="grid h-12 w-12 place-items-center rounded-full bg-emerald-500 text-white shadow-lg hover:bg-emerald-600" aria-label="Kuryerga qo'ng'iroq qilish">
                  <IconPhone />
                </a>
              )}
            </div>
          )}

          <div className="card p-6">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold">{DELIVERY_LABEL[order.deliveryType]}</span>
              <span className="text-stone-500">{time(order.createdAt)} da qabul qilingan</span>
            </div>
            {order.deliveryZoneName && <p className="mt-1 text-sm text-stone-500">Hudud: {order.deliveryZoneName}</p>}
            <ul className="mt-5 space-y-2.5 border-t border-dashed border-stone-200 pt-5 text-sm">
              {order.items.map((item) => (
                <li key={item.productName} className="flex justify-between gap-4">
                  <span>
                    {item.productName} <span className="text-stone-400">× {item.quantity}</span>
                  </span>
                  <span className="shrink-0 font-semibold">{money(item.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-5 space-y-2 border-t border-dashed border-stone-200 pt-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-500">Taomlar</dt>
                <dd className="font-semibold">{money(order.subTotal)}</dd>
              </div>
              {order.deliveryType === 'Delivery' && (
                <div className="flex justify-between">
                  <dt className="text-stone-500">Yetkazib berish</dt>
                  <dd className={`font-semibold ${order.deliveryFee === 0 ? 'text-emerald-600' : ''}`}>{order.deliveryFee === 0 ? 'Bepul' : money(order.deliveryFee)}</dd>
                </div>
              )}
              <div className="flex items-end justify-between pt-1">
                <dt className="font-bold">Jami · {PAYMENT_LABEL[order.paymentMethod]}</dt>
                <dd className="whitespace-nowrap font-display text-xl font-bold">{money(order.totalAmount)}</dd>
              </div>
            </dl>
          </div>

          <Link to="/" className="btn-ghost w-full rounded-2xl py-3.5">
            Yana buyurtma berish
          </Link>
        </aside>
      </div>
    </div>
  );
}

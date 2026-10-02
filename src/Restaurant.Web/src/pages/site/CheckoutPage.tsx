import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { ordersApi } from '../../api/endpoints';
import type { DeliveryType, PaymentMethod } from '../../api/types';
import { BRAND } from '../../config';
import { money, phoneInput } from '../../lib/format';
import { useZones, zoneFee } from '../../lib/queries';
import { rememberOrder, useCart } from '../../store/cart';
import { DishImage, EmptyState, ErrorBox, QuantityStepper } from '../../components/ui';
import { IconArrowLeft, IconCard, IconCash, IconCheck, IconClock, IconDish, IconPin, IconScooter, IconStore } from '../../components/icons';

const DELIVERY_OPTIONS: { type: DeliveryType; title: string; hint: string; icon: ReactNode }[] = [
  { type: 'Delivery', title: 'Yetkazib berish', hint: 'Kuryer olib boradi', icon: <IconScooter size={24} /> },
  { type: 'Pickup', title: 'Olib ketish', hint: '25 daqiqada tayyor', icon: <IconStore size={24} /> },
  { type: 'DineIn', title: 'Restoranda', hint: 'Stolingizga keltiramiz', icon: <IconDish size={24} /> },
];

const PAYMENT_OPTIONS: { method: PaymentMethod; title: string; hint: string; icon: ReactNode }[] = [
  { method: 'Cash', title: 'Naqd pul', hint: 'Qabul qilganda', icon: <IconCash size={22} /> },
  { method: 'Card', title: 'Karta', hint: 'Uzcard / Humo terminal', icon: <IconCard size={22} /> },
];

export default function CheckoutPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const { data: zones, isLoading: zonesLoading } = useZones();
  const [name, setName] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('Delivery');
  const [zoneId, setZoneId] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [comment, setComment] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('Cash');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (zoneId == null && zones?.length) setZoneId(zones[0]!.id);
  }, [zones, zoneId]);

  const isDelivery = deliveryType === 'Delivery';
  const zone = isDelivery ? zones?.find((z) => z.id === zoneId) : undefined;
  const fee = zone ? zoneFee(zone, cart.total) : 0;
  const total = cart.total + fee;
  const belowMinimum = zone ? cart.total < zone.minOrderAmount : false;
  const toFree = zone?.freeDeliveryFrom != null && fee > 0 ? zone.freeDeliveryFrom - cart.total : null;

  const errors = {
    name: name.trim().length < 2 ? 'Ismingizni kiriting' : null,
    phone: phoneDigits.length !== 9 ? '9 xonali raqamni kiriting' : null,
    zone: isDelivery && !zone ? 'Hududni tanlang' : null,
    address: isDelivery && address.trim().length < 5 ? "Manzilni to'liq yozing: ko'cha, uy, xonadon" : null,
    minimum: belowMinimum && zone ? `${zone.name} hududi uchun eng kam buyurtma — ${money(zone.minOrderAmount)}` : null,
  };
  const formValid = Object.values(errors).every((e) => e === null);

  const placeOrder = useMutation({
    mutationFn: () =>
      ordersApi.create({
        customerName: name.trim(),
        customerPhone: `+998${phoneDigits}`,
        deliveryType,
        deliveryZoneId: isDelivery ? (zone?.id ?? undefined) : undefined,
        address: isDelivery ? address.trim() : undefined,
        comment: comment.trim() || undefined,
        paymentMethod: payment,
        items: cart.lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
      }),
    onSuccess: (order) => {
      rememberOrder(order.id, `+998${phoneDigits}`);
      cart.clear();
      navigate(`/track/${order.id}`, { replace: true });
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (formValid) placeOrder.mutate();
    else document.querySelector('[data-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20">
        <EmptyState icon="🛒" title="Savat bo'sh">
          <Link to="/" className="btn-primary mt-4 rounded-full">
            Menyuga qaytish
          </Link>
        </EmptyState>
      </div>
    );
  }

  const fieldError = (message: string | null) => touched && message ? <p className="mt-1.5 text-xs font-semibold text-red-600">{message}</p> : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-stone-500 hover:text-ink">
        <IconArrowLeft size={16} /> Menyuga qaytish
      </Link>
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">Buyurtmani rasmiylashtirish</h1>

      <form onSubmit={submit} noValidate className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-5">
          <Step number={1} title="Qanday olasiz?">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {DELIVERY_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option.type}
                  onClick={() => setDeliveryType(option.type)}
                  aria-pressed={deliveryType === option.type}
                  className={`relative flex flex-col items-center rounded-2xl px-2 py-4 text-center transition sm:py-5 ${
                    deliveryType === option.type ? 'bg-brand-50 text-brand-800 ring-2 ring-brand-500' : 'bg-cream text-stone-600 ring-1 ring-black/5 hover:ring-black/15'
                  }`}
                >
                  {deliveryType === option.type && (
                    <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-brand-600 text-white">
                      <IconCheck size={12} />
                    </span>
                  )}
                  {option.icon}
                  <span className="mt-2 text-sm font-extrabold">{option.title}</span>
                  <span className="mt-0.5 hidden text-xs text-stone-500 sm:block">{option.hint}</span>
                </button>
              ))}
            </div>
          </Step>

          {isDelivery ? (
            <Step number={2} title="Yetkazib berish manzili">
              <p className="label">Hudud</p>
              <div className="grid gap-2 sm:grid-cols-2" data-invalid={touched && !!(errors.zone || errors.minimum)}>
                {zonesLoading && <p className="text-sm text-stone-500">Hududlar yuklanmoqda…</p>}
                {zones?.map((z) => {
                  const zFee = zoneFee(z, cart.total);
                  const active = z.id === zoneId;
                  return (
                    <button
                      type="button"
                      key={z.id}
                      onClick={() => setZoneId(z.id)}
                      aria-pressed={active}
                      className={`rounded-2xl p-4 text-left transition ${active ? 'bg-brand-50 ring-2 ring-brand-500' : 'bg-cream ring-1 ring-black/5 hover:ring-black/15'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-extrabold">{z.name}</span>
                        <span className={`shrink-0 text-sm font-extrabold ${zFee === 0 ? 'text-emerald-600' : 'text-ink'}`}>{zFee === 0 ? 'Bepul' : money(zFee)}</span>
                      </div>
                      {z.description && <p className="mt-1 text-xs text-stone-500">{z.description}</p>}
                      <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-stone-500">
                        <IconClock size={13} /> {z.minMinutes}–{z.maxMinutes} daq · min. {money(z.minOrderAmount)}
                      </p>
                    </button>
                  );
                })}
              </div>
              {fieldError(errors.zone)}
              {touched && errors.minimum && <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 ring-1 ring-amber-200">{errors.minimum}</p>}

              <div className="mt-5" data-invalid={touched && !!errors.address}>
                <label className="label" htmlFor="address">
                  Manzil
                </label>
                <div className="relative">
                  <IconPin size={18} className="absolute left-4 top-3.5 text-stone-400" />
                  <textarea id="address" rows={2} className="input pl-11" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ko'cha, uy, xonadon, podyezd, mo'ljal" maxLength={300} />
                </div>
                {fieldError(errors.address)}
              </div>
            </Step>
          ) : (
            <Step number={2} title={deliveryType === 'Pickup' ? 'Olib ketish manzili' : 'Restoranda ovqatlanish'}>
              <div className="flex items-start gap-4 rounded-2xl bg-cream p-4 ring-1 ring-black/5">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-brand-600 shadow-sm">
                  {deliveryType === 'Pickup' ? <IconStore /> : <IconDish />}
                </span>
                <div className="text-sm">
                  <p className="font-extrabold">{BRAND.name}</p>
                  <p className="text-stone-600">{BRAND.address}</p>
                  <p className="mt-1 text-stone-500">
                    {deliveryType === 'Pickup' ? 'Buyurtmangiz taxminan 25 daqiqada tayyor bo\'ladi.' : 'Kelganingizda buyurtma raqamini ayting — taomni stolingizga keltiramiz.'}
                  </p>
                </div>
              </div>
            </Step>
          )}

          <Step number={3} title="Aloqa ma'lumotlari">
            <div className="grid gap-4 sm:grid-cols-2">
              <div data-invalid={touched && !!errors.name}>
                <label className="label" htmlFor="name">
                  Ismingiz
                </label>
                <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Masalan, Aziz" autoComplete="given-name" maxLength={100} />
                {fieldError(errors.name)}
              </div>
              <div data-invalid={touched && !!errors.phone}>
                <label className="label" htmlFor="phone">
                  Telefon raqam
                </label>
                <div className="flex">
                  <span className="flex items-center rounded-l-2xl border border-r-0 border-stone-200 bg-stone-50 px-3.5 text-sm font-bold text-stone-600">+998</span>
                  <input
                    id="phone"
                    className="input rounded-l-none"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="90 123 45 67"
                    value={phoneInput(phoneDigits)}
                    onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  />
                </div>
                {fieldError(errors.phone)}
              </div>
            </div>
            <div className="mt-4">
              <label className="label" htmlFor="comment">
                Izoh <span className="font-normal text-stone-400">(ixtiyoriy)</span>
              </label>
              <textarea id="comment" rows={2} className="input" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Masalan: achchiqroq bo'lsin, piyozsiz, domofon ishlamaydi" maxLength={500} />
            </div>
          </Step>

          <Step number={4} title="To'lov usuli">
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option.method}
                  onClick={() => setPayment(option.method)}
                  aria-pressed={payment === option.method}
                  className={`flex items-center gap-3 rounded-2xl p-4 text-left transition ${
                    payment === option.method ? 'bg-brand-50 ring-2 ring-brand-500' : 'bg-cream ring-1 ring-black/5 hover:ring-black/15'
                  }`}
                >
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${payment === option.method ? 'bg-brand-600 text-white' : 'bg-white text-stone-600 shadow-sm'}`}>
                    {option.icon}
                  </span>
                  <span>
                    <span className="block text-sm font-extrabold">{option.title}</span>
                    <span className="block text-xs text-stone-500">{option.hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </Step>
        </div>

        <aside className="lg:sticky lg:top-28">
          <div className="card p-6">
            <h2 className="font-display text-lg font-bold">Buyurtmangiz</h2>
            <ul className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
              {cart.lines.map(({ product, quantity }) => (
                <li key={product.id} className="flex items-center gap-3">
                  <DishImage name={product.name} category={product.categoryName} imageUrl={product.imageUrl} className="h-12 w-12 shrink-0 rounded-xl" emojiClassName="text-xl" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{product.name}</p>
                    <p className="text-xs font-semibold text-stone-500">{money(product.price * quantity)}</p>
                  </div>
                  <QuantityStepper size="sm" value={quantity} onChange={(q) => cart.setQuantity(product.id, q)} />
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-2 border-t border-dashed border-stone-200 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-500">Taomlar</dt>
                <dd className="font-bold">{money(cart.total)}</dd>
              </div>
              {isDelivery && (
                <div className="flex justify-between">
                  <dt className="text-stone-500">Yetkazib berish</dt>
                  <dd className={`font-bold ${fee === 0 && zone ? 'text-emerald-600' : ''}`}>{zone ? (fee === 0 ? 'Bepul' : money(fee)) : '—'}</dd>
                </div>
              )}
              <div className="flex items-end justify-between pt-2">
                <dt className="font-bold">Jami</dt>
                <dd className="font-display text-2xl font-bold">{money(total)}</dd>
              </div>
            </dl>

            {toFree != null && toFree > 0 && (
              <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                Yana {money(toFree)}lik taom qo'shsangiz — yetkazib berish bepul 🎉
              </p>
            )}

            <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-stone-500">
              <IconClock size={14} />
              {isDelivery && zone ? `Yetkazib berish: ${zone.minMinutes}–${zone.maxMinutes} daqiqa` : 'Tayyor bo\'lish vaqti: ~25 daqiqa'}
            </p>

            {placeOrder.error && (
              <div className="mt-4">
                <ErrorBox error={placeOrder.error} />
              </div>
            )}
            <button type="submit" disabled={placeOrder.isPending} className="btn-primary mt-5 w-full rounded-2xl py-4 text-base">
              {placeOrder.isPending ? 'Yuborilmoqda…' : `Buyurtma berish · ${money(total)}`}
            </button>
            <p className="mt-3 text-center text-[11px] text-stone-400">Buyurtma berish orqali operator siz bilan bog'lanishiga rozilik bildirasiz.</p>
          </div>
        </aside>
      </form>
    </div>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <section className="card p-5 sm:p-7">
      <h2 className="mb-5 flex items-center gap-3 text-lg font-extrabold">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-ink font-display text-sm text-white">{number}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

import { createContext, useContext, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { BRAND } from '../../config';
import { money } from '../../lib/format';
import { cheapestFreeDelivery, useMenu, useZones } from '../../lib/queries';
import { useCart } from '../../store/cart';
import { DishImage, EmptyState, Logo, QuantityStepper, useLockBodyScroll } from '../../components/ui';
import {
  IconArrowRight,
  IconBag,
  IconClock,
  IconClose,
  IconInstagram,
  IconPhone,
  IconPin,
  IconScooter,
  IconTelegram,
} from '../../components/icons';

const CartDrawerContext = createContext<() => void>(() => {});

export const useOpenCart = () => useContext(CartDrawerContext);

const NAV = [
  { to: '/', label: 'Menyu', end: true },
  { to: '/delivery', label: 'Yetkazib berish' },
  { to: '/track', label: 'Buyurtmani kuzatish' },
];

export default function SiteLayout() {
  const [cartOpen, setCartOpen] = useState(false);
  const cart = useCart();
  const { syncWithMenu } = cart;
  const location = useLocation();
  const { data: menu } = useMenu();
  const telHref = `tel:${BRAND.phone.replace(/\s/g, '')}`;

  useEffect(() => {
    if (menu) syncWithMenu(menu.flatMap((c) => c.products));
  }, [menu, syncWithMenu]);

  useEffect(() => {
    setCartOpen(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `relative rounded-full px-4 py-2 text-sm font-bold transition ${isActive ? 'bg-ink text-white' : 'text-stone-600 hover:bg-black/5 hover:text-ink'}`;

  return (
    <CartDrawerContext.Provider value={() => setCartOpen(true)}>
      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-40">
          <div className="hidden bg-ink text-xs text-white/70 md:block">
            <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4">
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-1.5">
                  <IconClock size={14} /> Har kuni {BRAND.hours}
                </span>
                <span className="flex items-center gap-1.5">
                  <IconScooter size={14} /> Toshkent bo'ylab yetkazib berish
                </span>
              </div>
              <a href={telHref} className="flex items-center gap-1.5 font-bold text-white hover:text-brand-300">
                <IconPhone size={14} /> {BRAND.phone}
              </a>
            </div>
          </div>
          <div className="border-b border-black/5 bg-cream/85 backdrop-blur-xl">
            <div className="mx-auto flex h-[68px] max-w-7xl items-center gap-4 px-4">
              <Link to="/" aria-label="Bosh sahifa" className="shrink-0">
                <Logo />
              </Link>
              <nav className="ml-6 hidden items-center gap-1 lg:flex">
                {NAV.map((item) => (
                  <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              <div className="ml-auto flex items-center gap-2">
                <NavLink to="/delivery" className="grid h-11 w-11 place-items-center rounded-full text-stone-600 hover:bg-black/5 lg:hidden" aria-label="Yetkazib berish">
                  <IconScooter />
                </NavLink>
                <NavLink to="/track" className="grid h-11 w-11 place-items-center rounded-full text-stone-600 hover:bg-black/5 lg:hidden" aria-label="Buyurtmani kuzatish">
                  <IconPin />
                </NavLink>
                <button onClick={() => setCartOpen(true)} className="btn-primary relative h-11 rounded-full px-4 sm:px-5">
                  <IconBag />
                  <span className="hidden sm:inline">{cart.count > 0 ? money(cart.total) : 'Savat'}</span>
                  {cart.count > 0 && (
                    <span key={cart.count} className="animate-bump absolute -right-1.5 -top-1.5 grid h-6 min-w-6 place-items-center rounded-full bg-ink px-1.5 text-[11px] font-extrabold ring-2 ring-cream">
                      {cart.count}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>

        <Footer telHref={telHref} />
      </div>

      {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}
    </CartDrawerContext.Provider>
  );
}

function Footer({ telHref }: { telHref: string }) {
  return (
    <footer className="relative mt-20 overflow-hidden bg-ink text-white/70">
      <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-brand-600/20 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
            {BRAND.tagline}. Ko'mirda pishirilgan go'sht, yangi baliq va onajonlarimiz retseptidagi milliy taomlar.
          </p>
          <div className="mt-5 flex gap-2">
            <a href={BRAND.telegram} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-brand-600" aria-label="Telegram">
              <IconTelegram size={18} />
            </a>
            <a href={BRAND.instagram} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-brand-600" aria-label="Instagram">
              <IconInstagram size={18} />
            </a>
          </div>
        </div>
        <div className="text-sm">
          <p className="font-display text-sm font-bold text-white">Mijozlarga</p>
          <ul className="mt-4 space-y-2.5">
            <li><Link to="/" className="hover:text-white">Menyu</Link></li>
            <li><Link to="/delivery" className="hover:text-white">Yetkazib berish va to'lov</Link></li>
            <li><Link to="/track" className="hover:text-white">Buyurtmani kuzatish</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-display text-sm font-bold text-white">Aloqa</p>
          <ul className="mt-4 space-y-2.5">
            <li>
              <a href={telHref} className="flex items-center gap-2 font-bold text-white hover:text-brand-300">
                <IconPhone size={16} /> {BRAND.phone}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <IconPin size={16} className="mt-0.5 shrink-0" /> {BRAND.address}
            </li>
            <li className="flex items-center gap-2">
              <IconClock size={16} /> Har kuni {BRAND.hours}
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-display text-sm font-bold text-white">Hamkorlar uchun</p>
          <p className="mt-4 leading-relaxed text-white/60">Oshxona, kuryerlar va rahbariyat uchun boshqaruv paneli.</p>
          <Link to="/admin/login" className="btn-glass mt-4 rounded-full px-4 py-2.5">
            Xodimlar kirishi <IconArrowRight size={16} />
          </Link>
        </div>
      </div>
      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-white/40">
          <span>© {new Date().getFullYear()} {BRAND.name}. Barcha huquqlar himoyalangan.</span>
          <span>Rasmlar: Pexels</span>
        </div>
      </div>
    </footer>
  );
}

function CartDrawer({ onClose }: { onClose: () => void }) {
  const cart = useCart();
  const navigate = useNavigate();
  const { data: zones } = useZones();
  const free = cheapestFreeDelivery(zones);
  const freeFrom = free?.amount ?? null;
  useLockBodyScroll();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const progress = freeFrom ? Math.min(100, (cart.total / freeFrom) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/50 backdrop-blur-sm" onClick={onClose}>
      <aside onClick={(e) => e.stopPropagation()} className="animate-slide-in-right flex h-full w-full max-w-md flex-col bg-cream shadow-2xl" aria-label="Savat">
        <div className="flex items-center justify-between px-6 py-5">
          <div>
            <h2 className="font-display text-xl font-bold">Savat</h2>
            {cart.count > 0 && <p className="text-sm text-stone-500">{cart.count} ta taom</p>}
          </div>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-white text-stone-500 shadow-sm hover:text-ink" aria-label="Yopish">
            <IconClose />
          </button>
        </div>

        {cart.lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6">
            <EmptyState icon="🛒" title="Savat hozircha bo'sh">
              Menyudan sevimli taomlaringizni tanlang
            </EmptyState>
            <button onClick={onClose} className="btn-primary">
              Menyuni ko'rish
            </button>
          </div>
        ) : (
          <>
            {freeFrom && (
              <div className="mx-6 mb-3 rounded-2xl bg-white p-4 shadow-card">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <IconScooter size={18} className="text-brand-600" />
                  {cart.total >= freeFrom ? (
                    <span>Yetkazib berish bepul bo'ladi* 🎉</span>
                  ) : (
                    <span>
                      Bepul yetkazishgacha yana <b className="text-brand-700">{money(freeFrom - cart.total)}</b>
                    </span>
                  )}
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-2 text-[11px] text-stone-400">*{free?.zone} hududida. Boshqa hududlar shartlari «Yetkazib berish» sahifasida.</p>
              </div>
            )}
            <ul className="flex-1 space-y-3 overflow-y-auto px-6 pb-4">
              {cart.lines.map(({ product, quantity }) => (
                <li key={product.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card">
                  <DishImage name={product.name} category={product.categoryName} imageUrl={product.imageUrl} className="h-16 w-16 shrink-0 rounded-xl" emojiClassName="text-2xl" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{product.name}</p>
                    <p className="text-sm font-semibold text-brand-700">{money(product.price * quantity)}</p>
                  </div>
                  <QuantityStepper size="sm" value={quantity} onChange={(q) => cart.setQuantity(product.id, q)} />
                </li>
              ))}
            </ul>
            <div className="border-t border-black/5 bg-white p-6">
              <div className="mb-4 flex items-end justify-between">
                <span className="text-stone-500">Taomlar</span>
                <span className="font-display text-2xl font-bold">{money(cart.total)}</span>
              </div>
              <button onClick={() => navigate('/checkout')} className="btn-primary w-full rounded-2xl py-4 text-base">
                Buyurtma berish <IconArrowRight size={18} />
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

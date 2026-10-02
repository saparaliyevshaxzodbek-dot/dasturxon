import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import type { MenuCategory, Product } from '../../api/types';
import { BRAND } from '../../config';
import { money } from '../../lib/format';
import { cheapestFreeDelivery, deliveryWindow, useMenu, useZones } from '../../lib/queries';
import { useCart } from '../../store/cart';
import { DishBadge, DishImage, ErrorBox, QuantityStepper, SectionTitle, Skeleton } from '../../components/ui';
import {
  IconArrowRight,
  IconBag,
  IconCard,
  IconFlame,
  IconLeaf,
  IconPhone,
  IconPlus,
  IconScooter,
  IconSearch,
} from '../../components/icons';
import ProductModal from './ProductModal';
import { useOpenCart } from './SiteLayout';

export default function MenuPage() {
  const { data: menu, isLoading, error } = useMenu();
  const { data: zones } = useZones();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const sectionRefs = useRef(new Map<number, HTMLElement>());
  const cart = useCart();
  const openCart = useOpenCart();
  const free = cheapestFreeDelivery(zones);
  const window_ = deliveryWindow(zones);

  const filtered = useMemo<MenuCategory[]>(() => {
    const query = search.trim().toLowerCase();
    if (!menu || !query) return menu ?? [];
    return menu
      .map((c) => ({ ...c, products: c.products.filter((p) => `${p.name} ${p.description ?? ''}`.toLowerCase().includes(query)) }))
      .filter((c) => c.products.length > 0);
  }, [menu, search]);

  // Highlights the category chip for the section currently on screen.
  useEffect(() => {
    if (!filtered.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(Number(visible[0].target.getAttribute('data-category')));
      },
      { rootMargin: '-160px 0px -55% 0px' },
    );
    sectionRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [filtered]);

  const scrollTo = (id: number) => {
    const el = sectionRefs.current.get(id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 150, behavior: 'smooth' });
  };

  const scrollToMenu = () => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
  const assorti = menu?.flatMap((c) => c.products).find((p) => /assorti/i.test(p.name));

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-ink text-white">
        <img src="/images/hero/dasturxon.jpg" alt="" className="absolute inset-0 -z-20 h-full w-full scale-105 object-cover opacity-45" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/90 to-ink/60" />
        <div className="absolute -right-32 -top-40 -z-10 h-[32rem] w-[32rem] rounded-full bg-brand-600/30 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-ink to-transparent" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-28 pt-14 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:pb-36 lg:pt-20">
          <div className="min-w-0">
          <div className="max-w-2xl animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold text-brand-200 ring-1 ring-white/20 backdrop-blur">
              <IconFlame size={14} /> Ko'mirda pishirilgan · har kuni yangi
            </span>
            <h1 className="mt-6 font-display text-[2rem] font-bold leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">
              Issiq shashlik va baliq — <span className="text-brand-400">dasturxoningizga</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">
              Qo'y go'shtidan shashlik, tandirda sazan, Toshkent oshi va yana 30 dan ortiq taom. Bir necha bosishda buyurtma bering — tayyorlanishini onlayn kuzating.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={scrollToMenu} className="btn-primary rounded-full px-7 py-4 text-base">
                Menyuni ko'rish <IconArrowRight size={18} />
              </button>
              <a href={`tel:${BRAND.phone.replace(/\s/g, '')}`} className="btn-glass rounded-full px-7 py-4 text-base">
                <IconPhone size={18} /> {BRAND.phone}
              </a>
            </div>
          </div>
          <dl className="mt-12 grid max-w-2xl grid-cols-3 gap-3 animate-fade-up [animation-delay:150ms]">
            {[
              { label: 'Yetkazib berish', value: window_ ?? '30–60 daq', icon: <IconScooter size={18} /> },
              { label: 'Bepul yetkazish', value: free ? `${Math.round(free.amount / 1000)} ming so'mdan` : 'Hudud bo\'yicha', icon: <IconBag size={18} /> },
              { label: 'Har kuni', value: BRAND.hours, icon: <IconFlame size={18} /> },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur-md sm:p-4">
                <dt className="flex items-center gap-1.5 text-[11px] font-semibold text-white/60 sm:text-xs">
                  {s.icon} {s.label}
                </dt>
                <dd className="mt-1 text-sm font-extrabold sm:text-base">{s.value}</dd>
              </div>
            ))}
          </dl>
          </div>
          <HeroCollage menu={menu} onOpen={setSelected} />
        </div>
      </section>

      {/* Category rail */}
      <section className="relative z-10 mx-auto -mt-16 max-w-7xl px-4">
        <div className="card no-scrollbar flex gap-3 overflow-x-auto p-4 sm:gap-5 sm:p-6 lg:justify-around">
          {(menu ?? Array.from({ length: 6 }, (_, i) => ({ id: -i, name: '', products: [] as Product[] }))).map((c) => {
            const cover = c.products[0];
            return (
              <button key={c.id} onClick={() => c.id > 0 && scrollTo(c.id)} className="group flex w-24 shrink-0 flex-col items-center gap-2 sm:w-28">
                {cover ? (
                  <DishImage name={cover.name} category={c.name} imageUrl={cover.imageUrl} className="h-20 w-20 rounded-full ring-4 ring-cream transition duration-300 group-hover:scale-105 group-hover:ring-brand-200 sm:h-24 sm:w-24" emojiClassName="text-3xl" />
                ) : (
                  <Skeleton className="h-20 w-20 rounded-full sm:h-24 sm:w-24" />
                )}
                <span className="text-center text-xs font-bold leading-tight text-stone-700 group-hover:text-brand-700 sm:text-sm">{c.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Promo banners */}
      <section className="mx-auto mt-10 grid max-w-7xl gap-4 px-4 lg:grid-cols-3">
        <div className="relative isolate flex min-h-64 overflow-hidden rounded-[2rem] bg-ink p-7 text-white lg:col-span-2">
          <img src="/images/hero/platter.jpg" alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/95 via-ink/70 to-transparent" />
          <div className="flex max-w-sm flex-col">
            <DishBadge label="Tavsiya" className="self-start" />
            <h3 className="mt-4 font-display text-2xl font-bold leading-tight sm:text-3xl">Assorti shashlik — 4 xil ta'm bir dasturxonda</h3>
            <p className="mt-2 text-sm text-white/70">Qo'y, mol, lula va tovuq. Katta davra uchun ideal.</p>
            <div className="mt-auto flex items-center gap-4 pt-6">
              {assorti && (
                <>
                  <span className="font-display text-2xl font-bold">{money(assorti.price)}</span>
                  <button onClick={() => cart.add(assorti)} className="btn-primary rounded-full">
                    <IconPlus size={18} /> Savatga
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="grid gap-4">
          <Link to="/delivery" className="group relative isolate flex min-h-32 items-end overflow-hidden rounded-[2rem] bg-brand-600 p-6 text-white">
            <img src="/images/hero/delivery.jpg" alt="" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-40 transition duration-500 group-hover:scale-105" loading="lazy" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-brand-800/90 to-brand-600/30" />
            <div>
              <p className="font-display text-xl font-bold">{free ? `${Math.round(free.amount / 1000)} ming so'mdan bepul yetkazamiz` : 'Tez yetkazib berish'}</p>
              <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-white/80">
                Hududlar va narxlar <IconArrowRight size={16} className="transition group-hover:translate-x-1" />
              </p>
            </div>
          </Link>
          <button onClick={scrollToMenu} className="group relative isolate flex min-h-32 items-end overflow-hidden rounded-[2rem] bg-ink p-6 text-left text-white">
            <img src="/images/hero/choy.jpg" alt="" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-60 transition duration-500 group-hover:scale-105" loading="lazy" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/95 to-ink/20" />
            <div>
              <p className="font-display text-xl font-bold">Oilaviy dasturxon</p>
              <p className="mt-1 text-sm font-semibold text-white/80">Osh, shashlik, salat va ko'k choy — hammasi bir joyda</p>
            </div>
          </button>
        </div>
      </section>

      <FishFeature menu={menu} onOpen={setSelected} />

      {/* Menu */}
      <div id="menu" className="scroll-mt-24" />
      <div className="sticky top-[68px] z-30 mt-12 border-y border-black/5 bg-cream/90 backdrop-blur-xl md:top-[104px]">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <div className="no-scrollbar flex flex-1 gap-2 overflow-x-auto">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => scrollTo(c.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
                  activeId === c.id ? 'bg-ink text-white shadow-md' : 'bg-white text-stone-700 ring-1 ring-black/5 hover:ring-black/15'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
          <label className="relative hidden w-64 shrink-0 md:block">
            <IconSearch size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Taom qidirish…" className="input rounded-full py-2.5 pl-10" aria-label="Taom qidirish" />
          </label>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-8">
        <label className="relative mb-6 block md:hidden">
          <IconSearch size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Taom qidirish…" className="input rounded-full pl-10" aria-label="Taom qidirish" />
        </label>

        {error && <ErrorBox error={error} />}
        {isLoading && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-3xl" />
            ))}
          </div>
        )}
        {menu && filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-5xl">🔍</p>
            <p className="mt-3 font-bold">«{search}» bo'yicha taom topilmadi</p>
            <button onClick={() => setSearch('')} className="btn-ghost mt-4 rounded-full">
              Qidiruvni tozalash
            </button>
          </div>
        )}

        <div className="space-y-14">
          {filtered.map((category) => (
            <section
              key={category.id}
              data-category={category.id}
              ref={(el) => {
                if (el) sectionRefs.current.set(category.id, el);
                else sectionRefs.current.delete(category.id);
              }}
            >
              <div className="mb-6 flex items-end justify-between gap-4">
                <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{category.name}</h2>
                <span className="text-sm font-semibold text-stone-400">{category.products.length} ta taom</span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
                {category.products.map((product) => (
                  <ProductCard key={product.id} product={product} onOpen={() => setSelected(product)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <Features />
      <DeliveryTeaser />

      {cart.count > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 p-3 sm:p-5">
          <button onClick={openCart} className="btn-primary pointer-events-auto mx-auto flex w-full max-w-md justify-between rounded-full py-4 pl-6 pr-4 text-base shadow-2xl">
            <span className="flex items-center gap-2">
              <IconBag /> Savat · {cart.count} ta
            </span>
            <span className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5">{money(cart.total)}</span>
          </button>
        </div>
      )}

      {selected && <ProductModal product={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function ProductCard({ product, onOpen }: { product: Product; onOpen: () => void }) {
  const cart = useCart();
  const quantity = cart.quantityOf(product.id);

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <button onClick={onOpen} className="relative block overflow-hidden" aria-label={`${product.name} haqida batafsil`}>
        <DishImage name={product.name} category={product.categoryName} imageUrl={product.imageUrl} className="aspect-[4/3] w-full transition duration-500 group-hover:scale-105" />
        {product.badge && <DishBadge label={product.badge} className="absolute left-3 top-3" />}
      </button>
      <div className="flex flex-1 flex-col p-3.5 sm:p-5">
        <button onClick={onOpen} className="text-left">
          <h3 className="font-bold leading-snug sm:text-lg">{product.name}</h3>
          {product.portion && <p className="mt-0.5 text-xs font-semibold text-stone-400">{product.portion}</p>}
          {product.description && <p className="mt-2 line-clamp-2 hidden text-sm leading-relaxed text-stone-500 sm:block">{product.description}</p>}
        </button>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
          <span className="whitespace-nowrap font-display text-base font-bold sm:text-lg">{money(product.price)}</span>
          {quantity > 0 ? (
            <QuantityStepper size="sm" tone="brand" value={quantity} onChange={(q) => cart.setQuantity(product.id, q)} />
          ) : (
            <button onClick={() => cart.add(product)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-600 text-white shadow-glow transition hover:scale-105 hover:bg-brand-700 active:scale-95" aria-label={`${product.name} — savatga qo'shish`}>
              <IconPlus size={20} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

const findDish = (menu: MenuCategory[] | undefined, slug: string) =>
  menu?.flatMap((c) => c.products).find((p) => p.imageUrl?.includes(`/${slug}.`));

/** Photo collage of signature dishes; each tile opens the dish. */
function HeroCollage({ menu, onOpen }: { menu: MenuCategory[] | undefined; onOpen: (p: Product) => void }) {
  const tiles = [
    { slug: 'qoy-shashlik', area: 'lg:col-span-2 lg:row-span-2' },
    { slug: 'forel-grilda', area: '' },
    { slug: 'mol-shashlik', area: '' },
    { slug: 'toshkent-oshi', area: '' },
    { slug: 'qovurilgan-laqqa', area: 'lg:col-span-2' },
  ]
    .map((t) => ({ ...t, dish: findDish(menu, t.slug) }))
    .filter((t): t is typeof t & { dish: Product } => !!t.dish);

  if (!menu) {
    return <Skeleton className="hidden h-[520px] rounded-[2rem] bg-white/5 lg:block" />;
  }

  return (
    <div className="no-scrollbar -mx-4 flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto px-4 animate-fade-up [animation-delay:250ms] lg:mx-0 lg:grid lg:h-[540px] lg:grid-cols-3 lg:grid-rows-3 lg:gap-4 lg:overflow-visible lg:px-0">
      {tiles.map(({ slug, area, dish }) => (
        <button
          key={slug}
          onClick={() => onOpen(dish)}
          className={`group relative h-52 w-64 shrink-0 snap-start overflow-hidden rounded-3xl text-left shadow-2xl ring-1 ring-white/15 lg:h-auto lg:w-auto ${area}`}
        >
          <DishImage name={dish.name} category={dish.categoryName} imageUrl={dish.imageUrl} className="h-full w-full transition duration-700 group-hover:scale-110" />
          <span className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
          <span className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
            <span className="min-w-0">
              <span className="line-clamp-2 block text-sm font-extrabold leading-tight">{dish.name}</span>
              <span className="block text-xs font-semibold text-white/70">{money(dish.price)}</span>
            </span>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-600 shadow-glow transition group-hover:scale-110">
              <IconPlus size={18} />
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

/** Highlights the fish dishes with a big photo, since fish is half of the restaurant's identity. */
function FishFeature({ menu, onOpen }: { menu: MenuCategory[] | undefined; onOpen: (p: Product) => void }) {
  const cart = useCart();
  const fish = menu?.find((c) => /baliq/i.test(c.name));
  const hero = findDish(menu, 'forel-grilda') ?? fish?.products[0];
  if (!fish || !hero) return null;

  return (
    <section className="mx-auto mt-16 max-w-7xl px-4">
      <div className="grid overflow-hidden rounded-[2rem] bg-ink text-white lg:grid-cols-[1.1fr_1fr]">
        <button onClick={() => onOpen(hero)} className="group relative min-h-72 overflow-hidden text-left lg:min-h-full">
          <DishImage name={hero.name} category={hero.categoryName} imageUrl={hero.imageUrl} className="absolute inset-0 h-full w-full transition duration-700 group-hover:scale-105" />
          <span className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-ink" />
          <span className="absolute bottom-6 left-6 right-6 rounded-2xl bg-ink/75 px-4 py-3 ring-1 ring-white/15 backdrop-blur-md sm:right-auto">
            <span className="block text-xs font-semibold text-white/70">Oshpaz tavsiyasi</span>
            <span className="block font-display text-base font-bold sm:text-lg">
              {hero.name} · {money(hero.price)}
            </span>
          </span>
        </button>
        <div className="p-7 sm:p-10">
          <SectionTitle eyebrow="Baliq taomlari" title="Ko'mirda, tandirda va qozonda pishgan baliq" light>
            Har tong keltiriladigan yangi baliq — qarsildoq qovurilgan laqqadan tortib, butun forel va tandirdagi sazangacha.
          </SectionTitle>
          <ul className="mt-8 space-y-3">
            {fish.products.slice(0, 5).map((p) => {
              const quantity = cart.quantityOf(p.id);
              return (
                <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-white/5 p-2.5 pr-3 ring-1 ring-white/10 transition hover:bg-white/10">
                  <button onClick={() => onOpen(p)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <DishImage name={p.name} category={p.categoryName} imageUrl={p.imageUrl} className="h-14 w-14 shrink-0 rounded-xl" emojiClassName="text-2xl" />
                    <span className="min-w-0">
                      <span className="block truncate font-bold">{p.name}</span>
                      <span className="block text-xs text-white/50">{p.portion}</span>
                    </span>
                  </button>
                  <span className="shrink-0 text-sm font-extrabold">{money(p.price)}</span>
                  {quantity > 0 ? (
                    <QuantityStepper size="sm" tone="brand" value={quantity} onChange={(q) => cart.setQuantity(p.id, q)} />
                  ) : (
                    <button onClick={() => cart.add(p)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-600 shadow-glow transition hover:scale-110" aria-label={`${p.name} — savatga qo'shish`}>
                      <IconPlus size={18} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: <IconFlame size={26} />, title: "Ko'mirda pishiriladi", text: "Shashlik va baliq faqat tabiiy ko'mirda, buyurtmadan keyin pishiriladi." },
    { icon: <IconLeaf size={26} />, title: 'Har kuni yangi mahsulot', text: "Go'sht va baliq har tong bozordan keladi, muzlatilgan mahsulot ishlatilmaydi." },
    { icon: <IconScooter size={26} />, title: 'Tez yetkazib berish', text: 'Issiq holda, termosumkada. Kuryer qayerdaligini onlayn kuzatasiz.' },
    { icon: <IconCard size={26} />, title: "Qulay to'lov", text: "Naqd yoki karta orqali — buyurtmani qabul qilganingizda to'laysiz." },
  ];
  return (
    <section className="mx-auto mt-24 max-w-7xl px-4">
      <SectionTitle eyebrow="Nega aynan biz" title="Mehmonni aziz tutgandek pishiramiz" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.title} className="card p-6">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">{item.icon}</div>
            <h3 className="mt-5 text-lg font-extrabold">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-500">{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DeliveryTeaser() {
  const { data: zones } = useZones();
  const navigate = useNavigate();
  return (
    <section className="mx-auto mt-24 max-w-7xl px-4">
      <div className="grid overflow-hidden rounded-[2rem] bg-ink text-white lg:grid-cols-2">
        <div className="relative min-h-64">
          <img src="/images/hero/delivery.jpg" alt="Yetkazib berish" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        </div>
        <div className="p-8 sm:p-12">
          <SectionTitle eyebrow="Yetkazib berish" title="Toshkent bo'ylab issiq holda yetkazamiz" light>
            Hududingizni tanlang — narx va vaqt darhol ko'rinadi.
          </SectionTitle>
          <ul className="mt-8 space-y-3">
            {(zones ?? []).slice(0, 4).map((z) => (
              <li key={z.id} className="flex items-center justify-between gap-4 rounded-2xl bg-white/5 px-5 py-4 ring-1 ring-white/10">
                <div>
                  <p className="font-bold">{z.name}</p>
                  <p className="text-xs text-white/50">
                    {z.minMinutes}–{z.maxMinutes} daqiqa
                  </p>
                </div>
                <span className="text-right text-sm font-extrabold text-brand-300">{z.fee === 0 ? 'Bepul' : money(z.fee)}</span>
              </li>
            ))}
          </ul>
          <button onClick={() => navigate('/delivery')} className="btn-primary mt-8 rounded-full">
            Barcha shartlar <IconArrowRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}

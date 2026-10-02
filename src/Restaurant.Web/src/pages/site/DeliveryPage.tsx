import { Link } from 'react-router';
import { BRAND } from '../../config';
import { money } from '../../lib/format';
import { useZones } from '../../lib/queries';
import { SectionTitle, Skeleton } from '../../components/ui';
import { IconArrowRight, IconBag, IconCard, IconCash, IconChevronDown, IconClock, IconFlame, IconPhone, IconPin, IconScooter, IconShield } from '../../components/icons';

const STEPS = [
  { icon: <IconBag size={24} />, title: 'Tanlang', text: "Menyudan taomlarni savatga qo'shing" },
  { icon: <IconPin size={24} />, title: 'Manzilni kiriting', text: 'Hududni tanlang — narx va vaqt darhol hisoblanadi' },
  { icon: <IconFlame size={24} />, title: 'Tayyorlaymiz', text: "Oshpaz buyurtmangizni ko'mirda pishiradi" },
  { icon: <IconScooter size={24} />, title: 'Yetkazamiz', text: 'Kuryer termosumkada issiq holda olib keladi' },
];

const FAQ = [
  {
    q: 'Buyurtma qancha vaqtda yetib keladi?',
    a: "Hududga qarab 30 daqiqadan 100 daqiqagacha. Aniq vaqt buyurtma berayotganda va kuzatish sahifasida ko'rsatiladi.",
  },
  {
    q: "Qanday to'lash mumkin?",
    a: "Buyurtmani qabul qilganingizda naqd pul yoki karta orqali (Uzcard, Humo) — kuryerda terminal bor.",
  },
  {
    q: 'Buyurtmani qayerda kuzatsam bo\'ladi?',
    a: "Buyurtma berganingizdan keyin kuzatish sahifasi ochiladi: holat real vaqtda yangilanadi, kuryer yo'lga chiqqanda uning ismi va telefoni ko'rinadi.",
  },
  {
    q: "Buyurtmani bekor qilish yoki o'zgartirish mumkinmi?",
    a: `Oshxona tayyorlashni boshlamaguncha — ha. ${BRAND.phone} raqamiga qo'ng'iroq qiling.`,
  },
];

export default function DeliveryPage() {
  const { data: zones, isLoading } = useZones();

  return (
    <>
      <section className="relative isolate overflow-hidden bg-ink text-white">
        <img src="/images/hero/delivery.jpg" alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/85 to-ink/30" />
        <div className="mx-auto max-w-7xl px-4 py-20 sm:py-28">
          <div className="max-w-2xl animate-fade-up">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand-300">Yetkazib berish va to'lov</p>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">Issiq taomni eshigingizgacha olib boramiz</h1>
            <p className="mt-5 text-lg text-white/70">Toshkent shahri va viloyatining yaqin hududlari bo'ylab. Har bir buyurtmani onlayn kuzatish mumkin.</p>
            <Link to="/" className="btn-primary mt-8 rounded-full px-7 py-4 text-base">
              Buyurtma berish <IconArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-7xl px-4">
        <SectionTitle eyebrow="Qanday ishlaydi" title="To'rt qadam — va dasturxon tayyor" />
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="card relative p-6">
              <span className="absolute right-5 top-5 font-display text-4xl font-bold text-stone-100">{i + 1}</span>
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white shadow-glow">{step.icon}</span>
              <h3 className="mt-5 text-lg font-extrabold">{step.title}</h3>
              <p className="mt-1.5 text-sm text-stone-500">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto mt-20 max-w-7xl px-4">
        <SectionTitle eyebrow="Hududlar va narxlar" title="Yetkazib berish shartlari">
          Belgilangan summadan yuqori buyurtmalarda yetkazib berish bepul.
        </SectionTitle>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {isLoading && Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-56 rounded-3xl" />)}
          {zones?.map((z) => (
            <article key={z.id} className="card flex flex-col p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-bold">{z.name}</h3>
                  {z.description && <p className="mt-1 text-sm text-stone-500">{z.description}</p>}
                </div>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                  <IconPin />
                </span>
              </div>
              <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-cream p-3">
                  <dt className="text-xs font-semibold text-stone-500">Yetkazib berish</dt>
                  <dd className="mt-0.5 font-extrabold">{z.fee === 0 ? 'Bepul' : money(z.fee)}</dd>
                </div>
                <div className="rounded-2xl bg-cream p-3">
                  <dt className="flex items-center gap-1 text-xs font-semibold text-stone-500">
                    <IconClock size={12} /> Vaqt
                  </dt>
                  <dd className="mt-0.5 font-extrabold">
                    {z.minMinutes}–{z.maxMinutes} daq
                  </dd>
                </div>
                <div className="rounded-2xl bg-cream p-3">
                  <dt className="text-xs font-semibold text-stone-500">Eng kam buyurtma</dt>
                  <dd className="mt-0.5 font-extrabold">{money(z.minOrderAmount)}</dd>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-3">
                  <dt className="text-xs font-semibold text-emerald-700">Bepul yetkazish</dt>
                  <dd className="mt-0.5 font-extrabold text-emerald-800">{z.freeDeliveryFrom != null ? `${money(z.freeDeliveryFrom)}dan` : '—'}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 grid max-w-7xl gap-6 px-4 lg:grid-cols-2">
        <div className="card p-8">
          <SectionTitle eyebrow="To'lov" title="Qabul qilganingizda to'laysiz" />
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-4 rounded-2xl bg-cream p-4">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-white text-brand-600 shadow-sm">
                <IconCash />
              </span>
              <div>
                <p className="font-extrabold">Naqd pul</p>
                <p className="text-xs text-stone-500">Kuryerga yoki kassada</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl bg-cream p-4">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-white text-brand-600 shadow-sm">
                <IconCard />
              </span>
              <div>
                <p className="font-extrabold">Karta</p>
                <p className="text-xs text-stone-500">Uzcard, Humo — terminal orqali</p>
              </div>
            </div>
          </div>
          <p className="mt-6 flex items-start gap-3 rounded-2xl bg-brand-50 p-4 text-sm text-brand-900">
            <IconShield className="mt-0.5 shrink-0" />
            Taomlar muhrlangan idishda, termosumkada yetkaziladi. Qabul qilishda buyurtmani tekshirib olishingiz mumkin.
          </p>
        </div>

        <div className="card p-8">
          <SectionTitle eyebrow="Savollar" title="Ko'p so'raladigan savollar" />
          <div className="mt-6 divide-y divide-stone-100">
            {FAQ.map((item) => (
              <details key={item.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <IconChevronDown className="shrink-0 text-stone-400 transition group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-stone-500">{item.a}</p>
              </details>
            ))}
          </div>
          <a href={`tel:${BRAND.phone.replace(/\s/g, '')}`} className="btn-dark mt-6 rounded-full">
            <IconPhone size={18} /> {BRAND.phone}
          </a>
        </div>
      </section>
    </>
  );
}

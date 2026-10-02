import { useEffect, useState, type ReactNode } from 'react';
import type { OrderStatus } from '../api/types';
import { BRAND } from '../config';
import { STATUS_LABEL, STATUS_STYLE } from '../lib/orders';
import { IconClose, IconMinus, IconPlus } from './icons';

const DISH_EMOJI: [RegExp, string][] = [
  [/shashlik|kabob|lula|jigar|qanot|assorti/i, '🍢'],
  [/baliq|forel|sazan|laqqa/i, '🐟'],
  [/osh|palov/i, '🍛'],
  [/lag'mon|lagmon/i, '🍜'],
  [/manti|chuchvara/i, '🥟'],
  [/somsa/i, '🥐'],
  [/sho'rva|shorva/i, '🍲'],
  [/salat|olivye|sezar|achchiq/i, '🥗'],
  [/non/i, '🫓'],
  [/kartoshka|fri/i, '🍟'],
  [/guruch/i, '🍚'],
  [/choy/i, '🍵'],
  [/kompot|ayron|suv|ichimlik/i, '🥤'],
];

export function dishEmoji(name: string, category = ''): string {
  return DISH_EMOJI.find(([pattern]) => pattern.test(name) || pattern.test(category))?.[1] ?? '🍽️';
}

/** Dish photo; falls back to a warm gradient with an emoji when there is no photo or it fails to load. */
export function DishImage({ name, category, imageUrl, className = '', emojiClassName = 'text-5xl' }: {
  name: string;
  category?: string;
  imageUrl: string | null;
  className?: string;
  emojiClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [imageUrl]);

  if (imageUrl && !failed) {
    return <img src={imageUrl} alt={name} loading="lazy" decoding="async" onError={() => setFailed(true)} className={`bg-sand object-cover ${className}`} />;
  }

  return (
    <div aria-hidden className={`flex items-center justify-center bg-gradient-to-br from-brand-100 via-amber-50 to-orange-200 ${className}`}>
      <span className={`drop-shadow-sm ${emojiClassName}`}>{dishEmoji(name, category)}</span>
    </div>
  );
}

const BADGE_STYLE: Record<string, string> = {
  xit: 'bg-brand-600 text-white',
  yangi: 'bg-emerald-600 text-white',
  tavsiya: 'bg-ink text-white',
  achchiq: 'bg-red-600 text-white',
};

export function DishBadge({ label, className = '' }: { label: string; className?: string }) {
  const style = BADGE_STYLE[label.toLowerCase()] ?? 'bg-white text-ink';
  const icon = label.toLowerCase() === 'xit' ? '🔥 ' : label.toLowerCase() === 'yangi' ? '✨ ' : label.toLowerCase() === 'tavsiya' ? '👨‍🍳 ' : '';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide shadow-md ${style} ${className}`}>
      {icon}
      {label}
    </span>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex justify-center py-12 ${className}`} role="status" aria-label="Yuklanmoqda">
      <div className="h-9 w-9 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-stone-200/70 ${className}`} />;
}

export function EmptyState({ icon, title, children }: { icon: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 text-5xl">{icon}</div>
      <p className="font-bold text-ink">{title}</p>
      {children && <div className="mt-1 text-sm text-stone-500">{children}</div>}
    </div>
  );
}

export function ErrorBox({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : "Noma'lum xatolik";
  return <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">{message}</div>;
}

/** Locks page scroll while an overlay is open. */
export function useLockBodyScroll() {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);
}

export function Modal({ title, onClose, children, wide = false, bare = false }: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  /** Without the title bar, for content that brings its own header (e.g. a photo). */
  bare?: boolean;
}) {
  useLockBodyScroll();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/60 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`animate-pop-in relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl sm:rounded-[2rem] ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}
      >
        {bare ? (
          <button onClick={onClose} className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-ink shadow-lg backdrop-blur hover:bg-white" aria-label="Yopish">
            <IconClose />
          </button>
        ) : (
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-100 bg-white/95 px-6 py-4 backdrop-blur">
            <h2 className="text-lg font-extrabold">{title}</h2>
            <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-ink" aria-label="Yopish">
              <IconClose />
            </button>
          </div>
        )}
        <div className={bare ? '' : 'p-6'}>{children}</div>
      </div>
    </div>
  );
}

export function QuantityStepper({ value, onChange, size = 'md', tone = 'light' }: {
  value: number;
  onChange: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'light' | 'brand';
}) {
  const button = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10';
  const wrap = tone === 'brand' ? 'bg-brand-600 text-white shadow-glow' : 'bg-stone-100 text-ink';
  const btn = tone === 'brand' ? 'hover:bg-white/15' : 'bg-white shadow-sm hover:text-brand-600';
  return (
    <div className={`inline-flex items-center gap-1 rounded-full p-1 ${wrap}`}>
      <button type="button" onClick={() => onChange(value - 1)} className={`${button} grid place-items-center rounded-full transition ${btn}`} aria-label="Kamaytirish">
        <IconMinus size={16} />
      </button>
      <span key={value} className={`animate-bump min-w-7 text-center font-extrabold tabular-nums ${size === 'lg' ? 'text-lg' : 'text-sm'}`}>
        {value}
      </span>
      <button type="button" onClick={() => onChange(value + 1)} className={`${button} grid place-items-center rounded-full transition ${btn}`} aria-label="Ko'paytirish">
        <IconPlus size={16} />
      </button>
    </div>
  );
}

export function Logo({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <img src="/favicon.svg" alt="" className="h-10 w-10" />
      {!compact && (
        <span className="leading-none">
          <span className={`block font-display text-lg font-bold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>{BRAND.name}</span>
          <span className={`mt-1 block text-[10px] font-semibold uppercase tracking-[0.18em] ${light ? 'text-white/50' : 'text-stone-400'}`}>
            Choyxona · Grill
          </span>
        </span>
      )}
    </span>
  );
}

export function SectionTitle({ eyebrow, title, children, light = false }: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
  light?: boolean;
}) {
  return (
    <div className="max-w-2xl">
      {eyebrow && <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.2em] text-brand-600">{eyebrow}</p>}
      <h2 className={`font-display text-2xl font-bold leading-tight tracking-tight sm:text-4xl ${light ? 'text-white' : 'text-ink'}`}>{title}</h2>
      {children && <p className={`mt-3 text-base ${light ? 'text-white/70' : 'text-stone-500'}`}>{children}</p>}
    </div>
  );
}

export function money(value: number): string {
  return `${amount(value)} so'm`;
}

/** "28 000" — the number part of a price. */
export function amount(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

const pad = (n: number) => n.toString().padStart(2, '0');

export function time(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function dateTime(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${time(iso)}`;
}

/** Clock time by which the order should arrive or be ready. */
export function etaTime(createdAt: string, minutes: number): string {
  return time(new Date(new Date(createdAt).getTime() + minutes * 60_000).toISOString());
}

/** Minutes since the given moment, e.g. "12 daq" or "1 soat 5 daq". */
export function elapsed(iso: string, now = Date.now()): string {
  const minutes = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60_000));
  if (minutes < 60) return `${minutes} daq`;
  return `${Math.floor(minutes / 60)} soat ${minutes % 60} daq`;
}

export function minutesSince(iso: string, now = Date.now()): number {
  return Math.floor((now - new Date(iso).getTime()) / 60_000);
}

/** Formats "+998901234567" as "+998 90 123 45 67". */
export function phone(value: string): string {
  const m = value.match(/^\+998(\d{2})(\d{3})(\d{2})(\d{2})$/);
  return m ? `+998 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : value;
}

/** Groups 9 local digits as "90 123 45 67" while the user types. */
export function phoneInput(digits: string): string {
  return [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)].filter(Boolean).join(' ');
}

const WEEKDAYS = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];

export function weekday(isoDate: string): string {
  return WEEKDAYS[new Date(`${isoDate}T12:00:00`).getDay()];
}

export function localDateInput(date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

/** Opens the address in Yandex Maps, the map app couriers in Uzbekistan use most. */
export function mapLink(address: string): string {
  return `https://yandex.uz/maps/?text=${encodeURIComponent(`Toshkent, ${address}`)}`;
}

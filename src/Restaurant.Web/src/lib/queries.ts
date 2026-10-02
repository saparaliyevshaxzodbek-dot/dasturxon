import { useQuery } from '@tanstack/react-query';
import { menuApi, zonesApi } from '../api/endpoints';
import type { DeliveryZone } from '../api/types';

export const useMenu = () => useQuery({ queryKey: ['menu'], queryFn: menuApi.get });

export const useZones = () => useQuery({ queryKey: ['zones'], queryFn: zonesApi.active, staleTime: 5 * 60_000 });

/** The zone with the lowest free-delivery threshold, for "free from…" hints. */
export function cheapestFreeDelivery(zones: DeliveryZone[] | undefined): { amount: number; zone: string } | null {
  const best = (zones ?? [])
    .filter((z) => z.freeDeliveryFrom != null)
    .sort((a, b) => a.freeDeliveryFrom! - b.freeDeliveryFrom!)[0];
  return best ? { amount: best.freeDeliveryFrom!, zone: best.name } : null;
}

/** "30–100 daq" across all zones. */
export function deliveryWindow(zones: DeliveryZone[] | undefined): string | null {
  if (!zones?.length) return null;
  return `${Math.min(...zones.map((z) => z.minMinutes))}–${Math.max(...zones.map((z) => z.maxMinutes))} daq`;
}

export function zoneFee(zone: DeliveryZone, subTotal: number): number {
  return zone.freeDeliveryFrom != null && subTotal >= zone.freeDeliveryFrom ? 0 : zone.fee;
}

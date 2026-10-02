import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zonesApi } from '../../api/endpoints';
import type { DeliveryZone, DeliveryZoneRequest } from '../../api/types';
import { money } from '../../lib/format';
import { useToast } from '../../store/toast';
import { ErrorBox, Modal, Spinner } from '../../components/ui';
import { IconClock, IconPin } from '../../components/icons';
import { PageHeader } from './AdminLayout';

export default function DeliveryZonesPage() {
  const { data: zones, isLoading, error } = useQuery({ queryKey: ['zones', 'all'], queryFn: zonesApi.all });
  const [editing, setEditing] = useState<DeliveryZone | 'new' | null>(null);

  return (
    <>
      <PageHeader
        title="Yetkazib berish hududlari"
        subtitle="Narx, eng kam buyurtma, bepul yetkazish chegarasi va vaqt — mijoz saytida darhol ko'rinadi"
        actions={
          <button className="btn-primary" onClick={() => setEditing('new')}>
            + Hudud qo'shish
          </button>
        }
      />
      {isLoading && <Spinner />}
      {error && <ErrorBox error={error} />}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {zones?.map((z) => (
          <button key={z.id} onClick={() => setEditing(z)} className={`card p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${z.isActive ? '' : 'opacity-60'}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 font-display text-lg font-bold">
                  <IconPin size={18} className="text-brand-600" /> {z.name}
                </p>
                {z.description && <p className="mt-1 text-sm text-stone-500">{z.description}</p>}
              </div>
              {!z.isActive && <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-bold text-stone-500">O'chirilgan</span>}
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-cream p-2.5">
                <dt className="text-xs text-stone-500">Narx</dt>
                <dd className="font-extrabold">{z.fee === 0 ? 'Bepul' : money(z.fee)}</dd>
              </div>
              <div className="rounded-xl bg-cream p-2.5">
                <dt className="flex items-center gap-1 text-xs text-stone-500">
                  <IconClock size={12} /> Vaqt
                </dt>
                <dd className="font-extrabold">
                  {z.minMinutes}–{z.maxMinutes} daq
                </dd>
              </div>
              <div className="rounded-xl bg-cream p-2.5">
                <dt className="text-xs text-stone-500">Min. buyurtma</dt>
                <dd className="font-extrabold">{money(z.minOrderAmount)}</dd>
              </div>
              <div className="rounded-xl bg-emerald-50 p-2.5">
                <dt className="text-xs text-emerald-700">Bepul</dt>
                <dd className="font-extrabold text-emerald-800">{z.freeDeliveryFrom != null ? `${money(z.freeDeliveryFrom)}dan` : '—'}</dd>
              </div>
            </dl>
          </button>
        ))}
      </div>
      {editing && <ZoneForm zone={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function ZoneForm({ zone, onClose }: { zone: DeliveryZone | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState({
    name: zone?.name ?? '',
    description: zone?.description ?? '',
    fee: String(zone?.fee ?? 15000),
    minOrderAmount: String(zone?.minOrderAmount ?? 50000),
    freeDeliveryFrom: zone?.freeDeliveryFrom != null ? String(zone.freeDeliveryFrom) : '',
    minMinutes: String(zone?.minMinutes ?? 30),
    maxMinutes: String(zone?.maxMinutes ?? 60),
    isActive: zone?.isActive ?? true,
    sortOrder: zone?.sortOrder ?? 0,
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['zones'] });
  };

  const toRequest = (): DeliveryZoneRequest => ({
    name: form.name.trim(),
    description: form.description.trim() || null,
    fee: Number(form.fee || 0),
    minOrderAmount: Number(form.minOrderAmount || 0),
    freeDeliveryFrom: form.freeDeliveryFrom === '' ? null : Number(form.freeDeliveryFrom),
    minMinutes: Number(form.minMinutes || 0),
    maxMinutes: Number(form.maxMinutes || 0),
    isActive: form.isActive,
    sortOrder: form.sortOrder,
  });

  const save = useMutation({
    mutationFn: () => (zone ? zonesApi.update(zone.id, toRequest()) : zonesApi.create(toRequest())),
    onSuccess: () => {
      refresh();
      toast('Hudud saqlandi', 'success');
      onClose();
    },
  });

  const remove = useMutation({
    mutationFn: () => zonesApi.remove(zone!.id),
    onSuccess: () => {
      refresh();
      toast("Hudud o'chirildi", 'success');
      onClose();
    },
  });

  const digits = (value: string) => value.replace(/\D/g, '').slice(0, 9);
  const minutesInvalid = Number(form.maxMinutes) < Number(form.minMinutes);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!minutesInvalid) save.mutate();
  };

  return (
    <Modal title={zone ? 'Hududni tahrirlash' : 'Yangi hudud'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="z-name">Nomi</label>
          <input id="z-name" className="input" required minLength={2} maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="z-desc">Tumanlar / izoh</label>
          <input id="z-desc" className="input" maxLength={300} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Chilonzor, Yunusobod…" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="z-fee">Narxi (so'm)</label>
            <input id="z-fee" className="input" inputMode="numeric" value={form.fee} onChange={(e) => setForm({ ...form, fee: digits(e.target.value) })} />
          </div>
          <div>
            <label className="label" htmlFor="z-min">Eng kam buyurtma</label>
            <input id="z-min" className="input" inputMode="numeric" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: digits(e.target.value) })} />
          </div>
          <div className="col-span-2">
            <label className="label" htmlFor="z-free">Bepul yetkazish (so'mdan)</label>
            <input id="z-free" className="input" inputMode="numeric" value={form.freeDeliveryFrom} onChange={(e) => setForm({ ...form, freeDeliveryFrom: digits(e.target.value) })} placeholder="Bo'sh qoldirilsa — hech qachon bepul emas" />
          </div>
          <div>
            <label className="label" htmlFor="z-mintime">Vaqt, dan (daq)</label>
            <input id="z-mintime" className="input" inputMode="numeric" value={form.minMinutes} onChange={(e) => setForm({ ...form, minMinutes: digits(e.target.value).slice(0, 3) })} />
          </div>
          <div>
            <label className="label" htmlFor="z-maxtime">gacha (daq)</label>
            <input id="z-maxtime" className="input" inputMode="numeric" value={form.maxMinutes} onChange={(e) => setForm({ ...form, maxMinutes: digits(e.target.value).slice(0, 3) })} />
          </div>
        </div>
        {minutesInvalid && <p className="text-xs font-semibold text-red-600">«gacha» vaqti «dan» vaqtidan kichik bo'lmasligi kerak.</p>}
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          Saytda ko'rinsin
        </label>
        {(save.error || remove.error) && <ErrorBox error={save.error ?? remove.error} />}
        <div className="flex items-center gap-2 pt-2">
          {zone && (
            <button type="button" className="btn-danger" disabled={remove.isPending} onClick={() => window.confirm("Hududni o'chirasizmi?") && remove.mutate()}>
              O'chirish
            </button>
          )}
          <button type="button" className="btn-ghost ml-auto" onClick={onClose}>
            Bekor qilish
          </button>
          <button className="btn-primary" disabled={save.isPending || form.name.trim().length < 2 || minutesInvalid}>
            Saqlash
          </button>
        </div>
      </form>
    </Modal>
  );
}

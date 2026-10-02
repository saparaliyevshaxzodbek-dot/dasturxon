import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { staffApi } from '../../api/endpoints';
import type { StaffRole, StaffUser } from '../../api/types';
import { phone } from '../../lib/format';
import { ROLE_LABEL } from '../../lib/orders';
import { useAuth } from '../../store/auth';
import { useToast } from '../../store/toast';
import { ErrorBox, Modal, Spinner } from '../../components/ui';
import { PageHeader } from './AdminLayout';

const ROLES: StaffRole[] = ['Admin', 'Manager', 'Cook', 'Courier'];
const ROLE_ICON: Record<StaffRole, string> = { Admin: '👑', Manager: '💼', Cook: '👨‍🍳', Courier: '🛵' };

export default function StaffPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ['staff'], queryFn: staffApi.list });
  const [editing, setEditing] = useState<StaffUser | 'new' | null>(null);

  return (
    <>
      <PageHeader
        title="Xodimlar"
        subtitle="Har bir xodim o'z telefon raqami va paroli bilan kiradi"
        actions={
          <button className="btn-primary" onClick={() => setEditing('new')}>
            + Xodim qo'shish
          </button>
        }
      />
      {isLoading && <Spinner />}
      {error && <ErrorBox error={error} />}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data?.map((u) => (
          <button key={u.id} onClick={() => setEditing(u)} className={`card flex items-center gap-4 p-4 text-left transition hover:shadow-md ${u.isActive ? '' : 'opacity-60'}`}>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-2xl">{ROLE_ICON[u.role]}</span>
            <span className="min-w-0">
              <span className="block truncate font-bold">{u.fullName}</span>
              <span className="block text-sm text-stone-500">{phone(u.phoneNumber)}</span>
              <span className="mt-1 inline-block rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-600">
                {ROLE_LABEL[u.role]}
                {!u.isActive && ' · bloklangan'}
              </span>
            </span>
          </button>
        ))}
      </div>
      {editing && <StaffForm user={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function StaffForm({ user, onClose }: { user: StaffUser | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user: me } = useAuth();
  const isSelf = user?.id === me?.id;
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<StaffRole>(user?.role ?? 'Cook');
  const [isActive, setIsActive] = useState(user?.isActive ?? true);

  const save = useMutation({
    mutationFn: () =>
      user
        ? staffApi.update(user.id, { fullName, role, isActive, newPassword: password || undefined })
        : staffApi.create({ fullName, phoneNumber: `+998${phoneDigits}`, password, role }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast('Saqlandi', 'success');
      onClose();
    },
  });

  const valid = fullName.trim().length >= 2 && (user ? !password || password.length >= 6 : phoneDigits.length === 9 && password.length >= 6);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (valid) save.mutate();
  };

  return (
    <Modal title={user ? 'Xodimni tahrirlash' : 'Yangi xodim'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="s-name">To'liq ism</label>
          <input id="s-name" className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} />
        </div>
        {user ? (
          <p className="text-sm text-stone-500">Telefon: {phone(user.phoneNumber)}</p>
        ) : (
          <div>
            <label className="label" htmlFor="s-phone">Telefon raqam</label>
            <div className="flex">
              <span className="flex items-center rounded-l-xl border border-r-0 border-stone-200 bg-stone-100 px-3 text-sm font-semibold text-stone-600">+998</span>
              <input id="s-phone" className="input rounded-l-none" inputMode="numeric" value={phoneDigits} onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, '').slice(0, 9))} />
            </div>
          </div>
        )}
        <div>
          <label className="label">Lavozim</label>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((r) => (
              <button
                type="button"
                key={r}
                disabled={isSelf}
                onClick={() => setRole(r)}
                className={`rounded-xl px-3 py-2.5 text-sm font-semibold ${role === r ? 'bg-brand-50 text-brand-700 ring-2 ring-brand-500' : 'bg-stone-50 ring-1 ring-stone-200'} disabled:opacity-60`}
              >
                {ROLE_ICON[r]} {ROLE_LABEL[r]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label" htmlFor="s-password">{user ? 'Yangi parol (ixtiyoriy)' : 'Parol'}</label>
          <input id="s-password" type="password" autoComplete="new-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Kamida 6 ta belgi" />
        </div>
        {user && !isSelf && (
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Faol (tizimga kira oladi)
          </label>
        )}
        {save.error && <ErrorBox error={save.error} />}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Bekor qilish
          </button>
          <button className="btn-primary" disabled={!valid || save.isPending}>
            Saqlash
          </button>
        </div>
      </form>
    </Modal>
  );
}

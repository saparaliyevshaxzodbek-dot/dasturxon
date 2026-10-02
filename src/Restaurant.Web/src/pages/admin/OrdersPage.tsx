import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ordersApi } from '../../api/endpoints';
import type { Order, OrderStatus } from '../../api/types';
import { localDateInput, money, phone, time } from '../../lib/format';
import { DELIVERY_ICON, STATUS_LABEL } from '../../lib/orders';
import { EmptyState, ErrorBox, Modal, Spinner, StatusBadge } from '../../components/ui';
import { PageHeader } from './AdminLayout';
import { OrderDetails } from './orderActions';

const STATUSES: OrderStatus[] = ['New', 'Preparing', 'Ready', 'OnTheWay', 'Completed', 'Cancelled'];
const PAGE_SIZE = 15;

export default function OrdersPage() {
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [date, setDate] = useState(localDateInput());
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['orders', 'list', status, date, search, page],
    queryFn: () => ordersApi.list({ status: status || undefined, date: date || undefined, search: search.trim() || undefined, page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  const selected: Order | undefined = data?.items.find((o) => o.id === selectedId);
  const pages = data ? Math.max(1, Math.ceil(data.totalCount / PAGE_SIZE)) : 1;

  const resetPage = <T,>(setter: (v: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  return (
    <>
      <PageHeader title="Buyurtmalar tarixi" subtitle={data ? `${data.totalCount} ta buyurtma topildi` : undefined} />

      <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-3">
        <input className="input" placeholder="🔎 Raqam, ism yoki telefon" value={search} onChange={(e) => resetPage(setSearch)(e.target.value)} />
        <select className="input" value={status} onChange={(e) => resetPage(setStatus)(e.target.value as OrderStatus | '')}>
          <option value="">Barcha holatlar</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <input type="date" className="input" value={date} onChange={(e) => resetPage(setDate)(e.target.value)} />
          {date && (
            <button className="btn-ghost shrink-0" onClick={() => resetPage(setDate)('')}>
              Barchasi
            </button>
          )}
        </div>
      </div>

      {isLoading && <Spinner />}
      {error && <ErrorBox error={error} />}
      {data && (
        <div className={`card overflow-hidden transition ${isFetching ? 'opacity-70' : ''}`}>
          {data.items.length === 0 ? (
            <EmptyState icon="📭" title="Buyurtma topilmadi">
              Filtrlarni o'zgartirib ko'ring
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                  <tr>
                    <th className="px-4 py-3">№</th>
                    <th className="px-4 py-3">Vaqt</th>
                    <th className="px-4 py-3">Mijoz</th>
                    <th className="hidden px-4 py-3 md:table-cell">Turi</th>
                    <th className="px-4 py-3 text-right">Summa</th>
                    <th className="px-4 py-3">Holat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {data.items.map((order) => (
                    <tr key={order.id} onClick={() => setSelectedId(order.id)} className="cursor-pointer hover:bg-brand-50/40">
                      <td className="px-4 py-3 font-bold">#{order.id}</td>
                      <td className="px-4 py-3 text-stone-600">{time(order.createdAt)}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold">{order.customerName}</p>
                        <p className="text-xs text-stone-500">{phone(order.customerPhone)}</p>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">{DELIVERY_ICON[order.deliveryType]}</td>
                      <td className="px-4 py-3 text-right font-semibold">{money(order.totalAmount)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {pages > 1 && (
            <div className="flex items-center justify-between border-t border-stone-100 px-4 py-3 text-sm">
              <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                ← Oldingi
              </button>
              <span className="text-stone-500">
                {page} / {pages}
              </span>
              <button className="btn-ghost" disabled={page >= pages} onClick={() => setPage(page + 1)}>
                Keyingi →
              </button>
            </div>
          )}
        </div>
      )}

      {selected && (
        <Modal title={`Buyurtma #${selected.id}`} onClose={() => setSelectedId(null)}>
          <OrderDetails order={selected} />
        </Modal>
      )}
    </>
  );
}

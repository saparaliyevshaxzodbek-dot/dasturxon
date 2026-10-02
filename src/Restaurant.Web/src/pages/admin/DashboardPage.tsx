import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../api/endpoints';
import { money, weekday } from '../../lib/format';
import { STATUS_LABEL } from '../../lib/orders';
import { ErrorBox, Spinner, StatusBadge } from '../../components/ui';
import { PageHeader } from './AdminLayout';

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.get, refetchInterval: 60_000 });

  if (isLoading) return <Spinner />;
  if (error || !data) return <ErrorBox error={error} />;

  const maxRevenue = Math.max(...data.last7Days.map((d) => d.revenue), 1);
  const weekRevenue = data.last7Days.reduce((sum, d) => sum + d.revenue, 0);
  const maxTop = Math.max(...data.topProducts.map((p) => p.revenue), 1);

  const kpis = [
    { label: 'Bugungi buyurtmalar', value: data.todayOrders.toString(), icon: '🧾', tone: 'bg-sky-50 text-sky-700' },
    { label: 'Bugungi tushum', value: money(data.todayRevenue), icon: '💰', tone: 'bg-emerald-50 text-emerald-700' },
    { label: "O'rtacha chek", value: money(data.averageCheck), icon: '📈', tone: 'bg-violet-50 text-violet-700' },
    { label: 'Hozir jarayonda', value: data.activeOrders.toString(), icon: '🔥', tone: 'bg-brand-50 text-brand-700' },
  ];

  return (
    <>
      <PageHeader title="Boshqaruv paneli" subtitle="Bugungi holat va oxirgi 7 kunlik natijalar" />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="card p-4 sm:p-5">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl text-xl ${kpi.tone}`}>{kpi.icon}</div>
            <p className="text-xs font-medium text-stone-500 sm:text-sm">{kpi.label}</p>
            <p className="mt-1 text-lg font-extrabold tracking-tight sm:text-2xl">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-bold">Tushum, oxirgi 7 kun</h2>
            <span className="text-sm text-stone-500">Jami: <b className="text-stone-900">{money(weekRevenue)}</b></span>
          </div>
          <div className="mt-6 flex h-56 items-end gap-2 sm:gap-4">
            {data.last7Days.map((day, i) => {
              const isToday = i === data.last7Days.length - 1;
              return (
                <div key={day.date} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <span className="text-[10px] font-semibold text-stone-500 opacity-0 transition group-hover:opacity-100 sm:text-xs">
                    {Math.round(day.revenue / 1000)}k
                  </span>
                  <div
                    title={`${day.orders} ta buyurtma · ${money(day.revenue)}`}
                    className={`w-full rounded-t-lg transition-all ${isToday ? 'bg-brand-500' : 'bg-stone-300 group-hover:bg-stone-400'}`}
                    style={{ height: `${Math.max((day.revenue / maxRevenue) * 100, 2)}%` }}
                  />
                  <span className={`text-xs ${isToday ? 'font-bold text-brand-700' : 'text-stone-500'}`}>{isToday ? 'Bugun' : weekday(day.date)}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Jarayondagi buyurtmalar</h2>
            <Link to="/admin/board" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
              Oqimga o'tish →
            </Link>
          </div>
          {data.activeByStatus.length === 0 ? (
            <p className="mt-6 text-sm text-stone-500">Hozir faol buyurtma yo'q.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.activeByStatus.map((s) => (
                <li key={s.status} className="flex items-center justify-between rounded-xl bg-stone-50 px-4 py-3">
                  <StatusBadge status={s.status} />
                  <span className="text-lg font-extrabold" aria-label={STATUS_LABEL[s.status]}>
                    {s.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card mt-6 p-5 sm:p-6">
        <h2 className="font-bold">Eng ko'p sotilgan taomlar (7 kun)</h2>
        <ul className="mt-4 space-y-4">
          {data.topProducts.map((p, i) => (
            <li key={p.productName}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-semibold">
                  <span className="mr-2 text-stone-400">{i + 1}.</span>
                  {p.productName}
                </span>
                <span className="shrink-0 text-stone-500">
                  {p.quantity} ta · <b className="text-stone-900">{money(p.revenue)}</b>
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-stone-100">
                <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600" style={{ width: `${(p.revenue / maxTop) * 100}%` }} />
              </div>
            </li>
          ))}
          {data.topProducts.length === 0 && <p className="text-sm text-stone-500">Hali savdo yo'q.</p>}
        </ul>
      </section>
    </>
  );
}

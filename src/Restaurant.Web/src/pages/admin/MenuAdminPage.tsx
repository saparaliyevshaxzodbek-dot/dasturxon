import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoriesApi, productsApi } from '../../api/endpoints';
import type { Category, Product } from '../../api/types';
import { money } from '../../lib/format';
import { useAuth } from '../../store/auth';
import { useToast } from '../../store/toast';
import { DishImage, ErrorBox, Modal, Spinner } from '../../components/ui';
import { PageHeader } from './AdminLayout';

export default function MenuAdminPage() {
  const { hasRole } = useAuth();
  const canEdit = hasRole('Admin', 'Manager');
  const queryClient = useQueryClient();
  const toast = useToast();
  const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all');
  const [editingProduct, setEditingProduct] = useState<Product | 'new' | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | 'new' | null>(null);

  const products = useQuery({ queryKey: ['products'], queryFn: productsApi.list });
  // Cooks only manage the stop-list, so they don't need (and can't read) the category admin list.
  const categories = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list, enabled: canEdit });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['products'] });
    void queryClient.invalidateQueries({ queryKey: ['categories'] });
    void queryClient.invalidateQueries({ queryKey: ['menu'] });
  };

  const toggle = useMutation({
    mutationFn: (p: Product) => productsApi.setAvailability(p.id, !p.isAvailable),
    onSuccess: (p) => {
      refresh();
      toast(p.isAvailable ? `"${p.name}" menyuga qaytarildi` : `"${p.name}" stop-listga qo'shildi`, 'success');
    },
    onError: (e) => toast(e.message, 'error'),
  });

  const remove = useMutation({
    mutationFn: (p: Product) => productsApi.remove(p.id),
    onSuccess: () => {
      refresh();
      toast("Taom o'chirildi", 'success');
    },
    onError: (e) => toast(e.message, 'error'),
  });

  const categoryTabs: { id: number; name: string; count: number; isActive: boolean; source?: Category }[] = canEdit
    ? (categories.data ?? []).map((c) => ({ id: c.id, name: c.name, count: c.productCount, isActive: c.isActive, source: c }))
    : Array.from(new Map((products.data ?? []).map((p) => [p.categoryId, p.categoryName])).entries()).map(([id, name]) => ({
        id,
        name,
        count: (products.data ?? []).filter((p) => p.categoryId === id).length,
        isActive: true,
      }));

  const list = (products.data ?? []).filter((p) => categoryFilter === 'all' || p.categoryId === categoryFilter);

  return (
    <>
      <PageHeader
        title={canEdit ? 'Menyu' : 'Stop-list'}
        subtitle={canEdit ? 'Taomlar, narxlar va rasmlar' : "Tugagan taomlarni menyudan vaqtincha olib qo'ying"}
        actions={
          canEdit && (
            <>
              <button className="btn-ghost" onClick={() => setEditingCategory('new')}>
                + Kategoriya
              </button>
              <button className="btn-primary" onClick={() => setEditingProduct('new')}>
                + Taom qo'shish
              </button>
            </>
          )
        }
      />

      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${categoryFilter === 'all' ? 'bg-stone-900 text-white' : 'bg-white ring-1 ring-stone-200'}`}
        >
          Barchasi
        </button>
        {categoryTabs.map((c) => (
          <span key={c.id} className="inline-flex shrink-0 items-center">
            <button
              onClick={() => setCategoryFilter(c.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${categoryFilter === c.id ? 'bg-stone-900 text-white' : 'bg-white ring-1 ring-stone-200'} ${c.isActive ? '' : 'opacity-50'}`}
            >
              {c.name} <span className="opacity-60">{c.count}</span>
            </button>
            {canEdit && c.source && (
              <button onClick={() => setEditingCategory(c.source!)} className="ml-0.5 rounded-full p-1.5 text-stone-400 hover:bg-white hover:text-stone-700" aria-label={`${c.name} kategoriyasini tahrirlash`}>
                ✎
              </button>
            )}
          </span>
        ))}
      </div>

      {products.isLoading && <Spinner />}
      {products.error && <ErrorBox error={products.error} />}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((p) => (
          <article key={p.id} className={`card flex gap-3 p-3 ${p.isAvailable ? '' : 'bg-stone-50'}`}>
            <DishImage name={p.name} category={p.categoryName} imageUrl={p.imageUrl} className={`h-20 w-20 shrink-0 rounded-xl [&>span]:text-3xl ${p.isAvailable ? '' : 'grayscale'}`} />
            <div className="min-w-0 flex-1">
              <p className={`truncate font-bold ${p.isAvailable ? '' : 'text-stone-400 line-through'}`}>{p.name}</p>
              <p className="text-xs text-stone-500">
                {p.categoryName}
                {p.portion && ` · ${p.portion}`}
                {p.badge && <span className="ml-1 rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">{p.badge}</span>}
              </p>
              <p className="mt-1 text-sm font-extrabold">{money(p.price)}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold">
                  <input type="checkbox" className="peer sr-only" checked={p.isAvailable} onChange={() => toggle.mutate(p)} />
                  <span className="relative h-5 w-9 rounded-full bg-stone-300 transition peer-checked:bg-emerald-500 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-4" />
                  {p.isAvailable ? 'Sotuvda' : 'Tugagan'}
                </label>
                {canEdit && (
                  <>
                    <button className="ml-auto text-xs font-semibold text-brand-600 hover:underline" onClick={() => setEditingProduct(p)}>
                      Tahrirlash
                    </button>
                    <button
                      className="text-xs font-semibold text-red-600 hover:underline"
                      onClick={() => window.confirm(`"${p.name}" taomini o'chirasizmi?`) && remove.mutate(p)}
                    >
                      O'chirish
                    </button>
                  </>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {editingProduct && (
        <ProductForm
          product={editingProduct === 'new' ? null : editingProduct}
          categories={categories.data ?? []}
          defaultCategoryId={categoryFilter === 'all' ? undefined : categoryFilter}
          onClose={() => setEditingProduct(null)}
          onSaved={refresh}
        />
      )}
      {editingCategory && (
        <CategoryForm category={editingCategory === 'new' ? null : editingCategory} onClose={() => setEditingCategory(null)} onSaved={refresh} />
      )}
    </>
  );
}

function ProductForm({ product, categories, defaultCategoryId, onClose, onSaved }: {
  product: Product | null;
  categories: Category[];
  defaultCategoryId?: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState({
    categoryId: product?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? 0,
    name: product?.name ?? '',
    description: product?.description ?? '',
    portion: product?.portion ?? '',
    badge: product?.badge ?? '',
    price: product?.price.toString() ?? '',
    imageUrl: product?.imageUrl ?? '',
    isAvailable: product?.isAvailable ?? true,
    sortOrder: product?.sortOrder ?? 0,
  });
  const [uploading, setUploading] = useState(false);

  const save = useMutation({
    mutationFn: () => {
      const request = {
        ...form,
        price: Number(form.price),
        description: form.description || undefined,
        portion: form.portion || undefined,
        badge: form.badge || undefined,
        imageUrl: form.imageUrl || undefined,
      };
      return product ? productsApi.update(product.id, request) : productsApi.create(request);
    },
    onSuccess: () => {
      onSaved();
      toast(product ? 'Taom yangilandi' : "Taom qo'shildi", 'success');
      onClose();
    },
  });

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await productsApi.uploadImage(file);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Rasm yuklanmadi', 'error');
    } finally {
      setUploading(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate();
  };

  return (
    <Modal title={product ? 'Taomni tahrirlash' : 'Yangi taom'} onClose={onClose} wide>
      <form onSubmit={submit} className="grid gap-5 sm:grid-cols-[180px_1fr]">
        <div>
          <DishImage name={form.name || 'Taom'} imageUrl={form.imageUrl || null} className="aspect-square w-full rounded-2xl" />
          <label className="btn-ghost mt-3 w-full cursor-pointer">
            {uploading ? 'Yuklanmoqda…' : '📷 Rasm yuklash'}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} />
          </label>
          {form.imageUrl && (
            <button type="button" className="mt-2 w-full text-xs text-stone-500 hover:text-red-600" onClick={() => setForm({ ...form, imageUrl: '' })}>
              Rasmni olib tashlash
            </button>
          )}
        </div>
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="p-name">Nomi</label>
            <input id="p-name" className="input" required minLength={2} maxLength={150} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="p-category">Kategoriya</label>
              <select id="p-category" className="input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="p-price">Narxi (so'm)</label>
              <input id="p-price" className="input" required inputMode="numeric" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value.replace(/\D/g, '') })} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="p-desc">Tavsif</label>
            <textarea id="p-desc" rows={2} className="input" maxLength={500} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="p-portion">Porsiya</label>
              <input id="p-portion" className="input" maxLength={50} value={form.portion} onChange={(e) => setForm({ ...form, portion: e.target.value })} placeholder="1 six · 180 g" />
            </div>
            <div>
              <label className="label" htmlFor="p-badge">Belgi</label>
              <select id="p-badge" className="input" value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })}>
                <option value="">Yo'q</option>
                <option value="Xit">🔥 Xit</option>
                <option value="Yangi">✨ Yangi</option>
                <option value="Tavsiya">👨‍🍳 Tavsiya</option>
                <option value="Achchiq">🌶 Achchiq</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="p-sort">Tartib raqami</label>
              <input id="p-sort" type="number" min={0} max={1000} className="input" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
            </div>
            <label className="mt-7 flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} />
              Sotuvda
            </label>
          </div>
          {save.error && <ErrorBox error={save.error} />}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Bekor qilish
            </button>
            <button className="btn-primary" disabled={save.isPending || uploading || !form.name || !form.price || !form.categoryId}>
              Saqlash
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function CategoryForm({ category, onClose, onSaved }: { category: Category | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: category?.name ?? '',
    sortOrder: category?.sortOrder ?? 0,
    isActive: category?.isActive ?? true,
  });

  const save = useMutation({
    mutationFn: () => (category ? categoriesApi.update(category.id, form) : categoriesApi.create(form)),
    onSuccess: () => {
      onSaved();
      toast('Kategoriya saqlandi', 'success');
      onClose();
    },
  });

  const remove = useMutation({
    mutationFn: () => categoriesApi.remove(category!.id),
    onSuccess: () => {
      onSaved();
      toast("Kategoriya o'chirildi", 'success');
      onClose();
    },
  });

  return (
    <Modal title={category ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="space-y-4"
      >
        <div>
          <label className="label" htmlFor="c-name">Nomi</label>
          <input id="c-name" className="input" required minLength={2} maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="c-sort">Tartib raqami</label>
            <input id="c-sort" type="number" min={0} max={1000} className="input" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
          </div>
          <label className="mt-7 flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Saytda ko'rinsin
          </label>
        </div>
        {(save.error || remove.error) && <ErrorBox error={save.error ?? remove.error} />}
        <div className="flex items-center gap-2 pt-2">
          {category && (
            <button type="button" className="btn-danger" disabled={remove.isPending} onClick={() => window.confirm("Kategoriyani o'chirasizmi?") && remove.mutate()}>
              O'chirish
            </button>
          )}
          <button type="button" className="btn-ghost ml-auto" onClick={onClose}>
            Bekor qilish
          </button>
          <button className="btn-primary" disabled={save.isPending || form.name.trim().length < 2}>
            Saqlash
          </button>
        </div>
      </form>
    </Modal>
  );
}

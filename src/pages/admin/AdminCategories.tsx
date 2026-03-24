import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus, Pencil, Trash2, GripVertical, Package, Gift, Tag, Star, Briefcase,
  BookOpen, Pen, Globe, Award, Shirt, Coffee, Layers, Search, Eye, EyeOff,
  ChevronUp, ChevronDown, Save, X, LayoutGrid, Sparkles, Languages,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// --- Icon registry ---
const ICONS: Record<string, React.ElementType> = {
  Package, Gift, Tag, Star, Briefcase, BookOpen, Pen, Globe, Award,
  Shirt, Coffee, Layers,
};
const ICON_NAMES = Object.keys(ICONS);

interface CategoryForm {
  name_en: string;
  name_bn: string;
  description_en: string;
  description_bn: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
}

const emptyForm: CategoryForm = {
  name_en: '', name_bn: '', description_en: '', description_bn: '',
  icon: 'Package', is_active: true, sort_order: 0,
};

// ─── Live Preview Card ────────────────────────────────────────────────────────
const CategoryPreviewCard = ({ form, lang }: { form: CategoryForm; lang: 'en' | 'bn' }) => {
  const Icon = ICONS[form.icon] ?? Package;
  const name = lang === 'en' ? form.name_en : (form.name_bn || form.name_en);
  const desc = lang === 'en' ? form.description_en : (form.description_bn || form.description_en);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Card top gradient bar */}
      <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-primary/40" />
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/10">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base leading-tight truncate text-foreground">
              {name || <span className="text-muted-foreground italic text-sm">Untitled category…</span>}
            </p>
            {lang === 'en' && form.name_bn && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{form.name_bn}</p>
            )}
            {lang === 'bn' && form.name_en && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{form.name_en}</p>
            )}
            {desc && (
              <p className="text-xs text-muted-foreground/80 mt-2 line-clamp-2 leading-relaxed">{desc}</p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
          <div className="flex gap-1.5">
            <Badge variant={form.is_active ? 'default' : 'secondary'} className="text-[10px] h-5 px-2">
              {form.is_active ? '● Active' : '○ Inactive'}
            </Badge>
            <Badge variant="outline" className="text-[10px] h-5 px-2 font-mono">
              #{form.sort_order}
            </Badge>
          </div>
          <span className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">
            {lang === 'en' ? 'EN Preview' : 'BN প্রিভিউ'}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Catalog-style chip preview ───────────────────────────────────────────────
const CatalogChipPreview = ({ form }: { form: CategoryForm }) => {
  const Icon = ICONS[form.icon] ?? Package;
  return (
    <div className="flex flex-wrap gap-2">
      {(['en', 'bn'] as const).map(l => (
        <div
          key={l}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium shadow-sm opacity-90"
        >
          <Icon className="w-3 h-3" />
          {l === 'en'
            ? (form.name_en || 'English name')
            : (form.name_bn || form.name_en || 'বাংলা নাম')}
          <span className="text-[9px] ml-0.5 text-primary-foreground/60">{l.toUpperCase()}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Icon Picker ──────────────────────────────────────────────────────────────
const IconPicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const [q, setQ] = useState('');
  const filtered = ICON_NAMES.filter(n => n.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder="Search icons…" value={q} onChange={e => setQ(e.target.value)} className="pl-8 h-8 text-xs" />
      </div>
      <div className="grid grid-cols-6 gap-1.5 max-h-32 overflow-y-auto rounded-lg border border-border bg-muted/30 p-2">
        {filtered.map(name => {
          const Icon = ICONS[name];
          return (
            <button
              key={name}
              type="button"
              title={name}
              onClick={() => onChange(name)}
              className={cn(
                'flex flex-col items-center gap-0.5 p-1.5 rounded-lg border text-[9px] transition-all',
                value === name
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-transparent hover:border-primary/30 hover:bg-background text-muted-foreground'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate w-full text-center">{name}</span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-6 text-center text-xs text-muted-foreground py-3">No icons match</p>
        )}
      </div>
    </div>
  );
};

// ─── Bilingual Editor Panel ───────────────────────────────────────────────────
const BilingualEditorPanel = ({
  form,
  sf,
  isNew,
  isPending,
  onSave,
  onCancel,
}: {
  form: CategoryForm;
  sf: (p: Partial<CategoryForm>) => void;
  isNew: boolean;
  isPending: boolean;
  onSave: () => void;
  onCancel: () => void;
}) => {
  const [previewLang, setPreviewLang] = useState<'en' | 'bn'>('en');

  return (
    <div className="flex flex-col h-full space-y-0">
      {/* Panel header */}
      <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
        <div className="flex items-center gap-2">
          {isNew
            ? <><Plus className="w-4 h-4 text-primary" /><span className="font-semibold text-sm">New Category</span></>
            : <><Pencil className="w-4 h-4 text-primary" /><span className="font-semibold text-sm">Edit Category</span></>
          }
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="h-8">
            <X className="w-3.5 h-3.5 mr-1" /> Cancel
          </Button>
          <Button size="sm" onClick={onSave} disabled={isPending} className="h-8 gap-1.5">
            <Save className="w-3.5 h-3.5" />
            {isPending ? 'Saving…' : isNew ? 'Create' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-5 pr-0.5">
        {/* Live preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> Live Preview
            </p>
            <div className="flex rounded-full bg-muted p-0.5 gap-0.5">
              {(['en', 'bn'] as const).map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setPreviewLang(l)}
                  className={cn(
                    'text-[10px] font-semibold px-2.5 py-0.5 rounded-full transition-all',
                    previewLang === l
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {l === 'en' ? '🇬🇧 EN' : '🇧🇩 BN'}
                </button>
              ))}
            </div>
          </div>
          <CategoryPreviewCard form={form} lang={previewLang} />
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-1">
              <LayoutGrid className="w-3 h-3" /> Catalog chip
            </p>
            <CatalogChipPreview form={form} />
          </div>
        </div>

        {/* Bilingual content tabs */}
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Content</p>
          <Tabs defaultValue="en" className="w-full">
            <TabsList className="w-full mb-3 h-9">
              <TabsTrigger value="en" className="flex-1 text-xs gap-1.5">
                🇬🇧 English
                {!form.name_en && <span className="w-1.5 h-1.5 rounded-full bg-destructive" />}
              </TabsTrigger>
              <TabsTrigger value="bn" className="flex-1 text-xs gap-1.5">
                🇧🇩 বাংলা
                {!form.name_bn && form.name_en && <span className="w-1.5 h-1.5 rounded-full bg-accent" title="Using English fallback" />}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="en" className="space-y-3 mt-0">
              <div>
                <Label className="text-xs mb-1.5 block">
                  Name <span className="text-destructive ml-0.5">*</span>
                </Label>
                <Input
                  value={form.name_en}
                  onChange={e => sf({ name_en: e.target.value })}
                  placeholder="e.g. Corporate Gifts"
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Description</Label>
                <Textarea
                  value={form.description_en}
                  onChange={e => sf({ description_en: e.target.value })}
                  placeholder="Brief description shown on the catalog page…"
                  rows={3}
                  className="text-sm resize-none"
                />
              </div>
            </TabsContent>

            <TabsContent value="bn" className="space-y-3 mt-0">
              <div>
                <Label className="text-xs mb-1.5 block">নাম</Label>
                <Input
                  value={form.name_bn}
                  onChange={e => sf({ name_bn: e.target.value })}
                  placeholder="যেমন: কর্পোরেট গিফট"
                  className="text-sm"
                />
                {!form.name_bn && form.name_en && (
                  <p className="text-[11px] text-accent-foreground/70 mt-1 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-accent inline-block" />
                    Showing English fallback: <em className="not-italic font-medium">{form.name_en}</em>
                  </p>
                )}
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">বিবরণ</Label>
                <Textarea
                  value={form.description_bn}
                  onChange={e => sf({ description_bn: e.target.value })}
                  placeholder="ক্যাটালগ পেজে দৃশ্যমান সংক্ষিপ্ত বিবরণ…"
                  rows={3}
                  className="text-sm resize-none"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Icon picker */}
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Icon</p>
          <IconPicker value={form.icon} onChange={v => sf({ icon: v })} />
        </div>

        {/* Sort order + Active */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs mb-1.5 block">Sort Order</Label>
            <Input
              type="number"
              value={form.sort_order}
              onChange={e => sf({ sort_order: parseInt(e.target.value) || 0 })}
              min={0}
              className="text-sm"
            />
            <p className="text-[10px] text-muted-foreground mt-1">Lower = appears first</p>
          </div>
          <div className="flex flex-col justify-center pt-3">
            <Label className="text-xs mb-2 block">Visibility</Label>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => sf({ is_active: v })} />
              <span className="text-xs text-muted-foreground">
                {form.is_active ? 'Public' : 'Hidden'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────────────────────
const AdminCategories = () => {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [searchQ, setSearchQ] = useState('');
  const [bilingualPreview, setBilingualPreview] = useState(false);

  // Queries
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: productCounts = {} } = useQuery({
    queryKey: ['admin-categories-product-counts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('category_id');
      if (error) throw error;
      const counts: Record<string, number> = {};
      data.forEach(p => {
        if (p.category_id) counts[p.category_id] = (counts[p.category_id] ?? 0) + 1;
      });
      return counts;
    },
  });

  const filtered = useMemo(() => {
    if (!searchQ.trim()) return categories;
    const q = searchQ.toLowerCase();
    return categories.filter(c =>
      c.name_en.toLowerCase().includes(q) ||
      (c.name_bn ?? '').includes(q) ||
      (c.description_en ?? '').toLowerCase().includes(q)
    );
  }, [categories, searchQ]);

  // Mutations
  const upsert = useMutation({
    mutationFn: async (payload: CategoryForm & { id?: string }) => {
      if (payload.id) {
        const { id, ...rest } = payload;
        const { error } = await supabase.from('categories').update(rest).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('categories').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      qc.invalidateQueries({ queryKey: ['public-categories'] });
      toast.success(editingId === 'new' ? 'Category created' : 'Category updated');
      setEditingId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      qc.invalidateQueries({ queryKey: ['public-categories'] });
      toast.success('Category deleted');
      if (editingId !== 'new') setEditingId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('categories').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      qc.invalidateQueries({ queryKey: ['public-categories'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reorder = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: 'up' | 'down' }) => {
      const idx = categories.findIndex(c => c.id === id);
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= categories.length) return;
      const curr = categories[idx];
      const swap = categories[swapIdx];
      await Promise.all([
        supabase.from('categories').update({ sort_order: swap.sort_order }).eq('id', curr.id),
        supabase.from('categories').update({ sort_order: curr.sort_order }).eq('id', swap.id),
      ]);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-categories'] }),
    onError: (e: Error) => toast.error(e.message),
  });

  // Handlers
  const sf = (patch: Partial<CategoryForm>) => setForm(f => ({ ...f, ...patch }));

  const openCreate = () => {
    setForm({ ...emptyForm, sort_order: categories.length });
    setEditingId('new');
  };

  const openEdit = (cat: typeof categories[0]) => {
    setForm({
      name_en: cat.name_en,
      name_bn: cat.name_bn ?? '',
      description_en: cat.description_en ?? '',
      description_bn: cat.description_bn ?? '',
      icon: cat.icon ?? 'Package',
      is_active: cat.is_active,
      sort_order: cat.sort_order,
    });
    setEditingId(cat.id);
  };

  const handleSave = () => {
    if (!form.name_en.trim()) { toast.error('English name is required'); return; }
    const id = editingId === 'new' ? undefined : editingId ?? undefined;
    upsert.mutate(id ? { ...form, id } : form);
  };

  const activeCount = categories.filter(c => c.is_active).length;
  const totalProducts = Object.values(productCounts).reduce((a, b) => a + b, 0);
  const isEditing = editingId !== null;

  return (
    <div className="space-y-4 h-full">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Product Categories</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {categories.length} categories · {activeCount} active · {totalProducts} products assigned
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 shrink-0 h-9">
          <Plus className="w-4 h-4" /> Add Category
        </Button>
      </div>

      {/* ── Split layout ── */}
      <div className={cn(
        'grid gap-4 transition-all duration-300',
        isEditing ? 'grid-cols-1 lg:grid-cols-[1fr_420px]' : 'grid-cols-1'
      )}>

        {/* ── Left: List ── */}
        <div className="space-y-3">
          {/* Search + bilingual toggle toolbar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories…"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <button
              type="button"
              onClick={() => setBilingualPreview(v => !v)}
              title="Toggle EN/BN side-by-side preview"
              className={cn(
                'flex items-center gap-1.5 h-9 px-3 rounded-lg border text-xs font-medium transition-all shrink-0',
                bilingualPreview
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
              )}
            >
              <Languages className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">EN / BN</span>
            </button>
          </div>

          {/* Bilingual preview legend */}
          {bilingualPreview && (
            <div className="flex items-center gap-2 px-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                <Languages className="w-3 h-3" /> Bilingual preview on
              </span>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="inline-block w-2 h-2 rounded-full bg-primary/70" /> EN
                <span className="inline-block w-2 h-2 rounded-full bg-accent/70 ml-1" /> BN
              </span>
            </div>
          )}

          {/* List */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
              {searchQ ? 'No categories match your search.' : 'No categories yet — click "Add Category" to start.'}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((cat, idx) => {
                const Icon = ICONS[cat.icon ?? 'Package'] ?? Package;
                const count = productCounts[cat.id] ?? 0;
                const isSelected = editingId === cat.id;
                return (
                  <div
                    key={cat.id}
                    className={cn(
                      'group flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-all cursor-pointer',
                      isSelected
                        ? 'border-primary/60 ring-1 ring-primary/20 shadow-sm bg-primary/[0.03]'
                        : 'hover:border-border/80 hover:shadow-sm',
                      !cat.is_active && 'opacity-55'
                    )}
                    onClick={() => openEdit(cat)}
                  >
                    {/* Reorder */}
                    <div className="flex flex-col items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => reorder.mutate({ id: cat.id, direction: 'up' })}
                        disabled={idx === 0 || reorder.isPending}
                        className="p-0.5 rounded text-muted-foreground/40 hover:text-foreground disabled:opacity-20 transition-colors"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <GripVertical className="w-3.5 h-3.5 text-muted-foreground/30" />
                      <button
                        type="button"
                        onClick={() => reorder.mutate({ id: cat.id, direction: 'down' })}
                        disabled={idx === filtered.length - 1 || reorder.isPending}
                        className="p-0.5 rounded text-muted-foreground/40 hover:text-foreground disabled:opacity-20 transition-colors"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Icon */}
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                      isSelected ? 'bg-primary/15' : 'bg-primary/10'
                    )}>
                      <Icon className={cn('w-5 h-5', isSelected ? 'text-primary' : 'text-primary/80')} />
                    </div>

                    {/* Names — inline or side-by-side bilingual */}
                    <div className="flex-1 min-w-0">
                      {bilingualPreview ? (
                        <div className="grid grid-cols-2 gap-2">
                          {/* EN column */}
                          <div className="min-w-0 rounded-lg bg-primary/5 border border-primary/10 px-2.5 py-1.5">
                            <p className="text-[9px] font-bold text-primary/60 uppercase tracking-widest mb-0.5">EN 🇬🇧</p>
                            <p className="font-semibold text-sm leading-tight truncate text-foreground">
                              {cat.name_en || <span className="text-muted-foreground italic text-xs">—</span>}
                            </p>
                            {cat.description_en && (
                              <p className="text-[10px] text-muted-foreground truncate mt-0.5 leading-tight">
                                {cat.description_en}
                              </p>
                            )}
                          </div>
                          {/* BN column */}
                          <div className="min-w-0 rounded-lg bg-accent/5 border border-accent/10 px-2.5 py-1.5">
                            <p className="text-[9px] font-bold text-accent-foreground/50 uppercase tracking-widest mb-0.5">BN 🇧🇩</p>
                            <p className="font-semibold text-sm leading-tight truncate text-foreground">
                              {cat.name_bn || (
                                <span className="text-muted-foreground italic text-xs">↳ {cat.name_en}</span>
                              )}
                            </p>
                            {(cat.description_bn || cat.description_en) && (
                              <p className="text-[10px] text-muted-foreground truncate mt-0.5 leading-tight">
                                {cat.description_bn || (
                                  <span className="italic opacity-60">{cat.description_en}</span>
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm">{cat.name_en}</p>
                            {cat.name_bn && (
                              <span className="text-xs text-muted-foreground">{cat.name_bn}</span>
                            )}
                          </div>
                          {cat.description_en && (
                            <p className="text-xs text-muted-foreground/70 truncate max-w-xs mt-0.5">
                              {cat.description_en}
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    {/* Product badge */}
                    <Badge variant="secondary" className="text-xs shrink-0 gap-1 hidden sm:flex">
                      <Package className="w-3 h-3" />{count}
                    </Badge>

                    {/* Active toggle */}
                    <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                      {cat.is_active
                        ? <Eye className="w-3.5 h-3.5 text-muted-foreground/40" />
                        : <EyeOff className="w-3.5 h-3.5 text-muted-foreground/40" />
                      }
                      <Switch
                        checked={cat.is_active}
                        onCheckedChange={v => toggleActive.mutate({ id: cat.id, is_active: v })}
                        className="scale-90"
                      />
                    </div>

                    {/* Edit / Delete */}
                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <Button
                        variant={isSelected ? 'default' : 'ghost'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(cat)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        disabled={count > 0}
                        title={count > 0 ? 'Remove products first' : 'Delete category'}
                        onClick={() => { if (confirm(`Delete "${cat.name_en}"?`)) remove.mutate(cat.id); }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right: Editor Panel ── */}
        {isEditing && (
          <div className="rounded-xl border border-border bg-card p-5 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
            <BilingualEditorPanel
              form={form}
              sf={sf}
              isNew={editingId === 'new'}
              isPending={upsert.isPending}
              onSave={handleSave}
              onCancel={() => setEditingId(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCategories;

import { useState, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Upload, Image as ImageIcon, PackagePlus, Search, ChevronLeft, ChevronRight, X, CheckSquare, Square, Loader2, RefreshCw, Palette } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import BulkUploadZone, { type FileItem } from '@/components/admin/BulkUploadZone';
import VariantManager from '@/components/admin/VariantManager';
import ProductImageManager from '@/components/admin/ProductImageManager';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 12;

// ── Inline 5-view image uploader (works before product is saved) ──────────────
type ViewType = 'main' | 'front' | 'back' | 'left' | 'right';
const VIEW_SLOTS: { type: ViewType; label: string }[] = [
  { type: 'main',  label: 'Main'  },
  { type: 'front', label: 'Front' },
  { type: 'back',  label: 'Back'  },
  { type: 'left',  label: 'Left'  },
  { type: 'right', label: 'Right' },
];

interface StagedImage { file?: File; url: string; uploading?: boolean; }
type StagedViews = Partial<Record<ViewType, StagedImage>>;

interface InlineViewUploaderProps {
  staged: StagedViews;
  onStaged: (v: StagedViews) => void;
}

const InlineViewUploader = ({ staged, onStaged }: InlineViewUploaderProps) => {
  const { toast } = useToast();

  const handleFile = async (file: File, viewType: ViewType) => {
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 2MB per image.', variant: 'destructive' });
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid type', description: 'Images only.', variant: 'destructive' });
      return;
    }
    // Set uploading state
    onStaged({ ...staged, [viewType]: { url: '', uploading: true } });

    const ext = file.name.split('.').pop();
    const path = `product-views/staged/${viewType}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('products').upload(path, file);
    if (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      const next = { ...staged };
      delete next[viewType];
      onStaged(next);
      return;
    }
    const { data: urlData } = supabase.storage.from('products').getPublicUrl(path);
    onStaged({ ...staged, [viewType]: { file, url: urlData.publicUrl } });
  };

  const remove = (viewType: ViewType) => {
    const next = { ...staged };
    delete next[viewType];
    onStaged(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Additional Product Images
        </p>
        <span className="text-[10px] text-muted-foreground/60">(Main required · others optional · max 2MB)</span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {VIEW_SLOTS.map(({ type, label }) => {
          const img = staged[type];
          const isRequired = type === 'main';

          return (
            <div key={type} className="flex flex-col gap-1">
              <div className={cn(
                'relative aspect-square rounded-xl overflow-hidden border-2 border-dashed transition-all group',
                img?.url
                  ? 'border-[hsl(var(--sm-gold))]/60 shadow-sm'
                  : isRequired
                    ? 'border-destructive/40 bg-destructive/5 hover:border-destructive/70'
                    : 'border-border/40 bg-muted/20 hover:border-border/70',
              )}>
                {img?.uploading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : img?.url ? (
                  <>
                    <img src={img.url} alt={label} className="w-full h-full object-contain p-1" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                      <label className="cursor-pointer p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors" title="Replace">
                        <Upload className="h-3 w-3 text-foreground" />
                        <input type="file" accept="image/*" className="hidden"
                          onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0], type); }} />
                      </label>
                      <button type="button" onClick={() => remove(type)}
                        className="p-1.5 bg-destructive/90 rounded-full hover:bg-destructive transition-colors" title="Remove">
                        <X className="h-3 w-3 text-destructive-foreground" />
                      </button>
                    </div>
                  </>
                ) : (
                  <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center gap-1.5 hover:bg-muted/40 transition-colors">
                    <Upload className="h-4 w-4 text-muted-foreground/50" />
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0], type); }} />
                  </label>
                )}
                {isRequired && !img?.url && !img?.uploading && (
                  <span className="absolute bottom-1 left-0 right-0 text-center text-[8px] text-destructive/70 font-bold">required</span>
                )}
              </div>
              <p className={cn(
                'text-[10px] text-center font-semibold uppercase tracking-wider',
                img?.url ? 'text-[hsl(var(--sm-gold))]' : 'text-muted-foreground',
              )}>{label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
// ─────────────────────────────────────────────────────────────────────────────

// ── Inline Variant Manager (staged — works before product is saved) ───────────
const DESIGN_OPTIONS = ['Design A', 'Design B', 'Design C', 'Design D', 'Design E'];
const PRESET_COLORS = [
  { name: 'Black', hex: '#000000' }, { name: 'White', hex: '#FFFFFF' },
  { name: 'Navy Blue', hex: '#1E3A8A' }, { name: 'Royal Blue', hex: '#2563EB' },
  { name: 'Brown', hex: '#6B4226' }, { name: 'Burgundy', hex: '#800020' },
  { name: 'Dark Green', hex: '#166534' }, { name: 'Gray', hex: '#6B7280' },
  { name: 'Gold', hex: '#D97706' }, { name: 'Red', hex: '#DC2626' },
];

interface StagedVariant {
  id: string; // local temp id
  design_type: string;
  color_name: string;
  color_hex: string;
  stock: number;
  unit_price: number;
  is_active: boolean;
  imageFile?: File;
  imageUrl?: string;
  imageUploading?: boolean;
  sku_preview: string;
}

const generateSku = (productCode: string, design: string, colorHex: string) => {
  const d = design.replace(/\s+/g, '').toUpperCase().slice(0, 7);
  const c = colorHex.replace('#', '').toUpperCase().slice(0, 6);
  return `SMTI-${(productCode || 'PROD').toUpperCase()}-${d}-${c}`;
};

interface InlineVariantManagerProps {
  staged: StagedVariant[];
  onStaged: (v: StagedVariant[]) => void;
  productCode: string;
  /** If set, variants are saved directly to DB */
  productId?: string | null;
}

const InlineVariantManager = ({ staged, onStaged, productCode, productId }: InlineVariantManagerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Live variants from DB (edit mode)
  const { data: liveVariants = [], refetch: refetchLive } = useQuery({
    queryKey: ['admin-variants', productId],
    queryFn: async () => {
      const { data, error } = await supabase.from('product_variants').select('*').eq('product_id', productId!).order('sort_order');
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  const deleteLiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('product_variants').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-variants', productId] }); toast({ title: 'Variant deleted' }); },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const addCard = () => {
    const newV: StagedVariant = {
      id: crypto.randomUUID(),
      design_type: 'Design A',
      color_name: '',
      color_hex: '#000000',
      stock: 999,
      unit_price: 0,
      is_active: true,
      sku_preview: generateSku(productCode, 'Design A', '#000000'),
    };
    onStaged([...staged, newV]);
  };

  const updateCard = (id: string, patch: Partial<StagedVariant>) => {
    onStaged(staged.map(v => {
      if (v.id !== id) return v;
      const updated = { ...v, ...patch };
      updated.sku_preview = generateSku(productCode, updated.design_type, updated.color_hex);
      return updated;
    }));
  };

  const removeCard = (id: string) => onStaged(staged.filter(v => v.id !== id));

  const handleVariantImage = async (id: string, file: File) => {
    if (file.size > 2 * 1024 * 1024) { toast({ title: 'Max 2MB', variant: 'destructive' }); return; }
    updateCard(id, { imageUploading: true, imageFile: file });
    const ext = file.name.split('.').pop();
    const path = `variants/staged-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('products').upload(path, file);
    if (error) { toast({ title: 'Upload failed', description: error.message, variant: 'destructive' }); updateCard(id, { imageUploading: false }); return; }
    const { data: urlData } = supabase.storage.from('products').getPublicUrl(path);
    updateCard(id, { imageUrl: urlData.publicUrl, imageUploading: false });
  };

  // Save a staged variant directly to DB (only when productId exists)
  const saveLive = async (v: StagedVariant) => {
    if (!productId) return;
    const sku = generateSku(productCode, v.design_type, v.color_hex);
    const payload = {
      product_id: productId,
      variant_label_en: `${v.design_type} – ${v.color_name || v.color_hex}`,
      variant_label_bn: '',
      design_type: v.design_type,
      color_name: v.color_name,
      color_hex: v.color_hex,
      sku,
      stock: v.stock,
      is_active: v.is_active,
      image_url: v.imageUrl || null,
      min_quantity: 1,
      unit_price: v.unit_price || 0,
      sort_order: liveVariants.length + 1,
    };
    const { error } = await supabase.from('product_variants').insert(payload as any);
    if (error) { toast({ title: 'Save failed', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Variant saved' });
    queryClient.invalidateQueries({ queryKey: ['admin-variants', productId] });
    removeCard(v.id);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Variants</p>
          {(staged.length > 0 || liveVariants.length > 0) && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {liveVariants.length + staged.length}
            </Badge>
          )}
        </div>
        <Button type="button" size="sm" variant="outline" onClick={addCard} className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" /> Add Variant
        </Button>
      </div>

      {/* Live variants (edit mode) — with inline price editing */}
      {liveVariants.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Saved Variants</p>
          {liveVariants.map((lv: any) => (
            <div key={lv.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-border/40 bg-muted/10 group">
              {lv.image_url && <img src={lv.image_url} alt="" className="w-8 h-8 rounded object-contain border border-border/30 shrink-0" />}
              {!lv.image_url && (
                <div className="w-8 h-8 rounded border border-dashed border-border/40 flex items-center justify-center shrink-0">
                  <ImageIcon className="h-3 w-3 text-muted-foreground/40" />
                </div>
              )}
              {lv.color_hex && (
                <span className="w-4 h-4 rounded-full border border-border/50 shrink-0" style={{ backgroundColor: lv.color_hex }} />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{lv.variant_label_en}</p>
                {lv.sku && <p className="text-[10px] font-mono text-muted-foreground/60 truncate">{lv.sku}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] text-muted-foreground">৳</span>
                <input
                  type="number"
                  min={0}
                  defaultValue={Number(lv.unit_price) || 0}
                  className="w-16 h-6 text-xs text-center border border-border/40 rounded bg-background px-1"
                  onBlur={async (e) => {
                    const newPrice = Math.max(0, Number(e.target.value));
                    if (newPrice === Number(lv.unit_price)) return;
                    const { error } = await supabase.from('product_variants').update({ unit_price: newPrice } as any).eq('id', lv.id);
                    if (error) { toast({ title: 'Price update failed', description: error.message, variant: 'destructive' }); return; }
                    toast({ title: 'Price updated' });
                    queryClient.invalidateQueries({ queryKey: ['admin-variants', productId] });
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                />
              </div>
              <span className={cn('text-[10px] font-semibold shrink-0', lv.is_active ? 'text-green-600' : 'text-muted-foreground')}>
                {lv.is_active ? 'Active' : 'Off'}
              </span>
              <button
                type="button"
                onClick={() => { if (confirm('Delete this variant?')) deleteLiveMutation.mutate(lv.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 transition-all"
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Staged (new) variant cards */}
      {staged.length > 0 && (
        <div className="space-y-3">
          {staged.length > 0 && liveVariants.length > 0 && (
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">New Variants (unsaved)</p>
          )}
          {staged.map(v => (
            <div key={v.id} className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
              {/* Card header */}
              <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border/40">
                <p className="text-xs font-semibold text-foreground">
                  {v.design_type} {v.color_name ? `— ${v.color_name}` : ''}
                </p>
                <div className="flex items-center gap-1">
                  {productId && (
                    <Button type="button" size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-primary hover:text-primary"
                      onClick={() => saveLive(v)}>
                      Save
                    </Button>
                  )}
                  <button type="button" onClick={() => removeCard(v.id)} className="p-1 rounded hover:bg-destructive/10 transition-colors">
                    <X className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>
              </div>

              <div className="p-3 grid grid-cols-2 gap-3">
                {/* Design */}
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Design</label>
                  <Select value={v.design_type} onValueChange={val => updateCard(v.id, { design_type: val })}>
                    <SelectTrigger className="h-8 text-xs mt-0.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DESIGN_OPTIONS.map(d => <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Color name */}
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Color Name</label>
                  <Input
                    value={v.color_name}
                    onChange={e => updateCard(v.id, { color_name: e.target.value })}
                    placeholder="e.g. Navy Blue"
                    className="h-8 text-xs mt-0.5"
                  />
                </div>

                {/* Color picker */}
                <div className="col-span-2">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Color</label>
                  <div className="flex flex-wrap gap-1.5 mt-1.5 mb-1.5">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c.hex}
                        type="button"
                        title={c.name}
                        onClick={() => updateCard(v.id, { color_hex: c.hex, color_name: v.color_name || c.name })}
                        className={cn(
                          'w-5 h-5 rounded-full border-2 transition-all hover:scale-110',
                          v.color_hex === c.hex ? 'border-foreground ring-1 ring-foreground scale-110' : 'border-border/50',
                        )}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={v.color_hex}
                      onChange={e => updateCard(v.id, { color_hex: e.target.value })}
                      placeholder="#000000"
                      className="h-7 text-xs font-mono flex-1"
                    />
                    {v.color_hex && (
                      <span className="w-7 h-7 rounded-md border shrink-0" style={{ backgroundColor: v.color_hex }} />
                    )}
                  </div>
                </div>

                {/* Price */}
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Price (৳)</label>
                  <Input
                    type="number"
                    min={0}
                    value={v.unit_price}
                    onChange={e => updateCard(v.id, { unit_price: Math.max(0, Number(e.target.value)) })}
                    placeholder="0"
                    className="h-8 text-xs mt-0.5"
                  />
                </div>

                {/* Stock */}
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Stock</label>
                  <Input
                    type="number"
                    min={0}
                    value={v.stock}
                    onChange={e => updateCard(v.id, { stock: Math.max(0, Number(e.target.value)) })}
                    className="h-8 text-xs mt-0.5"
                  />
                </div>

                {/* Status + image */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Status</label>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Switch
                      checked={v.is_active}
                      onCheckedChange={val => updateCard(v.id, { is_active: val })}
                      className="scale-75 origin-left"
                    />
                    <span className={cn('text-xs font-medium', v.is_active ? 'text-green-600' : 'text-muted-foreground')}>
                      {v.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* SKU preview */}
                <div className="col-span-2">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">SKU (auto-generated)</label>
                  <div className="flex items-center gap-1.5 mt-0.5 p-2 bg-muted/40 rounded-md border border-border/30">
                    <code className="text-[10px] font-mono text-foreground/80 flex-1 break-all">{v.sku_preview}</code>
                    <RefreshCw className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                  </div>
                </div>

                {/* Variant image */}
                <div className="col-span-2">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Variant Image (optional)</label>
                  {v.imageUploading ? (
                    <div className="mt-1 h-20 flex items-center justify-center border border-dashed border-border/40 rounded-lg">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : v.imageUrl ? (
                    <div className="relative mt-1">
                      <img src={v.imageUrl} alt="variant" className="w-full h-20 object-contain rounded-lg border bg-muted/20" />
                      <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity bg-black/40 rounded-lg">
                        <label className="cursor-pointer p-1.5 bg-white/90 rounded-full">
                          <Upload className="h-3 w-3 text-foreground" />
                          <input type="file" accept="image/*" className="hidden"
                            onChange={e => { if (e.target.files?.[0]) handleVariantImage(v.id, e.target.files[0]); }} />
                        </label>
                        <button type="button" onClick={() => updateCard(v.id, { imageUrl: undefined, imageFile: undefined })}
                          className="p-1.5 bg-destructive/90 rounded-full">
                          <X className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex items-center justify-center gap-2 mt-1 h-16 border border-dashed border-border/40 rounded-lg hover:border-border hover:bg-muted/20 transition-all">
                      <Upload className="h-3.5 w-3.5 text-muted-foreground/50" />
                      <span className="text-[10px] text-muted-foreground">Upload image</span>
                      <input type="file" accept="image/*" className="hidden"
                        onChange={e => { if (e.target.files?.[0]) handleVariantImage(v.id, e.target.files[0]); }} />
                    </label>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {staged.length === 0 && liveVariants.length === 0 && (
        <div className="flex flex-col items-center justify-center py-6 border border-dashed border-border/30 rounded-xl text-center">
          <Palette className="h-6 w-6 text-muted-foreground/30 mb-1.5" />
          <p className="text-xs text-muted-foreground">No variants yet. Click "+ Add Variant" to begin.</p>
        </div>
      )}
    </div>
  );
};
// ─────────────────────────────────────────────────────────────────────────────

interface ProductForm {
  name_en: string;
  name_bn: string;
  description_en: string;
  description_bn: string;
  category_id: string;
  image_url: string;
  is_active: boolean;
  product_code: string;
}

const emptyForm: ProductForm = {
  name_en: '', name_bn: '', description_en: '', description_bn: '',
  category_id: '', image_url: '', is_active: true, product_code: '',
};

const slugify = (str: string) =>
  str.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();

const AdminProducts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [savedProductId, setSavedProductId] = useState<string | null>(null); // ID after first save (add mode)
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [stagedViews, setStagedViews] = useState<StagedViews>({}); // inline 5-view images before product save
  const [stagedVariants, setStagedVariants] = useState<StagedVariant[]>([]); // inline variants before product save
  const fileRef = useRef<HTMLInputElement>(null);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState('');

  // Bulk state
  const [bulkFiles, setBulkFiles] = useState<FileItem[]>([]);
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkImporting, setBulkImporting] = useState(false);

  // Search / filter / pagination
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);

  // Multi-select
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name_en)')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').eq('is_active', true).order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  // Filtered + paginated products
  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch = !search || p.name_en.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCategory === 'all' || p.category_id === filterCategory;
      const matchStatus = filterStatus === 'all' || (filterStatus === 'active' ? p.is_active : !p.is_active);
      return matchSearch && matchCat && matchStatus;
    });
  }, [products, search, filterCategory, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleImageUpload = async (file: File) => {
    // Validate
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 5MB per image.', variant: 'destructive' });
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'Only JPG, PNG, WebP, GIF allowed.', variant: 'destructive' });
      return;
    }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `products/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('cms-images').upload(path, file);
    if (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('cms-images').getPublicUrl(path);
    setForm(f => ({ ...f, image_url: urlData.publicUrl }));
    setUploading(false);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        category_id: form.category_id || null,
        product_code: form.product_code || slugify(form.name_en),
      };
      if (editId) {
        const { error } = await supabase.from('products').update(payload).eq('id', editId);
        if (error) throw error;
        return null;
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert({ ...payload, sort_order: products.length + 1 } as any)
          .select('id')
          .single();
        if (error) throw error;
        const newId = data?.id ?? null;

        if (newId) {
          // Persist staged view images to product_images table
          const entries = VIEW_SLOTS
            .map((slot, idx) => ({ slot, idx }))
            .filter(({ slot }) => stagedViews[slot.type]?.url);
          if (entries.length > 0) {
            const rows = entries.map(({ slot, idx }) => ({
              product_id: newId,
              variant_id: null,
              image_url: stagedViews[slot.type]!.url,
              image_type: slot.type,
              sort_order: idx,
            }));
            await supabase.from('product_images').insert(rows as any);
          }

          // Persist staged variants to product_variants table
          if (stagedVariants.length > 0) {
            const variantRows = stagedVariants.map((v, idx) => ({
              product_id: newId,
              variant_label_en: `${v.design_type} – ${v.color_name || v.color_hex}`,
              variant_label_bn: '',
              design_type: v.design_type,
              color_name: v.color_name,
              color_hex: v.color_hex,
              sku: generateSku(form.product_code || slugify(form.name_en), v.design_type, v.color_hex),
              stock: v.stock,
              is_active: v.is_active,
              image_url: v.imageUrl || null,
              min_quantity: 1,
              unit_price: 0,
              sort_order: idx + 1,
            }));
            await supabase.from('product_variants').insert(variantRows as any);
          }
        }

        return newId;
      }
    },
    onSuccess: (newId) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      if (newId) {
        setEditId(newId);
        setSavedProductId(newId);
        setStagedViews({});
        setStagedVariants([]);
        toast({ title: 'Product created successfully!' });
      } else {
        toast({ title: 'Product updated' });
        closeDialog();
      }
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('product_variants').delete().eq('product_id', id);
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast({ title: 'Product deleted' });
      setDeleteId(null);
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await supabase.from('product_variants').delete().in('product_id', ids);
      const { error } = await supabase.from('products').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast({ title: `${selected.size} products deleted` });
      setSelected(new Set());
      setBulkDeleteOpen(false);
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('products').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const openEdit = (prod: typeof products[0]) => {
    setEditId(prod.id);
    setForm({
      name_en: prod.name_en,
      name_bn: prod.name_bn,
      description_en: prod.description_en ?? '',
      description_bn: prod.description_bn ?? '',
      category_id: prod.category_id ?? '',
      image_url: prod.image_url ?? '',
      is_active: prod.is_active,
      product_code: (prod as any).product_code ?? '',
    });
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditId(null); setSavedProductId(null); setForm(emptyForm); setStagedViews({}); setStagedVariants([]); };

  const handleBulkImport = useCallback(async () => {
    const pending = bulkFiles.filter(f => f.status === 'pending');
    if (pending.length === 0) return;
    setBulkImporting(true);

    const updated = [...bulkFiles];
    let successCount = 0;
    const baseOrder = products.length + 1;

    for (let i = 0; i < updated.length; i++) {
      if (updated[i].status !== 'pending') continue;

      // Validate
      if (updated[i].file.size > 5 * 1024 * 1024) {
        updated[i] = { ...updated[i], status: 'error', error: 'File too large (max 5MB)' };
        setBulkFiles([...updated]);
        continue;
      }

      updated[i] = { ...updated[i], status: 'uploading' };
      setBulkFiles([...updated]);

      try {
        const ext = updated[i].file.name.split('.').pop();
        const path = `products/${Date.now()}-${i}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('cms-images').upload(path, updated[i].file);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from('cms-images').getPublicUrl(path);

        const name = updated[i].file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const code = slugify(name);

        const { error: insertErr } = await supabase.from('products').insert({
          name_en: name,
          name_bn: '',
          image_url: urlData.publicUrl,
          category_id: bulkCategory || null,
          is_active: true,
          sort_order: baseOrder + successCount,
          product_code: code,
        } as any);
        if (insertErr) throw insertErr;

        updated[i] = { ...updated[i], status: 'done', url: urlData.publicUrl };
        successCount++;
      } catch (err: any) {
        updated[i] = { ...updated[i], status: 'error', error: err.message };
      }
      setBulkFiles([...updated]);
    }

    setBulkImporting(false);
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    toast({ title: `${successCount} products added`, description: `From ${pending.length} images.` });
  }, [bulkFiles, bulkCategory, products.length, queryClient, toast]);

  const closeBulk = () => { setBulkOpen(false); setBulkFiles([]); setBulkCategory(''); };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === paginated.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginated.map(p => p.id)));
    }
  };

  const resetFilters = () => { setSearch(''); setFilterCategory('all'); setFilterStatus('all'); setPage(1); };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-muted-foreground text-sm">
          {filtered.length} product{filtered.length !== 1 ? 's' : ''}
          {filtered.length !== products.length && ` (filtered from ${products.length})`}
        </p>
        <div className="flex gap-2 flex-wrap">
          {/* Bulk Delete */}
          {selected.size > 0 && (
            <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
              <Trash2 className="h-4 w-4 mr-1" /> Delete {selected.size}
            </Button>
          )}

          {/* Bulk Add */}
          <Dialog open={bulkOpen} onOpenChange={v => { if (!v) closeBulk(); else setBulkOpen(true); }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <PackagePlus className="h-4 w-4 mr-2" /> Bulk Add
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Bulk Add Products</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Drop multiple images (max 5MB each, JPG/PNG/WebP). Product names derived from filenames.
                </p>
                <div>
                  <label className="text-sm font-medium">Category (optional)</label>
                  <Select value={bulkCategory} onValueChange={setBulkCategory}>
                    <SelectTrigger><SelectValue placeholder="No category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name_en}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <BulkUploadZone files={bulkFiles} onFilesChange={setBulkFiles} disabled={bulkImporting} />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={closeBulk} disabled={bulkImporting}>Cancel</Button>
                  <Button
                    onClick={handleBulkImport}
                    disabled={bulkImporting || bulkFiles.filter(f => f.status === 'pending').length === 0}
                    className="bg-sm-red hover:bg-[hsl(var(--sm-red-dark))] text-white"
                  >
                    {bulkImporting ? 'Importing...' : `Add ${bulkFiles.filter(f => f.status === 'pending').length} Products`}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Single Add */}
          <Dialog open={dialogOpen} onOpenChange={v => { if (!v) closeDialog(); else setDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button className="bg-sm-red hover:bg-[hsl(var(--sm-red-dark))] text-white">
                <Plus className="h-4 w-4 mr-2" /> Add Product
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editId ? 'Edit Product' : 'Add Product'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Name (English) *</label>
                    <Input
                      value={form.name_en}
                      onChange={e => setForm(f => ({
                        ...f,
                        name_en: e.target.value,
                        product_code: f.product_code || slugify(e.target.value),
                      }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Name (বাংলা)</label>
                    <Input value={form.name_bn} onChange={e => setForm(f => ({ ...f, name_bn: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Product Code / Slug</label>
                  <Input
                    value={form.product_code}
                    onChange={e => setForm(f => ({ ...f, product_code: e.target.value }))}
                    placeholder="auto-generated from name"
                    className="font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name_en}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Description (English)</label>
                    <Textarea value={form.description_en} onChange={e => setForm(f => ({ ...f, description_en: e.target.value }))} rows={3} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description (বাংলা)</label>
                    <Textarea value={form.description_bn} onChange={e => setForm(f => ({ ...f, description_bn: e.target.value }))} rows={3} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Product Image</label>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]); }} />
                  {form.image_url ? (
                    <div className="relative mt-2">
                      <img src={form.image_url} alt="Preview" className="w-full h-40 object-contain rounded-lg border bg-white p-2" />
                      <div className="absolute bottom-2 right-2 flex gap-1.5">
                        <Button type="button" size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>Change</Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => setForm(f => ({ ...f, image_url: '' }))}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button type="button" variant="outline" className="w-full mt-2 h-32 flex-col gap-2"
                      onClick={() => fileRef.current?.click()} disabled={uploading}>
                      {uploading ? <span className="text-sm">Uploading...</span> : (
                        <><Upload className="h-6 w-6 text-muted-foreground" /><span className="text-sm text-muted-foreground">Click to upload (max 5MB)</span></>
                      )}
                    </Button>
                  )}
                </div>
                {/* 5-view image uploader — always visible in add mode */}
                {!editId && (
                  <div className="border border-border/50 rounded-xl p-3 bg-muted/20">
                    <InlineViewUploader staged={stagedViews} onStaged={setStagedViews} />
                  </div>
                )}

                {/* Edit mode: ProductImageManager for multi-view uploads */}
                {editId && (
                  <div className="border border-border/50 rounded-xl p-3 bg-muted/20">
                    <ProductImageManager productId={editId} />
                  </div>
                )}

                {/* Inline Variant Manager — visible in both add and edit modes */}
                <div className="border border-border/50 rounded-xl p-3 bg-muted/20">
                  <InlineVariantManager
                    staged={stagedVariants}
                    onStaged={setStagedVariants}
                    productCode={form.product_code}
                    productId={editId}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                  <label className="text-sm">Active (visible on site)</label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                  {savedProductId ? (
                    <Button type="button" className="bg-sm-red hover:bg-[hsl(var(--sm-red-dark))] text-white" onClick={closeDialog}>
                      Done
                    </Button>
                  ) : (
                    <Button type="submit" className="bg-sm-red hover:bg-[hsl(var(--sm-red-dark))] text-white" disabled={saveMutation.isPending}>
                      {saveMutation.isPending ? 'Saving...' : editId ? 'Update Product' : 'Save Product'}
                    </Button>
                  )}
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={filterCategory} onValueChange={v => { setFilterCategory(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name_en}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={v => { setFilterStatus(v as any); setPage(1); }}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        {(search || filterCategory !== 'all' || filterStatus !== 'all') && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <X className="h-4 w-4 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Select all bar */}
      {paginated.length > 0 && (
        <div className="flex items-center gap-3 text-sm">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            {selected.size === paginated.length && paginated.length > 0
              ? <CheckSquare className="h-4 w-4" />
              : <Square className="h-4 w-4" />}
            {selected.size === paginated.length && paginated.length > 0 ? 'Deselect all' : 'Select all on page'}
          </button>
          {selected.size > 0 && (
            <span className="text-muted-foreground">· {selected.size} selected</span>
          )}
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Card key={i} className="animate-pulse"><CardContent className="h-48" /></Card>)}
        </div>
      ) : paginated.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {products.length === 0 ? 'No products yet. Add your first product.' : 'No products match your filters.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map(prod => {
            const isSelected = selected.has(prod.id);
            return (
              <Card
                key={prod.id}
                className={`overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${isSelected ? 'ring-2 ring-primary' : ''}`}
                onClick={() => toggleSelect(prod.id)}
              >
                <div className="aspect-video bg-muted relative">
                  {prod.image_url ? (
                    <img src={prod.image_url} alt={prod.name_en} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}
                  {/* Status badge + toggle */}
                  <div className="absolute top-2 right-2 flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                    <Switch
                      checked={prod.is_active}
                      onCheckedChange={v => toggleStatusMutation.mutate({ id: prod.id, is_active: v })}
                      className="scale-75"
                    />
                    <Badge variant={prod.is_active ? 'default' : 'secondary'} className="text-xs py-0">
                      {prod.is_active ? 'Active' : 'Off'}
                    </Badge>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 left-2">
                      <CheckSquare className="h-5 w-5 text-primary bg-background rounded" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <p className="font-medium text-sm mb-0.5 truncate">{prod.name_en}</p>
                  <p className="text-xs text-muted-foreground mb-1 truncate">
                    {(prod as any).categories?.name_en ?? 'Uncategorized'}
                  </p>
                  {(prod as any).product_code && (
                    <p className="text-[10px] font-mono text-muted-foreground/60 mb-3 truncate">{(prod as any).product_code}</p>
                  )}
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(prod)}>
                      <Pencil className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setDeleteId(prod.id); setDeleteName(prod.name_en); }}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Delete confirmation modal */}
      <AlertDialog open={!!deleteId} onOpenChange={open => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteName}</strong> and all its variants. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirmation */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} Products?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selected.size} products and all their variants. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => bulkDeleteMutation.mutate(Array.from(selected))}
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminProducts;

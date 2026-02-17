import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ImageIcon, GripVertical, Expand } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import BulkUploadZone, { type FileItem } from '@/components/admin/BulkUploadZone';
import GalleryLightbox from '@/components/gallery/GalleryLightbox';
import { cn } from '@/lib/utils';

interface VariantForm {
  variant_label_en: string;
  variant_label_bn: string;
  color_hex: string;
  design_type: string;
  unit_price: number;
  min_quantity: number;
  image_url: string;
  is_active: boolean;
}

const emptyVariantForm: VariantForm = {
  variant_label_en: '', variant_label_bn: '', color_hex: '',
  design_type: '', unit_price: 0, min_quantity: 1, image_url: '', is_active: true,
};

interface VariantManagerProps {
  productId: string;
}

const VariantManager = ({ productId }: VariantManagerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<VariantForm>(emptyVariantForm);
  const [galleryVariantId, setGalleryVariantId] = useState<string | null>(null);
  const [bulkFiles, setBulkFiles] = useState<FileItem[]>([]);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data: variants = [], isLoading } = useQuery({
    queryKey: ['admin-variants', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  const { data: galleryImages = [] } = useQuery({
    queryKey: ['admin-variant-images', galleryVariantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variant_images')
        .select('*')
        .eq('variant_id', galleryVariantId!)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    enabled: !!galleryVariantId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        product_id: productId,
        unit_price: Number(form.unit_price) || 0,
        min_quantity: Number(form.min_quantity) || 1,
        color_hex: form.color_hex || null,
        design_type: form.design_type || null,
        image_url: form.image_url || null,
      };
      if (editId) {
        const { error } = await supabase.from('product_variants').update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('product_variants').insert({
          ...payload,
          sort_order: variants.length + 1,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-variants', productId] });
      toast({ title: editId ? 'Variant updated' : 'Variant created' });
      closeEdit();
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('product_variants').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-variants', productId] });
      toast({ title: 'Variant deleted' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('product_variant_images').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-variant-images', galleryVariantId] });
      toast({ title: 'Image removed' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const openEdit = (v?: typeof variants[0]) => {
    if (v) {
      setEditId(v.id);
      setForm({
        variant_label_en: v.variant_label_en,
        variant_label_bn: v.variant_label_bn,
        color_hex: v.color_hex || '',
        design_type: v.design_type || '',
        unit_price: v.unit_price,
        min_quantity: v.min_quantity,
        image_url: v.image_url || '',
        is_active: v.is_active,
      });
    } else {
      setEditId(null);
      setForm(emptyVariantForm);
    }
    setEditOpen(true);
  };

  const closeEdit = () => { setEditOpen(false); setEditId(null); setForm(emptyVariantForm); };

  const openGallery = (variantId: string) => {
    setGalleryVariantId(variantId);
    setBulkFiles([]);
    setGalleryOpen(true);
  };

  const closeGallery = () => {
    setGalleryOpen(false);
    setGalleryVariantId(null);
    setBulkFiles([]);
  };

  const handleBulkUpload = useCallback(async () => {
    if (!galleryVariantId) return;
    const pending = bulkFiles.filter(f => f.status === 'pending');
    if (pending.length === 0) return;
    setBulkImporting(true);

    const updated = [...bulkFiles];
    let successCount = 0;
    const baseOrder = galleryImages.length + 1;

    for (let i = 0; i < updated.length; i++) {
      if (updated[i].status !== 'pending') continue;
      updated[i] = { ...updated[i], status: 'uploading' };
      setBulkFiles([...updated]);

      try {
        const ext = updated[i].file.name.split('.').pop();
        const path = `variant-images/${galleryVariantId}/${Date.now()}-${i}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('cms-images').upload(path, updated[i].file);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from('cms-images').getPublicUrl(path);

        const { error: insertErr } = await supabase.from('product_variant_images').insert({
          variant_id: galleryVariantId,
          image_url: urlData.publicUrl,
          sort_order: baseOrder + successCount,
        });
        if (insertErr) throw insertErr;

        updated[i] = { ...updated[i], status: 'done', url: urlData.publicUrl };
        successCount++;
      } catch (err: any) {
        updated[i] = { ...updated[i], status: 'error', error: err.message };
      }
      setBulkFiles([...updated]);
    }

    setBulkImporting(false);
    queryClient.invalidateQueries({ queryKey: ['admin-variant-images', galleryVariantId] });
    toast({ title: `${successCount} images uploaded` });
  }, [bulkFiles, galleryVariantId, galleryImages.length, queryClient, toast]);

  const handleMainImageUpload = async (file: File) => {
    const ext = file.name.split('.').pop();
    const path = `variants/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('cms-images').upload(path, file);
    if (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      return;
    }
    const { data: urlData } = supabase.storage.from('cms-images').getPublicUrl(path);
    setForm(f => ({ ...f, image_url: urlData.publicUrl }));
  };

  const galleryVariant = variants.find(v => v.id === galleryVariantId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Variants</h3>
        <Button size="sm" variant="outline" onClick={() => openEdit()}>
          <Plus className="h-3 w-3 mr-1" /> Add Variant
        </Button>
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading...</p>
      ) : variants.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">No variants yet.</p>
      ) : (
        <div className="space-y-2">
          {variants.map(v => (
            <div
              key={v.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card hover:bg-accent/30 transition-colors"
            >
              <div className="shrink-0 w-10 h-10 rounded-md overflow-hidden bg-muted border border-border/30">
                {v.image_url ? (
                  <img src={v.image_url} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{v.variant_label_en}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {v.color_hex && (
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: v.color_hex }} />
                      {v.color_hex}
                    </span>
                  )}
                  {v.unit_price > 0 && <span>৳{v.unit_price}</span>}
                  <span className={v.is_active ? 'text-green-600' : 'text-red-500'}>
                    {v.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openGallery(v.id)} title="Manage gallery">
                  <ImageIcon className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(v)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { if (confirm('Delete this variant?')) deleteMutation.mutate(v.id); }}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Add Variant Dialog */}
      <Dialog open={editOpen} onOpenChange={v => { if (!v) closeEdit(); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Variant' : 'Add Variant'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Label (English)</label>
                <Input value={form.variant_label_en} onChange={e => setForm(f => ({ ...f, variant_label_en: e.target.value }))} required />
              </div>
              <div>
                <label className="text-xs font-medium">Label (বাংলা)</label>
                <Input value={form.variant_label_bn} onChange={e => setForm(f => ({ ...f, variant_label_bn: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Color Hex</label>
                <div className="flex gap-2">
                  <Input
                    value={form.color_hex}
                    onChange={e => setForm(f => ({ ...f, color_hex: e.target.value }))}
                    placeholder="#000000"
                    className="flex-1"
                  />
                  {form.color_hex && (
                    <span className="w-9 h-9 rounded-md border shrink-0" style={{ backgroundColor: form.color_hex }} />
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium">Design Type</label>
                <Input value={form.design_type} onChange={e => setForm(f => ({ ...f, design_type: e.target.value }))} placeholder="e.g. Dotted" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Unit Price (৳)</label>
                <Input type="number" min={0} step={0.01} value={form.unit_price} onChange={e => setForm(f => ({ ...f, unit_price: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-xs font-medium">Min Quantity</label>
                <Input type="number" min={1} value={form.min_quantity} onChange={e => setForm(f => ({ ...f, min_quantity: Number(e.target.value) }))} />
              </div>
            </div>
            {/* Main variant image */}
            <div>
              <label className="text-xs font-medium">Variant Image</label>
              {form.image_url ? (
                <div className="relative mt-1">
                  <img src={form.image_url} alt="Variant" className="w-full h-32 object-contain rounded-lg border bg-muted" />
                  <input type="file" accept="image/*" className="hidden" id="variant-img-input"
                    onChange={e => { if (e.target.files?.[0]) handleMainImageUpload(e.target.files[0]); }} />
                  <Button type="button" size="sm" variant="secondary" className="absolute bottom-1 right-1"
                    onClick={() => document.getElementById('variant-img-input')?.click()}>Change</Button>
                </div>
              ) : (
                <>
                  <input type="file" accept="image/*" className="hidden" id="variant-img-input"
                    onChange={e => { if (e.target.files?.[0]) handleMainImageUpload(e.target.files[0]); }} />
                  <Button type="button" variant="outline" className="w-full mt-1 h-20 flex-col gap-1 text-xs"
                    onClick={() => document.getElementById('variant-img-input')?.click()}>
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    Upload image
                  </Button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              <label className="text-xs">Active</label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={closeEdit}>Cancel</Button>
              <Button type="submit" size="sm" className="bg-sm-red hover:bg-[hsl(var(--sm-red-dark))] text-white" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Variant Gallery Dialog with Bulk Upload */}
      <Dialog open={galleryOpen} onOpenChange={v => { if (!v) closeGallery(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Gallery — {galleryVariant?.variant_label_en || 'Variant'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Existing images */}
            {galleryImages.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {galleryImages.map((img, idx) => (
                  <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                    <img
                      src={img.image_url}
                      alt=""
                      className="w-full h-full object-cover cursor-pointer"
                      loading="lazy"
                      decoding="async"
                      onClick={() => setLightboxIndex(idx)}
                    />
                    <button
                      onClick={() => setLightboxIndex(idx)}
                      className="absolute bottom-1 left-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="View full screen"
                    >
                      <Expand className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); if (confirm('Remove?')) deleteImageMutation.mutate(img.id); }}
                      className="absolute top-1 right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Bulk drop zone */}
            <BulkUploadZone files={bulkFiles} onFilesChange={setBulkFiles} disabled={bulkImporting} />

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={closeGallery} disabled={bulkImporting}>Close</Button>
              <Button
                size="sm"
                onClick={handleBulkUpload}
                disabled={bulkImporting || bulkFiles.filter(f => f.status === 'pending').length === 0}
                className="bg-sm-red hover:bg-[hsl(var(--sm-red-dark))] text-white"
              >
                {bulkImporting ? 'Uploading...' : `Upload ${bulkFiles.filter(f => f.status === 'pending').length} Images`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      {lightboxIndex !== null && galleryImages.length > 0 && (
        <GalleryLightbox
          items={galleryImages.map(img => ({ src: img.image_url, title: galleryVariant?.variant_label_en || 'Variant' }))}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
};

export default VariantManager;

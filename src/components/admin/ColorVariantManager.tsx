import { useState, useRef } from 'react';
import { supabase } from '@/lib/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Upload, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Variant {
  id: string;
  product_id: string;
  variant_label_en: string;
  variant_label_bn: string;
  color_name: string | null;
  color_hex: string | null;
  image_url: string | null;
  unit_price: number;
  sort_order: number;
  is_active: boolean;
}

interface Props {
  productId: string;
  basePrice: number;
}

const ColorVariantManager = ({ productId, basePrice }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [activeVariantIdx, setActiveVariantIdx] = useState<number | null>(null);

  const { data: variants = [], isLoading } = useQuery({
    queryKey: ['product-variants', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('sort_order');
      if (error) throw error;
      return data as Variant[];
    },
    enabled: !!productId,
  });

  const saveMutation = useMutation({
    mutationFn: async (v: Partial<Variant> & { id?: string }) => {
      if (v.id) {
        const { id, ...payload } = v;
        const { error } = await supabase.from('product_variants').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('product_variants').insert({
          product_id: productId,
          variant_label_en: v.variant_label_en || 'New Color',
          variant_label_bn: v.variant_label_bn || '',
          color_name: v.color_name || null,
          color_hex: v.color_hex || null,
          image_url: v.image_url || null,
          unit_price: v.unit_price ?? basePrice,
          sort_order: variants.length,
          is_active: true,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('product_variants').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
      toast({ title: 'Variant deleted' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const handleImageUpload = async (file: File, variantId: string, idx: number) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', variant: 'destructive' });
      return;
    }
    setUploadingIdx(idx);
    const ext = file.name.split('.').pop();
    const path = `products/variant-${Date.now()}.${ext}`;
    const { data: uploadData, error } = await supabase.storage.from('cms-images').upload(path, file);
    if (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      setUploadingIdx(null);
      return;
    }
    // Use the publicUrl returned by the upload endpoint (multer generates a random filename)
    const publicUrl = uploadData?.publicUrl || supabase.storage.from('cms-images').getPublicUrl(path).data.publicUrl;
    await saveMutation.mutateAsync({ id: variantId, image_url: publicUrl });
    setUploadingIdx(null);
  };

  const addVariant = () => {
    saveMutation.mutate({
      variant_label_en: 'New Color',
      variant_label_bn: '',
      color_name: '',
      color_hex: '#000000',
      unit_price: basePrice,
    });
  };

  if (isLoading) return <div className="text-sm text-muted-foreground py-2">Loading variants...</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Color Variants</label>
        <Button type="button" variant="outline" size="sm" onClick={addVariant} disabled={saveMutation.isPending}>
          <Plus className="h-3 w-3 mr-1" /> Add Color
        </Button>
      </div>

      {variants.length === 0 && (
        <p className="text-xs text-muted-foreground py-2">No color variants yet. Add one to show color options on the product page.</p>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => {
          if (e.target.files?.[0] && activeVariantIdx !== null) {
            const v = variants[activeVariantIdx];
            if (v) handleImageUpload(e.target.files[0], v.id, activeVariantIdx);
          }
        }} />

      <div className="space-y-2">
        {variants.map((v, idx) => (
          <div key={v.id} className="flex items-start gap-2 p-2 rounded-lg border border-border/50 bg-muted/30">
            {/* Image thumbnail */}
            <button
              type="button"
              className="shrink-0 w-14 h-14 rounded border border-border/50 overflow-hidden bg-white flex items-center justify-center hover:ring-2 hover:ring-primary/50 transition-all"
              onClick={() => { setActiveVariantIdx(idx); fileRef.current?.click(); }}
            >
              {uploadingIdx === idx ? (
                <span className="text-[10px] text-muted-foreground">...</span>
              ) : v.image_url ? (
                <img src={v.image_url} alt={v.color_name || ''} className="w-full h-full object-cover" />
              ) : (
                <Upload className="h-4 w-4 text-muted-foreground/40" />
              )}
            </button>

            <div className="flex-1 space-y-1.5 min-w-0">
              <div className="flex gap-2">
                <Input
                  value={v.variant_label_en}
                  onChange={e => saveMutation.mutate({ id: v.id, variant_label_en: e.target.value })}
                  placeholder="Color name (EN)"
                  className="h-7 text-xs"
                />
                <Input
                  value={v.color_name || ''}
                  onChange={e => saveMutation.mutate({ id: v.id, color_name: e.target.value })}
                  placeholder="e.g. Brown"
                  className="h-7 text-xs w-24"
                />
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={v.color_hex || '#000000'}
                  onChange={e => saveMutation.mutate({ id: v.id, color_hex: e.target.value })}
                  className="w-7 h-7 rounded cursor-pointer border-0"
                />
                <Input
                  type="number"
                  value={v.unit_price || ''}
                  onChange={e => saveMutation.mutate({ id: v.id, unit_price: Math.max(0, Number(e.target.value)) })}
                  placeholder="Price"
                  className="h-7 text-xs w-24"
                />
                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive"
                  onClick={() => deleteMutation.mutate(v.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColorVariantManager;

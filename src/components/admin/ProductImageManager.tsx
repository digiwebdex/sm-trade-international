/**
 * ProductImageManager
 * Handles 5-view image uploads (main, front, back, left, right) + gallery images.
 * Features: drag-and-drop, instant local preview, upload progress, multi-image gallery.
 */
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, Loader2, ImageIcon, GripVertical, Plus, Camera, X, CheckCircle2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

export type ImageType = 'main' | 'front' | 'back' | 'left' | 'right' | 'gallery';

const IMAGE_VIEWS: { type: ImageType; label: string }[] = [
  { type: 'main', label: 'Main' },
  { type: 'front', label: 'Front' },
  { type: 'back', label: 'Back' },
  { type: 'left', label: 'Left' },
  { type: 'right', label: 'Right' },
];

interface ProductImageManagerProps {
  productId: string;
  variantId?: string | null;
  featuredImageUrl?: string;
  onSetFeatured?: (imageUrl: string) => void;
}

interface ProductImage {
  id: string;
  product_id: string;
  variant_id: string | null;
  image_url: string;
  image_type: string;
  sort_order: number;
}

// Local preview state for instant feedback
interface UploadingFile {
  id: string;
  localUrl: string;
  progress: number;
  imageType: ImageType;
  done: boolean;
  error?: string;
}

const ProductImageManager = ({ productId, variantId = null, featuredImageUrl, onSetFeatured }: ProductImageManagerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [dragOverSlot, setDragOverSlot] = useState<ImageType | null>(null);
  const [dragOverGallery, setDragOverGallery] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const queryKey = ['product-view-images', productId, variantId];

  const { data: images = [] } = useQuery<ProductImage[]>({
    queryKey,
    queryFn: async () => {
      let q = supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('sort_order');

      if (variantId) {
        q = q.eq('variant_id', variantId);
      } else {
        q = q.is('variant_id', null);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data as ProductImage[]) ?? [];
    },
  });

  const viewImages = images.filter(i => i.image_type !== 'gallery');
  const galleryImages = images.filter(i => i.image_type === 'gallery');

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('product_images').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['product-images', productId] });
      toast({ title: 'Image removed' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const resizeImage = (file: File, maxSize = 1000): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          blob => (blob ? resolve(blob) : reject(new Error('Resize failed'))),
          'image/webp',
          0.85
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const updateUploadingFile = useCallback((id: string, patch: Partial<UploadingFile>) => {
    setUploadingFiles(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));
  }, []);

  const removeUploadingFile = useCallback((id: string) => {
    setUploadingFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.localUrl) URL.revokeObjectURL(file.localUrl);
      return prev.filter(f => f.id !== id);
    });
  }, []);

  const handleUpload = useCallback(async (file: File, imageType: ImageType) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 5MB.', variant: 'destructive' });
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid type', description: 'Images only.', variant: 'destructive' });
      return;
    }

    // Create instant local preview
    const localUrl = URL.createObjectURL(file);
    const uploadId = crypto.randomUUID();
    setUploadingFiles(prev => [...prev, {
      id: uploadId,
      localUrl,
      progress: 10,
      imageType,
      done: false,
    }]);

    try {
      // Resize
      updateUploadingFile(uploadId, { progress: 30 });
      const uploadBlob = await resizeImage(file, 1000);
      updateUploadingFile(uploadId, { progress: 50 });

      const scope = variantId ? `variant-${variantId}` : `product-${productId}`;
      const path = `product-views/${scope}/${imageType}-${Date.now()}.webp`;

      const { data: uploadData, error: uploadErr } = await supabase.storage.from('cms-images').upload(path, uploadBlob);
      if (uploadErr) throw uploadErr;
      updateUploadingFile(uploadId, { progress: 80 });

      // Use the publicUrl returned by the upload endpoint (multer generates a random filename)
      const publicUrl = uploadData?.publicUrl || supabase.storage.from('cms-images').getPublicUrl(path).data.publicUrl;

      // For view types (not gallery), remove existing image of same type
      if (imageType !== 'gallery') {
        const existing = images.find(img => img.image_type === imageType);
        if (existing) {
          await supabase.from('product_images').delete().eq('id', existing.id);
        }
      }

      const insertPayload: any = {
        product_id: productId,
        variant_id: variantId,
        image_url: publicUrl,
        image_type: imageType,
        sort_order: imageType === 'gallery'
          ? galleryImages.length + 10
          : IMAGE_VIEWS.findIndex(v => v.type === imageType),
      };

      const { error: insertErr } = await supabase.from('product_images').insert(insertPayload);
      if (insertErr) throw insertErr;

      updateUploadingFile(uploadId, { progress: 100, done: true });
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['product-images', productId] });

      // Remove preview after a short delay
      setTimeout(() => removeUploadingFile(uploadId), 1200);
    } catch (err: any) {
      updateUploadingFile(uploadId, { error: err.message, progress: 0 });
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
      setTimeout(() => removeUploadingFile(uploadId), 3000);
    }
  }, [images, galleryImages.length, productId, variantId, queryClient, queryKey, toast, updateUploadingFile, removeUploadingFile]);

  const handleMultiUpload = useCallback((files: FileList | File[], imageType: ImageType = 'gallery') => {
    Array.from(files).forEach(file => handleUpload(file, imageType));
  }, [handleUpload]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent, slot?: ImageType) => {
    e.preventDefault();
    e.stopPropagation();
    if (slot) setDragOverSlot(slot);
    else setDragOverGallery(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverSlot(null);
    setDragOverGallery(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, imageType: ImageType) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSlot(null);
    setDragOverGallery(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      if (imageType === 'gallery') {
        handleMultiUpload(files, 'gallery');
      } else {
        handleUpload(files[0], imageType);
      }
    }
  }, [handleUpload, handleMultiUpload]);

  const activeUploadsForType = (type: ImageType) =>
    uploadingFiles.filter(f => f.imageType === type && !f.done && !f.error);

  return (
    <div className="space-y-5">
      {/* 5-View Uploads */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {variantId ? 'Variant Images' : 'Product View Images'}
          </p>
          <span className="text-[10px] text-muted-foreground/50">(drag & drop supported)</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {IMAGE_VIEWS.map(view => {
            const img = viewImages.find(i => i.image_type === view.type);
            const uploading = activeUploadsForType(view.type);
            const uploadingPreview = uploading[0];
            const isDragOver = dragOverSlot === view.type;

            return (
              <div key={view.type} className="flex flex-col gap-1">
                <div
                  className={cn(
                    'relative aspect-square rounded-xl overflow-hidden border-2 border-dashed transition-all group',
                    isDragOver
                      ? 'border-accent bg-accent/10 scale-105'
                      : img
                        ? 'border-[hsl(var(--sm-gold))]/40 shadow-sm'
                        : 'border-border/40 bg-muted/20 hover:border-border/70',
                  )}
                  onDragOver={(e) => handleDragOver(e, view.type)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, view.type)}
                >
                  {/* Uploading preview */}
                  {uploadingPreview && (
                    <div className="absolute inset-0 z-20">
                      <img
                        src={uploadingPreview.localUrl}
                        alt="Uploading..."
                        className="w-full h-full object-contain p-1 opacity-60"
                      />
                      <div className="absolute inset-x-1 bottom-1">
                        <Progress value={uploadingPreview.progress} className="h-1" />
                      </div>
                      {uploadingPreview.done && (
                        <div className="absolute inset-0 flex items-center justify-center bg-accent/20">
                          <CheckCircle2 className="h-5 w-5 text-accent" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Existing image */}
                  {img && !uploadingPreview ? (
                    <>
                      <img
                        src={img.image_url}
                        alt={view.label}
                        className="w-full h-full object-contain p-1"
                        loading="lazy"
                      />
                      {/* Featured badge */}
                      {featuredImageUrl && img.image_url === featuredImageUrl && (
                        <div className="absolute top-1 left-1 z-10">
                          <Star className="h-4 w-4 text-[hsl(var(--sm-gold))] fill-[hsl(var(--sm-gold))]" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                        {onSetFeatured && img.image_url !== featuredImageUrl && (
                          <button
                            type="button"
                            onClick={() => onSetFeatured(img.image_url)}
                            className="p-1.5 bg-[hsl(var(--sm-gold))]/90 rounded-full hover:bg-[hsl(var(--sm-gold))] transition-colors"
                            title="Set as Featured"
                          >
                            <Star className="h-3 w-3 text-white" />
                          </button>
                        )}
                        <label className="cursor-pointer p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors" title="Replace">
                          <Upload className="h-3 w-3 text-foreground" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0], view.type); }}
                          />
                        </label>
                        <button
                          onClick={() => deleteMutation.mutate(img.id)}
                          className="p-1.5 bg-destructive/90 rounded-full hover:bg-destructive transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3 text-destructive-foreground" />
                        </button>
                      </div>
                    </>
                  ) : !uploadingPreview ? (
                    <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center gap-1.5 hover:bg-muted/40 transition-colors">
                      {isDragOver ? (
                        <Upload className="h-5 w-5 text-accent animate-bounce" />
                      ) : (
                        <>
                          <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                          <Upload className="h-3 w-3 text-muted-foreground/30" />
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0], view.type); }}
                      />
                    </label>
                  ) : null}
                </div>
                <p className={cn(
                  'text-[10px] text-center font-semibold uppercase tracking-wider',
                  img ? 'text-[hsl(var(--sm-gold))]' : 'text-muted-foreground',
                )}>{view.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gallery Section — multi-image upload */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Gallery Images
            </p>
            {galleryImages.length > 0 && (
              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground font-medium">
                {galleryImages.length}
              </span>
            )}
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => galleryInputRef.current?.click()}
          >
            <Plus className="h-3 w-3" /> Add Photos
          </Button>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => { if (e.target.files) handleMultiUpload(e.target.files); }}
          />
        </div>

        {/* Drop zone + gallery grid */}
        <div
          className={cn(
            'rounded-xl border-2 border-dashed transition-all p-3',
            dragOverGallery
              ? 'border-accent bg-accent/5'
              : galleryImages.length > 0 || uploadingFiles.some(f => f.imageType === 'gallery')
                ? 'border-border/30 bg-muted/10'
                : 'border-border/40 bg-muted/20',
          )}
          onDragOver={(e) => handleDragOver(e)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'gallery')}
        >
          {galleryImages.length === 0 && uploadingFiles.filter(f => f.imageType === 'gallery').length === 0 ? (
            <label
              className="cursor-pointer flex flex-col items-center justify-center py-8 gap-2 hover:bg-muted/30 transition-colors rounded-lg"
              onClick={e => e.stopPropagation()}
            >
              {dragOverGallery ? (
                <>
                  <Upload className="h-8 w-8 text-accent animate-bounce" />
                  <p className="text-sm font-medium text-accent">Drop images here</p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                    <Camera className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-muted-foreground">Drag & drop images or click to browse</p>
                  <p className="text-[10px] text-muted-foreground/50">JPG, PNG, WebP • Max 5MB each • Multiple files supported</p>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => { if (e.target.files) handleMultiUpload(e.target.files); }}
              />
            </label>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {/* Existing gallery images */}
              {galleryImages.map(img => (
                <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border border-border/30 bg-white group">
                  <img
                    src={img.image_url}
                    alt="Gallery"
                    className="w-full h-full object-contain p-1"
                    loading="lazy"
                  />
                  {/* Featured badge */}
                  {featuredImageUrl && img.image_url === featuredImageUrl && (
                    <div className="absolute top-1 left-1 z-10">
                      <Star className="h-4 w-4 text-[hsl(var(--sm-gold))] fill-[hsl(var(--sm-gold))]" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                    {onSetFeatured && img.image_url !== featuredImageUrl && (
                      <button
                        type="button"
                        onClick={() => onSetFeatured(img.image_url)}
                        className="p-1.5 bg-[hsl(var(--sm-gold))]/90 rounded-full hover:bg-[hsl(var(--sm-gold))] transition-colors"
                        title="Set as Featured"
                      >
                        <Star className="h-3.5 w-3.5 text-white" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(img.id)}
                      className="p-1.5 bg-destructive/90 rounded-full hover:bg-destructive transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive-foreground" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Uploading previews */}
              {uploadingFiles
                .filter(f => f.imageType === 'gallery')
                .map(f => (
                  <div key={f.id} className="relative aspect-square rounded-lg overflow-hidden border border-accent/30 bg-white">
                    <img
                      src={f.localUrl}
                      alt="Uploading..."
                      className="w-full h-full object-contain p-1 opacity-50"
                    />
                    <div className="absolute inset-x-1 bottom-1">
                      <Progress value={f.progress} className="h-1" />
                    </div>
                    {f.done && (
                      <div className="absolute inset-0 flex items-center justify-center bg-accent/10">
                        <CheckCircle2 className="h-5 w-5 text-accent" />
                      </div>
                    )}
                    {f.error && (
                      <div className="absolute inset-0 flex items-center justify-center bg-destructive/10">
                        <X className="h-5 w-5 text-destructive" />
                      </div>
                    )}
                  </div>
                ))}

              {/* Add more button */}
              <label className="cursor-pointer aspect-square rounded-lg border-2 border-dashed border-border/40 flex flex-col items-center justify-center gap-1 hover:border-accent/50 hover:bg-accent/5 transition-all">
                <Plus className="h-5 w-5 text-muted-foreground/40" />
                <span className="text-[9px] text-muted-foreground/50 font-medium">Add</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => { if (e.target.files) handleMultiUpload(e.target.files); }}
                />
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductImageManager;

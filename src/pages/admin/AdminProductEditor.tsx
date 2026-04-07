/**
 * AdminProductEditor — Full-page tabbed product form
 * Replaces the cramped dialog with a spacious, organized editing experience.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Upload, X, Star, ImageIcon, Loader2, Eye, EyeOff, Info, Tag, FileText, Image as ImgIcon, Palette, AlertCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import ProductImageManager from '@/components/admin/ProductImageManager';
import ColorVariantManager from '@/components/admin/ColorVariantManager';
import { cn } from '@/lib/utils';

interface ProductForm {
  name_en: string;
  name_bn: string;
  description_en: string;
  description_bn: string;
  short_description_en: string;
  short_description_bn: string;
  category_id: string;
  image_url: string;
  is_active: boolean;
  product_code: string;
  unit_price: number;
}

const emptyForm: ProductForm = {
  name_en: '', name_bn: '', description_en: '', description_bn: '',
  short_description_en: '', short_description_bn: '',
  category_id: '', image_url: '', is_active: true, product_code: '', unit_price: 0,
};

const slugify = (str: string) =>
  str.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();

const AdminProductEditor = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(id || null);
  const [activeTab, setActiveTab] = useState('basic');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Fetch product if editing
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').eq('is_active', true).order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  // Populate form when product loads
  useEffect(() => {
    if (product) {
      setForm({
        name_en: product.name_en || '',
        name_bn: product.name_bn || '',
        description_en: product.description_en || '',
        description_bn: product.description_bn || '',
        short_description_en: (product as any).short_description_en || '',
        short_description_bn: (product as any).short_description_bn || '',
        category_id: product.category_id || '',
        image_url: product.image_url || '',
        is_active: product.is_active,
        product_code: (product as any).product_code || '',
        unit_price: Number((product as any).unit_price) || 0,
      });
    }
  }, [product]);

  const resizeImage = (file: File, maxSize = 1000): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
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
          'image/webp', 0.85,
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 5MB per image.', variant: 'destructive' });
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file type', description: 'Only images allowed.', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const blob = await resizeImage(file);
      const path = `products/${Date.now()}.webp`;
      const { data: uploadData, error } = await supabase.storage.from('cms-images').upload(path, blob);
      if (error) throw error;
      const publicUrl = uploadData?.publicUrl || supabase.storage.from('cms-images').getPublicUrl(path).data.publicUrl;
      setForm(f => ({ ...f, image_url: publicUrl }));
      toast({ title: 'Image uploaded' });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    }
    setUploading(false);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  }, []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.name_en.trim()) throw new Error('Product name (English) is required');

      const payload: any = {
        name_en: form.name_en.trim(),
        name_bn: form.name_bn.trim(),
        description_en: form.description_en,
        description_bn: form.description_bn,
        short_description_en: form.short_description_en,
        short_description_bn: form.short_description_bn,
        category_id: form.category_id || null,
        image_url: form.image_url,
        is_active: form.is_active,
        product_code: form.product_code || slugify(form.name_en),
        unit_price: form.unit_price,
      };

      if (savedId) {
        const { error } = await supabase.from('products').update(payload).eq('id', savedId);
        if (error) throw error;
        return savedId;
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert({ ...payload, sort_order: 0 })
          .select('id')
          .single();
        if (error) throw error;
        return data?.id ?? null;
      }
    },
    onSuccess: (newId) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-product', newId] });
      setSaved(true);
      if (!savedId && newId) {
        setSavedId(newId);
        // Update URL without full navigation
        window.history.replaceState(null, '', `/admin/products/edit/${newId}`);
      }
      toast({ title: savedId ? 'Product updated' : 'Product created! You can now add images and variants.' });
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  if (productLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const categoryName = categories.find(c => c.id === form.category_id)?.name_en;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/products')} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {isEdit ? 'Edit Product' : savedId ? 'Edit Product' : 'New Product'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isEdit ? `Editing: ${form.name_en || 'Untitled'}` : savedId ? 'Product created — add images & variants' : 'Fill in the details below'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-2">
            <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
            <span className="text-sm text-muted-foreground">{form.is_active ? 'Active' : 'Draft'}</span>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin/products')}>Cancel</Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !form.name_en.trim()}
            className="gap-2"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              '✓ Saved'
            ) : (
              <><Save className="h-4 w-4" /> {savedId ? 'Update' : 'Save'}</>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start bg-muted/30 border border-border p-1 rounded-xl">
          <TabsTrigger value="basic" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
            <Info className="h-4 w-4" /> Basic Info
          </TabsTrigger>
          <TabsTrigger value="description" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
            <FileText className="h-4 w-4" /> Description
          </TabsTrigger>
          <TabsTrigger
            value="media"
            className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
            disabled={!savedId}
          >
            <ImgIcon className="h-4 w-4" /> Media
            {!savedId && <Badge variant="secondary" className="text-[10px] ml-1">Save first</Badge>}
          </TabsTrigger>
          <TabsTrigger
            value="variants"
            className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
            disabled={!savedId}
          >
            <Palette className="h-4 w-4" /> Variants
            {!savedId && <Badge variant="secondary" className="text-[10px] ml-1">Save first</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* === BASIC INFO TAB === */}
        <TabsContent value="basic" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Main fields */}
            <div className="lg:col-span-2 space-y-5">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Product Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Name (English) <span className="text-destructive">*</span></label>
                      <Input
                        value={form.name_en}
                        onChange={e => setForm(f => ({
                          ...f, name_en: e.target.value,
                          product_code: !f.product_code || f.product_code === slugify(f.name_en) ? slugify(e.target.value) : f.product_code,
                        }))}
                        placeholder="e.g. Premium Leather Briefcase"
                        className="text-base"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Name (বাংলা)</label>
                      <Input
                        value={form.name_bn}
                        onChange={e => setForm(f => ({ ...f, name_bn: e.target.value }))}
                        placeholder="পণ্যের নাম"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Product Code / Slug</label>
                    <Input
                      value={form.product_code}
                      onChange={e => setForm(f => ({ ...f, product_code: e.target.value }))}
                      placeholder="auto-generated from name"
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Used in URLs and for identification. Auto-generated if left blank.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Category</label>
                      <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>
                          {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name_en}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Price (৳)</label>
                      <Input
                        type="number"
                        min={0}
                        value={form.unit_price || ''}
                        onChange={e => setForm(f => ({ ...f, unit_price: Math.max(0, Number(e.target.value)) }))}
                        placeholder="0"
                        className="text-lg font-bold"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Featured Image + Status */}
            <div className="space-y-5">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Featured Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.currentTarget.value = ''; }} />

                  {form.image_url ? (
                    <div className="relative group">
                      <img src={form.image_url} alt="Featured" className="w-full aspect-square object-contain rounded-xl border bg-muted/20 p-2" />
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-amber-500/90 text-white text-[10px] gap-1">
                          <Star className="h-3 w-3 fill-current" /> Featured
                        </Badge>
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors rounded-xl flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <Button type="button" size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
                          <Upload className="h-4 w-4 mr-1" /> Replace
                        </Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => setForm(f => ({ ...f, image_url: '' }))}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "border-2 border-dashed rounded-xl aspect-square flex flex-col items-center justify-center gap-3 cursor-pointer transition-all",
                        dragOver ? "border-primary bg-primary/5 scale-[1.02]" : "border-border/50 hover:border-border hover:bg-muted/20"
                      )}
                      onClick={() => fileRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                    >
                      {uploading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center">
                            <ImageIcon className="h-7 w-7 text-muted-foreground/50" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-muted-foreground">
                              {dragOver ? 'Drop image here' : 'Click or drag image'}
                            </p>
                            <p className="text-xs text-muted-foreground/60 mt-0.5">Max 5MB · JPG, PNG, WebP</p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Status & Visibility</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Active</p>
                      <p className="text-xs text-muted-foreground">Visible on the website</p>
                    </div>
                    <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                  </div>
                  <Separator />
                  <div className="flex items-center gap-2">
                    {form.is_active ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1">
                        <Eye className="h-3 w-3" /> Published
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <EyeOff className="h-3 w-3" /> Draft
                      </Badge>
                    )}
                    {categoryName && (
                      <Badge variant="outline" className="gap-1">
                        <Tag className="h-3 w-3" /> {categoryName}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* === DESCRIPTION TAB === */}
        <TabsContent value="description" className="mt-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Product Descriptions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Short Description (EN)</label>
                  <Input value={form.short_description_en} onChange={e => setForm(f => ({ ...f, short_description_en: e.target.value }))} placeholder="Brief one-liner for catalog cards" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Short Description (বাংলা)</label>
                  <Input value={form.short_description_bn} onChange={e => setForm(f => ({ ...f, short_description_bn: e.target.value }))} placeholder="সংক্ষিপ্ত বিবরণ" />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Full Description (English)</label>
                  <Textarea value={form.description_en} onChange={e => setForm(f => ({ ...f, description_en: e.target.value }))} rows={8}
                    placeholder="Detailed product description for the product page…" className="resize-y" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Full Description (বাংলা)</label>
                  <Textarea value={form.description_bn} onChange={e => setForm(f => ({ ...f, description_bn: e.target.value }))} rows={8}
                    placeholder="পণ্যের বিস্তারিত বিবরণ…" className="resize-y" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === MEDIA TAB === */}
        <TabsContent value="media" className="mt-6">
          {savedId ? (
            <div className="space-y-6">
              {/* Featured image indicator */}
              {form.image_url && (
                <Card className="border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/10">
                  <CardContent className="flex items-center gap-4 py-4">
                    <img src={form.image_url} alt="Featured" className="h-16 w-16 object-contain rounded-lg border bg-background p-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <p className="text-sm font-semibold">Featured Image</p>
                      </div>
                      <p className="text-xs text-muted-foreground">This is the main image shown in catalog cards. Click ★ on any image below to change it.</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setForm(f => ({ ...f, image_url: '' }))}>
                      <X className="h-4 w-4 mr-1" /> Remove
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Product Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProductImageManager
                    productId={savedId}
                    featuredImageUrl={form.image_url}
                    onSetFeatured={(url) => {
                      setForm(f => ({ ...f, image_url: url }));
                      // Auto-save featured image to DB
                      supabase.from('products').update({ image_url: url }).eq('id', savedId);
                      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
                      toast({ title: 'Featured image updated' });
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Save the product first to manage images.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* === VARIANTS TAB === */}
        <TabsContent value="variants" className="mt-6">
          {savedId ? (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Color Variants</CardTitle>
              </CardHeader>
              <CardContent>
                <ColorVariantManager productId={savedId} basePrice={form.unit_price} />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Save the product first to manage variants.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminProductEditor;

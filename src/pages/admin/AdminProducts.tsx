import { useState, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Upload, Image as ImageIcon, PackagePlus, Search, ChevronLeft, ChevronRight, X, CheckSquare, Square } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import BulkUploadZone, { type FileItem } from '@/components/admin/BulkUploadZone';
import VariantManager from '@/components/admin/VariantManager';

const PAGE_SIZE = 12;

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
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [uploading, setUploading] = useState(false);
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
      } else {
        const { error } = await supabase.from('products').insert({ ...payload, sort_order: products.length + 1 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast({ title: editId ? 'Product updated' : 'Product created' });
      closeDialog();
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

  const closeDialog = () => { setDialogOpen(false); setEditId(null); setForm(emptyForm); };

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
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
                      <img src={form.image_url} alt="Preview" className="w-full h-40 object-cover rounded-lg border" />
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
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                  <label className="text-sm">Active (visible on site)</label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                  <Button type="submit" className="bg-sm-red hover:bg-[hsl(var(--sm-red-dark))] text-white" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </form>
              {editId && (
                <div className="border-t border-border pt-4 mt-4">
                  <VariantManager productId={editId} />
                </div>
              )}
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

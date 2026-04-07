import { useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, X, PackagePlus, Package, Filter, MoreVertical, Eye, EyeOff, ToggleLeft, Image as ImageIcon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import BulkUploadZone, { type FileItem } from '@/components/admin/BulkUploadZone';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';

const PAGE_SIZE = 12;

const slugify = (str: string) =>
  str.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();

const AdminProducts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkFiles, setBulkFiles] = useState<FileItem[]>([]);
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkImporting, setBulkImporting] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState('');

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);

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

  const filtered = useMemo(() => {
    return products.filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !search || 
        p.name_en.toLowerCase().includes(q) || 
        ((p as any).product_code && (p as any).product_code.toLowerCase().includes(q)) ||
        ((p as any).categories?.name_en || '').toLowerCase().includes(q);
      const matchCat = filterCategory === 'all' || p.category_id === filterCategory;
      const matchStatus = filterStatus === 'all' || (filterStatus === 'active' ? p.is_active : !p.is_active);
      return matchSearch && matchCat && matchStatus;
    });
  }, [products, search, filterCategory, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeCount = products.filter(p => p.is_active).length;
  const inactiveCount = products.filter(p => !p.is_active).length;

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('product_variants').delete().eq('product_id', id);
      await supabase.from('product_images').delete().eq('product_id', id);
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
      await supabase.from('product_images').delete().in('product_id', ids);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast({ title: 'Status updated' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const bulkToggleStatusMutation = useMutation({
    mutationFn: async ({ ids, is_active }: { ids: string[]; is_active: boolean }) => {
      for (const id of ids) {
        await supabase.from('products').update({ is_active }).eq('id', id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast({ title: `${selected.size} products updated` });
      setSelected(new Set());
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const handleBulkImport = useCallback(async () => {
    const pending = bulkFiles.filter(f => f.status === 'pending');
    if (pending.length === 0) return;
    setBulkImporting(true);

    const updated = [...bulkFiles];
    let successCount = 0;
    const baseOrder = products.length + 1;

    for (let i = 0; i < updated.length; i++) {
      if (updated[i].status !== 'pending') continue;
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
        const { data: uploadData, error: uploadErr } = await supabase.storage.from('cms-images').upload(path, updated[i].file);
        if (uploadErr) throw uploadErr;
        const bulkPublicUrl = uploadData?.publicUrl || supabase.storage.from('cms-images').getPublicUrl(path).data.publicUrl;
        const name = updated[i].file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const { error: insertErr } = await supabase.from('products').insert({
          name_en: name, name_bn: '', image_url: bulkPublicUrl,
          category_id: bulkCategory || null, is_active: true,
          sort_order: baseOrder + successCount, product_code: slugify(name),
        } as any);
        if (insertErr) throw insertErr;
        updated[i] = { ...updated[i], status: 'done', url: bulkPublicUrl };
        successCount++;
      } catch (err: any) {
        updated[i] = { ...updated[i], status: 'error', error: err.message };
      }
      setBulkFiles([...updated]);
    }
    setBulkImporting(false);
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    toast({ title: `${successCount} products added` });
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
    if (selected.size === paginated.length) setSelected(new Set());
    else setSelected(new Set(paginated.map(p => p.id)));
  };

  const resetFilters = () => { setSearch(''); setFilterCategory('all'); setFilterStatus('all'); setPage(1); };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Products
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your product catalog</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={bulkOpen} onOpenChange={v => { if (!v) closeBulk(); else setBulkOpen(true); }}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <PackagePlus className="h-4 w-4" /> Bulk Add
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Bulk Add Products</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Drop multiple images (max 5MB each). Product names derived from filenames.</p>
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
                  <Button onClick={handleBulkImport}
                    disabled={bulkImporting || bulkFiles.filter(f => f.status === 'pending').length === 0}>
                    {bulkImporting ? 'Importing...' : `Add ${bulkFiles.filter(f => f.status === 'pending').length} Products`}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button size="sm" className="gap-2" onClick={() => navigate('/admin/products/new')}>
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-background border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{products.length}</p>
            <p className="text-xs text-muted-foreground">Total Products</p>
          </div>
        </div>
        <div className="bg-background border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Eye className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{activeCount}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
        </div>
        <div className="bg-background border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <EyeOff className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{inactiveCount}</p>
            <p className="text-xs text-muted-foreground">Inactive</p>
          </div>
        </div>
        <div className="bg-background border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Filter className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{categories.length}</p>
            <p className="text-xs text-muted-foreground">Categories</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-background border border-border rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, code, or category…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-10 bg-muted/30 border-border/50 focus:bg-background"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterCategory} onValueChange={v => { setFilterCategory(v); setPage(1); }}>
              <SelectTrigger className="w-[160px] bg-muted/30 border-border/50">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name_en}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={v => { setFilterStatus(v as any); setPage(1); }}>
              <SelectTrigger className="w-[130px] bg-muted/30 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            {(search || filterCategory !== 'all' || filterStatus !== 'all') && (
              <Button variant="ghost" size="icon" onClick={resetFilters} className="shrink-0">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Select all & bulk actions bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {paginated.length > 0 && (
              <button onClick={toggleSelectAll} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Checkbox
                  checked={selected.size === paginated.length && paginated.length > 0}
                  onCheckedChange={() => toggleSelectAll()}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <span>{selected.size === paginated.length && paginated.length > 0 ? 'Deselect all' : 'Select all'}</span>
              </button>
            )}
            <span className="text-sm text-muted-foreground">
              {filtered.length} product{filtered.length !== 1 ? 's' : ''}
              {filtered.length !== products.length && ` (filtered from ${products.length})`}
            </span>
          </div>

          {selected.size > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">{selected.size} selected</Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <ToggleLeft className="h-3.5 w-3.5" /> Bulk Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => bulkToggleStatusMutation.mutate({ ids: Array.from(selected), is_active: true })}>
                    <Eye className="h-4 w-4 mr-2" /> Activate All
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => bulkToggleStatusMutation.mutate({ ids: Array.from(selected), is_active: false })}>
                    <EyeOff className="h-4 w-4 mr-2" /> Deactivate All
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setBulkDeleteOpen(true)}>
                    <Trash2 className="h-4 w-4 mr-2" /> Delete Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-background border border-border rounded-xl overflow-hidden">
              <Skeleton className="aspect-[4/3] w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className="bg-background border border-border rounded-xl p-16 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Package className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {products.length === 0 ? 'No products yet' : 'No results found'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {products.length === 0 ? 'Add your first product to get started.' : 'Try adjusting your search or filters.'}
          </p>
          {products.length === 0 && (
            <Button onClick={() => navigate('/admin/products/new')} className="gap-2">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map(prod => {
            const isSelected = selected.has(prod.id);
            const price = Number((prod as any).unit_price) || 0;
            const categoryName = (prod as any).categories?.name_en ?? 'Uncategorized';
            const productCode = (prod as any).product_code;

            return (
              <div
                key={prod.id}
                className={cn(
                  'group bg-background border rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-primary/20 cursor-pointer',
                  isSelected ? 'ring-2 ring-primary border-primary/30 shadow-md' : 'border-border'
                )}
                onClick={() => navigate(`/admin/products/edit/${prod.id}`)}
              >
                {/* Image Area */}
                <div className="relative aspect-[4/3] bg-muted/30 overflow-hidden">
                  {prod.image_url ? (
                    <img src={prod.image_url} alt={prod.name_en} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground/20" />
                    </div>
                  )}

                  {/* Checkbox */}
                  <div className="absolute top-3 left-3 z-10" onClick={e => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(prod.id)}
                      className={cn(
                        "h-5 w-5 border-2 bg-background/80 backdrop-blur-sm data-[state=checked]:bg-primary data-[state=checked]:border-primary",
                        !isSelected && "opacity-0 group-hover:opacity-100 transition-opacity"
                      )}
                    />
                  </div>

                  {/* Status */}
                  <div className="absolute top-3 right-3 z-10" onClick={e => e.stopPropagation()}>
                    <Badge
                      variant={prod.is_active ? 'default' : 'secondary'}
                      className={cn(
                        "text-[11px] px-2 py-0.5 font-medium shadow-sm",
                        prod.is_active ? "bg-emerald-500/90 text-white hover:bg-emerald-500" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {prod.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  {/* Price */}
                  {price > 0 && (
                    <div className="absolute bottom-3 left-3">
                      <span className="bg-background/90 backdrop-blur-sm text-foreground text-sm font-bold px-3 py-1 rounded-full shadow-sm">
                        ৳{price.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm text-foreground truncate">{prod.name_en}</h3>
                      <p className="text-xs text-primary/80 font-medium mt-0.5">{categoryName}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground" onClick={e => e.stopPropagation()}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/admin/products/edit/${prod.id}`); }}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleStatusMutation.mutate({ id: prod.id, is_active: !prod.is_active }); }}>
                          {prod.is_active ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                          {prod.is_active ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => { e.stopPropagation(); setDeleteId(prod.id); setDeleteName(prod.name_en); }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {productCode && (
                    <p className="text-[11px] font-mono text-muted-foreground/70 mb-3 truncate">{productCode}</p>
                  )}

                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs gap-1.5"
                      onClick={() => navigate(`/admin/products/edit/${prod.id}`)}>
                      <Pencil className="h-3 w-3" /> Edit
                    </Button>
                    <div className="flex items-center gap-1.5 px-2">
                      <Switch checked={prod.is_active} onCheckedChange={v => toggleStatusMutation.mutate({ id: prod.id, is_active: v })} className="scale-90" />
                    </div>
                    <Button variant="ghost" size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => { setDeleteId(prod.id); setDeleteName(prod.name_en); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-background border border-border rounded-xl px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) pageNum = i + 1;
              else if (page <= 3) pageNum = i + 1;
              else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = page - 2 + i;
              return (
                <Button key={pageNum} variant={page === pageNum ? "default" : "outline"} size="sm" className="w-8 h-8 p-0" onClick={() => setPage(pageNum)}>
                  {pageNum}
                </Button>
              );
            })}
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={open => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteName}</strong> and all its images and variants.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirmation */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} Products?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selected.size} products along with their images and variants.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => bulkDeleteMutation.mutate(Array.from(selected))}>Delete All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminProducts;

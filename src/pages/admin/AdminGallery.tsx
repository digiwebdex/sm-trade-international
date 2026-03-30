import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Upload, Image as ImageIcon, Images } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import BulkUploadZone, { type FileItem } from '@/components/admin/BulkUploadZone';

interface GalleryForm {
  title_en: string;
  title_bn: string;
  category: string;
  image_url: string;
  is_active: boolean;
}

const emptyForm: GalleryForm = {
  title_en: '', title_bn: '', category: 'general', image_url: '', is_active: true,
};

const GALLERY_CATEGORIES = ['general', 'products', 'factory', 'events', 'team'];

const AdminGallery = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<GalleryForm>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Bulk state
  const [bulkFiles, setBulkFiles] = useState<FileItem[]>([]);
  const [bulkCategory, setBulkCategory] = useState('general');
  const [bulkImporting, setBulkImporting] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-gallery'],
    queryFn: async () => {
      const { data, error } = await supabase.from('gallery').select('*').order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `gallery/${Date.now()}.${ext}`;
    const { data: uploadData, error } = await supabase.storage.from('cms-images').upload(path, file);
    if (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      setUploading(false);
      return;
    }
    const publicUrl = uploadData?.publicUrl || supabase.storage.from('cms-images').getPublicUrl(path).data.publicUrl;
    setForm(f => ({ ...f, image_url: publicUrl }));
    setUploading(false);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.image_url) throw new Error('Image is required');
      const payload = { ...form };
      if (editId) {
        const { error } = await supabase.from('gallery').update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('gallery').insert({ ...payload, sort_order: items.length + 1 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gallery'] });
      toast({ title: editId ? 'Image updated' : 'Image added' });
      closeDialog();
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('gallery').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gallery'] });
      toast({ title: 'Image deleted' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const openEdit = (item: typeof items[0]) => {
    setEditId(item.id);
    setForm({
      title_en: item.title_en, title_bn: item.title_bn,
      category: item.category ?? 'general', image_url: item.image_url, is_active: item.is_active,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditId(null); setForm(emptyForm); };

  // Bulk import handler
  const handleBulkImport = useCallback(async () => {
    const pending = bulkFiles.filter(f => f.status === 'pending');
    if (pending.length === 0) return;
    setBulkImporting(true);

    const updated = [...bulkFiles];
    let successCount = 0;
    const baseOrder = items.length + 1;

    for (let i = 0; i < updated.length; i++) {
      if (updated[i].status !== 'pending') continue;
      updated[i] = { ...updated[i], status: 'uploading' };
      setBulkFiles([...updated]);

      try {
        const ext = updated[i].file.name.split('.').pop();
        const path = `gallery/${Date.now()}-${i}.${ext}`;
        const { data: bulkUploadData, error: uploadErr } = await supabase.storage.from('cms-images').upload(path, updated[i].file);
        if (uploadErr) throw uploadErr;
        const bulkPublicUrl = bulkUploadData?.publicUrl || supabase.storage.from('cms-images').getPublicUrl(path).data.publicUrl;

        const title = updated[i].file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

        const { error: insertErr } = await supabase.from('gallery').insert({
          title_en: title,
          title_bn: '',
          image_url: bulkPublicUrl,
          category: bulkCategory,
          is_active: true,
          sort_order: baseOrder + successCount,
        });
        if (insertErr) throw insertErr;

        updated[i] = { ...updated[i], status: 'done', url: bulkPublicUrl };
        successCount++;
      } catch (err: any) {
        updated[i] = { ...updated[i], status: 'error', error: err.message };
      }
      setBulkFiles([...updated]);
    }

    setBulkImporting(false);
    queryClient.invalidateQueries({ queryKey: ['admin-gallery'] });
    toast({ title: `${successCount} images added`, description: `From ${pending.length} files.` });
  }, [bulkFiles, bulkCategory, items.length, queryClient, toast]);

  const closeBulk = () => { setBulkOpen(false); setBulkFiles([]); setBulkCategory('general'); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-muted-foreground text-sm">{items.length} images</p>
        <div className="flex gap-2">
          {/* Bulk Add */}
          <Dialog open={bulkOpen} onOpenChange={v => { if (!v) closeBulk(); else setBulkOpen(true); }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Images className="h-4 w-4 mr-2" /> Bulk Add
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Bulk Add Gallery Images</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Drop multiple images to add them to the gallery at once. Titles will be derived from filenames.
                </p>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={bulkCategory} onValueChange={setBulkCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GALLERY_CATEGORIES.map(c => (
                        <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                      ))}
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
                    {bulkImporting ? 'Importing...' : `Add ${bulkFiles.filter(f => f.status === 'pending').length} Images`}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Single Add */}
          <Dialog open={dialogOpen} onOpenChange={v => { if (!v) closeDialog(); else setDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button className="bg-sm-red hover:bg-[hsl(var(--sm-red-dark))] text-white">
                <Plus className="h-4 w-4 mr-2" /> Add Image
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editId ? 'Edit Image' : 'Add Image'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Title (English)</label>
                    <Input value={form.title_en} onChange={e => setForm(f => ({ ...f, title_en: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Title (বাংলা)</label>
                    <Input value={form.title_bn} onChange={e => setForm(f => ({ ...f, title_bn: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GALLERY_CATEGORIES.map(c => (
                        <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Image</label>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]); }} />
                  {form.image_url ? (
                    <div className="relative mt-2">
                      <img src={form.image_url} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                      <Button type="button" size="sm" variant="secondary" className="absolute bottom-2 right-2"
                        onClick={() => fileRef.current?.click()}>Change</Button>
                    </div>
                  ) : (
                    <Button type="button" variant="outline" className="w-full mt-2 h-32 flex-col gap-2"
                      onClick={() => fileRef.current?.click()} disabled={uploading}>
                      {uploading ? <span className="text-sm">Uploading...</span> : (
                        <><Upload className="h-6 w-6 text-muted-foreground" /><span className="text-sm text-muted-foreground">Click to upload</span></>
                      )}
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                  <label className="text-sm">Active</label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                  <Button type="submit" className="bg-sm-red hover:bg-[hsl(var(--sm-red-dark))] text-white" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Card key={i} className="animate-pulse"><CardContent className="h-40" /></Card>)}
        </div>
      ) : items.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No gallery images yet.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(item => (
            <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow group">
              <div className="aspect-square bg-muted relative">
                <img src={item.image_url} alt={item.title_en} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <Button size="sm" variant="secondary" onClick={() => openEdit(item)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(item.id); }}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
                <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {item.is_active ? 'Active' : 'Hidden'}
                </span>
              </div>
              <CardContent className="p-3">
                <p className="text-sm font-medium truncate">{item.title_en || 'Untitled'}</p>
                <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminGallery;

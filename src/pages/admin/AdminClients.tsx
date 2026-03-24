import { useState, useRef } from 'react';
import { supabase } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Upload, Building2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface ClientForm {
  name: string;
  logo_url: string;
  website_url: string;
  is_active: boolean;
}

const emptyForm: ClientForm = { name: '', logo_url: '', website_url: '', is_active: true };

const AdminClients = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['admin-clients'],
    queryFn: async () => {
      const { data, error } = await supabase.from('client_logos').select('*').order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `clients/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('cms-images').upload(path, file);
    if (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('cms-images').getPublicUrl(path);
    setForm(f => ({ ...f, logo_url: urlData.publicUrl }));
    setUploading(false);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.name) throw new Error('Name is required');
      const payload = { ...form };
      if (editId) {
        const { error } = await supabase.from('client_logos').update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('client_logos').insert({ ...payload, sort_order: clients.length + 1 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
      toast({ title: editId ? 'Client updated' : 'Client added' });
      closeDialog();
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('client_logos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
      toast({ title: 'Client deleted' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const openEdit = (client: typeof clients[0]) => {
    setEditId(client.id);
    setForm({
      name: client.name,
      logo_url: client.logo_url ?? '',
      website_url: client.website_url ?? '',
      is_active: client.is_active,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditId(null); setForm(emptyForm); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">{clients.length} clients</p>
        <Dialog open={dialogOpen} onOpenChange={v => { if (!v) closeDialog(); else setDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="bg-sm-red hover:bg-[hsl(var(--sm-red-dark))] text-white">
              <Plus className="h-4 w-4 mr-2" /> Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editId ? 'Edit Client' : 'Add Client'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Client Name</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="text-sm font-medium">Website URL</label>
                <Input value={form.website_url} onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))} placeholder="https://" />
              </div>

              <div>
                <label className="text-sm font-medium">Logo</label>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]); }} />
                {form.logo_url ? (
                  <div className="relative mt-2 bg-muted rounded-lg p-4 flex items-center justify-center">
                    <img src={form.logo_url} alt="Logo" className="max-h-24 object-contain" />
                    <Button type="button" size="sm" variant="secondary" className="absolute bottom-2 right-2"
                      onClick={() => fileRef.current?.click()}>Change</Button>
                  </div>
                ) : (
                  <Button type="button" variant="outline" className="w-full mt-2 h-24 flex-col gap-2"
                    onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? <span className="text-sm">Uploading...</span> : (
                      <><Upload className="h-5 w-5 text-muted-foreground" /><span className="text-sm text-muted-foreground">Upload logo</span></>
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

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Card key={i} className="animate-pulse"><CardContent className="h-32" /></Card>)}
        </div>
      ) : clients.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No clients yet.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {clients.map(client => (
            <Card key={client.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-[3/2] bg-muted flex items-center justify-center p-4">
                {client.logo_url ? (
                  <img src={client.logo_url} alt={client.name} className="max-h-full max-w-full object-contain" />
                ) : (
                  <Building2 className="h-10 w-10 text-muted-foreground/30" />
                )}
              </div>
              <CardContent className="p-3">
                <p className="text-sm font-medium truncate">{client.name}</p>
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(client)}>
                    <Pencil className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(client.id); }}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminClients;

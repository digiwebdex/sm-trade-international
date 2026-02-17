import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, GripVertical, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

type HeroSlide = {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  cta_text: string;
  cta_link: string;
  sort_order: number;
  is_active: boolean;
};

const emptySlide: Omit<HeroSlide, 'id'> = {
  title: '',
  subtitle: '',
  image_url: '',
  cta_text: '',
  cta_link: '#contact',
  sort_order: 0,
  is_active: true,
};

const AdminHeroSlides = () => {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<HeroSlide | null>(null);
  const [form, setForm] = useState(emptySlide);
  const [uploading, setUploading] = useState(false);

  const { data: slides = [], isLoading } = useQuery({
    queryKey: ['hero_slides'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as HeroSlide[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (slide: Omit<HeroSlide, 'id'> & { id?: string }) => {
      if (slide.id) {
        const { error } = await supabase.from('hero_slides').update(slide).eq('id', slide.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('hero_slides').insert(slide);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hero_slides'] });
      toast.success(editing ? 'Slide updated' : 'Slide created');
      closeDialog();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('hero_slides').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hero_slides'] });
      toast.success('Slide deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('hero_slides').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hero_slides'] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptySlide, sort_order: slides.length });
    setDialogOpen(true);
  };

  const openEdit = (s: HeroSlide) => {
    setEditing(s);
    setForm({ title: s.title, subtitle: s.subtitle, image_url: s.image_url, cta_text: s.cta_text, cta_link: s.cta_link, sort_order: s.sort_order, is_active: s.is_active });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptySlide);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsert.mutate(editing ? { ...form, id: editing.id } : form);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `hero-slides/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('cms-images').upload(path, file);
    if (error) {
      toast.error('Upload failed: ' + error.message);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('cms-images').getPublicUrl(path);
    setForm(f => ({ ...f, image_url: urlData.publicUrl }));
    setUploading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Hero Slides</h2>
          <p className="text-sm text-muted-foreground">Manage homepage carousel slides</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add Slide</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Slide' : 'New Slide'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} />
              </div>
              <div>
                <Label>Image</Label>
                <div className="flex items-center gap-3">
                  {form.image_url ? (
                    <img src={form.image_url} alt="" className="w-20 h-14 object-cover rounded border" />
                  ) : (
                    <div className="w-20 h-14 bg-muted rounded border flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                  </div>
                </div>
                <Input className="mt-2" placeholder="Or paste image URL" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>CTA Text</Label>
                  <Input value={form.cta_text} onChange={e => setForm(f => ({ ...f, cta_text: e.target.value }))} />
                </div>
                <div>
                  <Label>CTA Link</Label>
                  <Input value={form.cta_link} onChange={e => setForm(f => ({ ...f, cta_link: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <Label>Active</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                <Button type="submit" disabled={upsert.isPending}>{editing ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-muted-foreground/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : slides.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No hero slides yet. Click "Add Slide" to create one.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {slides.map(slide => (
            <Card key={slide.id} className={!slide.is_active ? 'opacity-50' : ''}>
              <CardContent className="flex items-center gap-4 py-3">
                <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                {slide.image_url ? (
                  <img src={slide.image_url} alt="" className="w-20 h-14 object-cover rounded border shrink-0" />
                ) : (
                  <div className="w-20 h-14 bg-muted rounded border flex items-center justify-center shrink-0">
                    <ImageIcon className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{slide.title || '(no title)'}</p>
                  <p className="text-xs text-muted-foreground truncate">{slide.subtitle}</p>
                  {slide.cta_text && (
                    <p className="text-xs text-primary mt-0.5">{slide.cta_text} → {slide.cta_link}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={slide.is_active}
                    onCheckedChange={v => toggleActive.mutate({ id: slide.id, is_active: v })}
                  />
                  <Button variant="ghost" size="icon" onClick={() => openEdit(slide)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => { if (confirm('Delete this slide?')) remove.mutate(slide.id); }}
                  >
                    <Trash2 className="w-4 h-4" />
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

export default AdminHeroSlides;

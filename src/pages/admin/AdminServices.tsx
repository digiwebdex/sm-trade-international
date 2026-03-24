import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, Eye, Gift, Monitor, Briefcase, GlassWater } from 'lucide-react';
type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

const iconOptions = [
  { name: 'Gift', Icon: Gift },
  { name: 'Monitor', Icon: Monitor },
  { name: 'Briefcase', Icon: Briefcase },
  { name: 'GlassWater', Icon: GlassWater },
];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Gift, Monitor, Briefcase, GlassWater,
};

interface ServiceData {
  title_en: string; title_bn: string;
  desc_en: string; desc_bn: string;
  icon: string;
}

const emptyService: ServiceData = { title_en: '', title_bn: '', desc_en: '', desc_bn: '', icon: 'Gift' };

const AdminServices = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [services, setServices] = useState<ServiceData[]>([
    { ...emptyService }, { ...emptyService, icon: 'Monitor' },
    { ...emptyService, icon: 'Briefcase' }, { ...emptyService, icon: 'GlassWater' },
  ]);
  const [previewLang, setPreviewLang] = useState<'en' | 'bn'>('en');

  const { data: saved, isLoading } = useQuery({
    queryKey: ['site-settings', 'services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings').select('setting_value')
        .eq('setting_key', 'services').maybeSingle();
      if (error) throw error;
      return data?.setting_value as Record<string, Record<string, string>> | null;
    },
  });

  useEffect(() => {
    if (saved) {
      setServices([1, 2, 3, 4].map((n, i) => ({
        title_en: saved[`service${n}_title`]?.en ?? '',
        title_bn: saved[`service${n}_title`]?.bn ?? '',
        desc_en: saved[`service${n}_desc`]?.en ?? '',
        desc_bn: saved[`service${n}_desc`]?.bn ?? '',
        icon: saved[`service${n}_icon`]?.en ?? ['Gift', 'Monitor', 'Briefcase', 'GlassWater'][i],
      })));
    }
  }, [saved]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const value: Record<string, Record<string, string>> = {};
      services.forEach((s, i) => {
        const n = i + 1;
        value[`service${n}_title`] = { en: s.title_en, bn: s.title_bn };
        value[`service${n}_desc`] = { en: s.desc_en, bn: s.desc_bn };
        value[`service${n}_icon`] = { en: s.icon, bn: s.icon };
      });
      const { data: existing } = await supabase.from('site_settings')
        .select('id').eq('setting_key', 'services').maybeSingle();
      if (existing) {
        const { error } = await supabase.from('site_settings')
          .update({ setting_value: value as unknown as Json }).eq('setting_key', 'services');
        if (error) throw error;
      } else {
        const { error } = await supabase.from('site_settings')
          .insert({ setting_key: 'services', setting_value: value as unknown as Json });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings-public'] });
      toast({ title: 'Services saved ✅' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const update = (idx: number, field: keyof ServiceData, val: string) => {
    setServices(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s));
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Services Section</h1>
          <p className="text-muted-foreground text-sm">Edit the 4 service cards with bilingual content</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
          className="bg-sm-red hover:bg-[hsl(var(--sm-red-dark))] text-white">
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save All
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="space-y-4">
          {services.map((s, idx) => (
            <Card key={idx}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {(() => { const I = iconMap[s.icon] || Gift; return <I className="h-4 w-4 text-primary" />; })()}
                  Service {idx + 1}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Icon</Label>
                  <div className="flex gap-2 mt-1">
                    {iconOptions.map(opt => (
                      <button key={opt.name} type="button"
                        onClick={() => update(idx, 'icon', opt.name)}
                        className={`p-2 rounded-lg border transition-colors ${
                          s.icon === opt.name ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                        }`}>
                        <opt.Icon className="h-5 w-5" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">🇬🇧 Title (English)</Label>
                    <Input value={s.title_en} onChange={e => update(idx, 'title_en', e.target.value)} placeholder="Service title" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">🇧🇩 Title (বাংলা)</Label>
                    <Input value={s.title_bn} onChange={e => update(idx, 'title_bn', e.target.value)} placeholder="সেবার শিরোনাম" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">🇬🇧 Description</Label>
                    <Textarea value={s.desc_en} onChange={e => update(idx, 'desc_en', e.target.value)} rows={2} placeholder="Description" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">🇧🇩 বর্ণনা</Label>
                    <Textarea value={s.desc_bn} onChange={e => update(idx, 'desc_bn', e.target.value)} rows={2} placeholder="বর্ণনা" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Live Preview */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm">Live Preview</span>
            <div className="flex gap-1 ml-auto">
              <button onClick={() => setPreviewLang('en')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  previewLang === 'en' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                }`}>EN</button>
              <button onClick={() => setPreviewLang('bn')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  previewLang === 'bn' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                }`}>বাংলা</button>
            </div>
          </div>

          <div className="border rounded-xl p-6 bg-background space-y-4">
            <div className="text-center mb-6">
              <span className="text-accent text-xs font-semibold tracking-widest uppercase">
                {previewLang === 'en' ? 'What We Offer' : 'আমরা যা অফার করি'}
              </span>
              <h2 className="text-xl font-bold mt-1">
                {previewLang === 'en' ? 'Our Services' : 'আমাদের সেবা'}
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {services.map((s, i) => {
                const Icon = iconMap[s.icon] || Gift;
                const title = previewLang === 'en' ? s.title_en : s.title_bn;
                const desc = previewLang === 'en' ? s.desc_en : s.desc_bn;
                return (
                  <div key={i} className="group border border-border/50 rounded-xl p-4 text-center hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-accent" />
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-bold text-sm mb-1">{title || <span className="text-muted-foreground italic">Untitled</span>}</h3>
                    <p className="text-muted-foreground text-xs leading-relaxed">{desc || <span className="italic">No description</span>}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminServices;

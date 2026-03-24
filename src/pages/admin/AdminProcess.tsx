import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, Eye, MessageSquare, PenTool, FlaskConical, Factory, Truck } from 'lucide-react';
type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

const stepIcons = [MessageSquare, PenTool, FlaskConical, Factory, Truck];

interface StepData {
  title_en: string; title_bn: string;
  desc_en: string; desc_bn: string;
}

const emptyStep: StepData = { title_en: '', title_bn: '', desc_en: '', desc_bn: '' };

const AdminProcess = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [steps, setSteps] = useState<StepData[]>(Array.from({ length: 5 }, () => ({ ...emptyStep })));
  const [previewLang, setPreviewLang] = useState<'en' | 'bn'>('en');

  const { data: saved, isLoading } = useQuery({
    queryKey: ['site-settings', 'process'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings').select('setting_value')
        .eq('setting_key', 'process').maybeSingle();
      if (error) throw error;
      return data?.setting_value as Record<string, Record<string, string>> | null;
    },
  });

  useEffect(() => {
    if (saved) {
      setSteps([1, 2, 3, 4, 5].map(n => ({
        title_en: saved[`step${n}_title`]?.en ?? '',
        title_bn: saved[`step${n}_title`]?.bn ?? '',
        desc_en: saved[`step${n}_desc`]?.en ?? '',
        desc_bn: saved[`step${n}_desc`]?.bn ?? '',
      })));
    }
  }, [saved]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const value: Record<string, Record<string, string>> = {};
      steps.forEach((s, i) => {
        const n = i + 1;
        value[`step${n}_title`] = { en: s.title_en, bn: s.title_bn };
        value[`step${n}_desc`] = { en: s.desc_en, bn: s.desc_bn };
      });
      const { data: existing } = await supabase.from('site_settings')
        .select('id').eq('setting_key', 'process').maybeSingle();
      if (existing) {
        const { error } = await supabase.from('site_settings')
          .update({ setting_value: value as unknown as Json }).eq('setting_key', 'process');
        if (error) throw error;
      } else {
        const { error } = await supabase.from('site_settings')
          .insert({ setting_key: 'process', setting_value: value as unknown as Json });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings-public'] });
      toast({ title: 'Process steps saved ✅' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const update = (idx: number, field: keyof StepData, val: string) => {
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s));
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Process Steps</h1>
          <p className="text-muted-foreground text-sm">Edit the "How It Works" timeline with bilingual content</p>
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
          {steps.map((s, idx) => {
            const Icon = stepIcons[idx];
            return (
              <Card key={idx}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[hsl(var(--sm-gold))] flex items-center justify-center">
                      <span className="text-white font-bold text-xs">{idx + 1}</span>
                    </div>
                    <Icon className="h-4 w-4 text-primary" />
                    Step {idx + 1}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">🇬🇧 Title (English)</Label>
                      <Input value={s.title_en} onChange={e => update(idx, 'title_en', e.target.value)} placeholder="Step title" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">🇧🇩 Title (বাংলা)</Label>
                      <Input value={s.title_bn} onChange={e => update(idx, 'title_bn', e.target.value)} placeholder="ধাপের শিরোনাম" />
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
            );
          })}
        </div>

        {/* Live Preview */}
        <div className="space-y-3 lg:sticky lg:top-20 self-start">
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

          <div className="border rounded-xl p-6 bg-secondary/50">
            <div className="text-center mb-6">
              <span className="text-accent text-xs font-semibold tracking-widest uppercase">
                {previewLang === 'en' ? 'How It Works' : 'কিভাবে কাজ করে'}
              </span>
              <h2 className="text-xl font-bold mt-1">
                {previewLang === 'en' ? 'Our Process' : 'আমাদের প্রক্রিয়া'}
              </h2>
            </div>

            {/* Mini timeline */}
            <div className="relative pl-10 space-y-6">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-accent to-primary" />
              {steps.map((s, i) => {
                const Icon = stepIcons[i];
                const title = previewLang === 'en' ? s.title_en : s.title_bn;
                const desc = previewLang === 'en' ? s.desc_en : s.desc_bn;
                return (
                  <div key={i} className="relative">
                    <div className="absolute -left-6 top-2 w-7 h-7 rounded-full bg-[hsl(var(--sm-gold))] flex items-center justify-center shadow-md z-10">
                      <span className="text-white font-bold text-[10px]">{i + 1}</span>
                    </div>
                    <div className="bg-background rounded-xl p-4 shadow-sm border border-border/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-4 w-4 text-primary" />
                        <h3 className="font-bold text-sm">{title || <span className="text-muted-foreground italic">Untitled</span>}</h3>
                      </div>
                      <p className="text-muted-foreground text-xs leading-relaxed">{desc || <span className="italic">No description</span>}</p>
                    </div>
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

export default AdminProcess;

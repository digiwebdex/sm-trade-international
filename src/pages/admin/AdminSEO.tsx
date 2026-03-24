import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, Globe, Upload, Image as ImageIcon, Eye, CheckCircle2 } from 'lucide-react';

const PAGES = [
  { slug: 'home', label: 'Home Page', icon: '🏠' },
  { slug: 'catalog', label: 'Catalog', icon: '📦' },
  { slug: 'gallery', label: 'Gallery', icon: '🖼️' },
  { slug: 'about', label: 'About Page', icon: 'ℹ️' },
];

interface SeoRecord {
  id?: string;
  page_slug: string;
  meta_title_en: string;
  meta_title_bn: string;
  meta_description_en: string;
  meta_description_bn: string;
  keywords: string;
  og_image_url: string | null;
  canonical_url: string | null;
}

const emptySeo = (slug: string): SeoRecord => ({
  page_slug: slug,
  meta_title_en: '',
  meta_title_bn: '',
  meta_description_en: '',
  meta_description_bn: '',
  keywords: '',
  og_image_url: null,
  canonical_url: null,
});

const CharCount = ({ value, max, warn }: { value: string; max: number; warn: number }) => {
  const len = value.length;
  return (
    <span className={`text-xs ml-auto ${len > max ? 'text-destructive font-semibold' : len > warn ? 'text-yellow-600' : 'text-muted-foreground'}`}>
      {len}/{max}
    </span>
  );
};

const AdminSEO = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('home');
  const [forms, setForms] = useState<Record<string, SeoRecord>>(
    Object.fromEntries(PAGES.map(p => [p.slug, emptySeo(p.slug)]))
  );
  const [uploading, setUploading] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadSlug, setUploadSlug] = useState('');

  const { data: seoData, isLoading } = useQuery({
    queryKey: ['seo-meta-all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('seo_meta' as any).select('*');
      if (error) throw error;
      return (data as unknown) as SeoRecord[];
    },
  });

  useEffect(() => {
    if (seoData) {
      const updated = { ...forms };
      seoData.forEach((row: SeoRecord) => {
        updated[row.page_slug] = { ...emptySeo(row.page_slug), ...row };
      });
      setForms(updated);
    }
  }, [seoData]);

  const saveMutation = useMutation({
    mutationFn: async (slug: string) => {
      const form = forms[slug];
      const { data: existing } = await supabase
        .from('seo_meta' as any)
        .select('id')
        .eq('page_slug', slug)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from('seo_meta' as any).update(form).eq('page_slug', slug);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('seo_meta' as any).insert(form);
        if (error) throw error;
      }
    },
    onSuccess: (_, slug) => {
      queryClient.invalidateQueries({ queryKey: ['seo-meta-all'] });
      toast({ title: `SEO saved for ${PAGES.find(p => p.slug === slug)?.label}` });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const updateForm = (slug: string, field: keyof SeoRecord, value: string) => {
    setForms(prev => ({ ...prev, [slug]: { ...prev[slug], [field]: value } }));
  };

  const handleOgImageUpload = async (file: File, slug: string) => {
    setUploading(slug);
    const ext = file.name.split('.').pop();
    const path = `seo/${slug}-og-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('cms-images').upload(path, file);
    if (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      setUploading(null);
      return;
    }
    const { data: urlData } = supabase.storage.from('cms-images').getPublicUrl(path);
    updateForm(slug, 'og_image_url', urlData.publicUrl);
    setUploading(null);
    toast({ title: 'OG Image uploaded' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const PageSeoForm = ({ slug }: { slug: string }) => {
    const form = forms[slug];
    if (!form) return null;
    const titleLen = form.meta_title_en.length;
    const descLen = form.meta_description_en.length;

    return (
      <div className="space-y-6">
        {/* Google Preview */}
        <Card className="bg-muted/30 border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="h-4 w-4" /> Google Search Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-background rounded-lg p-4 border space-y-1 max-w-xl">
              <p className="text-xs text-muted-foreground">https://sm-trade-international.lovable.app/{slug === 'home' ? '' : slug}</p>
              <p className="text-base font-medium text-blue-600 truncate">
                {form.meta_title_en || 'Page Title (not set)'}
              </p>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {form.meta_description_en || 'Meta description will appear here…'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Meta Title */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="font-semibold">Meta Title (English)</Label>
            <CharCount value={form.meta_title_en} max={60} warn={50} />
            {titleLen >= 30 && titleLen <= 60 && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
          </div>
          <Input
            value={form.meta_title_en}
            onChange={e => updateForm(slug, 'meta_title_en', e.target.value)}
            placeholder="e.g. S.M. Trade International | Corporate Gifts Bangladesh"
          />
          <p className="text-xs text-muted-foreground">Ideal: 30–60 characters</p>
        </div>

        <div className="space-y-2">
          <Label className="font-semibold">Meta Title (বাংলা)</Label>
          <Input
            value={form.meta_title_bn}
            onChange={e => updateForm(slug, 'meta_title_bn', e.target.value)}
            placeholder="বাংলা টাইটেল"
          />
        </div>

        {/* Meta Description */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="font-semibold">Meta Description (English)</Label>
            <CharCount value={form.meta_description_en} max={160} warn={140} />
            {descLen >= 70 && descLen <= 160 && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
          </div>
          <Textarea
            value={form.meta_description_en}
            onChange={e => updateForm(slug, 'meta_description_en', e.target.value)}
            placeholder="Brief description for search engines…"
            rows={3}
          />
          <p className="text-xs text-muted-foreground">Ideal: 70–160 characters</p>
        </div>

        <div className="space-y-2">
          <Label className="font-semibold">Meta Description (বাংলা)</Label>
          <Textarea
            value={form.meta_description_bn}
            onChange={e => updateForm(slug, 'meta_description_bn', e.target.value)}
            placeholder="বাংলা বিবরণ…"
            rows={2}
          />
        </div>

        {/* Keywords */}
        <div className="space-y-2">
          <Label className="font-semibold">Keywords</Label>
          <Input
            value={form.keywords}
            onChange={e => updateForm(slug, 'keywords', e.target.value)}
            placeholder="corporate gifts, branded merchandise, bangladesh…"
          />
          <p className="text-xs text-muted-foreground">Comma-separated keywords</p>
        </div>

        {/* OG Image */}
        <div className="space-y-2">
          <Label className="font-semibold">OG Image (Social Share)</Label>
          <p className="text-xs text-muted-foreground">Recommended: 1200×630px. Used when shared on Facebook, Twitter, WhatsApp.</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              if (e.target.files?.[0]) handleOgImageUpload(e.target.files[0], uploadSlug);
            }}
          />
          {form.og_image_url ? (
            <div className="relative rounded-lg overflow-hidden border">
              <img src={form.og_image_url} alt="OG" className="w-full max-h-48 object-cover" />
              <div className="absolute bottom-2 right-2 flex gap-2">
                <Button
                  size="sm" variant="secondary"
                  onClick={() => { setUploadSlug(slug); fileRef.current?.click(); }}
                  disabled={uploading === slug}
                >
                  {uploading === slug ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Change'}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => updateForm(slug, 'og_image_url', '')}>
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full h-28 flex-col gap-2"
              onClick={() => { setUploadSlug(slug); fileRef.current?.click(); }}
              disabled={uploading === slug}
            >
              {uploading === slug ? (
                <><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /><span className="text-sm">Uploading…</span></>
              ) : (
                <><ImageIcon className="h-6 w-6 text-muted-foreground" /><span className="text-sm text-muted-foreground">Upload OG Image (1200×630)</span></>
              )}
            </Button>
          )}
        </div>

        {/* Canonical URL */}
        <div className="space-y-2">
          <Label className="font-semibold">Canonical URL <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Input
            value={form.canonical_url || ''}
            onChange={e => updateForm(slug, 'canonical_url', e.target.value)}
            placeholder="https://sm-trade-international.lovable.app/"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button
            onClick={() => saveMutation.mutate(slug)}
            disabled={saveMutation.isPending}
            className="bg-sm-red hover:bg-[hsl(var(--sm-red-dark))] text-white"
          >
            {saveMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</>
            ) : (
              <><Save className="h-4 w-4 mr-2" /> Save SEO</>
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Globe className="h-6 w-6 text-primary" /> SEO Settings
        </h1>
        <p className="text-muted-foreground mt-1">Configure per-page meta titles, descriptions, keywords, and Open Graph images.</p>
      </div>

      {/* Info banner */}
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
        <CardContent className="py-3 flex items-start gap-3">
          <Globe className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            SEO metadata is automatically injected into each page's <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded text-xs">&lt;head&gt;</code>. Changes take effect immediately without any rebuild.
          </p>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap gap-1 h-auto p-1">
          {PAGES.map(page => (
            <TabsTrigger key={page.slug} value={page.slug} className="gap-1.5">
              <span>{page.icon}</span> {page.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {PAGES.map(page => (
          <TabsContent key={page.slug} value={page.slug}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>{page.icon}</span> {page.label} SEO
                  {seoData?.some(d => d.page_slug === page.slug && d.meta_title_en) && (
                    <Badge variant="secondary" className="text-green-700 bg-green-100">Configured</Badge>
                  )}
                </CardTitle>
                <CardDescription>SEO settings for <code>/{page.slug === 'home' ? '' : page.slug}</code></CardDescription>
              </CardHeader>
              <CardContent>
                <PageSeoForm slug={page.slug} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AdminSEO;

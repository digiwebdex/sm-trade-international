import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, Upload, Image as ImageIcon, Target, Eye, Info } from 'lucide-react';

interface AboutSection {
  field_key: string;
  label: string;
  labelBn: string;
  icon: React.ElementType;
  description: string;
  rows?: number;
}

const SECTIONS: AboutSection[] = [
  {
    field_key: 'company_description',
    label: 'Company Description',
    labelBn: 'কোম্পানির বিবরণ',
    icon: Info,
    description: 'Main company overview shown at the top of the about section.',
    rows: 5,
  },
  {
    field_key: 'mission',
    label: 'Mission Statement',
    labelBn: 'মিশন',
    icon: Target,
    description: 'Our mission — what drives the company every day.',
    rows: 4,
  },
  {
    field_key: 'vision',
    label: 'Vision Statement',
    labelBn: 'ভিশন',
    icon: Eye,
    description: 'Our long-term vision and goals for the future.',
    rows: 4,
  },
  {
    field_key: 'company_history',
    label: 'Company History',
    labelBn: 'কোম্পানির ইতিহাস',
    icon: Info,
    description: 'Background story and founding history.',
    rows: 5,
  },
];

interface AboutRecord {
  id?: string;
  field_key: string;
  content_en: string;
  content_bn: string;
  image_url?: string | null;
}

const AdminAbout = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [contents, setContents] = useState<Record<string, AboutRecord>>({});
  const [companyImage, setCompanyImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: aboutData, isLoading } = useQuery({
    queryKey: ['about-page-admin'],
    queryFn: async () => {
      const { data, error } = await supabase.from('about_page' as any).select('*');
      if (error) throw error;
      return (data as unknown) as AboutRecord[];
    },
  });

  useEffect(() => {
    if (aboutData) {
      const map: Record<string, AboutRecord> = {};
      aboutData.forEach((row: AboutRecord) => {
        map[row.field_key] = row;
        if (row.field_key === 'company_description' && row.image_url) {
          setCompanyImage(row.image_url);
        }
      });
      setContents(map);
    }
  }, [aboutData]);

  const updateContent = (key: string, lang: 'en' | 'bn', value: string) => {
    setContents(prev => ({
      ...prev,
      [key]: {
        field_key: key,
        content_en: prev[key]?.content_en ?? '',
        content_bn: prev[key]?.content_bn ?? '',
        ...prev[key],
        [lang === 'en' ? 'content_en' : 'content_bn']: value,
      },
    }));
  };

  const saveMutation = useMutation({
    mutationFn: async (key: string) => {
      const record = contents[key] || { field_key: key, content_en: '', content_bn: '' };
      const payload = {
        field_key: key,
        content_en: record.content_en,
        content_bn: record.content_bn,
        image_url: key === 'company_description' ? companyImage || null : record.image_url,
      };

      const { data: existing } = await supabase
        .from('about_page' as any)
        .select('id')
        .eq('field_key', key)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from('about_page' as any).update(payload).eq('field_key', key);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('about_page' as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: (_, key) => {
      queryClient.invalidateQueries({ queryKey: ['about-page-admin'] });
      const section = SECTIONS.find(s => s.field_key === key);
      toast({ title: `${section?.label ?? key} saved ✅` });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const saveAllMutation = useMutation({
    mutationFn: async () => {
      for (const section of SECTIONS) {
        const record = contents[section.field_key] || { field_key: section.field_key, content_en: '', content_bn: '' };
        const payload = {
          field_key: section.field_key,
          content_en: record.content_en,
          content_bn: record.content_bn,
          image_url: section.field_key === 'company_description' ? companyImage || null : record.image_url,
        };

        const { data: existing } = await supabase
          .from('about_page' as any)
          .select('id')
          .eq('field_key', section.field_key)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase.from('about_page' as any).update(payload).eq('field_key', section.field_key);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('about_page' as any).insert(payload);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['about-page-admin'] });
      toast({ title: 'All about page sections saved ✅' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `about/company-image-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('cms-images').upload(path, file);
    if (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('cms-images').getPublicUrl(path);
    setCompanyImage(urlData.publicUrl);
    setUploading(false);
    toast({ title: 'Company image uploaded' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">About Page Editor</h1>
          <p className="text-muted-foreground mt-1">Edit mission, vision, company description, and company photo.</p>
        </div>
        <Button
          onClick={() => saveAllMutation.mutate()}
          disabled={saveAllMutation.isPending}
          className="bg-sm-red hover:bg-[hsl(var(--sm-red-dark))] text-white shrink-0"
        >
          {saveAllMutation.isPending ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving All…</>
          ) : (
            <><Save className="h-4 w-4 mr-2" /> Save All</>
          )}
        </Button>
      </div>

      {/* Company Image */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" /> Company Image
          </CardTitle>
          <CardDescription>Featured photo shown in the About section (recommended: landscape 16:9).</CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]); }}
          />
          {companyImage ? (
            <div className="relative rounded-xl overflow-hidden border">
              <img src={companyImage} alt="Company" className="w-full max-h-64 object-cover" />
              <div className="absolute bottom-3 right-3 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3 mr-1" />}
                  Change
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setCompanyImage('')}>Remove</Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full h-36 flex-col gap-2"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /><span className="text-sm">Uploading…</span></>
              ) : (
                <><Upload className="h-6 w-6 text-muted-foreground" /><span className="text-sm text-muted-foreground">Click to upload company image</span></>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Content sections */}
      {SECTIONS.map(section => {
        const Icon = section.icon;
        const record = contents[section.field_key];
        return (
          <Card key={section.field_key}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" /> {section.label}
                <span className="text-muted-foreground font-normal text-sm">/ {section.labelBn}</span>
              </CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    🇬🇧 <span>English</span>
                  </Label>
                  <Textarea
                    value={record?.content_en ?? ''}
                    onChange={e => updateContent(section.field_key, 'en', e.target.value)}
                    rows={section.rows ?? 4}
                    placeholder={`${section.label} in English…`}
                    className="resize-y"
                  />
                  <p className="text-xs text-muted-foreground">{(record?.content_en ?? '').length} characters</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    🇧🇩 <span>বাংলা</span>
                  </Label>
                  <Textarea
                    value={record?.content_bn ?? ''}
                    onChange={e => updateContent(section.field_key, 'bn', e.target.value)}
                    rows={section.rows ?? 4}
                    placeholder={`${section.labelBn}…`}
                    className="resize-y"
                  />
                  <p className="text-xs text-muted-foreground">{(record?.content_bn ?? '').length} characters</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => saveMutation.mutate(section.field_key)}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <Save className="h-3 w-3 mr-1.5" />}
                Save {section.label}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AdminAbout;

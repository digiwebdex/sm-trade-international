import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, Globe, Layout, Users, Phone, FileText, Layers, Cog } from 'lucide-react';
import type { Json } from '@/integrations/supabase/types';

type SettingsMap = Record<string, Record<string, string>>;

const defaultSettings: Record<string, SettingsMap> = {
  hero: {
    title: { en: '', bn: '' },
    subtitle: { en: '', bn: '' },
    cta_primary: { en: '', bn: '' },
    cta_secondary: { en: '', bn: '' },
  },
  about: {
    title: { en: '', bn: '' },
    description: { en: '', bn: '' },
    stat1_value: { en: '', bn: '' },
    stat1_label: { en: '', bn: '' },
    stat2_value: { en: '', bn: '' },
    stat2_label: { en: '', bn: '' },
    stat3_value: { en: '', bn: '' },
    stat3_label: { en: '', bn: '' },
    stat4_value: { en: '', bn: '' },
    stat4_label: { en: '', bn: '' },
  },
  contact: {
    phone: { en: '', bn: '' },
    email: { en: '', bn: '' },
    address: { en: '', bn: '' },
    whatsapp_number: { en: '', bn: '' },
    facebook: { en: '', bn: '' },
    linkedin: { en: '', bn: '' },
    instagram: { en: '', bn: '' },
  },
  seo: {
    page_title: { en: '', bn: '' },
    meta_description: { en: '', bn: '' },
    og_title: { en: '', bn: '' },
    og_description: { en: '', bn: '' },
  },
  footer: {
    description: { en: '', bn: '' },
    copyright: { en: '', bn: '' },
  },
  services: {
    service1_title: { en: '', bn: '' },
    service1_desc: { en: '', bn: '' },
    service1_icon: { en: 'Gift', bn: 'Gift' },
    service2_title: { en: '', bn: '' },
    service2_desc: { en: '', bn: '' },
    service2_icon: { en: 'Monitor', bn: 'Monitor' },
    service3_title: { en: '', bn: '' },
    service3_desc: { en: '', bn: '' },
    service3_icon: { en: 'Briefcase', bn: 'Briefcase' },
    service4_title: { en: '', bn: '' },
    service4_desc: { en: '', bn: '' },
    service4_icon: { en: 'GlassWater', bn: 'GlassWater' },
  },
  process: {
    step1_title: { en: '', bn: '' },
    step1_desc: { en: '', bn: '' },
    step2_title: { en: '', bn: '' },
    step2_desc: { en: '', bn: '' },
    step3_title: { en: '', bn: '' },
    step3_desc: { en: '', bn: '' },
    step4_title: { en: '', bn: '' },
    step4_desc: { en: '', bn: '' },
    step5_title: { en: '', bn: '' },
    step5_desc: { en: '', bn: '' },
  },
};

const AdminSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] = useState<Record<string, SettingsMap>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('*');
      if (error) throw error;
      const map: Record<string, SettingsMap> = {};
      data?.forEach((row) => {
        map[row.setting_key] = row.setting_value as unknown as SettingsMap;
      });
      return map;
    },
  });

  useEffect(() => {
    if (settings) {
      const merged: Record<string, SettingsMap> = {};
      for (const section of Object.keys(defaultSettings)) {
        merged[section] = {};
        for (const field of Object.keys(defaultSettings[section])) {
          merged[section][field] = {
            en: (settings[section]?.[field] as Record<string, string>)?.en ?? defaultSettings[section][field].en,
            bn: (settings[section]?.[field] as Record<string, string>)?.bn ?? defaultSettings[section][field].bn,
          };
        }
      }
      setLocalSettings(merged);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: SettingsMap }) => {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('setting_key', key)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ setting_value: value as unknown as Json })
          .eq('setting_key', key);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({ setting_key: key, setting_value: value as unknown as Json });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast({ title: 'সেটিংস সেভ হয়েছে ✅' });
    },
    onError: () => {
      toast({ title: 'Error saving settings', variant: 'destructive' });
    },
  });

  const updateField = (section: string, field: string, lang: string, value: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: { ...prev[section]?.[field], [lang]: value },
      },
    }));
  };

  const handleSave = (section: string) => {
    saveMutation.mutate({ key: section, value: localSettings[section] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const BilingualField = ({
    section,
    field,
    label,
    multiline = false,
  }: {
    section: string;
    field: string;
    label: string;
    multiline?: boolean;
  }) => {
    const Component = multiline ? Textarea : Input;
    return (
      <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
        <Label className="font-semibold text-sm">{label}</Label>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">🇬🇧 English</Label>
            <Component
              value={localSettings[section]?.[field]?.en ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                updateField(section, field, 'en', e.target.value)
              }
              placeholder={`${label} (English)`}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">🇧🇩 বাংলা</Label>
            <Component
              value={localSettings[section]?.[field]?.bn ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                updateField(section, field, 'bn', e.target.value)
              }
              placeholder={`${label} (বাংলা)`}
            />
          </div>
        </div>
      </div>
    );
  };

  const SaveButton = ({ section }: { section: string }) => (
    <Button
      onClick={() => handleSave(section)}
      disabled={saveMutation.isPending}
      className="mt-4"
    >
      {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
      Save {section.charAt(0).toUpperCase() + section.slice(1)} Settings
    </Button>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Site Settings</h1>
        <p className="text-muted-foreground">Manage your website content in English & Bengali</p>
      </div>

      <Tabs defaultValue="hero" className="w-full">
        <TabsList className="grid grid-cols-7 w-full max-w-3xl">
          <TabsTrigger value="hero" className="gap-1.5 text-xs">
            <Layout className="h-3.5 w-3.5" /> Hero
          </TabsTrigger>
          <TabsTrigger value="about" className="gap-1.5 text-xs">
            <Users className="h-3.5 w-3.5" /> About
          </TabsTrigger>
          <TabsTrigger value="services" className="gap-1.5 text-xs">
            <Cog className="h-3.5 w-3.5" /> Services
          </TabsTrigger>
          <TabsTrigger value="process" className="gap-1.5 text-xs">
            <Layers className="h-3.5 w-3.5" /> Process
          </TabsTrigger>
          <TabsTrigger value="contact" className="gap-1.5 text-xs">
            <Phone className="h-3.5 w-3.5" /> Contact
          </TabsTrigger>
          <TabsTrigger value="seo" className="gap-1.5 text-xs">
            <Globe className="h-3.5 w-3.5" /> SEO
          </TabsTrigger>
          <TabsTrigger value="footer" className="gap-1.5 text-xs">
            <FileText className="h-3.5 w-3.5" /> Footer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
              <CardDescription>Main banner text and call-to-action buttons</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <BilingualField section="hero" field="title" label="Hero Title" />
              <BilingualField section="hero" field="subtitle" label="Subtitle" multiline />
              <BilingualField section="hero" field="cta_primary" label="Primary Button Text" />
              <BilingualField section="hero" field="cta_secondary" label="Secondary Button Text" />
              <SaveButton section="hero" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>About Section</CardTitle>
              <CardDescription>Company info and statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <BilingualField section="about" field="title" label="Section Title" />
              <BilingualField section="about" field="description" label="Description" multiline />
              <div className="border-t pt-4 mt-4">
                <Label className="font-semibold text-sm mb-3 block">Statistics</Label>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="grid md:grid-cols-2 gap-3">
                      <BilingualField section="about" field={`stat${n}_value`} label={`Stat ${n} Value`} />
                      <BilingualField section="about" field={`stat${n}_label`} label={`Stat ${n} Label`} />
                    </div>
                  ))}
                </div>
              </div>
              <SaveButton section="about" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Services Section</CardTitle>
              <CardDescription>Edit the 4 service cards shown on the homepage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="border rounded-lg p-4 space-y-3">
                  <Label className="font-semibold">Service {n}</Label>
                  <BilingualField section="services" field={`service${n}_title`} label="Title" />
                  <BilingualField section="services" field={`service${n}_desc`} label="Description" multiline />
                  <BilingualField section="services" field={`service${n}_icon`} label="Icon Name (Lucide)" />
                </div>
              ))}
              <SaveButton section="services" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="process">
          <Card>
            <CardHeader>
              <CardTitle>Process Steps</CardTitle>
              <CardDescription>Edit the 5 "How It Works" steps on the homepage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="border rounded-lg p-4 space-y-3">
                  <Label className="font-semibold">Step {n}</Label>
                  <BilingualField section="process" field={`step${n}_title`} label="Title" />
                  <BilingualField section="process" field={`step${n}_desc`} label="Description" multiline />
                </div>
              ))}
              <SaveButton section="process" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Phone, email, address, and WhatsApp</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <BilingualField section="contact" field="phone" label="Phone Number" />
              <BilingualField section="contact" field="email" label="Email Address" />
              <BilingualField section="contact" field="address" label="Address" />
              <BilingualField section="contact" field="whatsapp_number" label="WhatsApp Number" />
              <SaveButton section="contact" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>Search engine optimization metadata</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <BilingualField section="seo" field="page_title" label="Page Title" />
              <BilingualField section="seo" field="meta_description" label="Meta Description" multiline />
              <BilingualField section="seo" field="og_title" label="OG Title (Social Share)" />
              <BilingualField section="seo" field="og_description" label="OG Description" multiline />
              <SaveButton section="seo" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="footer">
          <Card>
            <CardHeader>
              <CardTitle>Footer Settings</CardTitle>
              <CardDescription>Footer description and copyright text</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <BilingualField section="footer" field="description" label="Footer Description" multiline />
              <BilingualField section="footer" field="copyright" label="Copyright Text" />
              <SaveButton section="footer" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;

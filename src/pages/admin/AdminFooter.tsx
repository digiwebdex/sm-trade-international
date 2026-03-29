import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Trash2, GripVertical, Save, Facebook, Linkedin, Instagram, Twitter, Youtube, Globe, Upload, X, ImageIcon } from 'lucide-react';

/* ─── types ─── */
interface QuickLink {
  id: string;
  label_en: string;
  label_bn: string;
  href: string;
  isRoute: boolean;
}

interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

interface FooterTexts {
  description_en: string;
  description_bn: string;
  copyright_en: string;
  copyright_bn: string;
  quicklinks_title_en: string;
  quicklinks_title_bn: string;
  contactinfo_title_en: string;
  contactinfo_title_bn: string;
}

const defaultTexts: FooterTexts = {
  description_en: '',
  description_bn: '',
  copyright_en: 'All rights reserved',
  copyright_bn: 'সর্বস্বত্ব সংরক্ষিত',
  quicklinks_title_en: 'Quick Links',
  quicklinks_title_bn: 'দ্রুত লিঙ্ক',
  contactinfo_title_en: 'Contact Info',
  contactinfo_title_bn: 'যোগাযোগের তথ্য',
};

const defaultLinks: QuickLink[] = [
  { id: '1', label_en: 'Home', label_bn: 'হোম', href: '/#home', isRoute: false },
  { id: '2', label_en: 'About', label_bn: 'সম্পর্কে', href: '/about', isRoute: true },
  { id: '3', label_en: 'Services', label_bn: 'সেবা', href: '/#services', isRoute: false },
  { id: '4', label_en: 'Products', label_bn: 'পণ্য', href: '/#products', isRoute: false },
  { id: '5', label_en: 'Contact', label_bn: 'যোগাযোগ', href: '/#contact', isRoute: false },
];

const socialIcons: Record<string, typeof Facebook> = {
  facebook: Facebook,
  linkedin: Linkedin,
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  website: Globe,
};

const AdminFooter = () => {
  const queryClient = useQueryClient();
  const [links, setLinks] = useState<QuickLink[]>(defaultLinks);
  const [socials, setSocials] = useState<SocialLink[]>([
    { platform: 'facebook', url: '', icon: 'facebook' },
    { platform: 'linkedin', url: '', icon: 'linkedin' },
    { platform: 'instagram', url: '', icon: 'instagram' },
  ]);
  const [texts, setTexts] = useState<FooterTexts>(defaultTexts);
  const [bgImage, setBgImage] = useState('/images/footer-bg.jpg');
  const [uploadingBg, setUploadingBg] = useState(false);
  const bgFileRef = useRef<HTMLInputElement>(null);

  // Load existing settings
  const { data: settings } = useQuery({
    queryKey: ['site-settings-public'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('*');
      if (error) throw error;
      const map: Record<string, any> = {};
      data?.forEach((row: any) => { map[row.setting_key] = row.setting_value; });
      return map;
    },
  });

  useEffect(() => {
    if (!settings) return;
    // Load quick links
    if (settings.footer_links) {
      setLinks(settings.footer_links as unknown as QuickLink[]);
    }
    // Load social links from contact settings
    if (settings.contact) {
      const c = settings.contact as any;
      setSocials([
        { platform: 'facebook', url: c.facebook || '', icon: 'facebook' },
        { platform: 'linkedin', url: c.linkedin || '', icon: 'linkedin' },
        { platform: 'instagram', url: c.instagram || '', icon: 'instagram' },
        { platform: 'twitter', url: c.twitter || '', icon: 'twitter' },
        { platform: 'youtube', url: c.youtube || '', icon: 'youtube' },
      ].filter(s => s.url || ['facebook', 'linkedin', 'instagram'].includes(s.platform)));
    }
    // Load footer texts + bg image
    if (settings.footer) {
      const f = settings.footer as any;
      setTexts(prev => ({
        ...prev,
        description_en: f.description_en || f.description || prev.description_en,
        description_bn: f.description_bn || prev.description_bn,
        copyright_en: f.copyright_en || f.copyright || prev.copyright_en,
        copyright_bn: f.copyright_bn || prev.copyright_bn,
        quicklinks_title_en: f.quicklinks_title_en || prev.quicklinks_title_en,
        quicklinks_title_bn: f.quicklinks_title_bn || prev.quicklinks_title_bn,
        contactinfo_title_en: f.contactinfo_title_en || prev.contactinfo_title_en,
        contactinfo_title_bn: f.contactinfo_title_bn || prev.contactinfo_title_bn,
      }));
      if (f.bg_image) setBgImage(f.bg_image);
    }
  }, [settings]);

  // Upsert a setting
  const upsertSetting = async (key: string, value: any) => {
    // Try update first
    const { data: existing } = await supabase
      .from('site_settings')
      .select('id')
      .eq('setting_key', key);
    
    if (existing && existing.length > 0) {
      await supabase
        .from('site_settings')
        .update({ setting_value: value, updated_at: new Date().toISOString() })
        .eq('setting_key', key);
    } else {
      await supabase
        .from('site_settings')
        .insert({ setting_key: key, setting_value: value });
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Save quick links
      await upsertSetting('footer_links', links);

      // Save footer texts
      await upsertSetting('footer', {
        description_en: texts.description_en,
        description_bn: texts.description_bn,
        description: texts.description_en, // backward compat
        copyright_en: texts.copyright_en,
        copyright_bn: texts.copyright_bn,
        copyright: texts.copyright_en,
        quicklinks_title_en: texts.quicklinks_title_en,
        quicklinks_title_bn: texts.quicklinks_title_bn,
        contactinfo_title_en: texts.contactinfo_title_en,
        contactinfo_title_bn: texts.contactinfo_title_bn,
      });

      // Update social URLs in contact settings
      const contactData = (settings?.contact as any) || {};
      const updatedContact = { ...contactData };
      socials.forEach(s => {
        updatedContact[s.platform] = s.url;
      });
      await upsertSetting('contact', updatedContact);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings-public'] });
      toast.success('Footer settings saved!');
    },
    onError: () => toast.error('Failed to save footer settings'),
  });

  /* ─── Quick link helpers ─── */
  const addLink = () => {
    setLinks(prev => [...prev, {
      id: Date.now().toString(),
      label_en: '',
      label_bn: '',
      href: '/',
      isRoute: false,
    }]);
  };

  const removeLink = (id: string) => setLinks(prev => prev.filter(l => l.id !== id));

  const updateLink = (id: string, field: keyof QuickLink, value: string | boolean) => {
    setLinks(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  /* ─── Social helpers ─── */
  const addSocial = () => {
    setSocials(prev => [...prev, { platform: 'website', url: '', icon: 'website' }]);
  };

  const removeSocial = (idx: number) => setSocials(prev => prev.filter((_, i) => i !== idx));

  const updateSocial = (idx: number, field: keyof SocialLink, value: string) => {
    setSocials(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Footer Manager</h1>
          <p className="text-muted-foreground">Edit footer quick links, social media URLs, and text content</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? 'Saving...' : 'Save All'}
        </Button>
      </div>

      {/* Footer Texts */}
      <Card>
        <CardHeader><CardTitle>Footer Text Content</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Description (EN)</Label>
              <Textarea value={texts.description_en} onChange={e => setTexts(p => ({ ...p, description_en: e.target.value }))} placeholder="Company description..." />
            </div>
            <div>
              <Label>Description (BN)</Label>
              <Textarea value={texts.description_bn} onChange={e => setTexts(p => ({ ...p, description_bn: e.target.value }))} placeholder="কোম্পানির বিবরণ..." />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Copyright Text (EN)</Label>
              <Input value={texts.copyright_en} onChange={e => setTexts(p => ({ ...p, copyright_en: e.target.value }))} />
            </div>
            <div>
              <Label>Copyright Text (BN)</Label>
              <Input value={texts.copyright_bn} onChange={e => setTexts(p => ({ ...p, copyright_bn: e.target.value }))} />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Quick Links Title (EN)</Label>
              <Input value={texts.quicklinks_title_en} onChange={e => setTexts(p => ({ ...p, quicklinks_title_en: e.target.value }))} />
            </div>
            <div>
              <Label>Quick Links Title (BN)</Label>
              <Input value={texts.quicklinks_title_bn} onChange={e => setTexts(p => ({ ...p, quicklinks_title_bn: e.target.value }))} />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Contact Info Title (EN)</Label>
              <Input value={texts.contactinfo_title_en} onChange={e => setTexts(p => ({ ...p, contactinfo_title_en: e.target.value }))} />
            </div>
            <div>
              <Label>Contact Info Title (BN)</Label>
              <Input value={texts.contactinfo_title_bn} onChange={e => setTexts(p => ({ ...p, contactinfo_title_bn: e.target.value }))} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Quick Links</CardTitle>
          <Button size="sm" variant="outline" onClick={addLink}>
            <Plus className="h-4 w-4 mr-1" /> Add Link
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {links.map((link) => (
            <div key={link.id} className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30">
              <GripVertical className="h-5 w-5 text-muted-foreground mt-2 shrink-0" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-1">
                <Input placeholder="Label (EN)" value={link.label_en} onChange={e => updateLink(link.id, 'label_en', e.target.value)} />
                <Input placeholder="Label (BN)" value={link.label_bn} onChange={e => updateLink(link.id, 'label_bn', e.target.value)} />
                <Input placeholder="URL / path" value={link.href} onChange={e => updateLink(link.id, 'href', e.target.value)} />
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
                    <input type="checkbox" checked={link.isRoute} onChange={e => updateLink(link.id, 'isRoute', e.target.checked)} className="rounded" />
                    Route link
                  </label>
                  <Button size="icon" variant="ghost" className="text-destructive shrink-0" onClick={() => removeLink(link.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {links.length === 0 && <p className="text-center text-muted-foreground py-6">No quick links. Add one above.</p>}
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Social Media Links</CardTitle>
          <Button size="sm" variant="outline" onClick={addSocial}>
            <Plus className="h-4 w-4 mr-1" /> Add Social
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {socials.map((social, idx) => {
            const IconComp = socialIcons[social.platform] || Globe;
            return (
              <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                <IconComp className="h-5 w-5 text-muted-foreground shrink-0" />
                <select
                  value={social.platform}
                  onChange={e => {
                    updateSocial(idx, 'platform', e.target.value);
                    updateSocial(idx, 'icon', e.target.value);
                  }}
                  className="border rounded-md px-2 py-1.5 text-sm bg-background"
                >
                  {Object.keys(socialIcons).map(p => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
                <Input placeholder="https://..." value={social.url} onChange={e => updateSocial(idx, 'url', e.target.value)} className="flex-1" />
                <Button size="icon" variant="ghost" className="text-destructive shrink-0" onClick={() => removeSocial(idx)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFooter;

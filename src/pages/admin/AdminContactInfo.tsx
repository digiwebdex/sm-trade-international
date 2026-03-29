import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, Phone, Mail, MapPin, MessageCircle, Facebook, Linkedin, Instagram } from 'lucide-react';

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

interface ContactData {
  phone: string;
  email: string;
  address: string;
  address_bn: string;
  whatsapp_number: string;
  facebook: string;
  linkedin: string;
  instagram: string;
  twitter: string;
  youtube: string;
}

const defaultContact: ContactData = {
  phone: '', email: '', address: '', address_bn: '',
  whatsapp_number: '', facebook: '', linkedin: '', instagram: '',
  twitter: '', youtube: '',
};

const AdminContactInfo = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ContactData>(defaultContact);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['site-settings-contact'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('setting_key', 'contact')
        .maybeSingle();
      if (error) throw error;
      return data?.setting_value as unknown as Record<string, any> | null;
    },
  });

  useEffect(() => {
    if (settings) {
      setForm({
        phone: settings.phone?.en || settings.phone || '',
        email: settings.email?.en || settings.email || '',
        address: settings.address?.en || settings.address || '',
        address_bn: settings.address?.bn || settings.address_bn || '',
        whatsapp_number: settings.whatsapp_number?.en || settings.whatsapp_number || '',
        facebook: settings.facebook?.en || settings.facebook || '',
        linkedin: settings.linkedin?.en || settings.linkedin || '',
        instagram: settings.instagram?.en || settings.instagram || '',
        twitter: settings.twitter?.en || settings.twitter || '',
        youtube: settings.youtube?.en || settings.youtube || '',
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Save in the bilingual format expected by useSiteSettings
      const payload: Record<string, any> = {};
      for (const [key, val] of Object.entries(form)) {
        if (key === 'address_bn') continue;
        payload[key] = { en: val, bn: val };
      }
      payload.address = { en: form.address, bn: form.address_bn || form.address };

      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('setting_key', 'contact')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ setting_value: payload as unknown as Json })
          .eq('setting_key', 'contact');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({ setting_key: 'contact', setting_value: payload as unknown as Json });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings-contact'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings-public'] });
      toast({ title: 'Contact info saved ✅' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contact Information</h1>
          <p className="text-muted-foreground text-sm">Manage phone, email, address, WhatsApp, and social links</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save
        </Button>
      </div>

      {/* Primary Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Primary Contact</CardTitle>
          <CardDescription>Phone, email, and WhatsApp used across the website</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm"><Phone className="h-3.5 w-3.5" /> Phone Number</Label>
              <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+880 1867-666888" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp Number</Label>
              <Input value={form.whatsapp_number} onChange={e => setForm(p => ({ ...p, whatsapp_number: e.target.value }))} placeholder="8801867666888" />
              <p className="text-xs text-muted-foreground">Numbers only, with country code (no + or spaces)</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm"><Mail className="h-3.5 w-3.5" /> Email Address</Label>
            <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="info@smtradeint.com" />
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Address</CardTitle>
          <CardDescription>Physical address shown in footer and contact section</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm"><MapPin className="h-3.5 w-3.5" /> Address (English)</Label>
            <Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="123 Main Street, Dhaka" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm"><MapPin className="h-3.5 w-3.5" /> ঠিকানা (বাংলা)</Label>
            <Input value={form.address_bn} onChange={e => setForm(p => ({ ...p, address_bn: e.target.value }))} placeholder="১২৩ মেইন স্ট্রিট, ঢাকা" />
          </div>
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Social Media Links</CardTitle>
          <CardDescription>Social media profile URLs shown in footer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm"><Facebook className="h-3.5 w-3.5" /> Facebook</Label>
            <Input value={form.facebook} onChange={e => setForm(p => ({ ...p, facebook: e.target.value }))} placeholder="https://facebook.com/..." />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm"><Linkedin className="h-3.5 w-3.5" /> LinkedIn</Label>
            <Input value={form.linkedin} onChange={e => setForm(p => ({ ...p, linkedin: e.target.value }))} placeholder="https://linkedin.com/company/..." />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm"><Instagram className="h-3.5 w-3.5" /> Instagram</Label>
            <Input value={form.instagram} onChange={e => setForm(p => ({ ...p, instagram: e.target.value }))} placeholder="https://instagram.com/..." />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminContactInfo;

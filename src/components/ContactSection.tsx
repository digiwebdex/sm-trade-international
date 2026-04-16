import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { supabase } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Phone, Mail, MapPin, MessageCircle, Send } from 'lucide-react';

const ContactSection = () => {
  const { t, lang, tt } = useLanguage();
  const { get } = useSiteSettings();
  const { toast } = useToast();

  const phone = get('contact', 'phone', '+88 01867666888');
  const email = get('contact', 'email', 'smtrade.int94@gmail.com');
  const address = get('contact', 'address', t('contact.addressValue'));
  const whatsapp = get('contact', 'whatsapp_number', '8801867666888');

  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast({ title: tt('Please fill required fields', 'প্রয়োজনীয় ক্ষেত্র পূরণ করুন', '请填写必填字段'), variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('contact_messages').insert({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        message: form.message.trim(),
      });
      if (error) throw error;
      toast({ title: tt('Message sent successfully!', 'বার্তা সফলভাবে পাঠানো হয়েছে!', '消息发送成功！') });
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch (err) {
      console.error(err);
      toast({ title: tt('Failed to send message', 'বার্তা পাঠাতে ব্যর্থ', '消息发送失败'), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'bg-background border-border/50 shadow-sm focus:shadow-md transition-shadow';

  const contactItems = [
    { icon: MapPin, label: t('contact.address'), value: address },
    { icon: Phone, label: tt('Phone', 'ফোন', '电话'), value: phone },
    { icon: Mail, label: tt('Email', 'ইমেইল', '邮箱'), value: email },
  ];

  return (
    <section id="contact" className="py-24 bg-secondary">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-block text-accent text-sm font-semibold tracking-widest uppercase mb-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            {tt('Reach Out', 'যোগাযোগ করুন', '联系方式')}
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-5">{t('contact.title')}</h2>
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-accent/40" />
            <div className="w-2 h-2 rounded-full bg-accent" />
            <div className="h-px w-12 bg-accent/40" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input placeholder={t('contact.name') + ' *'} value={form.name} onChange={set('name')} className={inputClass} required />
            <Input type="email" placeholder={t('contact.email') + ' *'} value={form.email} onChange={set('email')} className={inputClass} required />
            <Input type="tel" placeholder={t('contact.phone')} value={form.phone} onChange={set('phone')} className={inputClass} />
            <Textarea placeholder={t('contact.message') + ' *'} value={form.message} onChange={set('message')} rows={5} className={inputClass} required />
            <Button type="submit" disabled={submitting} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <Send className="h-4 w-4" />
              {submitting ? tt('Sending...', 'পাঠানো হচ্ছে...', '发送中...') : t('contact.send')}
            </Button>
          </form>

          {/* Info */}
          <div className="space-y-6">
            {contactItems.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary transition-colors duration-300">
                  <Icon className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>{label}</h4>
                  <p className="text-muted-foreground text-sm">{value}</p>
                </div>
              </div>
            ))}

            <a
              href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[hsl(142,70%,40%)] text-white px-6 py-3 rounded-xl font-medium hover:bg-[hsl(142,70%,35%)] transition-colors shadow-md"
            >
              <MessageCircle className="h-5 w-5" />
              {t('contact.whatsapp')}
            </a>

            {(() => {
              const mapsUrl = get('branding', 'google_maps_embed', '');
              if (mapsUrl) {
                return (
                  <div className="rounded-xl overflow-hidden h-48 shadow-sm mt-4">
                    <iframe
                      src={mapsUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Location Map"
                    />
                  </div>
                );
              }
              return (
                <div className="bg-muted rounded-xl h-48 flex items-center justify-center text-muted-foreground text-sm mt-4 shadow-sm">
                  {tt('Add Google Maps URL in Admin Settings → Branding', 'অ্যাডমিন সেটিংস → ব্র্যান্ডিং থেকে Google Maps URL যোগ করুন', '在管理设置 → 品牌中添加 Google 地图 URL')}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;

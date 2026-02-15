import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react';

const ContactSection = () => {
  const { t } = useLanguage();

  return (
    <section id="contact" className="py-20 bg-secondary">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">{t('contact.title')}</h2>
        <div className="w-16 h-1 bg-sm-red mx-auto mb-12 rounded" />

        <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
          <div>
            <form className="space-y-4" onSubmit={e => e.preventDefault()}>
              <Input placeholder={t('contact.name')} className="bg-background" />
              <Input type="email" placeholder={t('contact.email')} className="bg-background" />
              <Input type="tel" placeholder={t('contact.phone')} className="bg-background" />
              <Textarea placeholder={t('contact.message')} rows={5} className="bg-background" />
              <Button type="submit" className="w-full bg-sm-red hover:bg-[hsl(var(--sm-red-dark))] text-white">
                {t('contact.send')}
              </Button>
            </form>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <MapPin className="h-5 w-5 text-sm-red mt-1 shrink-0" />
              <div>
                <h4 className="font-semibold mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>{t('contact.address')}</h4>
                <p className="text-muted-foreground text-sm">{t('contact.addressValue')}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Phone className="h-5 w-5 text-sm-red mt-1 shrink-0" />
              <div>
                <h4 className="font-semibold mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Phone</h4>
                <p className="text-muted-foreground text-sm">+88 01867666888</p>
                <p className="text-muted-foreground text-sm">+88 02224446664</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Mail className="h-5 w-5 text-sm-red mt-1 shrink-0" />
              <div>
                <h4 className="font-semibold mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Email</h4>
                <p className="text-muted-foreground text-sm">smtrade.int94@gmail.com</p>
              </div>
            </div>
            <a
              href="https://wa.me/8801867666888"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[hsl(142,70%,40%)] text-white px-6 py-3 rounded-lg font-medium hover:bg-[hsl(142,70%,35%)] transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              {t('contact.whatsapp')}
            </a>

            <div className="bg-muted rounded-lg h-48 flex items-center justify-center text-muted-foreground text-sm mt-4">
              Google Maps Placeholder
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;

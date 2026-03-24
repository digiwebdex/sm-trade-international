import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import logo from '@/assets/logo-sm.webp';
import { Phone, Mail, MapPin, Facebook, Linkedin, Instagram, Twitter, Youtube, Globe } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/apiClient';

const socialIconMap: Record<string, typeof Facebook> = {
  facebook: Facebook,
  linkedin: Linkedin,
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  website: Globe,
};

const Footer = () => {
  const { t, lang } = useLanguage();
  const { get } = useSiteSettings();

  const companyName = get('branding', 'company_name', 'S. M. Trade International');
  const tagline = get('branding', 'tagline', 'Premium Corporate Gifts');
  const creditText = get('branding', 'credit_text', 'Digitally Crafted by Digiwebdex.com');
  const creditUrl = get('branding', 'credit_url', 'https://digiwebdex.com');
  const phone = get('contact', 'phone', '+88 01867666888');
  const email = get('contact', 'email', 'smtrade.int94@gmail.com');
  const address = get('contact', 'address', t('contact.addressValue'));

  // Footer texts with lang support
  const desc = lang === 'bn'
    ? get('footer', 'description_bn', get('footer', 'description', t('footer.desc')))
    : get('footer', 'description_en', get('footer', 'description', t('footer.desc')));
  const copyright = lang === 'bn'
    ? get('footer', 'copyright_bn', get('footer', 'copyright', t('footer.rights')))
    : get('footer', 'copyright_en', get('footer', 'copyright', t('footer.rights')));
  const quicklinksTitle = lang === 'bn'
    ? get('footer', 'quicklinks_title_bn', t('footer.quicklinks'))
    : get('footer', 'quicklinks_title_en', t('footer.quicklinks'));
  const contactTitle = lang === 'bn'
    ? get('footer', 'contactinfo_title_bn', t('footer.contactinfo'))
    : get('footer', 'contactinfo_title_en', t('footer.contactinfo'));

  // Load dynamic quick links
  const { data: allSettings } = useQuery({
    queryKey: ['site-settings-public'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('*');
      if (error) throw error;
      const map: Record<string, any> = {};
      data?.forEach((row: any) => { map[row.setting_key] = row.setting_value; });
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });

  const dynamicLinks = allSettings?.footer_links as Array<{
    label_en: string; label_bn: string; href: string; isRoute: boolean;
  }> | undefined;

  const quickLinks = dynamicLinks || [
    { label_en: 'Home', label_bn: 'হোম', href: '/#home', isRoute: false },
    { label_en: 'About', label_bn: 'সম্পর্কে', href: '/about', isRoute: true },
    { label_en: 'Services', label_bn: 'সেবা', href: '/#services', isRoute: false },
    { label_en: 'Products', label_bn: 'পণ্য', href: '/#products', isRoute: false },
    { label_en: 'Contact', label_bn: 'যোগাযোগ', href: '/#contact', isRoute: false },
  ];

  // Social links from contact settings
  const contactSettings = allSettings?.contact as any;
  const socialPlatforms = ['facebook', 'linkedin', 'instagram', 'twitter', 'youtube'];
  const activeSocials = socialPlatforms
    .map(p => ({
      platform: p,
      url: contactSettings?.[p] || get('contact', p, ''),
      Icon: socialIconMap[p] || Globe,
    }))
    .filter(s => s.url && s.url !== '#' && s.url !== '');

  return (
    <footer className="bg-primary text-primary-foreground relative overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-transparent via-[hsl(var(--sm-gold))] to-transparent" />

      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'repeating-linear-gradient(45deg, hsl(var(--sm-gold)) 0, hsl(var(--sm-gold)) 1px, transparent 0, transparent 50%)',
        backgroundSize: '24px 24px',
      }} />

      <div className="container mx-auto px-4 py-14 relative">
        <div className="grid md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <img src={logo} alt="Logo" className="h-11 rounded" />
              <div>
                <span className="font-bold text-lg block" style={{ fontFamily: 'Montserrat, sans-serif' }}>{companyName}</span>
                <span className="text-primary-foreground/40 text-xs tracking-wider uppercase" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  {tagline}
                </span>
              </div>
            </div>
            <p className="text-primary-foreground/50 text-sm leading-relaxed mb-6">{desc}</p>
            
            <div className="flex items-center gap-3">
              {activeSocials.length > 0 ? (
                activeSocials.map((social, i) => (
                  <a
                    key={i}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-primary-foreground/5 border border-primary-foreground/10 flex items-center justify-center hover:bg-[hsl(var(--sm-gold))]/20 hover:border-[hsl(var(--sm-gold))]/40 transition-all duration-300"
                    title={social.platform}
                  >
                    <social.Icon className="h-4 w-4 text-primary-foreground/50 hover:text-[hsl(var(--sm-gold))]" />
                  </a>
                ))
              ) : (
                [Facebook, Linkedin, Instagram].map((Icon, i) => (
                  <span key={i} className="w-9 h-9 rounded-lg bg-primary-foreground/5 border border-primary-foreground/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary-foreground/30" />
                  </span>
                ))
              )}
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-5 text-lg" style={{ fontFamily: 'DM Sans, sans-serif' }}>{quicklinksTitle}</h4>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px w-6 bg-[hsl(var(--sm-gold))]/40" />
              <div className="w-1.5 h-1.5 rotate-45 bg-[hsl(var(--sm-gold))]/50" />
            </div>
            <div className="space-y-3">
              {quickLinks.map((item, idx) => {
                const label = lang === 'bn' && item.label_bn ? item.label_bn : item.label_en;
                return item.isRoute ? (
                  <Link
                    key={idx}
                    to={item.href}
                    className="block text-primary-foreground/50 hover:text-[hsl(var(--sm-gold))] text-sm transition-colors duration-300 hover:translate-x-1 transform"
                  >
                    {label}
                  </Link>
                ) : (
                  <a
                    key={idx}
                    href={item.href}
                    className="block text-primary-foreground/50 hover:text-[hsl(var(--sm-gold))] text-sm transition-colors duration-300 hover:translate-x-1 transform"
                  >
                    {label}
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-5 text-lg" style={{ fontFamily: 'DM Sans, sans-serif' }}>{contactTitle}</h4>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px w-6 bg-[hsl(var(--sm-gold))]/40" />
              <div className="w-1.5 h-1.5 rotate-45 bg-[hsl(var(--sm-gold))]/50" />
            </div>
            <div className="space-y-4 text-sm text-primary-foreground/50">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-foreground/5 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="h-4 w-4" />
                </div>
                <span className="leading-relaxed">{address}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-foreground/5 flex items-center justify-center shrink-0">
                  <Phone className="h-4 w-4" />
                </div>
                {phone}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-foreground/5 flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                {email}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-10 pt-8 flex flex-col items-center gap-4">
          <span className="text-primary-foreground/35 text-sm">
            © {new Date().getFullYear()} {companyName}. {copyright}
          </span>
          {creditText && (
            <span className="text-primary-foreground/35 text-sm">
              {creditUrl ? (
                <a href={creditUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[hsl(var(--sm-gold))] transition-colors duration-300">
                  {creditText}
                </a>
              ) : creditText}
            </span>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;

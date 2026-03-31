import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import logo from '@/assets/logo-sm.webp';
import { Phone, Mail, MapPin, Facebook, Linkedin, Instagram, Twitter, Youtube, Globe } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/apiClient';
import { useEffect, useRef, useState } from 'react';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const footerRef = useRef<HTMLElement>(null);

  const companyName = get('branding', 'company_name', 'S. M. Trade International');
  const tagline = get('branding', 'tagline', 'Premium Corporate Gifts');
  const creditText = get('branding', 'credit_text', 'Digitally Crafted by Digiwebdex.com');
  const creditUrl = get('branding', 'credit_url', 'https://digiwebdex.com');
  const phone = get('contact', 'phone', '+88 01867666888');
  const email = get('contact', 'email', 'info@smtradeint.com');
  const address = get('contact', 'address', t('contact.addressValue'));

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

  const footerVideoUrl = get('footer', 'video_url', 'https://videos.pexels.com/video-files/6578977/6578977-uhd_2560_1440_30fps.mp4');
  const footerBgImage = get('footer', 'bg_image', '/images/footer-bg.jpg');

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

  const contactSettings = allSettings?.contact as any;
  const socialPlatforms = ['facebook', 'linkedin', 'instagram', 'twitter', 'youtube'];
  const activeSocials = socialPlatforms
    .map(p => ({
      platform: p,
      url: contactSettings?.[p] || get('contact', p, ''),
      Icon: socialIconMap[p] || Globe,
    }))
    .filter(s => s.url && s.url !== '#' && s.url !== '');

  // Intersection observer for entrance animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (footerRef.current) observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <footer ref={footerRef} className="text-primary-foreground relative overflow-hidden">
      {/* Top gold line */}
      <div className="h-1 bg-gradient-to-r from-transparent via-[hsl(var(--sm-gold))] to-transparent relative z-10" />

      {/* Video / Image Background */}
      <div className="absolute inset-0">
        {footerVideoUrl ? (
          <video
            ref={videoRef}
            src={footerVideoUrl}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={footerBgImage}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}
        {/* Dark overlay with brand tint */}
        <div className="absolute inset-0 bg-[hsl(var(--sm-green-dark))]/90" />
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--sm-black))]/60 via-transparent to-[hsl(var(--sm-black))]/30" />
      </div>

      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'repeating-linear-gradient(45deg, hsl(var(--sm-gold)) 0, hsl(var(--sm-gold)) 1px, transparent 0, transparent 50%)',
        backgroundSize: '24px 24px',
      }} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-14 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">

          {/* Column 1: Company Info */}
          <div
            className="transition-all duration-700"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
              transitionDelay: '0ms',
            }}
          >
            <div className="flex items-center gap-3 mb-5">
              <img src={logo} alt="Logo" className="h-14 w-14 rounded-lg object-contain bg-white/10 p-1" />
              <div>
                <span className="font-bold text-lg block whitespace-nowrap" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {companyName}
                </span>
                <span className="text-[hsl(var(--sm-gold))] text-xs tracking-wider uppercase" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  {tagline}
                </span>
              </div>
            </div>
            <p className="text-primary-foreground/60 text-sm leading-relaxed mb-6">{desc}</p>

            {/* Social Icons */}
            <div className="flex items-center gap-3">
              {activeSocials.length > 0 ? (
                activeSocials.map((social, i) => (
                  <a
                    key={i}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-primary-foreground/10 border border-primary-foreground/15 flex items-center justify-center hover:bg-[hsl(var(--sm-gold))] hover:border-[hsl(var(--sm-gold))] hover:scale-110 transition-all duration-300 group"
                    title={social.platform}
                  >
                    <social.Icon className="h-4 w-4 text-primary-foreground/60 group-hover:text-[hsl(var(--sm-green-dark))]" />
                  </a>
                ))
              ) : (
                [Facebook, Linkedin, Instagram, Youtube].map((Icon, i) => (
                  <span key={i} className="w-10 h-10 rounded-full bg-primary-foreground/10 border border-primary-foreground/15 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary-foreground/40" />
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div
            className="transition-all duration-700"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
              transitionDelay: '150ms',
            }}
          >
            <h4 className="font-bold mb-4 text-lg relative inline-block" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              <span className="text-[hsl(var(--sm-gold))]/50 mr-2">—</span>
              {quicklinksTitle}
            </h4>
            <div className="space-y-3 mt-2">
              {quickLinks.map((item, idx) => {
                const label = lang === 'bn' && item.label_bn ? item.label_bn : item.label_en;
                const cls = "flex items-center gap-2 text-primary-foreground/60 hover:text-[hsl(var(--sm-gold))] text-sm transition-all duration-300 group";
                const dot = <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--sm-gold))]/50 group-hover:bg-[hsl(var(--sm-gold))] transition-colors" />;
                return item.isRoute ? (
                  <Link key={idx} to={item.href} className={cls}>{dot}{label}</Link>
                ) : (
                  <a key={idx} href={item.href} className={cls}>{dot}{label}</a>
                );
              })}
            </div>
          </div>

          {/* Column 3: Contact Info */}
          <div
            className="transition-all duration-700"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
              transitionDelay: '300ms',
            }}
          >
            <h4 className="font-bold mb-4 text-lg" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              <span className="text-[hsl(var(--sm-gold))]/50 mr-2">—</span>
              {contactTitle}
            </h4>
            <div className="space-y-5 text-sm text-primary-foreground/60 mt-2">
              {/* Savar Office */}
              <div>
                <span className="text-[hsl(var(--sm-gold))] font-semibold text-xs uppercase tracking-wider block mb-1">
                  {lang === 'bn' ? 'সাভার অফিস' : 'SAVAR OFFICE'}
                </span>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[hsl(var(--sm-gold))]/15 border border-[hsl(var(--sm-gold))]/25 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="h-4 w-4 text-[hsl(var(--sm-gold))]" />
                  </div>
                  <span className="leading-relaxed">
                    B-25/4, Al-Baraka Super Market, Savar Bazar Bus-Stand, Savar, Dhaka-1340.
                  </span>
                </div>
              </div>
              {/* Banani Office */}
              <div>
                <span className="text-[hsl(var(--sm-gold))] font-semibold text-xs uppercase tracking-wider block mb-1">
                  {lang === 'bn' ? 'বনানী অফিস' : 'BANANI OFFICE'}
                </span>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[hsl(var(--sm-gold))]/15 border border-[hsl(var(--sm-gold))]/25 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="h-4 w-4 text-[hsl(var(--sm-gold))]" />
                  </div>
                  <span className="leading-relaxed">
                    House # 37, Block # C, Road # 6, Banani, Dhaka-1213.
                  </span>
                </div>
              </div>
              {/* Emails */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[hsl(var(--sm-gold))]/15 border border-[hsl(var(--sm-gold))]/25 flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 text-[hsl(var(--sm-gold))]" />
                </div>
                <div className="flex flex-col gap-1">
                  <a href="mailto:support@smtradeint.com" className="hover:text-[hsl(var(--sm-gold))] transition-colors">support@smtradeint.com</a>
                  <a href="mailto:info@smtradeint.com" className="hover:text-[hsl(var(--sm-gold))] transition-colors">info@smtradeint.com</a>
                </div>
              </div>
            </div>
          </div>

          {/* Column 4: Phone Numbers */}
          <div
            className="transition-all duration-700"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
              transitionDelay: '450ms',
            }}
          >
            <h4 className="font-bold mb-4 text-lg" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              <span className="text-[hsl(var(--sm-gold))]/50 mr-2">—</span>
              {lang === 'bn' ? 'ফোন নম্বর' : 'Phone Numbers'}
            </h4>
            <div className="space-y-2.5 text-sm text-primary-foreground/60 mt-2">
              {[
                '+02224446664',
                '+8801867666888',
                '+8801619959625',
                '+8801619959626',
                '+8801619959627',
                '+8801619959628',
                '+8801619959629',
                '+8801619959630',
              ].map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[hsl(var(--sm-gold))]/15 border border-[hsl(var(--sm-gold))]/25 flex items-center justify-center shrink-0">
                    <Phone className="h-3.5 w-3.5 text-[hsl(var(--sm-gold))]" />
                  </div>
                  <a href={`tel:${p}`} className="hover:text-[hsl(var(--sm-gold))] transition-colors">
                    {p}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className="border-t border-primary-foreground/10 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-700"
          style={{
            opacity: isVisible ? 1 : 0,
            transitionDelay: '600ms',
          }}
        >
          <span className="text-primary-foreground/40 text-sm">
            © {new Date().getFullYear()} {companyName}. {copyright}
          </span>
          {creditText && (
            <span className="text-primary-foreground/40 text-sm italic">
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

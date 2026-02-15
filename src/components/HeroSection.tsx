import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Button } from '@/components/ui/button';
import { useEffect, useRef } from 'react';
import heroBg from '@/assets/hero-bg.jpg';

const HeroSection = () => {
  const { t } = useLanguage();
  const { get } = useSiteSettings();
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (bgRef.current) {
        const scrollY = window.scrollY;
        bgRef.current.style.transform = `translateY(${scrollY * 0.4}px)`;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const title = get('hero', 'title', t('hero.title'));
  const subtitle = get('hero', 'subtitle', t('hero.subtitle'));
  const ctaPrimary = get('hero', 'cta_primary', t('hero.cta'));
  const ctaSecondary = get('hero', 'cta_secondary', t('hero.contact'));

  return (
    <section id="home" className="relative min-h-[85vh] flex items-center overflow-hidden">
      {/* Background image with parallax */}
      <div
        ref={bgRef}
        className="absolute inset-0 -top-20 -bottom-20 will-change-transform bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-[hsl(0,0%,4%)] opacity-60" />

      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute w-[700px] h-[700px] rounded-full opacity-30 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, hsl(0 72% 45% / 0.8) 0%, transparent 70%)',
            top: '10%',
            left: '15%',
            animation: 'heroOrb1 12s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-[80px]"
          style={{
            background: 'radial-gradient(circle, hsl(0 72% 55% / 0.6) 0%, transparent 70%)',
            bottom: '5%',
            right: '10%',
            animation: 'heroOrb2 10s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-15 blur-[60px]"
          style={{
            background: 'radial-gradient(circle, hsl(0 0% 100% / 0.1) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            animation: 'heroOrb3 14s ease-in-out infinite',
          }}
        />
      </div>

      {/* Animated mesh gradient overlay */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: `
            linear-gradient(135deg, transparent 0%, hsl(0 72% 20% / 0.3) 25%, transparent 50%),
            linear-gradient(225deg, transparent 0%, hsl(0 72% 30% / 0.2) 35%, transparent 60%)
          `,
          animation: 'heroShimmer 8s ease-in-out infinite alternate',
        }}
      />

      {/* Noise texture */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }} />

      {/* Animated grid lines */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `
          linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px),
          linear-gradient(0deg, hsl(0 0% 100%) 1px, transparent 1px)
        `,
        backgroundSize: '80px 80px',
        animation: 'heroGrid 20s linear infinite',
      }} />

      {/* Top & bottom accent lines */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--sm-red))]/30 to-transparent" />

      {/* Content */}
      <div className="container mx-auto px-4 py-28 md:py-40 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div
            className="inline-block bg-white/10 backdrop-blur-sm text-white text-xs font-semibold px-5 py-2 rounded-full mb-8 tracking-widest uppercase border border-white/10"
            style={{ animation: 'heroFadeUp 0.8s ease-out both' }}
          >
            S.M. Trade International
          </div>
          <h1
            className="text-4xl md:text-5xl lg:text-7xl font-bold leading-[1.1] mb-7 text-white"
            style={{ animation: 'heroFadeUp 0.8s 0.15s ease-out both' }}
          >
            {title}
          </h1>
          <p
            className="text-lg md:text-xl text-white/60 mb-12 max-w-2xl mx-auto leading-relaxed font-light"
            style={{ animation: 'heroFadeUp 0.8s 0.3s ease-out both' }}
          >
            {subtitle}
          </p>
            <div
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
            style={{ animation: 'heroFadeUp 0.8s 0.45s ease-out both' }}
          >
            <Button asChild size="lg" className="w-full sm:w-auto bg-sm-red hover:bg-[hsl(var(--sm-red-dark))] text-white text-lg sm:text-base px-10 py-7 sm:py-6 rounded-lg shadow-lg shadow-red-900/30">
              <a href="#contact">{ctaPrimary}</a>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto border-white/30 text-white bg-white/10 hover:bg-white/20 text-lg sm:text-base px-10 py-7 sm:py-6 rounded-lg backdrop-blur-sm">
              <a href="#products">{ctaSecondary}</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

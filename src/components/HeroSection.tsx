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
      {/* Background image */}
      <div
        ref={bgRef}
        className="absolute inset-0 -top-20 -bottom-20 will-change-transform bg-center"
        style={{ backgroundImage: `url(${heroBg})`, backgroundSize: '70%', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-[hsl(0,0%,4%)]/50" />

      {/* Content */}
      <div className="container mx-auto px-4 py-28 md:py-40 relative z-10">
        <div className="max-w-2xl text-left">
          <div
            className="inline-block bg-white/10 backdrop-blur-sm text-white text-xs font-semibold px-5 py-2 rounded-full mb-8 tracking-widest uppercase border border-white/10"
            style={{ animation: 'heroFadeUp 0.8s ease-out both' }}
          >
            S. M. Trade International
          </div>
          <h1
            className="text-4xl md:text-5xl lg:text-7xl font-bold leading-[1.1] mb-7 text-white"
            style={{ animation: 'heroFadeUp 0.8s 0.15s ease-out both' }}
          >
            {title}
          </h1>
          <p
            className="text-lg md:text-xl text-white/60 mb-12 max-w-xl leading-relaxed font-light"
            style={{ animation: 'heroFadeUp 0.8s 0.3s ease-out both' }}
          >
            {subtitle}
          </p>
          <div
            className="flex flex-col sm:flex-row gap-4 sm:gap-5 justify-start"
            style={{ animation: 'heroFadeUp 0.8s 0.45s ease-out both' }}
          >
            <Button asChild size="lg" className="w-full sm:w-auto bg-[hsl(var(--sm-red))] hover:bg-[hsl(var(--sm-red-dark))] text-white text-lg sm:text-base px-12 py-7 sm:py-6 rounded-xl transition-all duration-300">
              <a href="#contact">
                <span className="flex items-center gap-2 font-semibold tracking-wide">
                  {ctaPrimary}
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </span>
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto border-white/20 text-white bg-white/5 backdrop-blur-md text-lg sm:text-base px-12 py-7 sm:py-6 rounded-xl hover:bg-white/15 hover:border-white/40 transition-all duration-300">
              <a href="#products">
                <span className="font-semibold tracking-wide">{ctaSecondary}</span>
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

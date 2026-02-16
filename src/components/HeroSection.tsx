import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';

// Product images for carousel
import product3 from '@/assets/products/product-3.png';
import product4 from '@/assets/products/product-4.png';
import product5 from '@/assets/products/product-5.png';
import product7 from '@/assets/products/product-7.png';
import product8 from '@/assets/products/product-8.png';
import tiesBlue from '@/assets/products/ties-blue.png';
import glassware from '@/assets/products/glassware.png';

const carouselItems = [
  { img: product3, label: 'Crystal Awards' },
  { img: tiesBlue, label: 'Premium Ties' },
  { img: glassware, label: 'Custom Glassware' },
  { img: product4, label: 'Leather Goods' },
  { img: product5, label: 'Branded Pens' },
  { img: product7, label: 'Office Accessories' },
  { img: product8, label: 'Gift Sets' },
];

const stats = [
  { value: '500+', label: 'Clients' },
  { value: '10+', label: 'Years' },
  { value: '1000+', label: 'Products' },
  { value: '50+', label: 'Countries' },
];

const HeroSection = () => {
  const { t } = useLanguage();
  const { get } = useSiteSettings();
  const [current, setCurrent] = useState(0);

  const title = get('hero', 'title', t('hero.title'));
  const subtitle = get('hero', 'subtitle', t('hero.subtitle'));
  const ctaPrimary = get('hero', 'cta_primary', t('hero.cta'));

  const next = useCallback(() => setCurrent(i => (i + 1) % carouselItems.length), []);
  const prev = useCallback(() => setCurrent(i => (i - 1 + carouselItems.length) % carouselItems.length), []);

  useEffect(() => {
    const timer = setInterval(next, 3500);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section id="home" className="relative overflow-hidden bg-foreground">
      {/* Background image with overlay */}
      <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-br from-foreground/90 via-foreground/70 to-primary/30" />

      <div className="relative z-10 container mx-auto px-4 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[500px] lg:min-h-[560px]">

          {/* Left — Value Proposition */}
          <div className="flex flex-col justify-center" style={{ animation: 'heroFadeUp 0.7s ease-out both' }}>
            <span
              className="inline-flex items-center gap-2 text-primary-foreground/60 text-xs font-semibold tracking-[0.2em] uppercase mb-5"
              style={{ fontFamily: 'Montserrat, DM Sans, sans-serif' }}
            >
              <span className="w-8 h-px bg-primary" />
              S. M. Trade International
            </span>

            <h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-5 text-white"
              style={{ animation: 'heroFadeUp 0.7s 0.1s ease-out both' }}
            >
              {title}
            </h1>

            <p
              className="text-base md:text-lg text-white/60 mb-8 max-w-lg leading-relaxed"
              style={{ fontFamily: 'DM Sans, sans-serif', animation: 'heroFadeUp 0.7s 0.2s ease-out both' }}
            >
              {subtitle}
            </p>

            <div
              className="flex flex-col sm:flex-row gap-4"
              style={{ animation: 'heroFadeUp 0.7s 0.3s ease-out both' }}
            >
              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-base rounded-lg shadow-lg"
              >
                <a href="#contact">
                  <span className="flex items-center gap-2 font-semibold" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    {ctaPrimary}
                    <ArrowRight className="w-5 h-5" />
                  </span>
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/20 text-white bg-white/5 backdrop-blur-sm px-8 py-6 text-base rounded-lg hover:bg-white/10 hover:border-white/30"
              >
                <a href="#products">
                  <span className="font-semibold" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    {t('hero.contact')}
                  </span>
                </a>
              </Button>
            </div>

            {/* Stats row */}
            <div
              className="grid grid-cols-4 gap-4 mt-10 pt-8 border-t border-white/10"
              style={{ animation: 'heroFadeUp 0.7s 0.5s ease-out both' }}
            >
              {stats.map(s => (
                <div key={s.label}>
                  <div className="text-white font-bold text-xl md:text-2xl" style={{ fontFamily: 'DM Sans, sans-serif' }}>{s.value}</div>
                  <div className="text-white/40 text-[10px] md:text-xs tracking-wider uppercase" style={{ fontFamily: 'DM Sans, sans-serif' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Product Carousel */}
          <div
            className="relative flex flex-col items-center justify-center"
            style={{ animation: 'heroFadeUp 0.7s 0.4s ease-out both' }}
          >
            {/* Main product display */}
            <div className="relative w-full max-w-md aspect-square">
              {/* Glow behind product */}
              <div className="absolute inset-8 rounded-full bg-primary/20 blur-3xl" />

              {/* Product image */}
              <div className="relative w-full h-full flex items-center justify-center p-8">
                {carouselItems.map((item, i) => (
                  <img
                    key={i}
                    src={item.img}
                    alt={item.label}
                    className={`absolute max-w-[75%] max-h-[75%] object-contain drop-shadow-2xl transition-all duration-500 ${
                      i === current
                        ? 'opacity-100 scale-100 translate-x-0'
                        : i < current
                        ? 'opacity-0 scale-90 -translate-x-12'
                        : 'opacity-0 scale-90 translate-x-12'
                    }`}
                  />
                ))}
              </div>

              {/* Product label */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md text-white text-sm font-medium px-5 py-2 rounded-full border border-white/15">
                {carouselItems[current].label}
              </div>
            </div>

            {/* Carousel controls */}
            <div className="flex items-center gap-4 mt-4">
              <button
                onClick={prev}
                className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Dots */}
              <div className="flex gap-1.5">
                {carouselItems.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === current ? 'w-6 bg-primary' : 'w-1.5 bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={next}
                className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
};

export default HeroSection;

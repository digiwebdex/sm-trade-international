import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ArrowRight, Pause, Play } from 'lucide-react';
import OptimizedImage from '@/components/OptimizedImage';
import heroBg from '@/assets/hero-bg.jpg';

// Product images for carousel
import product3 from '@/assets/products/product-3.png';
import product4 from '@/assets/products/product-4.png';
import product5 from '@/assets/products/product-5.png';
import product7 from '@/assets/products/product-7.png';
import product8 from '@/assets/products/product-8.png';
import product9 from '@/assets/products/product-9.png';
import product10 from '@/assets/products/product-10.png';
import product12 from '@/assets/products/product-12.png';
import tiesBlue from '@/assets/products/ties-blue.png';
import glassware from '@/assets/products/glassware.png';
import tunnelSouvenir from '@/assets/products/tunnel-souvenir.png';
import bpatcBuilding from '@/assets/products/bpatc-building.png';

const carouselItems = [
  { img: product3, label: 'Crystal Awards' },
  { img: tiesBlue, label: 'Premium Ties' },
  { img: glassware, label: 'Custom Glassware' },
  { img: product4, label: 'Leather Goods' },
  { img: product5, label: 'Branded Pens' },
  { img: product7, label: 'Office Accessories' },
  { img: product8, label: 'Gift Sets' },
  { img: product9, label: 'Desk Organizers' },
  { img: product10, label: 'Premium Souvenirs' },
  { img: product12, label: 'Executive Gifts' },
  { img: tunnelSouvenir, label: 'Custom Souvenirs' },
  { img: bpatcBuilding, label: 'Model Replicas' },
];

const stats = [
  { value: '500+', label: 'Clients' },
  { value: '10+', label: 'Years' },
  { value: '1000+', label: 'Products' },
  { value: '50+', label: 'Countries' },
];

const SPEED = 3000; // ms per item

const HeroSection = () => {
  const { t } = useLanguage();
  const { get } = useSiteSettings();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const title = get('hero', 'title', t('hero.title'));
  const subtitle = get('hero', 'subtitle', t('hero.subtitle'));
  const ctaPrimary = get('hero', 'cta_primary', t('hero.cta'));

  const len = carouselItems.length;

  const next = useCallback(() => setCurrent(i => (i + 1) % len), [len]);
  const prev = useCallback(() => setCurrent(i => (i - 1 + len) % len), [len]);

  // Auto-advance
  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(next, SPEED);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [next, paused]);

  // Compute offset for 3D positioning (-2..+2 visible range)
  const getOffset = (index: number) => {
    let diff = index - current;
    if (diff > len / 2) diff -= len;
    if (diff < -len / 2) diff += len;
    return diff;
  };

  return (
    <section id="home" className="relative overflow-hidden bg-foreground">
      {/* Background image with overlay */}
      <OptimizedImage src={heroBg} alt="" priority blurPlaceholder={false} className="absolute inset-0 w-full h-full object-cover opacity-20" wrapperClassName="absolute inset-0" />
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

          {/* Right — 3D Cube Carousel */}
          <div
            className="relative flex flex-col items-center justify-center"
            style={{ animation: 'heroFadeUp 0.7s 0.4s ease-out both' }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {/* Glow behind carousel */}
            <div className="absolute inset-12 rounded-full bg-accent/15 blur-3xl pointer-events-none" />

            {/* 3D Carousel Stage */}
            <div className="relative w-full py-8" style={{ perspective: '1200px' }}>
              <div className="relative flex items-center justify-center" style={{ height: 260 }}>
                {carouselItems.map((item, i) => {
                  const offset = getOffset(i);
                  const absOff = Math.abs(offset);
                  const visible = absOff <= 2;
                  if (!visible) return null;

                  const rotateY = offset * 45;
                  const tX = offset * 160;
                  const tZ = absOff === 0 ? 80 : absOff === 1 ? 0 : -60;
                  const scale = absOff === 0 ? 1.1 : absOff === 1 ? 0.85 : 0.65;
                  const opacity = absOff === 0 ? 1 : absOff === 1 ? 0.6 : 0.25;
                  const zIndex = 10 - absOff;

                  return (
                    <div
                      key={i}
                      className="absolute flex flex-col items-center"
                      style={{
                        transform: `translateX(${tX}px) translateZ(${tZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                        opacity,
                        zIndex,
                        transition: 'all 0.7s cubic-bezier(0.25,0.46,0.45,0.94)',
                        pointerEvents: absOff === 0 ? 'auto' : 'none',
                        transformStyle: 'preserve-3d',
                      }}
                    >
                      <div
                        className={`relative p-4 rounded-2xl border bg-white cursor-pointer transition-shadow duration-500 ${
                          absOff === 0
                            ? 'border-accent/30 shadow-2xl shadow-accent/20'
                            : 'border-border/20'
                        }`}
                        onClick={() => setCurrent(i)}
                      >
                        <OptimizedImage
                          src={item.img}
                          alt={item.label}
                          className="w-36 h-36 md:w-40 md:h-40 object-contain"
                          sizes="160px"
                          priority={absOff <= 1}
                          blurPlaceholder={false}
                        />
                      </div>
                      {/* Label */}
                      <div
                        className={`mt-3 text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap transition-all duration-500 ${
                          absOff === 0
                            ? 'bg-accent text-white opacity-100 translate-y-0'
                            : 'bg-transparent text-white/30 opacity-0 translate-y-2'
                        }`}
                        style={{ fontFamily: 'DM Sans, sans-serif' }}
                      >
                        {item.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reflection */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-accent/10 blur-2xl rounded-full" />

            {/* Carousel controls */}
            <div className="flex items-center gap-6 mt-2 relative z-30">
              <button
                onClick={prev}
                className="w-11 h-11 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white hover:border-accent/50 hover:bg-accent/10 transition-all duration-300"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Progress dots */}
              <div className="flex gap-1.5">
                {carouselItems.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`rounded-full transition-all duration-400 ${
                      i === current ? 'w-7 h-2 bg-accent' : 'w-2 h-2 bg-white/25 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={next}
                className="w-11 h-11 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white hover:border-accent/50 hover:bg-accent/10 transition-all duration-300"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Pause/play */}
              <button
                onClick={() => setPaused(p => !p)}
                className="w-9 h-9 rounded-full border border-white/15 bg-white/5 backdrop-blur-sm flex items-center justify-center text-white/40 hover:text-white/70 transition-all duration-300"
                title={paused ? 'Play' : 'Pause'}
              >
                {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
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

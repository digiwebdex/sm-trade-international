import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ArrowRight, Pause, Play } from 'lucide-react';
import OptimizedImage from '@/components/OptimizedImage';
import heroBg from '@/assets/hero-bg.jpg';

// Module-level flag: animations only play on first ever mount
let hasAnimated = false;

// Static fallback images
import product3 from '@/assets/products/product-3.png';
import tiesBlue from '@/assets/products/ties-blue.png';
import glassware from '@/assets/products/glassware.png';
import product8 from '@/assets/products/product-8.png';
import product10 from '@/assets/products/product-10.png';
import bpatcBuilding from '@/assets/products/bpatc-building.png';
import tunnelSouvenir from '@/assets/products/tunnel-souvenir.png';
import product9 from '@/assets/products/product-9.png';

const fallbackItems = [
  { img: product3, label: 'Crystal Awards', id: '' },
  { img: tiesBlue, label: 'Premium Ties', id: '' },
  { img: glassware, label: 'Custom Glassware', id: '' },
  { img: product8, label: 'Gift Sets', id: '' },
  { img: product10, label: 'Premium Souvenirs', id: '' },
  { img: bpatcBuilding, label: 'Model Replicas', id: '' },
  { img: tunnelSouvenir, label: 'Tunnel Souvenirs', id: '' },
  { img: product9, label: 'Executive Pens', id: '' },
];

const stats = [
  { value: '500+', label: 'Clients' },
  { value: '10+', label: 'Years' },
  { value: '1000+', label: 'Products' },
  { value: '50+', label: 'Countries' },
];

const SPEED = 3500;

const HeroSection = () => {
  const { t, lang } = useLanguage();
  const { get } = useSiteSettings();
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFirstLoad = !hasAnimated;

  useEffect(() => {
    if (!hasAnimated) hasAnimated = true;
  }, []);

  const anim = (delay: string) =>
    isFirstLoad ? { animation: `heroFadeUp 0.7s ${delay} ease-out both` } : {};

  const title = get('hero', 'title', t('hero.title'));
  const subtitle = get('hero', 'subtitle', t('hero.subtitle'));
  const ctaPrimary = get('hero', 'cta_primary', t('hero.cta'));

  // Fetch featured products from DB
  const { data: dbProducts } = useQuery({
    queryKey: ['hero-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name_en, name_bn, image_url, product_code')
        .eq('is_active', true)
        .order('sort_order')
        .limit(8);
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    initialData: [],
    placeholderData: (prev: any) => prev,
  });

  const carouselItems = dbProducts && dbProducts.length >= 4
    ? dbProducts.map(p => ({
        img: p.image_url || '',
        label: lang === 'en' ? p.name_en : (p.name_bn || p.name_en),
        id: p.id,
      }))
    : fallbackItems;

  const len = carouselItems.length;

  const next = useCallback(() => setCurrent(i => (i + 1) % len), [len]);
  const prev = useCallback(() => setCurrent(i => (i - 1 + len) % len), [len]);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(next, SPEED);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [next, paused]);

  const getOffset = (index: number) => {
    let diff = index - current;
    if (diff > len / 2) diff -= len;
    if (diff < -len / 2) diff += len;
    return diff;
  };

  const handleProductClick = (item: typeof carouselItems[0], index: number) => {
    if (index !== current) {
      setCurrent(index);
      return;
    }
    if (item.id) {
      navigate(`/product/${item.id}`);
    } else {
      navigate('/catalog');
    }
  };

  return (
    <section id="home" className="relative bg-foreground" style={{ overflow: 'clip' }}>
      <OptimizedImage src={heroBg} alt="" priority blurPlaceholder={false} className="absolute inset-0 w-full h-full object-cover opacity-20" wrapperClassName="absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-br from-foreground/90 via-foreground/70 to-primary/30" />

      <div className="relative z-10 container mx-auto px-4 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[500px] lg:min-h-[560px]">

          {/* Left — Value Proposition */}
          <div className="flex flex-col justify-center" style={anim('0s')}>
            <span
              className="inline-flex items-center gap-2 text-primary-foreground/60 text-xs font-semibold tracking-[0.2em] uppercase mb-5"
              style={{ fontFamily: 'Montserrat, DM Sans, sans-serif' }}
            >
              <span className="w-8 h-px bg-primary" />
              S. M. Trade International
            </span>

            <h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-5 text-white"
              style={anim('0.1s')}
            >
              {title}
            </h1>

            <p
              className="text-base md:text-lg text-white/60 mb-8 max-w-lg leading-relaxed"
              style={{ fontFamily: 'DM Sans, sans-serif', ...anim('0.2s') }}
            >
              {subtitle}
            </p>

            <div
              className="flex flex-col sm:flex-row gap-4"
              style={anim('0.3s')}
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
              style={anim('0.5s')}
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
            style={anim('0.4s')}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="absolute inset-12 rounded-full bg-accent/15 blur-3xl pointer-events-none" />

            {/* 3D Carousel Stage */}
            <div className="relative w-full py-8">
              <div className="relative flex items-center justify-center" style={{ height: 320 }}>
                {carouselItems.map((item, i) => {
                  const offset = getOffset(i);
                  const absOff = Math.abs(offset);
                  if (absOff > 2) return null;

                  // Full 3D cube transforms
                  const tX = offset * 180;
                  const scale = absOff === 0 ? 1.12 : absOff === 1 ? 0.85 : 0.62;
                  const opacity = absOff === 0 ? 1 : absOff === 1 ? 0.75 : 0.4;
                  const zIndex = 10 - absOff;
                  const rotY = offset * 35;
                  const tZ = absOff === 0 ? 0 : absOff === 1 ? -60 : -130;

                  return (
                    <div
                      key={i}
                      className="absolute flex flex-col items-center"
                      style={{
                        transform: `perspective(900px) translateX(${tX}px) translateZ(${tZ}px) rotateY(${rotY}deg) scale(${scale})`,
                        opacity,
                        zIndex,
                        transition: 'all 0.7s cubic-bezier(0.25,0.46,0.45,0.94)',
                        pointerEvents: absOff <= 1 ? 'auto' : 'none',
                      }}
                    >
                      <div
                        className={`relative rounded-2xl border overflow-hidden cursor-pointer transition-all duration-500 ${
                          absOff === 0
                            ? 'border-[hsl(var(--sm-gold))]/40 shadow-2xl shadow-[hsl(var(--sm-gold))]/20 ring-2 ring-[hsl(var(--sm-gold))]/20'
                            : 'border-white/10 shadow-lg'
                        }`}
                        style={{ width: absOff === 0 ? 220 : 180 }}
                        onClick={() => handleProductClick(item, i)}
                      >
                        <div className="bg-white p-3 flex items-center justify-center" style={{ minHeight: 192 }}>
                          <OptimizedImage
                            src={item.img}
                            alt={item.label}
                            className="w-full h-48 object-contain"
                            sizes="220px"
                            priority={absOff <= 1}
                            blurPlaceholder={false}
                            style={{ minWidth: '60%', minHeight: '60%' }}
                          />
                        </div>
                      </div>
                      {/* Label pill — only visible on active card */}
                      <div
                        className={`mt-3 text-xs font-semibold px-4 py-1.5 rounded-full whitespace-nowrap transition-all duration-500 ${
                          absOff === 0
                            ? 'bg-[hsl(var(--sm-gold))] text-white opacity-100 translate-y-0'
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
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-[hsl(var(--sm-gold))]/10 blur-2xl rounded-full" />

            {/* Carousel controls */}
            <div className="flex items-center gap-6 mt-2 relative z-30">
              <button
                onClick={prev}
                className="w-11 h-11 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white hover:border-[hsl(var(--sm-gold))]/50 hover:bg-[hsl(var(--sm-gold))]/10 transition-all duration-300"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex gap-1.5">
                {carouselItems.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`rounded-full transition-all duration-400 ${
                      i === current ? 'w-7 h-2 bg-[hsl(var(--sm-gold))]' : 'w-2 h-2 bg-white/25 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={next}
                className="w-11 h-11 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white hover:border-[hsl(var(--sm-gold))]/50 hover:bg-[hsl(var(--sm-gold))]/10 transition-all duration-300"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

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

      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
};

export default HeroSection;

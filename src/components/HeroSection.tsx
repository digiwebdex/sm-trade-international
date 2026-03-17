import { useState, useEffect, useRef, useCallback, TouchEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import OptimizedImage from '@/components/OptimizedImage';
import heroBg from '@/assets/hero-bg.jpg';

// Module-level flag: animations only play on first ever mount
let hasAnimated = false;

const stats = [
  { value: '500+', label: 'Clients' },
  { value: '10+', label: 'Years' },
  { value: '1000+', label: 'Products' },
  { value: '50+', label: 'Countries' },
];

const SPEED = 3500;
const CUBE_SIZE = 280; // px – height & depth of cube


const HeroSection = () => {
  const { t, lang } = useLanguage();
  const { get } = useSiteSettings();
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [prevIdx, setPrevIdx] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef(0);
  const touchDelta = useRef(0);
  const isFirstLoad = !hasAnimated;

  useEffect(() => {
    if (!hasAnimated) hasAnimated = true;
  }, []);

  const anim = (delay: string) =>
    isFirstLoad ? { animation: `heroFadeUp 0.7s ${delay} ease-out both` } : {};

  const title = get('hero', 'title', t('hero.title'));
  const subtitle = get('hero', 'subtitle', t('hero.subtitle'));
  const ctaPrimary = get('hero', 'cta_primary', t('hero.cta'));

  // Fetch all active products from DB — synced with product gallery
  const { data: dbProducts } = useQuery({
    queryKey: ['hero-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name_en, name_bn, image_url, product_code')
        .eq('is_active', true)
        .not('image_url', 'is', null)
        .neq('image_url', '')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const carouselItems = (dbProducts || []).map(p => ({
    img: p.image_url || '',
    label: lang === 'en' ? p.name_en : (p.name_bn || p.name_en),
    id: p.id,
  }));

  const len = carouselItems.length;

  // Direction tracking for cube rotation
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  const goTo = useCallback((idx: number, dir?: 'next' | 'prev') => {
    if (animating || idx === current) return;
    setDirection(dir || (idx > current ? 'next' : 'prev'));
    setPrevIdx(current);
    setAnimating(true);
    setCurrent(idx);
    setTimeout(() => setAnimating(false), 700);
  }, [current, animating]);

  const next = useCallback(() => goTo((current + 1) % len, 'next'), [goTo, current, len]);
  const prev = useCallback(() => goTo((current - 1 + len) % len, 'prev'), [goTo, current, len]);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(next, SPEED);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [next, paused]);

  const onTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDelta.current = 0;
    setPaused(true);
  };
  const onTouchMove = (e: TouchEvent) => {
    touchDelta.current = e.touches[0].clientX - touchStartX.current;
  };
  const onTouchEnd = () => {
    if (touchDelta.current > 50) prev();
    else if (touchDelta.current < -50) next();
    setPaused(false);
  };

  return (
    <section id="home" className="relative bg-foreground" style={{ overflow: 'clip' }}>
      <OptimizedImage src={heroBg} alt="" priority blurPlaceholder={false} className="absolute inset-0 w-full h-full object-cover opacity-20" wrapperClassName="absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-br from-foreground/90 via-foreground/70 to-primary/30" />

      <div className="relative z-10 container mx-auto px-4 pt-4 pb-8 lg:pt-6 lg:pb-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[500px] lg:min-h-[560px]">

          {/* Left — Value Proposition */}
          <div className="flex flex-col justify-center" style={anim('0s')}>
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

          {/* Right — 3D Cube */}
          {len > 0 && (
          <div
            className="relative flex flex-col items-center justify-center touch-pan-y"
            style={anim('0.4s')}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Ambient glow behind active card */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-accent/10 blur-[80px] pointer-events-none" />

            {/* 3D Cube */}
            <div className="relative w-full flex justify-center mb-6" style={{ perspective: '1200px' }}>
              <div
                className="relative"
                style={{
                  width: 300,
                  height: CUBE_SIZE,
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* The rotating cube container — key forces remount to reset rotation */}
                <div
                  key={`${current}-${prevIdx}`}
                  style={{
                    width: 300,
                    height: CUBE_SIZE,
                    position: 'relative',
                    transformStyle: 'preserve-3d',
                    animation: animating
                      ? direction === 'next'
                        ? 'cubeRotateNext 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards'
                        : 'cubeRotatePrev 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards'
                      : undefined,
                  }}
                >
                  {/* Front face — shows prevIdx during animation, current when idle */}
                  <div
                    className="absolute inset-0 rounded-2xl overflow-hidden bg-white shadow-[0_20px_70px_-15px_hsl(var(--sm-gold)/0.4)] ring-2 ring-accent/20 cursor-pointer"
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: `translateZ(${CUBE_SIZE / 2}px)`,
                    }}
                    onClick={() => {
                      const item = carouselItems[current];
                      if (item?.id) navigate(`/product/${item.id}`);
                      else navigate('/catalog');
                    }}
                  >
                    <div className="p-4 flex items-center justify-center h-full">
                      <OptimizedImage
                        src={carouselItems[animating ? prevIdx : current]?.img || ''}
                        alt={carouselItems[animating ? prevIdx : current]?.label || ''}
                        className="w-full h-full object-contain"
                        sizes="300px"
                        priority
                        blurPlaceholder={false}
                      />
                    </div>
                    <div className="absolute bottom-0 inset-x-0 h-14 bg-gradient-to-t from-accent/10 to-transparent pointer-events-none" />
                  </div>

                  {/* Right face — incoming item when rotating next */}
                  <div
                    className="absolute inset-0 rounded-2xl overflow-hidden bg-white shadow-xl ring-2 ring-accent/20"
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: `rotateY(90deg) translateZ(${CUBE_SIZE / 2}px)`,
                    }}
                  >
                    <div className="p-4 flex items-center justify-center h-full">
                      <OptimizedImage
                        src={carouselItems[current]?.img || ''}
                        alt={carouselItems[current]?.label || ''}
                        className="w-full h-full object-contain"
                        sizes="300px"
                        blurPlaceholder={false}
                      />
                    </div>
                  </div>

                  {/* Left face — incoming item when rotating prev */}
                  <div
                    className="absolute inset-0 rounded-2xl overflow-hidden bg-white shadow-xl ring-2 ring-accent/20"
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: `rotateY(-90deg) translateZ(${CUBE_SIZE / 2}px)`,
                    }}
                  >
                    <div className="p-4 flex items-center justify-center h-full">
                      <OptimizedImage
                        src={carouselItems[current]?.img || ''}
                        alt={carouselItems[current]?.label || ''}
                        className="w-full h-full object-contain"
                        sizes="300px"
                        blurPlaceholder={false}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Nav arrows */}
              <button
                onClick={prev}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-white/15 bg-white/5 backdrop-blur-md flex items-center justify-center text-white/60 hover:text-white hover:border-accent/40 hover:bg-accent/10 transition-all duration-300 z-20"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={next}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-white/15 bg-white/5 backdrop-blur-md flex items-center justify-center text-white/60 hover:text-white hover:border-accent/40 hover:bg-accent/10 transition-all duration-300 z-20"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Active label */}
            <div
              className="text-sm font-semibold px-5 py-1.5 mb-5 rounded-full bg-accent text-accent-foreground shadow-lg shadow-accent/25 transition-all duration-300"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {carouselItems[current]?.label}
            </div>

            {/* Pause/Play */}
            <button
              onClick={() => setPaused(p => !p)}
              className="w-9 h-9 rounded-full border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-center text-white/40 hover:text-white/70 transition-all duration-300"
              title={paused ? 'Play' : 'Pause'}
            >
              {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
          </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
};

export default HeroSection;

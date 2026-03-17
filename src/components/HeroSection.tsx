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

// Stats are now fetched from site settings

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

  const stats = [1, 2, 3, 4].map(n => ({
    value: get('hero', `stat${n}_value`, n === 1 ? '500+' : n === 2 ? '10+' : n === 3 ? '1000+' : '50+'),
    label: get('hero', `stat${n}_label`, n === 1 ? 'Clients' : n === 2 ? 'Years' : n === 3 ? 'Products' : 'Countries'),
  }));

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
            {/* Ambient glow layers */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-accent/15 blur-[100px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%] w-48 h-48 rounded-full bg-primary/20 blur-[60px] pointer-events-none" />

            {/* 3D Cube */}
            <div className="relative w-full flex justify-center mb-8" style={{ perspective: '1000px' }}>
              <div
                className="relative"
                style={{
                  width: 320,
                  height: CUBE_SIZE + 20,
                  transformStyle: 'preserve-3d',
                  transform: 'rotateX(2deg)',
                }}
              >
                {/* Cube container */}
                <div
                  key={`${current}-${prevIdx}`}
                  style={{
                    width: 320,
                    height: CUBE_SIZE + 20,
                    position: 'relative',
                    transformStyle: 'preserve-3d',
                    animation: animating
                      ? direction === 'next'
                        ? 'cubeRotateNext 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards'
                        : 'cubeRotatePrev 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards'
                      : undefined,
                  }}
                >
                  {/* Front face */}
                  <div
                    className="absolute inset-0 rounded-3xl overflow-hidden cursor-pointer"
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: `translateZ(${(CUBE_SIZE + 20) / 2}px)`,
                      background: 'linear-gradient(145deg, #ffffff 0%, #f8f6f3 100%)',
                      boxShadow: '0 25px 80px -20px hsl(var(--sm-gold) / 0.35), 0 10px 30px -10px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8)',
                      border: '1.5px solid hsl(var(--sm-gold) / 0.25)',
                    }}
                    onClick={() => {
                      const item = carouselItems[current];
                      if (item?.id) navigate(`/product/${item.id}`);
                      else navigate('/catalog');
                    }}
                  >
                    {/* Decorative corner accents */}
                    <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-accent/30 rounded-tl-xl" />
                    <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-accent/30 rounded-tr-xl" />
                    <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-accent/30 rounded-bl-xl" />
                    <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-accent/30 rounded-br-xl" />

                    <div className="p-6 flex items-center justify-center h-full">
                      <OptimizedImage
                        src={carouselItems[animating ? prevIdx : current]?.img || ''}
                        alt={carouselItems[animating ? prevIdx : current]?.label || ''}
                        className="w-full h-full object-contain drop-shadow-lg"
                        sizes="320px"
                        priority
                        blurPlaceholder={false}
                      />
                    </div>
                    <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-accent/8 to-transparent pointer-events-none" />
                  </div>

                  {/* Right face */}
                  <div
                    className="absolute inset-0 rounded-3xl overflow-hidden"
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: `rotateY(90deg) translateZ(${(CUBE_SIZE + 20) / 2}px)`,
                      background: 'linear-gradient(145deg, #ffffff 0%, #f8f6f3 100%)',
                      boxShadow: '0 25px 80px -20px hsl(var(--sm-gold) / 0.35), inset 0 1px 0 rgba(255,255,255,0.8)',
                      border: '1.5px solid hsl(var(--sm-gold) / 0.25)',
                    }}
                  >
                    <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-accent/30 rounded-tl-xl" />
                    <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-accent/30 rounded-tr-xl" />
                    <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-accent/30 rounded-bl-xl" />
                    <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-accent/30 rounded-br-xl" />
                    <div className="p-6 flex items-center justify-center h-full">
                      <OptimizedImage
                        src={carouselItems[current]?.img || ''}
                        alt={carouselItems[current]?.label || ''}
                        className="w-full h-full object-contain drop-shadow-lg"
                        sizes="320px"
                        blurPlaceholder={false}
                      />
                    </div>
                  </div>

                  {/* Left face */}
                  <div
                    className="absolute inset-0 rounded-3xl overflow-hidden"
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: `rotateY(-90deg) translateZ(${(CUBE_SIZE + 20) / 2}px)`,
                      background: 'linear-gradient(145deg, #ffffff 0%, #f8f6f3 100%)',
                      boxShadow: '0 25px 80px -20px hsl(var(--sm-gold) / 0.35), inset 0 1px 0 rgba(255,255,255,0.8)',
                      border: '1.5px solid hsl(var(--sm-gold) / 0.25)',
                    }}
                  >
                    <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-accent/30 rounded-tl-xl" />
                    <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-accent/30 rounded-tr-xl" />
                    <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-accent/30 rounded-bl-xl" />
                    <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-accent/30 rounded-br-xl" />
                    <div className="p-6 flex items-center justify-center h-full">
                      <OptimizedImage
                        src={carouselItems[current]?.img || ''}
                        alt={carouselItems[current]?.label || ''}
                        className="w-full h-full object-contain drop-shadow-lg"
                        sizes="320px"
                        blurPlaceholder={false}
                      />
                    </div>
                  </div>
                </div>

                {/* Reflection / shadow below cube */}
                <div
                  className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[70%] h-8 rounded-full pointer-events-none"
                  style={{
                    background: 'radial-gradient(ellipse, hsl(var(--sm-gold) / 0.2) 0%, transparent 70%)',
                    filter: 'blur(8px)',
                  }}
                />
              </div>

              {/* Nav arrows — refined */}
              <button
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl flex items-center justify-center text-white/50 hover:text-white hover:border-accent/50 hover:bg-accent/15 hover:scale-110 transition-all duration-300 z-20 shadow-lg shadow-black/10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl flex items-center justify-center text-white/50 hover:text-white hover:border-accent/50 hover:bg-accent/15 hover:scale-110 transition-all duration-300 z-20 shadow-lg shadow-black/10"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Active label + controls */}
            <div className="flex items-center gap-3">
              <div
                className="text-sm font-semibold px-6 py-2 rounded-full bg-gradient-to-r from-accent to-accent/80 text-accent-foreground shadow-lg shadow-accent/30 transition-all duration-500"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                {carouselItems[current]?.label}
              </div>
              <button
                onClick={() => setPaused(p => !p)}
                className="w-9 h-9 rounded-full border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-center text-white/40 hover:text-white/70 hover:border-accent/30 transition-all duration-300"
                title={paused ? 'Play' : 'Pause'}
              >
                {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Dot indicators */}
            <div className="flex items-center gap-1.5 mt-4">
              {carouselItems.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`rounded-full transition-all duration-500 ${
                    i === current
                      ? 'w-6 h-2 bg-accent shadow-sm shadow-accent/40'
                      : 'w-2 h-2 bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
};

export default HeroSection;

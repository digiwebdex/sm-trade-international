import { useState, useEffect, useRef, useCallback, TouchEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/apiClient';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import OptimizedImage from '@/components/OptimizedImage';

const SLIDE_SPEED = 4000;

const ProductSlider = () => {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('left');
  const [isAnimating, setIsAnimating] = useState(false);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef(0);

  const { data: dbProducts } = useQuery({
    queryKey: ['slider-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name_en, name_bn, image_url, product_code, short_description_en, short_description_bn, categories(name_en, name_bn)')
        .eq('is_active', true)
        .not('image_url', 'is', null)
        .neq('image_url', '')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const items = (dbProducts || []).map(p => ({
    id: p.id,
    img: p.image_url || '',
    name: lang === 'en' ? p.name_en : (p.name_bn || p.name_en),
    desc: lang === 'en' ? (p.short_description_en || '') : (p.short_description_bn || p.short_description_en || ''),
    category: (p as any).categories
      ? (lang === 'en' ? (p as any).categories.name_en : ((p as any).categories.name_bn || (p as any).categories.name_en))
      : '',
    code: p.product_code,
  }));

  const len = items.length;

  const goTo = useCallback((idx: number, dir: 'left' | 'right') => {
    if (isAnimating || len < 2) return;
    setDirection(dir);
    setIsAnimating(true);
    setCurrent(idx);
    setTimeout(() => setIsAnimating(false), 600);
  }, [isAnimating, len]);

  const next = useCallback(() => {
    goTo((current + 1) % len, 'left');
  }, [current, len, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + len) % len, 'right');
  }, [current, len, goTo]);

  useEffect(() => {
    if (paused || len < 2) return;
    timerRef.current = setInterval(next, SLIDE_SPEED);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [next, paused, len]);

  const onTouchStart = (e: TouchEvent) => { touchStartX.current = e.touches[0].clientX; setPaused(true); };
  const onTouchEnd = (e: TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > 50) prev();
    else if (delta < -50) next();
    setPaused(false);
  };

  if (len === 0) return null;

  const item = items[current];
  const progressPct = ((current + 1) / len) * 100;

  return (
    <section className="py-16 md:py-20 bg-secondary relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: 'radial-gradient(hsl(var(--sm-gold)) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />

      <div className="container mx-auto px-4 relative">
        {/* Section header */}
        <div className="text-center mb-10">
          <span className="inline-block text-accent text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ fontFamily: 'DM Sans, sans-serif' }}>
            {lang === 'en' ? 'Our Products' : 'আমাদের পণ্য'}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            {lang === 'en' ? 'Premium Collection' : 'প্রিমিয়াম কালেকশন'}
          </h2>
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-accent/40" />
            <div className="w-2 h-2 rotate-45 bg-accent/70" />
            <div className="h-px w-12 bg-accent/40" />
          </div>
        </div>

        {/* Main slider area */}
        <div
          className="relative max-w-5xl mx-auto"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            {/* Product Image — slides left to right */}
            <div className="relative w-full md:w-1/2 aspect-square max-w-md mx-auto overflow-hidden rounded-2xl bg-background shadow-lg border border-border/30">
              {/* Animated image */}
              <div
                key={`${current}-${direction}`}
                className="absolute inset-0 p-6 flex items-center justify-center"
                style={{
                  animation: `${direction === 'left' ? 'slideInFromRight' : 'slideInFromLeft'} 0.6s cubic-bezier(0.25, 0.8, 0.25, 1) forwards`,
                }}
              >
                <OptimizedImage
                  src={item.img}
                  alt={item.name}
                  className="w-full h-full object-contain"
                  blurPlaceholder={false}
                />
              </div>

              {/* Counter badge */}
              <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm"
                style={{
                  background: 'hsl(var(--sm-gold) / 0.15)',
                  color: 'hsl(var(--sm-gold))',
                  border: '1px solid hsl(var(--sm-gold) / 0.2)',
                }}>
                {current + 1} / {len}
              </div>

              {/* Category badge */}
              {item.category && (
                <div className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full bg-primary/80 text-primary-foreground text-xs font-medium backdrop-blur-sm">
                  {item.category}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="w-full md:w-1/2 text-center md:text-left">
              <div
                key={`info-${current}`}
                style={{
                  animation: 'fadeSlideUp 0.5s ease-out forwards',
                }}
              >
                {item.code && (
                  <span className="text-xs tracking-widest uppercase text-muted-foreground mb-2 block">
                    {item.code}
                  </span>
                )}
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3 leading-tight"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {item.name}
                </h3>
                {item.desc && (
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5 line-clamp-3">
                    {item.desc}
                  </p>
                )}
                <button
                  onClick={() => navigate(`/product/${item.id}`)}
                  className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105 bg-primary text-primary-foreground hover:opacity-90"
                >
                  {lang === 'en' ? 'View Details' : 'বিস্তারিত দেখুন'}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Progress bar + Navigation */}
          <div className="mt-8 flex items-center gap-4">
            <button onClick={prev} aria-label="Previous"
              className="w-10 h-10 rounded-full border border-border bg-background hover:bg-accent flex items-center justify-center text-foreground/60 hover:text-foreground transition-all duration-300 active:scale-90 shrink-0">
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Progress bar */}
            <div className="flex-1 h-1 bg-border/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${progressPct}%`,
                  background: 'linear-gradient(90deg, hsl(var(--sm-gold)), hsl(var(--primary)))',
                }}
              />
            </div>

            <button onClick={next} aria-label="Next"
              className="w-10 h-10 rounded-full border border-border bg-background hover:bg-accent flex items-center justify-center text-foreground/60 hover:text-foreground transition-all duration-300 active:scale-90 shrink-0">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Dot indicators */}
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {items.slice(0, Math.min(len, 15)).map((_, i) => (
              <button key={i}
                onClick={() => goTo(i, i > current ? 'left' : 'right')}
                aria-label={`Go to product ${i + 1}`}
                className={`rounded-full transition-all duration-400 ${
                  i === current
                    ? 'w-6 h-2 bg-primary'
                    : 'w-2 h-2 bg-border hover:bg-muted-foreground'
                }`}
              />
            ))}
          </div>
        </div>

        {/* View all CTA */}
        <div className="text-center mt-10">
          <button
            onClick={() => navigate('/catalog')}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium border border-border bg-background hover:bg-accent text-foreground transition-all duration-300 hover:scale-105"
          >
            {lang === 'en' ? 'View All Products' : 'সকল পণ্য দেখুন'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes slideInFromRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInFromLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeSlideUp {
          from { transform: translateY(15px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </section>
  );
};

export default ProductSlider;

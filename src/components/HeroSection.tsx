import { useState, useEffect, useRef, useCallback, TouchEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/apiClient';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import OptimizedImage from '@/components/OptimizedImage';
import { productSlug } from '@/lib/productSlug';

const SPEED = 5000;
const CUBE_SPEED = 3500;

/* ─── 3D Round Carousel (Luxury) ─── */
const ProductCarousel = ({
  products,
  lang,
  onProductClick,
}: {
  products: Array<{ id: string; name_en: string; name_bn: string; name_zh?: string; image_url: string | null; product_code: string | null; category_id: string | null; unit_price: number }>;
  lang: string;
  onProductClick: (product: any) => void;
}) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const count = products.length;

  useEffect(() => {
    if (count < 2) return;
    const timer = setInterval(() => setActiveIdx(i => (i + 1) % count), CUBE_SPEED);
    return () => clearInterval(timer);
  }, [count]);

  if (count === 0) return null;

  const goNext = () => setActiveIdx(i => (i + 1) % count);
  const goPrev = () => setActiveIdx(i => (i - 1 + count) % count);

  // Show 5 cards: active center + 2 on each side
  const getOffset = (i: number) => {
    let diff = i - activeIdx;
    if (diff > count / 2) diff -= count;
    if (diff < -count / 2) diff += count;
    return diff;
  };

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: 440, height: 420 }}>
      {/* Cards */}
      <div className="relative w-full flex-1 flex items-center justify-center">
        {products.map((product, i) => {
          const offset = getOffset(i);
          const absOffset = Math.abs(offset);
          if (absOffset > 2) return null;

          const isActive = offset === 0;
          const translateX = offset * 130;
          const translateZ = isActive ? 60 : absOffset === 1 ? -20 : -80;
          const rotateY = offset * -25;
          const scale = isActive ? 1 : absOffset === 1 ? 0.82 : 0.65;
          const opacity = isActive ? 1 : absOffset === 1 ? 0.7 : 0.4;
          const zIndex = 10 - absOffset;

          return (
            <div
              key={product.id}
              className="absolute cursor-pointer"
              style={{
                width: 180,
                height: 260,
                transform: `perspective(1000px) translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                opacity,
                zIndex,
                transition: 'all 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
                filter: isActive ? 'brightness(1)' : `brightness(0.6)`,
              }}
              onClick={() => isActive ? onProductClick(product) : setActiveIdx(i)}
            >
              <div className={`w-full h-full rounded-lg overflow-hidden flex flex-col transition-all duration-700
                ${isActive
                  ? 'border-2 border-[hsl(var(--sm-gold)/0.6)] shadow-[0_0_40px_hsl(var(--sm-gold)/0.2),0_20px_60px_rgba(0,0,0,0.6)]'
                  : 'border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.5)]'
                }
                bg-gradient-to-b from-[hsl(222,40%,14%)] to-[hsl(222,47%,8%)]`}
              >
                {/* Image area */}
                <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--sm-gold)/0.08)] to-transparent" />
                  )}
                  <OptimizedImage
                    src={product.image_url || '/placeholder.svg'}
                    alt={lang === 'zh' ? (product.name_zh || product.name_bn || product.name_en) : lang === 'en' ? product.name_en : product.name_bn}
                    className="max-w-full max-h-full object-contain relative z-[1] drop-shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
                  />
                </div>

                {/* Info bar */}
                <div className={`px-3 py-3 text-center border-t transition-all duration-700 ${
                  isActive
                    ? 'border-[hsl(var(--sm-gold)/0.3)] bg-gradient-to-t from-black/40 to-transparent'
                    : 'border-white/5 bg-black/20'
                }`}>
                  <h3 className={`text-[11px] font-bold truncate tracking-wider uppercase transition-colors duration-500 ${
                    isActive ? 'text-[hsl(var(--sm-gold))]' : 'text-white/50'
                  }`}>
                    {lang === 'zh' ? (product.name_zh || product.name_bn || product.name_en) : lang === 'en' ? product.name_en : (product.name_bn || product.name_en)}
                  </h3>
                  {isActive && product.product_code && (
                    <p className="text-[9px] text-white/30 mt-0.5 tracking-widest">{product.product_code}</p>
                  )}
                </div>
              </div>

              {/* Active card glow */}
              {isActive && (
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-6 rounded-full opacity-40"
                  style={{ background: 'radial-gradient(ellipse, hsl(var(--sm-gold) / 0.6), transparent 70%)' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-5 mt-1 z-10">
        <button onClick={goPrev} aria-label="Previous product"
          className="w-9 h-9 rounded-full border border-[hsl(var(--sm-gold)/0.25)] bg-black/30 backdrop-blur-sm flex items-center justify-center text-[hsl(var(--sm-gold)/0.5)] hover:text-[hsl(var(--sm-gold))] hover:border-[hsl(var(--sm-gold)/0.5)] hover:bg-[hsl(var(--sm-gold)/0.1)] transition-all duration-300">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          {products.map((_, i) => (
            <button key={i} onClick={() => setActiveIdx(i)} aria-label={`Product ${i + 1}`}
              className={`rounded-full transition-all duration-500 ${
                i === activeIdx
                  ? 'w-6 h-1.5 bg-gradient-to-r from-[hsl(var(--sm-gold))] to-[hsl(var(--sm-gold)/0.4)] shadow-[0_0_10px_hsl(var(--sm-gold)/0.4)]'
                  : 'w-1.5 h-1.5 bg-white/15 hover:bg-white/35'
              }`} />
          ))}
        </div>
        <button onClick={goNext} aria-label="Next product"
          className="w-9 h-9 rounded-full border border-[hsl(var(--sm-gold)/0.25)] bg-black/30 backdrop-blur-sm flex items-center justify-center text-[hsl(var(--sm-gold)/0.5)] hover:text-[hsl(var(--sm-gold))] hover:border-[hsl(var(--sm-gold)/0.5)] hover:bg-[hsl(var(--sm-gold)/0.1)] transition-all duration-300">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/* ─── Main Hero Section — Luxury Premium ─── */
const HeroSection = () => {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const { get } = useSiteSettings();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef(0);
  const touchDelta = useRef(0);

  const { data: heroSlides } = useQuery({
    queryKey: ['hero-slides-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: featuredProducts } = useQuery({
    queryKey: ['hero-featured-products'],
    queryFn: async () => {
        const { data, error } = await supabase
          .from('products')
          .select('id, name_en, name_bn, name_zh, image_url, product_code, category_id, unit_price')
        .eq('is_active', true)
        .order('sort_order')
        .limit(12);
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const products = featuredProducts ?? [];

  const slides = (heroSlides && heroSlides.length > 0)
    ? heroSlides.map(s => {
        const translated = (s.translations && typeof s.translations === 'object' ? (s.translations as any)[lang] : null) || {};
        return {
          id: s.id,
          title: translated.title || s.title,
          subtitle: translated.subtitle || s.subtitle,
          image: s.image_url,
          ctaText: translated.cta_text || s.cta_text,
          ctaLink: s.cta_link,
        };
      })
    : [{
        id: 'default',
        title: get('hero', 'title', lang === 'zh'
          ? '优质定制企业礼品和促销产品'
          : lang === 'en'
            ? 'Premium Customized Corporate Gifts & Promotional Products'
            : 'কাস্টমাইজড কর্পোরেট গিফট ও প্রমোশনাল প্রোডাক্ট'),
        subtitle: get('hero', 'subtitle', lang === 'zh'
          ? '我们为您的品牌提供高品质、精准且专业的定制服务。'
          : lang === 'en'
            ? 'We customize your brand identity with quality, precision and professionalism.'
            : 'শীর্ষস্থানীয় প্রতিষ্ঠানগুলোর বিশ্বস্ত পার্টনার — প্রিমিয়াম ব্র্যান্ডেড পণ্য ও কর্পোরেট গিফটিং সমাধান।'),
        image: heroBg,
        ctaText: lang === 'zh' ? '查看产品' : lang === 'en' ? 'Browse Products' : 'পণ্য দেখুন',
        ctaLink: '/catalog',
      }];

  const len = slides.length;
  const next = useCallback(() => { if (len > 1) setCurrent(c => (c + 1) % len); }, [len]);
  const prev = useCallback(() => { if (len > 1) setCurrent(c => (c - 1 + len) % len); }, [len]);

  useEffect(() => {
    if (paused || len < 2) return;
    timerRef.current = setInterval(next, SPEED);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [next, paused, len]);

  const onTouchStart = (e: TouchEvent) => { touchStartX.current = e.touches[0].clientX; touchDelta.current = 0; setPaused(true); };
  const onTouchMove = (e: TouchEvent) => { touchDelta.current = e.touches[0].clientX - touchStartX.current; };
  const onTouchEnd = () => { if (touchDelta.current > 50) prev(); else if (touchDelta.current < -50) next(); setPaused(false); };

  const handleCta = (link: string) => {
    if (link.startsWith('#')) {
      const el = document.getElementById(link.slice(1));
      el?.scrollIntoView({ behavior: 'smooth' });
    } else if (link.startsWith('http')) {
      window.open(link, '_blank');
    } else {
      navigate(link);
    }
  };

  const handleProductClick = (product: any) => {
    if (product) navigate(`/product/${productSlug(product)}`);
  };

  return (
    <section
      id="home"
      className="relative w-full min-h-[520px] md:min-h-[620px] lg:min-h-[720px] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Background slides with crossfade */}
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className="absolute inset-0 transition-opacity duration-[1.5s] ease-in-out"
          style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="absolute inset-0 w-full h-full object-cover scale-105"
            loading={i === 0 ? 'eager' : 'lazy'}
          />
          {/* Luxury dark overlay with gold tint */}
          <div className="absolute inset-0" style={{
            background: `
              linear-gradient(135deg, rgba(8,12,24,0.92) 0%, rgba(8,12,24,0.78) 35%, rgba(8,12,24,0.5) 65%, rgba(8,12,24,0.4) 100%),
              radial-gradient(ellipse at 20% 80%, rgba(180,140,60,0.08) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 20%, rgba(180,140,60,0.05) 0%, transparent 50%)
            `,
          }} />
        </div>
      ))}

      {/* Decorative gold lines */}
      <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
        {/* Top gold accent line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[hsl(var(--sm-gold)/0.4)] to-transparent" />
        {/* Diagonal gold line */}
        <div className="absolute -right-20 top-0 w-[1px] h-[120%] bg-gradient-to-b from-transparent via-[hsl(var(--sm-gold)/0.12)] to-transparent origin-top-right rotate-[15deg]" />
        <div className="absolute right-[30%] top-0 w-[1px] h-[120%] bg-gradient-to-b from-transparent via-[hsl(var(--sm-gold)/0.06)] to-transparent origin-top-right rotate-[15deg]" />
        {/* Corner ornaments */}
        <div className="absolute top-6 left-6 w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-[hsl(var(--sm-gold)/0.5)] to-transparent" />
          <div className="absolute top-0 left-0 h-full w-[1px] bg-gradient-to-b from-[hsl(var(--sm-gold)/0.5)] to-transparent" />
        </div>
        <div className="absolute bottom-6 right-6 w-16 h-16">
          <div className="absolute bottom-0 right-0 w-full h-[1px] bg-gradient-to-l from-[hsl(var(--sm-gold)/0.5)] to-transparent" />
          <div className="absolute bottom-0 right-0 h-full w-[1px] bg-gradient-to-t from-[hsl(var(--sm-gold)/0.5)] to-transparent" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between min-h-[520px] md:min-h-[620px] lg:min-h-[720px] gap-6">
        {/* Left: Text content */}
        <div className="flex-1 max-w-xl py-20 md:py-28">
          {/* Premium badge */}
          <div
            key={`badge-${current}`}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[hsl(var(--sm-gold)/0.3)] bg-[hsl(var(--sm-gold)/0.08)] backdrop-blur-md mb-6 animate-fade-in"
          >
            <Sparkles className="w-3.5 h-3.5 text-[hsl(var(--sm-gold))]" />
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[hsl(var(--sm-gold))]">
              {lang === 'zh' ? '优质品质 • 始于 1995' : lang === 'en' ? 'Since 1995 • Premium Quality' : 'প্রিমিয়াম মান • ১৯৯৫ থেকে'}
            </span>
          </div>

          {/* Title with gold accent */}
          <h1
            key={`title-${current}`}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.4rem] font-bold text-white leading-[1.15] mb-6 animate-fade-in"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            <span className="block">{slides[current].title}</span>
            <span
              className="block w-20 h-[2px] mt-4 rounded-full bg-gradient-to-r from-[hsl(var(--sm-gold))] to-[hsl(var(--sm-gold)/0.2)]"
            />
          </h1>

          <p
            key={`sub-${current}`}
            className="text-base sm:text-lg text-white/55 leading-relaxed mb-10 animate-fade-in max-w-md"
            style={{ animationDelay: '0.15s' }}
          >
            {slides[current].subtitle}
          </p>

          {/* CTA Buttons - Luxury style */}
          <div
            key={`cta-${current}`}
            className="flex flex-wrap gap-4 animate-fade-in"
            style={{ animationDelay: '0.25s' }}
          >
            <button
              onClick={() => handleCta(slides[current].ctaLink)}
              className="group relative flex items-center gap-2.5 px-8 py-4 rounded-none text-sm font-semibold tracking-wider uppercase overflow-hidden transition-all duration-500
                bg-gradient-to-r from-[hsl(var(--sm-gold))] to-[hsl(var(--sm-gold-dark))]
                text-[hsl(var(--sm-black))]
                shadow-[0_4px_24px_hsl(var(--sm-gold)/0.3)]
                hover:shadow-[0_8px_32px_hsl(var(--sm-gold)/0.5)]
                hover:scale-[1.02]"
            >
              <span className="relative z-10">{slides[current].ctaText || (lang === 'zh' ? '查看产品' : lang === 'en' ? 'Browse Products' : 'পণ্য দেখুন')}</span>
              <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--sm-gold-dark))] to-[hsl(var(--sm-gold))] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </button>
            <button
              onClick={() => handleCta('#contact')}
              className="px-8 py-4 rounded-none border border-[hsl(var(--sm-gold)/0.4)] text-[hsl(var(--sm-gold)/0.9)] font-semibold text-sm tracking-wider uppercase
                hover:bg-[hsl(var(--sm-gold)/0.1)] hover:border-[hsl(var(--sm-gold)/0.7)] transition-all duration-500 backdrop-blur-sm"
            >
              {lang === 'zh' ? '获取报价' : lang === 'en' ? 'Get a Quote' : 'কোটেশন নিন'}
            </button>
          </div>
        </div>

        {/* Right: 3D Carousel */}
        {products.length >= 3 && (
          <div className="hidden lg:flex items-center justify-center py-16 shrink-0">
            <ProductCarousel
              products={products}
              lang={lang}
              onProductClick={handleProductClick}
            />
          </div>
        )}
      </div>

      {/* Slide navigation - Luxury style */}
      {len > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-5">
          <button onClick={prev} aria-label="Previous"
            className="w-10 h-10 rounded-none border border-[hsl(var(--sm-gold)/0.25)] bg-black/30 backdrop-blur-md flex items-center justify-center text-[hsl(var(--sm-gold)/0.5)] hover:text-[hsl(var(--sm-gold))] hover:border-[hsl(var(--sm-gold)/0.5)] transition-all duration-400">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2.5">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} aria-label={`Slide ${i + 1}`}
                className={`transition-all duration-600 ${
                  i === current
                    ? 'w-10 h-[3px] bg-gradient-to-r from-[hsl(var(--sm-gold))] to-[hsl(var(--sm-gold)/0.4)] shadow-[0_0_12px_hsl(var(--sm-gold)/0.4)]'
                    : 'w-3 h-[2px] bg-white/20 hover:bg-white/40'
                }`} />
            ))}
          </div>
          <button onClick={next} aria-label="Next"
            className="w-10 h-10 rounded-none border border-[hsl(var(--sm-gold)/0.25)] bg-black/30 backdrop-blur-md flex items-center justify-center text-[hsl(var(--sm-gold)/0.5)] hover:text-[hsl(var(--sm-gold))] hover:border-[hsl(var(--sm-gold)/0.5)] transition-all duration-400">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 z-[3]"
        style={{ background: 'linear-gradient(to top, hsl(var(--background)), transparent)' }} />
    </section>
  );
};

export default HeroSection;

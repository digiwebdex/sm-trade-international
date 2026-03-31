import { useState, useEffect, useRef, useCallback, TouchEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/apiClient';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import OptimizedImage from '@/components/OptimizedImage';
import { productSlug } from '@/lib/productSlug';

const SPEED = 5000;
const CUBE_SPEED = 3500;

/* ─── 3D Round Carousel ─── */
const ProductCarousel = ({
  products,
  lang,
  onProductClick,
}: {
  products: Array<{ id: string; name_en: string; name_bn: string; image_url: string | null; product_code: string | null; category_id: string | null; unit_price: number }>;
  lang: string;
  onProductClick: (product: any) => void;
}) => {
  const [angle, setAngle] = useState(0);
  const count = products.length;
  const theta = count > 0 ? 360 / count : 0;
  const radius = Math.max(220, count * 28);

  useEffect(() => {
    if (count < 2) return;
    const timer = setInterval(() => {
      setAngle(a => a - theta);
    }, CUBE_SPEED);
    return () => clearInterval(timer);
  }, [count, theta]);

  if (count === 0) return null;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 420, height: 400, perspective: '1000px' }}>
      <div
        className="relative w-full h-full"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateY(${angle}deg)`,
          transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {products.map((product, i) => {
          const rotateY = theta * i;
          return (
            <div
              key={product.id}
              className="absolute left-1/2 top-1/2 cursor-pointer"
              style={{
                width: 180,
                height: 240,
                marginLeft: -90,
                marginTop: -120,
                transform: `rotateY(${rotateY}deg) translateZ(${radius}px)`,
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
              }}
              onClick={() => onProductClick(product)}
            >
              <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl shadow-black/40 ring-1 ring-white/10 bg-white/95 flex flex-col">
                <div className="flex-1 flex items-center justify-center p-3 bg-gradient-to-b from-gray-50 to-white">
                  <OptimizedImage
                    src={product.image_url || '/placeholder.svg'}
                    alt={lang === 'en' ? product.name_en : product.name_bn}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="px-3 py-2 text-center bg-white border-t border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-800 truncate">
                    {lang === 'en' ? product.name_en : (product.name_bn || product.name_en)}
                  </h3>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floor reflection */}
      <div
        className="absolute bottom-2 left-1/2 -translate-x-1/2 w-64 h-8 rounded-full opacity-15"
        style={{ background: 'radial-gradient(ellipse, hsl(var(--sm-gold) / 0.6), transparent)' }}
      />
    </div>
  );
};

/* ─── Main Hero Section ─── */
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
        .select('id, name_en, name_bn, image_url, product_code, category_id, unit_price')
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
    ? heroSlides.map(s => ({
        id: s.id,
        title: s.title,
        subtitle: s.subtitle,
        image: s.image_url,
        ctaText: s.cta_text,
        ctaLink: s.cta_link,
      }))
    : [{
        id: 'default',
        title: get('hero', 'title', lang === 'en'
          ? 'Premium Customized Corporate Gifts & Promotional Products'
          : 'কাস্টমাইজড কর্পোরেট গিফট ও প্রমোশনাল প্রোডাক্ট'),
        subtitle: get('hero', 'subtitle', lang === 'en'
          ? 'We customize your brand identity with quality, precision and professionalism.'
          : 'শীর্ষস্থানীয় প্রতিষ্ঠানগুলোর বিশ্বস্ত পার্টনার — প্রিমিয়াম ব্র্যান্ডেড পণ্য ও কর্পোরেট গিফটিং সমাধান।'),
        image: heroBg,
        ctaText: lang === 'en' ? 'Browse Products' : 'পণ্য দেখুন',
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
      className="relative w-full min-h-[500px] md:min-h-[600px] lg:min-h-[700px] overflow-hidden"
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
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading={i === 0 ? 'eager' : 'lazy'}
          />
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to right, rgba(10,15,30,0.88) 0%, rgba(10,15,30,0.7) 40%, rgba(10,15,30,0.35) 70%, rgba(10,15,30,0.25) 100%)',
          }} />
        </div>
      ))}

      {/* Content: Left text + Right 3D Cube */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between min-h-[500px] md:min-h-[600px] lg:min-h-[700px] gap-8">
        {/* Left: Text content */}
        <div className="flex-1 max-w-xl py-16 md:py-24">
          <div className="inline-block px-3 py-1 rounded-full border border-white/15 bg-white/5 backdrop-blur-sm mb-5">
            <span className="text-xs font-medium tracking-widest uppercase text-white/70">
              {lang === 'en' ? 'Premium Quality' : 'প্রিমিয়াম মান'}
            </span>
          </div>

          <h1
            key={`title-${current}`}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-bold text-white leading-tight mb-5 animate-fade-in"
          >
            {slides[current].title}
          </h1>

          <p
            key={`sub-${current}`}
            className="text-base sm:text-lg md:text-xl text-white/65 leading-relaxed mb-8 animate-fade-in"
            style={{ animationDelay: '0.1s' }}
          >
            {slides[current].subtitle}
          </p>

          <div
            key={`cta-${current}`}
            className="flex flex-wrap gap-3 animate-fade-in"
            style={{ animationDelay: '0.2s' }}
          >
            <button
              onClick={() => handleCta(slides[current].ctaLink)}
              className="group flex items-center gap-2 px-7 py-3.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all duration-300 shadow-lg shadow-primary/20"
            >
              {slides[current].ctaText || (lang === 'en' ? 'Browse Products' : 'পণ্য দেখুন')}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => handleCta('#contact')}
              className="px-7 py-3.5 rounded-lg border border-white/20 text-white/80 font-semibold text-sm hover:bg-white/10 hover:border-white/40 transition-all duration-300 backdrop-blur-sm"
            >
              {lang === 'en' ? 'Get a Quote' : 'কোটেশন নিন'}
            </button>
          </div>
        </div>

        {/* Right: 3D Cube Carousel */}
        {products.length >= 3 && (
          <div className="hidden lg:flex items-center justify-center py-16 md:py-24 shrink-0">
            <ProductCarousel
              products={products}
              lang={lang}
              onProductClick={handleProductClick}
            />
          </div>
        )}
      </div>

      {/* Navigation dots + arrows */}
      {len > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
          <button onClick={prev} aria-label="Previous"
            className="w-9 h-9 rounded-full border border-white/20 bg-black/20 backdrop-blur flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} aria-label={`Slide ${i + 1}`}
                className={`rounded-full transition-all duration-500 ${
                  i === current
                    ? 'w-8 h-2 bg-primary shadow-md'
                    : 'w-2 h-2 bg-white/25 hover:bg-white/50'
                }`} />
            ))}
          </div>
          <button onClick={next} aria-label="Next"
            className="w-9 h-9 rounded-full border border-white/20 bg-black/20 backdrop-blur flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 z-10"
        style={{ background: 'linear-gradient(to top, hsl(var(--foreground)), transparent)' }} />
    </section>
  );
};

export default HeroSection;

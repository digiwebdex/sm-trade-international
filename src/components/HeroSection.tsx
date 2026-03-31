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
const PRODUCT_SPEED = 3000;

const HeroSection = () => {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const { get } = useSiteSettings();
  const [current, setCurrent] = useState(0);
  const [productIdx, setProductIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const productTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

  // Fetch featured products for the slider
  const { data: featuredProducts } = useQuery({
    queryKey: ['hero-featured-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name_en, name_bn, image_url, product_code, category_id, unit_price')
        .eq('is_active', true)
        .order('sort_order')
        .limit(8);
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const products = featuredProducts ?? [];

  // Build slides array — use DB slides or fallback
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

  // Hero slide autoplay
  useEffect(() => {
    if (paused || len < 2) return;
    timerRef.current = setInterval(next, SPEED);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [next, paused, len]);

  // Product slider autoplay
  useEffect(() => {
    if (products.length < 2) return;
    productTimerRef.current = setInterval(() => {
      setProductIdx(c => (c + 1) % products.length);
    }, PRODUCT_SPEED);
    return () => { if (productTimerRef.current) clearInterval(productTimerRef.current); };
  }, [products.length]);

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

  // Show 3 products at a time on desktop, 1 on mobile
  const getVisibleProducts = () => {
    if (products.length === 0) return [];
    const visible = [];
    for (let i = 0; i < Math.min(3, products.length); i++) {
      visible.push(products[(productIdx + i) % products.length]);
    }
    return visible;
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
          {/* Dark gradient overlay */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to right, rgba(10,15,30,0.88) 0%, rgba(10,15,30,0.7) 40%, rgba(10,15,30,0.4) 70%, rgba(10,15,30,0.2) 100%)',
          }} />
        </div>
      ))}

      {/* Content overlay */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col lg:flex-row items-center min-h-[500px] md:min-h-[600px] lg:min-h-[700px] gap-8">
        {/* Left: Text content */}
        <div className="flex-1 max-w-2xl py-16 md:py-24">
          {/* Badge */}
          <div className="inline-block px-3 py-1 rounded-full border border-white/15 bg-white/5 backdrop-blur-sm mb-5">
            <span className="text-xs font-medium tracking-widest uppercase text-white/70">
              {lang === 'en' ? 'Premium Quality' : 'প্রিমিয়াম মান'}
            </span>
          </div>

          {/* Title */}
          <h1
            key={`title-${current}`}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-5 animate-fade-in"
          >
            {slides[current].title}
          </h1>

          {/* Subtitle */}
          <p
            key={`sub-${current}`}
            className="text-base sm:text-lg md:text-xl text-white/65 leading-relaxed mb-8 animate-fade-in"
            style={{ animationDelay: '0.1s' }}
          >
            {slides[current].subtitle}
          </p>

          {/* CTA buttons */}
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

        {/* Right: Product slider */}
        {products.length > 0 && (
          <div className="hidden lg:flex flex-col items-center gap-4 py-16 md:py-24 w-[380px] shrink-0">
            <div className="grid grid-cols-1 gap-4 w-full">
              {getVisibleProducts().map((product, i) => (
                <div
                  key={`${product.id}-${i}`}
                  onClick={() => navigate(`/product/${productSlug(product)}`)}
                  className="group flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3 cursor-pointer hover:bg-white/15 hover:border-white/25 transition-all duration-500 animate-fade-in"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="w-20 h-20 rounded-lg bg-white/10 overflow-hidden shrink-0">
                    <OptimizedImage
                      src={product.image_url || '/placeholder.svg'}
                      alt={lang === 'en' ? product.name_en : product.name_bn}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-sm truncate">
                      {lang === 'en' ? product.name_en : product.name_bn}
                    </h3>
                    {product.unit_price > 0 && (
                      <p className="text-primary text-xs mt-1">
                        ৳ {product.unit_price.toLocaleString()}
                      </p>
                    )}
                    <span className="text-white/40 text-xs group-hover:text-white/60 transition-colors">
                      {lang === 'en' ? 'View Details →' : 'বিস্তারিত দেখুন →'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Product slider dots */}
            {products.length > 3 && (
              <div className="flex gap-1.5 mt-2">
                {products.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setProductIdx(i)}
                    className={`rounded-full transition-all duration-300 ${
                      i === productIdx
                        ? 'w-5 h-1.5 bg-primary'
                        : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}
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

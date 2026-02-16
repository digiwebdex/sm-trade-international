import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { X, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

// Static fallback images
import img1 from '@/assets/products/ties-blue.png';
import img2 from '@/assets/products/bpatc-building.png';
import img3 from '@/assets/products/product-3.png';
import img4 from '@/assets/products/product-4.png';
import img5 from '@/assets/products/product-5.png';
import img6 from '@/assets/products/tunnel-souvenir.png';
import img7 from '@/assets/products/product-7.png';
import img8 from '@/assets/products/product-8.png';
import img9 from '@/assets/products/product-9.png';
import img10 from '@/assets/products/product-10.png';
import img11 from '@/assets/products/glassware.png';
import img12 from '@/assets/products/product-12.png';

interface StaticProduct {
  src: string;
  titleEn: string;
  titleBn: string;
  descEn: string;
  descBn: string;
  category: string;
}

const staticProducts: StaticProduct[] = [
  { src: img1, titleEn: 'Customized Ties', titleBn: 'কাস্টমাইজড টাই', descEn: 'Premium silk ties with custom branding.', descBn: 'কাস্টম ব্র্যান্ডিং সহ প্রিমিয়াম সিল্ক টাই।', category: 'corporate' },
  { src: img2, titleEn: 'BPATC Project', titleBn: 'বিপিএটিসি প্রজেক্ট', descEn: 'Custom project for BPATC.', descBn: 'বিপিএটিসির জন্য কাস্টম প্রকল্প।', category: 'souvenir' },
  { src: img3, titleEn: 'Leather Goods', titleBn: 'লেদার পণ্য', descEn: 'Genuine leather products.', descBn: 'আসল চামড়ার পণ্য।', category: 'corporate' },
  { src: img4, titleEn: 'Custom Bags', titleBn: 'কাস্টম ব্যাগ', descEn: 'Branded bags for events.', descBn: 'ইভেন্টের জন্য ব্র্যান্ডেড ব্যাগ।', category: 'corporate' },
  { src: img5, titleEn: 'Promotional Items', titleBn: 'প্রমোশনাল আইটেম', descEn: 'Custom promotional gifts.', descBn: 'কাস্টম প্রমোশনাল গিফট।', category: 'corporate' },
  { src: img6, titleEn: 'Bangabandhu Tunnel Souvenir', titleBn: 'বঙ্গবন্ধু টানেল স্মারক', descEn: 'Commemorative souvenir.', descBn: 'স্মারক উপহার।', category: 'souvenir' },
  { src: img7, titleEn: 'Custom Products', titleBn: 'কাস্টম পণ্য', descEn: 'Tailor-made corporate items.', descBn: 'কর্পোরেট আইটেম।', category: 'corporate' },
  { src: img8, titleEn: 'Branded Items', titleBn: 'ব্র্যান্ডেড আইটেম', descEn: 'Logo-printed merchandise.', descBn: 'লোগো-প্রিন্টেড পণ্য।', category: 'corporate' },
  { src: img9, titleEn: 'Stationery Set', titleBn: 'স্টেশনারি সেট', descEn: 'Premium branded stationery.', descBn: 'প্রিমিয়াম ব্র্যান্ডেড স্টেশনারি।', category: 'stationery' },
  { src: img10, titleEn: 'Premium Gifts', titleBn: 'প্রিমিয়াম গিফট', descEn: 'Luxury gift collections.', descBn: 'বিলাসবহুল গিফট সংগ্রহ।', category: 'corporate' },
  { src: img11, titleEn: 'Deli Glassware', titleBn: 'ডেলি গ্লাসওয়্যার', descEn: 'Custom engraved glassware.', descBn: 'কাস্টম খোদাই গ্লাসওয়্যার।', category: 'corporate' },
  { src: img12, titleEn: 'Special Collection', titleBn: 'স্পেশাল কালেকশন', descEn: 'Exclusive gift collection.', descBn: 'এক্সক্লুসিভ গিফট সংগ্রহ।', category: 'corporate' },
];

type DisplayProduct = {
  src: string;
  title: string;
  titleEn: string;
  titleBn: string;
  desc: string;
  descEn: string;
  descBn: string;
  category: string;
  categoryLabel: string;
  isActive: boolean;
};

const ProductsSection = () => {
  const { t, lang } = useLanguage();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [lightbox, setLightbox] = useState<DisplayProduct | null>(null);

  // Fetch ALL products (active + inactive) for availability filter
  const { data: dbProducts = [] } = useQuery({
    queryKey: ['public-products-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name_en, name_bn)')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: dbCategories = [] } = useQuery({
    queryKey: ['public-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name_en, name_bn')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const useDbData = dbProducts.length > 0;

  const allProducts: DisplayProduct[] = useMemo(() => {
    if (useDbData) {
      return dbProducts.map(p => {
        const cat = (p as any).categories;
        return {
          src: p.image_url || '',
          title: lang === 'en' ? p.name_en : (p.name_bn || p.name_en),
          titleEn: p.name_en,
          titleBn: p.name_bn || '',
          desc: lang === 'en' ? (p.description_en || '') : (p.description_bn || p.description_en || ''),
          descEn: p.description_en || '',
          descBn: p.description_bn || '',
          category: p.category_id || 'all',
          categoryLabel: cat ? (lang === 'en' ? cat.name_en : (cat.name_bn || cat.name_en)) : '',
          isActive: p.is_active,
        };
      });
    }
    return staticProducts.map(p => ({
      src: p.src,
      title: lang === 'en' ? p.titleEn : p.titleBn,
      titleEn: p.titleEn,
      titleBn: p.titleBn,
      desc: lang === 'en' ? p.descEn : p.descBn,
      descEn: p.descEn,
      descBn: p.descBn,
      category: p.category,
      categoryLabel: '',
      isActive: true,
    }));
  }, [dbProducts, useDbData, lang]);

  // Build filter categories
  const filterCategories = useMemo(() => {
    if (useDbData) {
      return [
        { id: 'all', label: t('products.all') },
        ...dbCategories.map(c => ({
          id: c.id,
          label: lang === 'en' ? c.name_en : (c.name_bn || c.name_en),
        })),
      ];
    }
    return [
      { id: 'all', label: t('products.all') },
      { id: 'corporate', label: t('products.corporate') },
      { id: 'souvenir', label: t('products.souvenir') },
      { id: 'stationery', label: t('products.stationery') },
    ];
  }, [useDbData, dbCategories, lang, t]);

  // Apply all filters
  const filtered = useMemo(() => {
    let result = allProducts;

    // Availability filter
    if (!showAll) {
      result = result.filter(p => p.isActive);
    }

    // Category filter
    if (filter !== 'all') {
      result = result.filter(p => p.category === filter);
    }

    // Search filter (searches both languages)
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(p =>
        p.titleEn.toLowerCase().includes(q) ||
        p.titleBn.includes(q) ||
        p.descEn.toLowerCase().includes(q) ||
        p.descBn.includes(q) ||
        p.categoryLabel.toLowerCase().includes(q)
      );
    }

    return result;
  }, [allProducts, filter, search, showAll]);

  const searchPlaceholder = lang === 'en' ? 'Search products...' : 'পণ্য খুঁজুন...';
  const showAllLabel = lang === 'en' ? 'Show inactive' : 'নিষ্ক্রিয় দেখান';
  const noResults = lang === 'en' ? 'No products found.' : 'কোনো পণ্য পাওয়া যায়নি।';

  return (
    <section id="products" className="py-24 bg-secondary relative overflow-hidden">
      {/* Subtle pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'radial-gradient(hsl(var(--sm-gold)) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-10">
          <span className="inline-block text-accent text-xs font-semibold tracking-widest uppercase mb-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            {lang === 'en' ? 'Our Products' : 'আমাদের পণ্য'}
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-5">{t('products.title')}</h2>
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-accent/40" />
            <div className="w-2 h-2 rotate-45 bg-accent/70" />
            <div className="h-px w-12 bg-accent/40" />
          </div>
        </div>

        {/* Search bar */}
        <div className="max-w-md mx-auto mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-10 rounded-full bg-background border-border"
          />
        </div>

        {/* Category filter chips + availability toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <div className="flex justify-center gap-2 flex-wrap">
            {filterCategories.map(c => (
              <button
                key={c.id}
                onClick={() => setFilter(c.id)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${filter === c.id ? 'bg-sm-red text-white' : 'bg-background text-foreground hover:bg-accent'}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p className="text-center text-xs text-muted-foreground mb-4">
          {lang === 'en'
            ? `${filtered.length} product${filtered.length !== 1 ? 's' : ''} found`
            : `${filtered.length}টি পণ্য পাওয়া গেছে`}
        </p>

        {/* Product grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">{noResults}</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtered.map((p, i) => (
              <div
                key={i}
                className="group cursor-pointer overflow-hidden rounded-2xl bg-background shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative border border-border/30"
                onClick={() => setLightbox(p)}
              >
                {!p.isActive && (
                  <span className="absolute top-3 left-3 z-10 bg-muted text-muted-foreground text-[10px] px-2 py-0.5 rounded-full">
                    {lang === 'en' ? 'Inactive' : 'নিষ্ক্রিয়'}
                  </span>
                )}
                {p.categoryLabel && (
                  <span className="absolute top-3 right-3 z-10 bg-primary/80 text-primary-foreground text-[10px] px-2.5 py-1 rounded-full backdrop-blur-sm">
                    {p.categoryLabel}
                  </span>
                )}
                {/* Gold corner accents on hover */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[hsl(var(--sm-gold))]/0 group-hover:border-[hsl(var(--sm-gold))]/60 transition-all duration-300 rounded-tl-2xl z-10" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[hsl(var(--sm-gold))]/0 group-hover:border-[hsl(var(--sm-gold))]/60 transition-all duration-300 rounded-br-2xl z-10" />
                <div className={`aspect-square overflow-hidden bg-muted relative ${!p.isActive ? 'opacity-50' : ''}`}>
                  {p.src ? (
                    <img
                      src={p.src}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      {p.title}
                    </div>
                  )}
                  {/* Frosted-glass title overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 pt-10">
                    <p className="font-semibold text-sm text-white line-clamp-1 drop-shadow-sm">{p.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox with bilingual details */}
      {lightbox && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white z-10" onClick={() => setLightbox(null)}>
            <X className="h-8 w-8" />
          </button>
          <div className="max-w-3xl w-full flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
            {lightbox.src && (
              <img src={lightbox.src} alt={lightbox.title} className="max-w-full max-h-[55vh] object-contain rounded-lg" />
            )}
            <div className="text-center space-y-3 max-w-xl">
              <h3 className="text-xl font-bold text-white">{lightbox.title}</h3>
              {lightbox.categoryLabel && (
                <span className="inline-block bg-white/10 text-white/70 text-xs px-3 py-1 rounded-full">{lightbox.categoryLabel}</span>
              )}
              {lightbox.desc && (
                <p className="text-white/60 text-sm leading-relaxed">{lightbox.desc}</p>
              )}
              {/* Show both languages in lightbox */}
              {lightbox.titleBn && lightbox.titleEn && (
                <div className="pt-2 border-t border-white/10 space-y-1">
                  <p className="text-white/40 text-xs">
                    {lang === 'en' ? `বাংলা: ${lightbox.titleBn}` : `English: ${lightbox.titleEn}`}
                  </p>
                  {(lang === 'en' ? lightbox.descBn : lightbox.descEn) && (
                    <p className="text-white/30 text-xs">
                      {lang === 'en' ? lightbox.descBn : lightbox.descEn}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ProductsSection;

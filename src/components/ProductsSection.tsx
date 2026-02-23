import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { X, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import OptimizedImage from '@/components/OptimizedImage';
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
  // Corporate
  { src: img1, titleEn: 'Premium Silk Ties', titleBn: 'প্রিমিয়াম সিল্ক টাই', descEn: 'Hand-crafted silk ties with custom logo embroidery for executive gifting.', descBn: 'এক্সিকিউটিভ গিফটিংয়ের জন্য কাস্টম লোগো এমব্রয়ডারি সহ হাতে তৈরি সিল্ক টাই।', category: 'corporate' },
  { src: img3, titleEn: 'Crystal Award Trophy', titleBn: 'ক্রিস্টাল অ্যাওয়ার্ড ট্রফি', descEn: 'Elegant crystal trophies for recognition ceremonies & corporate events.', descBn: 'স্বীকৃতি অনুষ্ঠান ও কর্পোরেট ইভেন্টের জন্য মার্জিত ক্রিস্টাল ট্রফি।', category: 'corporate' },
  { src: img4, titleEn: 'Luxury Gift Box', titleBn: 'লাক্সারি গিফট বক্স', descEn: 'Premium leather gift boxes with gold ribbon for VIP corporate presents.', descBn: 'ভিআইপি কর্পোরেট উপহারের জন্য সোনালী রিবন সহ প্রিমিয়াম লেদার গিফট বক্স।', category: 'corporate' },
  { src: img8, titleEn: 'Insulated Thermos', titleBn: 'ইনসুলেটেড থার্মোস', descEn: 'Matte black stainless steel flask with custom logo branding.', descBn: 'কাস্টম লোগো ব্র্যান্ডিং সহ ম্যাট ব্ল্যাক স্টেইনলেস স্টিল ফ্লাস্ক।', category: 'corporate' },
  { src: img9, titleEn: 'Leather Portfolio', titleBn: 'লেদার পোর্টফোলিও', descEn: 'Premium brown leather executive portfolio folder for conferences.', descBn: 'কনফারেন্সের জন্য প্রিমিয়াম ব্রাউন লেদার এক্সিকিউটিভ পোর্টফোলিও ফোল্ডার।', category: 'corporate' },
  { src: img10, titleEn: 'Crystal Paperweight', titleBn: 'ক্রিস্টাল পেপারওয়েট', descEn: 'Polished crystal globe paperweight — an elegant desk accessory.', descBn: 'পলিশড ক্রিস্টাল গ্লোব পেপারওয়েট — একটি মার্জিত ডেস্ক অ্যাক্সেসরি।', category: 'corporate' },
  { src: img11, titleEn: 'Custom Glassware', titleBn: 'কাস্টম গ্লাসওয়্যার', descEn: 'Elegant crystal glass pitcher for premium hospitality gifting.', descBn: 'প্রিমিয়াম হসপিটালিটি গিফটিংয়ের জন্য মার্জিত ক্রিস্টাল গ্লাস পিচার।', category: 'corporate' },
  { src: img12, titleEn: 'Gift Hamper', titleBn: 'গিফট হ্যাম্পার', descEn: 'Curated luxury gift basket with gold ribbon — ideal for festivals & events.', descBn: 'সোনালী রিবন সহ কিউরেটেড লাক্সারি গিফট বাস্কেট — উৎসব ও ইভেন্টের জন্য আদর্শ।', category: 'corporate' },

  // Souvenir
  { src: img2, titleEn: 'Commemorative Crest', titleBn: 'স্মারক ক্রেস্ট', descEn: 'Metal crest plaques with custom engraving for government & corporate offices.', descBn: 'সরকারি ও কর্পোরেট অফিসের জন্য কাস্টম খোদাই সহ ধাতব ক্রেস্ট প্ল্যাক।', category: 'souvenir' },
  { src: img6, titleEn: 'Crystal Souvenir', titleBn: 'ক্রিস্টাল স্যুভেনির', descEn: 'Custom-engraved crystal souvenirs for landmark projects & inaugurations.', descBn: 'ল্যান্ডমার্ক প্রকল্প ও উদ্বোধনের জন্য কাস্টম-খোদাই ক্রিস্টাল স্যুভেনির।', category: 'souvenir' },
  { src: img3, titleEn: 'Memorial Shield', titleBn: 'স্মৃতি শিল্ড', descEn: 'Engraved brass memorial shields for national events & anniversaries.', descBn: 'জাতীয় অনুষ্ঠান ও বার্ষিকীর জন্য খোদাই করা ব্রাস মেমোরিয়াল শিল্ড।', category: 'souvenir' },
  { src: img10, titleEn: 'Crystal Globe', titleBn: 'ক্রিস্টাল গ্লোব', descEn: 'Hand-polished crystal globe with etched landmark — a premium keepsake.', descBn: 'খোদাই করা ল্যান্ডমার্ক সহ হ্যান্ড-পলিশড ক্রিস্টাল গ্লোব — সংগ্রাহকদের স্মারক।', category: 'souvenir' },

  // Stationery
  { src: img5, titleEn: 'Executive Pen Set', titleBn: 'এক্সিকিউটিভ পেন সেট', descEn: 'Black & gold branded ballpoint pens — perfect for signing ceremonies.', descBn: 'সাইনিং সেরেমনির জন্য পারফেক্ট — ব্ল্যাক ও গোল্ড ব্র্যান্ডেড বলপয়েন্ট পেন।', category: 'stationery' },
  { src: img7, titleEn: 'Wooden Desk Organizer', titleBn: 'কাঠের ডেস্ক অর্গানাইজার', descEn: 'Handcrafted wooden pen & card holder for the modern executive desk.', descBn: 'আধুনিক এক্সিকিউটিভ ডেস্কের জন্য হাতে তৈরি কাঠের পেন ও কার্ড হোল্ডার।', category: 'stationery' },
  { src: img9, titleEn: 'Executive Notebook', titleBn: 'এক্সিকিউটিভ নোটবুক', descEn: 'Premium leather-bound notebook with gold-embossed logo for professionals.', descBn: 'পেশাদারদের জন্য গোল্ড-এমবসড লোগো সহ প্রিমিয়াম লেদার-বাউন্ড নোটবুক।', category: 'stationery' },
  { src: img4, titleEn: 'Branded Stationery Set', titleBn: 'ব্র্যান্ডেড স্টেশনারি সেট', descEn: 'Complete corporate stationery kit with letterhead, envelopes & business cards.', descBn: 'লেটারহেড, খাম ও বিজনেস কার্ড সহ সম্পূর্ণ কর্পোরেট স্টেশনারি কিট।', category: 'stationery' },
];

type DisplayProduct = {
  dbId?: string;
  slug?: string;
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
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [lightbox, setLightbox] = useState<DisplayProduct | null>(null);

  // Fetch ALL products (active + inactive) for availability filter
  const { data: dbProducts = [], isLoading: productsLoading } = useQuery({
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
          dbId: p.id,
          slug: (p as any).product_code ? encodeURIComponent((p as any).product_code) : p.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || p.id,
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
        {productsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-border/30 overflow-hidden bg-background">
                <Skeleton className="aspect-square w-full" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">{noResults}</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtered.map((p, i) => (
              <div
                key={i}
                className="group cursor-pointer overflow-hidden rounded-2xl bg-background shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative border border-border/30 flex flex-col"
                onClick={() => p.dbId ? navigate(`/product/${p.slug || p.dbId}`) : setLightbox(p)}
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
                <div className={`aspect-square overflow-hidden bg-white relative ${!p.isActive ? 'opacity-50' : ''}`}>
                  {p.src ? (
                    <OptimizedImage
                      src={p.src}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                      wrapperClassName="w-full h-full relative"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      {p.title}
                    </div>
                  )}
                </div>
                {/* E-commerce details body */}
                <div className="p-3 flex flex-col gap-1.5 flex-1">
                  <h3 className="font-semibold text-sm text-foreground line-clamp-2 leading-tight">{p.title}</h3>
                  {p.categoryLabel && (
                    <span className="inline-block self-start bg-primary/10 text-primary text-[10px] font-medium px-2 py-0.5 rounded-full">
                      {p.categoryLabel}
                    </span>
                  )}
                  {p.desc && (
                    <p className="text-muted-foreground text-xs line-clamp-2 leading-relaxed">{p.desc}</p>
                  )}
                  <span className="mt-auto pt-1.5 text-[11px] font-semibold text-[hsl(var(--sm-gold))] group-hover:underline">
                    {lang === 'en' ? 'Request Quote →' : 'কোটেশন চান →'}
                  </span>
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
                <span className="inline-block bg-primary/20 text-primary-foreground text-xs px-3 py-1 rounded-full">{lightbox.categoryLabel}</span>
              )}
              {lightbox.desc && (
                <p className="text-white/60 text-sm leading-relaxed">{lightbox.desc}</p>
              )}
              {/* Bilingual alternate */}
              {lightbox.titleBn && lightbox.titleEn && (
                <p className="text-white/30 text-xs pt-2 border-t border-white/10">
                  {lang === 'en' ? `বাংলা: ${lightbox.titleBn}` : `English: ${lightbox.titleEn}`}
                </p>
              )}
              {/* Request Quote CTA */}
              <a
                href="#contact"
                onClick={() => setLightbox(null)}
                className="inline-block mt-3 px-6 py-2.5 rounded-full bg-[hsl(var(--sm-gold))] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                {lang === 'en' ? 'Request Quote' : 'কোটেশন অনুরোধ'}
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ProductsSection;

import { useState, useMemo, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/apiClient';
import { ZoomIn } from 'lucide-react';
import OptimizedImage from '@/components/OptimizedImage';
import GalleryLightbox from '@/components/gallery/GalleryLightbox';

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

interface GalleryItem {
  src: string;
  titleEn: string;
  titleBn: string;
  category: string;
}

const staticItems: GalleryItem[] = [
  { src: img3, titleEn: 'Crystal Award Trophy', titleBn: 'ক্রিস্টাল অ্যাওয়ার্ড ট্রফি', category: 'crystal' },
  { src: img1, titleEn: 'Premium Silk Ties', titleBn: 'প্রিমিয়াম সিল্ক টাই', category: 'corporate' },
  { src: img4, titleEn: 'Luxury Gift Box', titleBn: 'লাক্সারি গিফট বক্স', category: 'corporate' },
  { src: img5, titleEn: 'Executive Pen Set', titleBn: 'এক্সিকিউটিভ পেন সেট', category: 'stationery' },
  { src: img11, titleEn: 'Custom Glassware', titleBn: 'কাস্টম গ্লাসওয়্যার', category: 'crystal' },
  { src: img7, titleEn: 'Wooden Desk Organizer', titleBn: 'কাঠের ডেস্ক অর্গানাইজার', category: 'stationery' },
  { src: img8, titleEn: 'Insulated Thermos', titleBn: 'ইনসুলেটেড থার্মোস', category: 'corporate' },
  { src: img9, titleEn: 'Leather Portfolio', titleBn: 'লেদার পোর্টফোলিও', category: 'leather' },
  { src: img2, titleEn: 'Commemorative Crest', titleBn: 'স্মারক ক্রেস্ট', category: 'souvenir' },
  { src: img6, titleEn: 'Crystal Souvenir', titleBn: 'ক্রিস্টাল স্যুভেনির', category: 'crystal' },
  { src: img10, titleEn: 'Crystal Paperweight', titleBn: 'ক্রিস্টাল পেপারওয়েট', category: 'crystal' },
  { src: img12, titleEn: 'Premium Gift Hamper', titleBn: 'প্রিমিয়াম গিফট হ্যাম্পার', category: 'corporate' },
];

const categories = [
  { id: 'all', labelEn: 'All', labelBn: 'সব' },
  { id: 'corporate', labelEn: 'Corporate', labelBn: 'কর্পোরেট' },
  { id: 'crystal', labelEn: 'Crystal & Glass', labelBn: 'ক্রিস্টাল ও গ্লাস' },
  { id: 'leather', labelEn: 'Leather', labelBn: 'লেদার' },
  { id: 'stationery', labelEn: 'Stationery', labelBn: 'স্টেশনারি' },
  { id: 'souvenir', labelEn: 'Souvenirs', labelBn: 'স্যুভেনির' },
];

const Gallery = () => {
  const { lang } = useLanguage();
  const [filter, setFilter] = useState('all');
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  // Try DB gallery first
  const { data: dbGallery = [] } = useQuery({
    queryKey: ['public-gallery'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const items: GalleryItem[] = useMemo(() => {
    if (dbGallery.length > 0) {
      return dbGallery.map(g => ({
        src: g.image_url,
        titleEn: g.title_en,
        titleBn: g.title_bn || g.title_en,
        category: g.category || 'corporate',
      }));
    }
    return staticItems;
  }, [dbGallery]);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter(i => i.category === filter);
  }, [items, filter]);

  const title = (i: GalleryItem) => lang === 'en' ? i.titleEn : i.titleBn;

  const lightboxItems = useMemo(() =>
    filtered.map(i => ({ src: i.src, title: title(i) })),
    [filtered, lang]
  );

  const onNavigate = useCallback((idx: number) => setLightboxIdx(idx), []);

  return (
    <div className="bg-background">

      {/* Hero */}
      <section className="relative bg-primary text-primary-foreground py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 30% 40%, hsl(var(--sm-gold)) 0%, transparent 50%), radial-gradient(circle at 70% 60%, hsl(var(--sm-gold)) 0%, transparent 50%)',
        }} />
        <div className="container mx-auto px-4 relative text-center">
          <span className="inline-block text-accent text-xs font-semibold tracking-[0.25em] uppercase mb-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            {lang === 'en' ? 'Studio Collection' : 'স্টুডিও কালেকশন'}
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            {lang === 'en' ? 'Product Gallery' : 'পণ্য গ্যালারি'}
          </h1>
          <p className="text-primary-foreground/60 max-w-xl mx-auto text-lg" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            {lang === 'en'
              ? 'Browse our studio-shot product photography — every item captured in pristine detail.'
              : 'আমাদের স্টুডিও-শট প্রোডাক্ট ফটোগ্রাফি ব্রাউজ করুন — প্রতিটি আইটেম নিখুঁত বিস্তারিত ক্যাপচার করা।'}
          </p>
        </div>
      </section>

      {/* Filter pills */}
      <section className="sticky top-16 z-40 bg-background/95 backdrop-blur-lg border-b border-border py-4">
        <div className="container mx-auto px-4 flex justify-center gap-2 flex-wrap">
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                filter === c.id
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-secondary text-foreground hover:bg-accent/20'
              }`}
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {lang === 'en' ? c.labelEn : c.labelBn}
            </button>
          ))}
        </div>
      </section>

      {/* Masonry-style gallery grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <p className="text-sm text-muted-foreground mb-8" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            {lang === 'en'
              ? `${filtered.length} image${filtered.length !== 1 ? 's' : ''}`
              : `${filtered.length}টি ছবি`}
          </p>

          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {filtered.map((item, i) => (
              <div
                key={i}
                className="break-inside-avoid group cursor-pointer relative rounded-2xl overflow-hidden bg-white border border-border/30 hover:shadow-xl transition-all duration-300"
                onClick={() => setLightboxIdx(i)}
              >
                <OptimizedImage
                  src={item.src}
                  alt={title(item)}
                  className="w-full h-auto object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                  wrapperClassName="relative"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/60 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center px-4">
                    <ZoomIn className="h-8 w-8 text-white mx-auto mb-2" />
                    <p className="text-white text-sm font-semibold">{title(item)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {lang === 'en' ? 'Like What You See?' : 'পছন্দ হয়েছে?'}
          </h2>
          <p className="text-primary-foreground/60 mb-8 max-w-lg mx-auto" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            {lang === 'en'
              ? 'Every product can be customized with your logo and branding. Contact us for a free consultation.'
              : 'প্রতিটি পণ্য আপনার লোগো ও ব্র্যান্ডিং দিয়ে কাস্টমাইজ করা যায়। বিনামূল্যে পরামর্শের জন্য যোগাযোগ করুন।'}
          </p>
          <a
            href="/#contact"
            className="inline-block px-10 py-4 rounded-lg bg-accent text-white font-semibold hover:bg-accent/90 transition-colors"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            {lang === 'en' ? 'Request a Quote' : 'কোটেশন অনুরোধ'}
          </a>
        </div>
      </section>

      

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <GalleryLightbox
          items={lightboxItems}
          currentIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
};

export default Gallery;

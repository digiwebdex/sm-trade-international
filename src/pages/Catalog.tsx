import { useState, useMemo, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, X, MessageCircle, ShoppingBag, Check } from 'lucide-react';
import { useQuoteBasket } from '@/contexts/QuoteBasketContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TopBar from '@/components/TopBar';
import Navbar from '@/components/Navbar';
import CatalogFilters from '@/components/catalog/CatalogFilters';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { lazy, Suspense } from 'react';

const Footer = lazy(() => import('@/components/Footer'));

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

interface Product {
  src: string;
  titleEn: string;
  titleBn: string;
  descEn: string;
  descBn: string;
  category: string;
  features?: string[];
}

const staticProducts: Product[] = [
  { src: img3, titleEn: 'Crystal Award Trophy', titleBn: 'ক্রিস্টাল অ্যাওয়ার্ড ট্রফি', descEn: 'Elegant crystal trophies handcrafted for recognition ceremonies, corporate milestones, and VIP events. Each piece is precision-cut and can be laser-engraved with your organization\'s logo and message.', descBn: 'স্বীকৃতি অনুষ্ঠান, কর্পোরেট মাইলফলক এবং ভিআইপি ইভেন্টের জন্য হাতে তৈরি মার্জিত ক্রিস্টাল ট্রফি।', category: 'corporate', features: ['Laser engraving', 'Gift box included', 'Custom sizes'] },
  { src: img1, titleEn: 'Premium Silk Ties', titleBn: 'প্রিমিয়াম সিল্ক টাই', descEn: 'Hand-crafted silk ties featuring custom logo embroidery, available in a curated palette of corporate colors. Perfect for executive gifting and team branding at international events.', descBn: 'কাস্টম লোগো এমব্রয়ডারি সহ হাতে তৈরি সিল্ক টাই, কর্পোরেট রঙের কিউরেটেড প্যালেটে উপলব্ধ।', category: 'corporate', features: ['100% silk', 'Custom embroidery', 'Gift packaging'] },
  { src: img4, titleEn: 'Luxury Gift Box', titleBn: 'লাক্সারি গিফট বক্স', descEn: 'Premium leather-bound gift boxes adorned with gold satin ribbon. Designed for VIP corporate presents, conference giveaways, and high-profile diplomatic exchanges.', descBn: 'সোনালী সাটিন রিবনে সজ্জিত প্রিমিয়াম লেদার-বাউন্ড গিফট বক্স।', category: 'corporate', features: ['Genuine leather', 'Gold ribbon', 'Customizable interior'] },
  { src: img5, titleEn: 'Executive Pen Set', titleBn: 'এক্সিকিউটিভ পেন সেট', descEn: 'Prestigious black & gold ballpoint pen set — the hallmark of professional elegance. Ideal for signing ceremonies, board presentations, and executive desk accessories.', descBn: 'প্রতিষ্ঠিত ব্ল্যাক ও গোল্ড বলপয়েন্ট পেন সেট — পেশাদার কমনীয়তার প্রতীক।', category: 'stationery', features: ['Metal body', 'Gold accents', 'Velvet case'] },
  { src: img11, titleEn: 'Custom Glassware', titleBn: 'কাস্টম গ্লাসওয়্যার', descEn: 'Elegant crystal glass pitcher crafted for premium hospitality gifting. Perfect for hotel welcome packages, corporate dining, and VIP lounges.', descBn: 'প্রিমিয়াম হসপিটালিটি গিফটিংয়ের জন্য তৈরি মার্জিত ক্রিস্টাল গ্লাস পিচার।', category: 'corporate', features: ['Lead-free crystal', 'Custom etching', 'Premium packaging'] },
  { src: img7, titleEn: 'Wooden Desk Organizer', titleBn: 'কাঠের ডেস্ক অর্গানাইজার', descEn: 'Handcrafted wooden pen & card holder that brings warmth and sophistication to any executive workspace. Features compartments for pens, business cards, and sticky notes.', descBn: 'হাতে তৈরি কাঠের পেন ও কার্ড হোল্ডার যা যেকোনো এক্সিকিউটিভ ওয়ার্কস্পেসে উষ্ণতা ও পরিশীলতা আনে।', category: 'stationery', features: ['Natural wood', 'Multi-compartment', 'Logo engraving'] },
  { src: img8, titleEn: 'Insulated Thermos', titleBn: 'ইনসুলেটেড থার্মোস', descEn: 'Matte black stainless steel flask with double-wall vacuum insulation. Keeps beverages hot for 12 hours. Custom logo branding via laser engraving or silk-screen printing.', descBn: 'ডাবল-ওয়াল ভ্যাকুয়াম ইনসুলেশন সহ ম্যাট ব্ল্যাক স্টেইনলেস স্টিল ফ্লাস্ক।', category: 'corporate', features: ['12hr insulation', 'BPA-free', 'Laser branding'] },
  { src: img9, titleEn: 'Leather Portfolio', titleBn: 'লেদার পোর্টফোলিও', descEn: 'Premium cognac-brown leather executive portfolio folder with brass zipper. Perfect for conferences, board meetings, and professional document organization.', descBn: 'ব্রাস জিপার সহ প্রিমিয়াম কগন্যাক-ব্রাউন লেদার এক্সিকিউটিভ পোর্টফোলিও ফোল্ডার।', category: 'corporate', features: ['Full-grain leather', 'Brass hardware', 'Document pockets'] },
  { src: img2, titleEn: 'Commemorative Crest', titleBn: 'স্মারক ক্রেস্ট', descEn: 'Bespoke metal crest plaques with fine detail engraving for government ministries, embassies, and corporate headquarters. A lasting symbol of achievement and partnership.', descBn: 'সরকারি মন্ত্রণালয়, দূতাবাস এবং কর্পোরেট সদর দফতরের জন্য সূক্ষ্ম বিস্তারিত খোদাই সহ বিস্পোক ধাতব ক্রেস্ট প্ল্যাক।', category: 'souvenir', features: ['Die-cast metal', 'Custom design', 'Display stand'] },
  { src: img6, titleEn: 'Crystal Souvenir', titleBn: 'ক্রিস্টাল স্যুভেনির', descEn: 'Custom-engraved crystal souvenirs commemorating landmark infrastructure projects, national celebrations, and diplomatic milestones.', descBn: 'ল্যান্ডমার্ক অবকাঠামো প্রকল্প, জাতীয় উদযাপন এবং কূটনৈতিক মাইলফলক স্মরণে কাস্টম-খোদাই ক্রিস্টাল স্যুভেনির।', category: 'souvenir', features: ['3D engraving', 'Optical crystal', 'Presentation box'] },
  { src: img10, titleEn: 'Crystal Paperweight', titleBn: 'ক্রিস্টাল পেপারওয়েট', descEn: 'Polished optical crystal globe paperweight — a timeless desk accessory that adds understated luxury to any workspace.', descBn: 'পলিশড অপটিক্যাল ক্রিস্টাল গ্লোব পেপারওয়েট — যেকোনো ওয়ার্কস্পেসে বিচক্ষণ বিলাসিতা যোগ করে।', category: 'corporate', features: ['Optical clarity', 'Heavy weight', 'Gift-ready'] },
  { src: img12, titleEn: 'Premium Gift Hamper', titleBn: 'প্রিমিয়াম গিফট হ্যাম্পার', descEn: 'Curated luxury gift baskets featuring gourmet selections, wrapped with gold satin ribbon. Ideal for Eid, Pohela Boishakh, and corporate appreciation events.', descBn: 'গুর্মে সিলেকশন সমৃদ্ধ কিউরেটেড লাক্সারি গিফট বাস্কেট, সোনালী সাটিন রিবনে মোড়ানো।', category: 'corporate', features: ['Curated selection', 'Festival-ready', 'Custom branding'] },
];

const categories = [
  { id: 'all', labelEn: 'All Products', labelBn: 'সকল পণ্য' },
  { id: 'corporate', labelEn: 'Corporate Gifts', labelBn: 'কর্পোরেট গিফট' },
  { id: 'souvenir', labelEn: 'Souvenirs', labelBn: 'স্যুভেনির' },
  { id: 'stationery', labelEn: 'Stationery', labelBn: 'স্টেশনারি' },
];

const Catalog = () => {
  const { t, lang } = useLanguage();
  const { get } = useSiteSettings();
  const { addItem, items: basketItems, setIsOpen: openBasket } = useQuoteBasket();
  const whatsappNumber = (get('contact', 'whatsapp_number', '8801867666888') as string).replace(/[^0-9]/g, '') || '8801867666888';
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Product | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  const handleAddToQuote = useCallback((p: Product, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const id = p.titleEn.toLowerCase().replace(/\s+/g, '-');
    addItem({ id, titleEn: p.titleEn, titleBn: p.titleBn, src: p.src, category: p.category });
    setJustAdded(id);
    setTimeout(() => setJustAdded(null), 1500);
  }, [addItem]);

  const isInBasket = useCallback((p: Product) => {
    const id = p.titleEn.toLowerCase().replace(/\s+/g, '-');
    return basketItems.some(i => i.id === id);
  }, [basketItems]);

  const getWhatsAppUrl = useCallback((p: Product) => {
    const productName = lang === 'en' ? p.titleEn : p.titleBn;
    const message = lang === 'en'
      ? `Hi, I'm interested in "${productName}" from your catalog. Could you please share pricing and customization details?`
      : `হ্যালো, আমি আপনার ক্যাটালগ থেকে "${productName}" পণ্যটিতে আগ্রহী। দয়া করে মূল্য ও কাস্টমাইজেশনের বিবরণ জানাবেন?`;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  }, [lang, whatsappNumber]);

  // Try DB products first
  const { data: dbProducts = [] } = useQuery({
    queryKey: ['catalog-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name_en, name_bn)')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const products = useMemo(() => {
    if (dbProducts.length > 0) {
      return dbProducts.map(p => {
        const cat = (p as any).categories;
        return {
          src: p.image_url || '',
          titleEn: p.name_en,
          titleBn: p.name_bn || p.name_en,
          descEn: p.description_en || '',
          descBn: p.description_bn || p.description_en || '',
          category: cat?.name_en?.toLowerCase() || 'corporate',
          features: [],
        } as Product;
      });
    }
    return staticProducts;
  }, [dbProducts]);

  // Extract all unique features
  const allFeatures = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => p.features?.forEach(f => set.add(f)));
    return Array.from(set).sort();
  }, [products]);

  const toggleFeature = useCallback((f: string) => {
    setSelectedFeatures(prev =>
      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
    );
  }, []);

  const resetFilters = useCallback(() => {
    setFilter('all');
    setSelectedFeatures([]);
    setSearch('');
  }, []);

  const filtered = useMemo(() => {
    let result = products;
    if (filter !== 'all') result = result.filter(p => p.category === filter);
    if (selectedFeatures.length > 0) {
      result = result.filter(p =>
        selectedFeatures.every(f => p.features?.includes(f))
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.titleEn.toLowerCase().includes(q) || p.titleBn.includes(q) ||
        p.descEn.toLowerCase().includes(q)
      );
    }
    return result;
  }, [products, filter, search, selectedFeatures]);

  const title = (p: Product) => lang === 'en' ? p.titleEn : p.titleBn;
  const desc = (p: Product) => lang === 'en' ? p.descEn : p.descBn;

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Navbar />

      {/* Hero banner */}
      <section className="relative bg-primary text-primary-foreground py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, hsl(var(--sm-gold)) 0%, transparent 50%), radial-gradient(circle at 80% 50%, hsl(var(--sm-gold)) 0%, transparent 50%)',
        }} />
        <div className="container mx-auto px-4 relative text-center">
          <span className="inline-block text-accent text-xs font-semibold tracking-[0.25em] uppercase mb-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            {lang === 'en' ? 'Premium Collection' : 'প্রিমিয়াম কালেকশন'}
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            {lang === 'en' ? 'Product Catalog' : 'পণ্য ক্যাটালগ'}
          </h1>
          <p className="text-primary-foreground/60 max-w-xl mx-auto text-lg" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            {lang === 'en'
              ? 'Explore our curated collection of premium corporate gifts, custom souvenirs, and branded merchandise.'
              : 'আমাদের প্রিমিয়াম কর্পোরেট গিফট, কাস্টম স্যুভেনির এবং ব্র্যান্ডেড পণ্যের কিউরেটেড সংগ্রহ অন্বেষণ করুন।'}
          </p>
        </div>
      </section>

      {/* Search bar */}
      <section className="sticky top-16 z-40 bg-background/95 backdrop-blur-lg border-b border-border py-4">
        <div className="container mx-auto px-4 flex items-center gap-3">
          <CatalogFilters
            lang={lang}
            categories={categories}
            filter={filter}
            setFilter={setFilter}
            selectedFeatures={selectedFeatures}
            toggleFeature={toggleFeature}
            allFeatures={[]}
            onReset={resetFilters}
            open={filtersOpen}
            setOpen={setFiltersOpen}
            variant="sticky"
          />
          <div className="relative flex-1 max-w-sm ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={lang === 'en' ? 'Search catalog...' : 'ক্যাটালগ খুঁজুন...'}
              className="pl-10 rounded-full"
            />
          </div>
        </div>
      </section>

      {/* Content with sidebar */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar filters */}
            <div className="hidden md:block">
              <CatalogFilters
                lang={lang}
                categories={categories}
                filter={filter}
                setFilter={setFilter}
                selectedFeatures={selectedFeatures}
                toggleFeature={toggleFeature}
                allFeatures={allFeatures}
                onReset={resetFilters}
                open={true}
                setOpen={() => {}}
              />
            </div>

            {/* Product grid */}
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-6" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                {lang === 'en'
                  ? `Showing ${filtered.length} product${filtered.length !== 1 ? 's' : ''}`
                  : `${filtered.length}টি পণ্য দেখানো হচ্ছে`}
              </p>

              {filtered.length === 0 ? (
                <div className="text-center py-24 text-muted-foreground">
                  <p className="mb-4">{lang === 'en' ? 'No products found.' : 'কোনো পণ্য পাওয়া যায়নি।'}</p>
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    {lang === 'en' ? 'Clear filters' : 'ফিল্টার মুছুন'}
                  </Button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map((p, i) => (
                    <div
                      key={i}
                      className="group cursor-pointer bg-card rounded-2xl border border-border/50 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-400"
                      onClick={() => setSelected(p)}
                    >
                      <div className="aspect-[4/3] bg-white overflow-hidden relative">
                        <img
                          src={p.src}
                          alt={title(p)}
                          className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute top-4 left-4">
                          <span className="bg-primary/90 text-primary-foreground text-[11px] font-semibold px-3 py-1 rounded-full backdrop-blur-sm" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                            {categories.find(c => c.id === p.category)?.[lang === 'en' ? 'labelEn' : 'labelBn'] || p.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-lg font-bold mb-2 group-hover:text-accent transition-colors">{title(p)}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 mb-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                          {desc(p)}
                        </p>
                        {p.features && p.features.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {p.features.map((f, fi) => (
                              <span key={fi} className="text-[10px] font-medium bg-accent/10 text-accent px-2.5 py-1 rounded-full" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                                {f}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={(e) => handleAddToQuote(p, e)}
                            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                              isInBasket(p)
                                ? 'bg-accent/15 text-accent'
                                : 'bg-primary/10 text-primary hover:bg-primary/20'
                            }`}
                            style={{ fontFamily: 'DM Sans, sans-serif' }}
                          >
                            {justAdded === p.titleEn.toLowerCase().replace(/\s+/g, '-') ? (
                              <><Check className="h-3.5 w-3.5" /> {lang === 'en' ? 'Added!' : 'যোগ হয়েছে!'}</>
                            ) : isInBasket(p) ? (
                              <><ShoppingBag className="h-3.5 w-3.5" /> {lang === 'en' ? 'In Basket' : 'বাস্কেটে আছে'}</>
                            ) : (
                              <><ShoppingBag className="h-3.5 w-3.5" /> {lang === 'en' ? 'Add to Quote' : 'কোটে যোগ করুন'}</>
                            )}
                          </button>
                          <a
                            href={getWhatsAppUrl(p)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1 text-[11px] font-medium text-[hsl(142,70%,40%)] hover:underline"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            WhatsApp
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {lang === 'en' ? 'Need Custom Products?' : 'কাস্টম পণ্য দরকার?'}
          </h2>
          <p className="text-primary-foreground/60 mb-8 max-w-lg mx-auto" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            {lang === 'en'
              ? 'We specialize in bespoke corporate gifts tailored to your brand. Get in touch for a free consultation.'
              : 'আমরা আপনার ব্র্যান্ডের জন্য বিশেষভাবে তৈরি কর্পোরেট গিফটে বিশেষজ্ঞ। বিনামূল্যে পরামর্শের জন্য যোগাযোগ করুন।'}
          </p>
          <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-white px-10 py-6 rounded-lg text-base">
            <a href="/#contact">
              <span className="font-semibold" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                {lang === 'en' ? 'Request a Quote' : 'কোটেশন অনুরোধ করুন'}
              </span>
            </a>
          </Button>
        </div>
      </section>

      <Suspense fallback={null}><Footer /></Suspense>

      {/* Product Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div
            className="bg-card rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative">
              <button
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-foreground/10 backdrop-blur-sm flex items-center justify-center hover:bg-foreground/20 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="aspect-[16/10] bg-secondary/50 overflow-hidden rounded-t-2xl">
                <img src={selected.src} alt={title(selected)} className="w-full h-full object-contain p-10" />
              </div>
            </div>

            <div className="p-8">
              <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                {categories.find(c => c.id === selected.category)?.[lang === 'en' ? 'labelEn' : 'labelBn'] || selected.category}
              </span>

              <h2 className="text-2xl md:text-3xl font-bold mb-4">{title(selected)}</h2>

              <p className="text-muted-foreground leading-relaxed mb-6" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                {desc(selected)}
              </p>

              {/* Bilingual alternate */}
              {selected.titleBn && selected.titleEn && (
                <p className="text-muted-foreground/50 text-sm mb-6 pb-6 border-b border-border" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  {lang === 'en' ? `বাংলা: ${selected.titleBn} — ${selected.descBn}` : `English: ${selected.titleEn} — ${selected.descEn}`}
                </p>
              )}

              {/* Features */}
              {selected.features && selected.features.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold mb-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    {lang === 'en' ? 'Key Features' : 'মূল বৈশিষ্ট্য'}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selected.features.map((f, i) => (
                      <span key={i} className="bg-accent/10 text-accent text-sm font-medium px-4 py-1.5 rounded-full" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-white px-8 gap-2"
                  onClick={() => { handleAddToQuote(selected); }}
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span className="font-semibold" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    {isInBasket(selected)
                      ? (lang === 'en' ? 'Added to Basket ✓' : 'বাস্কেটে যোগ হয়েছে ✓')
                      : (lang === 'en' ? 'Add to Quote Basket' : 'কোটেশন বাস্কেটে যোগ করুন')}
                  </span>
                </Button>
                <Button asChild size="lg" className="bg-[hsl(142,70%,40%)] hover:bg-[hsl(142,70%,35%)] text-white px-8">
                  <a href={getWhatsAppUrl(selected)} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    <span className="font-semibold" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                      {lang === 'en' ? 'Inquire on WhatsApp' : 'WhatsApp এ জিজ্ঞাসা করুন'}
                    </span>
                  </a>
                </Button>
                <Button variant="outline" size="lg" onClick={() => setSelected(null)}>
                  <span style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    {lang === 'en' ? 'Back to Catalog' : 'ক্যাটালগে ফিরুন'}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Catalog;

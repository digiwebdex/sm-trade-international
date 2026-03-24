import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/apiClient';
import { X, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';


type GalleryItem = {
  id: string;
  title_en: string;
  title_bn: string;
  image_url: string;
  category: string | null;
};

const Portfolio = () => {
  const { lang } = useLanguage();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const { data: items = [] } = useQuery({
    queryKey: ['gallery-portfolio'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gallery')
        .select('id, title_en, title_bn, image_url, category')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as GalleryItem[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const categories = useMemo(() => {
    const cats = new Set(items.map(i => i.category).filter(Boolean));
    return ['all', ...Array.from(cats)] as string[];
  }, [items]);

  const filtered = useMemo(() => {
    let result = items;
    if (filter !== 'all') result = result.filter(i => i.category === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(i =>
        i.title_en.toLowerCase().includes(q) || i.title_bn.includes(q)
      );
    }
    return result;
  }, [items, filter, search]);

  const openLightbox = (idx: number) => setLightboxIdx(idx);
  const closeLightbox = () => setLightboxIdx(null);
  const goPrev = () => setLightboxIdx(prev => (prev !== null && prev > 0 ? prev - 1 : filtered.length - 1));
  const goNext = () => setLightboxIdx(prev => (prev !== null && prev < filtered.length - 1 ? prev + 1 : 0));

  const currentItem = lightboxIdx !== null ? filtered[lightboxIdx] : null;

  const chipLabel = (cat: string) => {
    if (cat === 'all') return lang === 'en' ? 'All' : 'সকল';
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  return (
    <div>

      <main>
        {/* Hero banner */}
        <section className="relative bg-primary py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-[hsl(var(--sm-green-dark))]" />
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, hsl(var(--sm-gold)) 0%, transparent 50%)' }} />
          <div className="container mx-auto px-4 relative z-10 text-center">
            <span className="inline-block text-[hsl(var(--sm-gold))] text-sm font-semibold tracking-widest uppercase mb-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              {lang === 'en' ? 'Our Portfolio' : 'আমাদের পোর্টফোলিও'}
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-4">
              {lang === 'en' ? 'Gallery & Showcase' : 'গ্যালারি ও শোকেস'}
            </h1>
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-12 bg-[hsl(var(--sm-gold))]/40" />
              <div className="w-2 h-2 rounded-full bg-[hsl(var(--sm-gold))]" />
              <div className="h-px w-12 bg-[hsl(var(--sm-gold))]/40" />
            </div>
            <p className="text-primary-foreground/70 max-w-lg mx-auto text-sm md:text-base">
              {lang === 'en'
                ? 'Browse our completed projects, factory operations, and corporate events.'
                : 'আমাদের সম্পন্ন প্রকল্প, ফ্যাক্টরি পরিচালনা এবং কর্পোরেট ইভেন্ট দেখুন।'}
            </p>
          </div>
        </section>

        {/* Toolbar */}
        <section className="py-10 bg-background">
          <div className="container mx-auto px-4">
            {/* Search */}
            <div className="max-w-md mx-auto mb-6 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={lang === 'en' ? 'Search gallery...' : 'গ্যালারি খুঁজুন...'}
                className="pl-10 rounded-full bg-card border-border"
              />
            </div>

            {/* Filter chips */}
            <div className="flex justify-center gap-2 flex-wrap mb-8">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                    filter === cat
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-secondary text-foreground hover:bg-primary/10'
                  }`}
                >
                  {chipLabel(cat)}
                </button>
              ))}
            </div>

            {/* Count */}
            <p className="text-center text-xs text-muted-foreground mb-6">
              {filtered.length} {lang === 'en' ? 'items' : 'টি আইটেম'}
            </p>

            {/* Grid */}
            {filtered.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                {lang === 'en' ? 'No items found.' : 'কোনো আইটেম পাওয়া যায়নি।'}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filtered.map((item, idx) => (
                  <div
                    key={item.id}
                    className="group relative cursor-pointer overflow-hidden rounded-xl bg-card shadow-sm hover:shadow-xl transition-all duration-300"
                    onClick={() => openLightbox(idx)}
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={item.image_url}
                        alt={lang === 'en' ? item.title_en : item.title_bn}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <p className="text-primary-foreground font-semibold text-sm line-clamp-1">
                        {lang === 'en' ? item.title_en : item.title_bn}
                      </p>
                      {item.category && (
                        <span className="text-[hsl(var(--sm-gold))] text-xs mt-1 capitalize">{item.category}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Lightbox */}
      {currentItem && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button className="absolute top-4 right-4 text-white/70 hover:text-white z-10" onClick={closeLightbox}>
            <X className="h-8 w-8" />
          </button>

          {/* Prev / Next */}
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white z-10"
            onClick={e => { e.stopPropagation(); goPrev(); }}
          >
            <ChevronLeft className="h-10 w-10" />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white z-10"
            onClick={e => { e.stopPropagation(); goNext(); }}
          >
            <ChevronRight className="h-10 w-10" />
          </button>

          {/* Content */}
          <div className="max-w-4xl w-full flex flex-col items-center gap-4 px-4" onClick={e => e.stopPropagation()}>
            <img
              src={currentItem.image_url}
              alt={lang === 'en' ? currentItem.title_en : currentItem.title_bn}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-white">
                {lang === 'en' ? currentItem.title_en : currentItem.title_bn}
              </h3>
              {currentItem.category && (
                <span className="inline-block bg-white/10 text-[hsl(var(--sm-gold))] text-xs px-3 py-1 rounded-full capitalize">
                  {currentItem.category}
                </span>
              )}
              {/* Bilingual subtitle */}
              <p className="text-white/40 text-xs">
                {lang === 'en' ? currentItem.title_bn : currentItem.title_en}
              </p>
              {/* Counter */}
              <p className="text-white/30 text-xs">
                {lightboxIdx !== null ? lightboxIdx + 1 : 0} / {filtered.length}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Portfolio;

import { useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Eye } from 'lucide-react';
import OptimizedImage from '@/components/OptimizedImage';
import GalleryLightbox from '@/components/gallery/GalleryLightbox';
import { cn } from '@/lib/utils';

interface ProductWithVariants {
  id: string;
  name_en: string;
  name_bn: string;
  image_url: string | null;
  product_code: string | null;
  category_id: string | null;
  categories: { name_en: string; name_bn: string } | null;
  variants: {
    id: string;
    variant_label_en: string;
    image_url: string | null;
    color_hex: string | null;
  }[];
}

const ProductGallery = () => {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [hoveredVariant, setHoveredVariant] = useState<Record<string, string | null>>({});
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch products with variants
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['product-gallery'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name_en, name_bn, image_url, category_id, product_code, categories(name_en, name_bn)')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;

      // Fetch all variants in one go
      const productIds = data.map(p => p.id);
      const { data: variants = [] } = await supabase
        .from('product_variants')
        .select('id, product_id, variant_label_en, image_url, color_hex')
        .in('product_id', productIds)
        .eq('is_active', true)
        .order('sort_order');

      return data.map(p => ({
        ...p,
        variants: (variants || []).filter(v => v.product_id === p.id),
      })) as ProductWithVariants[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['gallery-categories'],
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

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return products;
    return products.filter(p => p.category_id === activeCategory);
  }, [products, activeCategory]);

  const getDisplayImage = useCallback((product: ProductWithVariants) => {
    const variantImg = hoveredVariant[product.id];
    if (variantImg) return variantImg;
    return product.image_url || '';
  }, [hoveredVariant]);

  const title = useCallback((p: ProductWithVariants) =>
    lang === 'en' ? p.name_en : (p.name_bn || p.name_en), [lang]);

  // Lightbox items from filtered products
  const lightboxItems = useMemo(() =>
    filtered.map(p => ({
      src: p.image_url || '',
      title: title(p),
    })), [filtered, title]);

  const onVariantHover = useCallback((productId: string, imageUrl: string | null) => {
    setHoveredVariant(prev => ({ ...prev, [productId]: imageUrl }));
  }, []);

  const onVariantLeave = useCallback((productId: string) => {
    setHoveredVariant(prev => ({ ...prev, [productId]: null }));
  }, []);

  // Scroll-based category detection for zero-UI nav
  const scrollToCategory = useCallback((catId: string) => {
    setActiveCategory(catId);
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="bg-background min-h-screen">
      {/* Minimal header */}
      <div className="border-b border-border/30 bg-background/95 backdrop-blur-lg sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-6 py-3 overflow-x-auto scrollbar-thin">
            <button
              onClick={() => scrollToCategory('all')}
              className={cn(
                'shrink-0 text-sm font-medium transition-all duration-300 pb-1 border-b-2',
                activeCategory === 'all'
                  ? 'border-[hsl(var(--sm-gold))] text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {lang === 'en' ? 'All Products' : 'সব পণ্য'}
              <span className="ml-1.5 text-xs text-muted-foreground">({products.length})</span>
            </button>
            {categories.map(c => {
              const count = products.filter(p => p.category_id === c.id).length;
              if (count === 0) return null;
              return (
                <button
                  key={c.id}
                  onClick={() => scrollToCategory(c.id)}
                  className={cn(
                    'shrink-0 text-sm font-medium transition-all duration-300 pb-1 border-b-2',
                    activeCategory === c.id
                      ? 'border-[hsl(var(--sm-gold))] text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                >
                  {lang === 'en' ? c.name_en : (c.name_bn || c.name_en)}
                  <span className="ml-1.5 text-xs text-muted-foreground">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Gallery grid */}
      <div ref={scrollRef} className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg font-medium">{lang === 'en' ? 'No products found' : 'কোনো পণ্য পাওয়া যায়নি'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {filtered.map((product, idx) => (
              <div
                key={product.id}
                className="group relative"
                onMouseEnter={() => setHoveredProduct(product.id)}
                onMouseLeave={() => {
                  setHoveredProduct(null);
                  onVariantLeave(product.id);
                }}
              >
                {/* Image card */}
                <div
                  className="relative aspect-square rounded-2xl overflow-hidden bg-white border border-border/20 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-border/40"
                  onClick={() => navigate(`/product/${product.product_code ? encodeURIComponent(product.product_code) : product.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || product.id}`)}
                >
                  <OptimizedImage
                    src={getDisplayImage(product)}
                    alt={title(product)}
                    className="w-full h-full object-contain p-3 md:p-5 transition-transform duration-500 group-hover:scale-105"
                    wrapperClassName="w-full h-full"
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                  />

                  {/* Hover overlay — zero-UI: only subtle actions */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                    {/* Quick view button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setLightboxIdx(idx); }}
                      className="pointer-events-auto absolute top-3 right-3 w-9 h-9 rounded-full bg-background/90 backdrop-blur-sm border border-border/40 flex items-center justify-center shadow-sm hover:bg-background transition-colors"
                      title={lang === 'en' ? 'Quick view' : 'দ্রুত দেখুন'}
                    >
                      <Eye className="h-4 w-4 text-foreground" />
                    </button>

                    {/* Bottom gradient with name */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent p-4 pt-10">
                      <p className="text-white text-sm font-semibold truncate" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                        {title(product)}
                      </p>
                      {product.categories && (
                        <p className="text-white/60 text-xs mt-0.5" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                          {lang === 'en' ? product.categories.name_en : (product.categories.name_bn || product.categories.name_en)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Variant count badge */}
                  {product.variants.length > 0 && (
                    <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-background/90 backdrop-blur-sm border border-border/30 text-[10px] font-medium text-muted-foreground">
                      {product.variants.length} {lang === 'en' ? (product.variants.length === 1 ? 'variant' : 'variants') : 'ভ্যারিয়েন্ট'}
                    </span>
                  )}
                </div>

                {/* Variant color/image swatches — appear on hover */}
                {product.variants.length > 0 && hoveredProduct === product.id && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 rounded-full bg-background/95 backdrop-blur-md border border-border/40 shadow-lg animate-fade-in z-10">
                    {product.variants.slice(0, 6).map(v => (
                      <button
                        key={v.id}
                        onMouseEnter={() => v.image_url && onVariantHover(product.id, v.image_url)}
                        onMouseLeave={() => onVariantLeave(product.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/product/${product.product_code ? encodeURIComponent(product.product_code) : product.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || product.id}`);
                        }}
                        className="w-6 h-6 rounded-full border-2 border-background overflow-hidden transition-transform hover:scale-125 hover:border-[hsl(var(--sm-gold))]"
                        title={v.variant_label_en}
                      >
                        {v.color_hex ? (
                          <span className="block w-full h-full rounded-full" style={{ backgroundColor: v.color_hex }} />
                        ) : v.image_url ? (
                          <img src={v.image_url} alt={v.variant_label_en} className="w-full h-full object-cover" />
                        ) : (
                          <span className="block w-full h-full rounded-full bg-muted" />
                        )}
                      </button>
                    ))}
                    {product.variants.length > 6 && (
                      <span className="text-[10px] text-muted-foreground font-medium pl-0.5">
                        +{product.variants.length - 6}
                      </span>
                    )}
                  </div>
                )}

                {/* Minimal text below card — always visible on mobile */}
                <div className="mt-2 px-1 md:opacity-0 md:group-hover:opacity-0">
                  <p className="text-xs font-medium text-foreground truncate" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    {title(product)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && filtered.length > 0 && (
        <GalleryLightbox
          items={lightboxItems}
          currentIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onNavigate={setLightboxIdx}
        />
      )}
    </div>
  );
};

export default ProductGallery;

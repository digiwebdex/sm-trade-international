import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuoteBasket } from '@/contexts/QuoteBasketContext';
import {
  ArrowLeft, ShoppingBag, MessageCircle, Share2,
  ChevronRight, Minus, Plus, Calculator, Package, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ProductImageGallery, { TypedImage } from '@/components/product/ProductImageGallery';
import OptimizedImage from '@/components/OptimizedImage';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { isUUID, productSlug } from '@/lib/productSlug';

const BULK_TIERS = [
  { min: 1, max: 49, discount: 0, label: '1–49' },
  { min: 50, max: 99, discount: 5, label: '50–99' },
  { min: 100, max: 499, discount: 10, label: '100–499' },
  { min: 500, max: Infinity, discount: 15, label: '500+' },
];

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { addItem } = useQuoteBasket();

  const [selectedDesign, setSelectedDesign] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  // ─── Data Fetching ───────────────────────────────────────────────────
  const { data: product, isLoading } = useQuery({
    queryKey: ['product-detail', id],
    queryFn: async () => {
      if (!id) return null;
      // Support both UUID and slug (product_code or name-based) lookup
      if (isUUID(id)) {
        const { data, error } = await supabase
          .from('products')
          .select('*, categories(name_en, name_bn)')
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        return data;
      }
      // Try product_code first
      const { data: byCode } = await supabase
        .from('products')
        .select('*, categories(name_en, name_bn)')
        .eq('product_code', decodeURIComponent(id))
        .maybeSingle();
      if (byCode) return byCode;
      // Fallback: fetch all and match slug
      const { data: all } = await supabase
        .from('products')
        .select('*, categories(name_en, name_bn)');
      const slug = decodeURIComponent(id);
      return all?.find(p => {
        const s = p.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        return s === slug;
      }) || null;
    },
    enabled: !!id,
  });

  const productId = product?.id;

  const { data: variants = [] } = useQuery({
    queryKey: ['product-variants', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId!)
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  const { data: productImages = [] } = useQuery({
    queryKey: ['product-images', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId!)
        .is('variant_id', null)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  const { data: relatedProducts = [] } = useQuery({
    queryKey: ['related-products', product?.category_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name_en, name_bn)')
        .eq('category_id', product!.category_id!)
        .neq('id', productId!)
        .eq('is_active', true)
        .limit(4);
      if (error) throw error;
      return data;
    },
    enabled: !!product?.category_id,
  });

  // ─── Variant Logic ────────────────────────────────────────────────────
  const uniqueDesigns = useMemo(() => {
    const seen = new Set<string>();
    return variants.filter(v => v.design_type && !seen.has(v.design_type) && seen.add(v.design_type));
  }, [variants]);

  const uniqueColors = useMemo(() => {
    const seen = new Set<string>();
    return variants.filter(v => v.color_name && !seen.has(v.color_name) && seen.add(v.color_name));
  }, [variants]);

  const activeVariant = useMemo(() => {
    if (!variants.length) return null;
    if (selectedDesign && selectedColor) {
      const match = variants.find(v => v.design_type === selectedDesign && v.color_name === selectedColor);
      if (match) return match;
    }
    if (selectedDesign) return variants.find(v => v.design_type === selectedDesign) ?? variants[0];
    if (selectedColor) return variants.find(v => v.color_name === selectedColor) ?? variants[0];
    return variants[0];
  }, [variants, selectedDesign, selectedColor]);

  const { data: variantImages = [] } = useQuery({
    queryKey: ['product-view-images', id, activeVariant?.id ?? null],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', id!)
        .eq('variant_id', activeVariant!.id)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    enabled: !!activeVariant?.id,
  });

  // ─── Build typed image list for gallery ───────────────────────────────
  const galleryImages = useMemo((): TypedImage[] => {
    const result: TypedImage[] = [];
    const seen = new Set<string>();
    const add = (img: TypedImage) => {
      if (!img.url || seen.has(img.url)) return;
      seen.add(img.url);
      result.push(img);
    };

    (variantImages as any[]).forEach(img => add({
      id: img.id, url: img.image_url, image_type: img.image_type ?? 'main', variant_id: img.variant_id,
    }));
    (productImages as any[]).forEach(img => add({
      id: img.id, url: img.image_url, image_type: img.image_type ?? 'main', variant_id: null,
    }));
    if (activeVariant?.image_url) {
      add({ url: activeVariant.image_url, image_type: 'main', variant_id: activeVariant.id });
    }
    if (product?.image_url) {
      add({ url: product.image_url, image_type: 'main' });
    }
    return result;
  }, [variantImages, productImages, activeVariant, product]);

  // ─── Pricing ──────────────────────────────────────────────────────────
  const unitPrice = activeVariant?.unit_price ? Number(activeVariant.unit_price) : 0;
  const currentTier = BULK_TIERS.find(t => quantity >= t.min && quantity <= t.max) ?? BULK_TIERS[0];
  const discountedPrice = unitPrice > 0 ? unitPrice * (1 - currentTier.discount / 100) : 0;
  const totalPrice = discountedPrice * quantity;
  const savings = unitPrice > 0 ? (unitPrice - discountedPrice) * quantity : 0;

  // ─── Handlers ─────────────────────────────────────────────────────────
  const handleDesignSelect = (design: string) => {
    setSelectedDesign(design === selectedDesign ? null : design);
  };
  const handleColorSelect = (colorName: string) => {
    setSelectedColor(colorName === selectedColor ? null : colorName);
  };

  const handleAddToQuote = () => {
    if (!product) return;
    const displayImg = galleryImages[0]?.url ?? '';
    addItem({
      id: product.id,
      titleEn: product.name_en,
      titleBn: product.name_bn || '',
      src: displayImg,
      category: product.category_id || '',
    });
    toast.success(lang === 'en' ? 'Added to quote basket' : 'কোটেশন বাস্কেটে যোগ হয়েছে');
  };

  const handleWhatsApp = () => {
    if (!product) return;
    const variantInfo = activeVariant ? ` (${activeVariant.variant_label_en})` : '';
    const msg = encodeURIComponent(
      `Hi, I'm interested in: ${product.name_en}${variantInfo}, Qty: ${quantity}. Please share price & availability.`
    );
    window.open(`https://wa.me/8801867666888?text=${msg}`, '_blank');
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: product?.name_en ?? '', url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success(lang === 'en' ? 'Link copied!' : 'লিংক কপি হয়েছে!');
    }
  };

  // ─── Loading / Not found ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-4">
        <div className="container mx-auto px-4 max-w-7xl">
          <Skeleton className="h-4 w-48 mb-4" />
          <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)] gap-6">
            <div className="flex gap-3">
              <div className="hidden sm:flex flex-col gap-2 w-14">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="w-14 h-14 rounded" />)}
              </div>
              <Skeleton className="flex-1 aspect-square rounded-lg" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-48" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">{lang === 'en' ? 'Product not found' : 'পণ্য পাওয়া যায়নি'}</h2>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {lang === 'en' ? 'Go Back' : 'ফিরে যান'}
          </Button>
        </div>
      </div>
    );
  }

  const cat = (product as any).categories;
  const title = lang === 'en' ? product.name_en : (product.name_bn || product.name_en);
  const desc = lang === 'en' ? (product.description_en ?? '') : (product.description_bn ?? product.description_en ?? '');
  const categoryLabel = cat ? (lang === 'en' ? cat.name_en : (cat.name_bn || cat.name_en)) : '';
  const stock = activeVariant ? (activeVariant as any).stock ?? null : null;

  return (
    <div className="min-h-screen bg-background pt-2 pb-20">
      <div className="container mx-auto px-4 max-w-7xl">

        {/* Back button + Breadcrumb */}
        <div className="flex items-center gap-3 py-3">
          <button
            onClick={() => navigate(-1)}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {lang === 'en' ? 'Back' : 'ফিরুন'}
          </button>
          <span className="text-border">|</span>
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
          <Link to="/" className="hover:text-accent hover:underline transition-colors">{lang === 'en' ? 'Home' : 'হোম'}</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/products" className="hover:text-accent hover:underline transition-colors">{lang === 'en' ? 'Products' : 'পণ্য'}</Link>
          {categoryLabel && (
            <>
              <ChevronRight className="h-3 w-3" />
              <Link to={`/catalog?category=${product.category_id}`} className="hover:text-accent hover:underline transition-colors">{categoryLabel}</Link>
            </>
          )}
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground truncate max-w-[200px]">{title}</span>
          </nav>
        </div>

        {/* ─── Main 2-Column Layout (Amazon: image left, info right) ─── */}
        <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)] gap-6 lg:gap-10 items-start">

          {/* LEFT — Image gallery with vertical thumbnails */}
          <div className="lg:sticky lg:top-20">
            <ProductImageGallery
              images={galleryImages}
              selectedVariantId={activeVariant?.id ?? null}
              title={title}
            />
          </div>

          {/* RIGHT — Product Info (Amazon style) */}
          <div className="flex flex-col gap-3">

            {/* Title — large, Amazon-style */}
            <h1 className="text-xl md:text-2xl font-normal text-foreground leading-snug">
              {title}
            </h1>

            {/* Brand / Category link */}
            {categoryLabel && (
              <Link
                to={`/catalog?category=${product.category_id}`}
                className="text-sm text-accent hover:text-accent/80 hover:underline w-fit"
              >
                {lang === 'en' ? `Visit the ${categoryLabel} Store` : `${categoryLabel} স্টোর দেখুন`}
              </Link>
            )}

            <div className="h-px bg-border/50" />

            {/* Price section — Amazon style */}
            {unitPrice > 0 && (
              <div className="space-y-1">
                {currentTier.discount > 0 && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-medium text-destructive">-{currentTier.discount}%</span>
                    <span className="text-2xl font-medium text-foreground">৳{discountedPrice.toFixed(0)}</span>
                  </div>
                )}
                {currentTier.discount === 0 && (
                  <span className="text-2xl font-medium text-foreground">৳{unitPrice.toFixed(0)}</span>
                )}
                {currentTier.discount > 0 && (
                  <div className="text-sm text-muted-foreground">
                    M.R.P.: <span className="line-through">৳{unitPrice.toFixed(0)}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">{lang === 'en' ? 'Inclusive of all taxes' : 'সকল কর সহ'}</p>
              </div>
            )}

            {/* Product code / SKU */}
            {((activeVariant as any)?.sku || (product as any).product_code) && (
              <div className="text-xs text-muted-foreground">
                {lang === 'en' ? 'SKU' : 'পণ্য কোড'}: <span className="font-mono font-semibold text-foreground">{(activeVariant as any)?.sku || (product as any).product_code}</span>
              </div>
            )}

            <div className="h-px bg-border/50" />

            {/* ─── Color Family (Daraz-style) ─── */}
            {uniqueColors.length > 0 && (
              <div className="space-y-2.5">
                <div className="text-sm">
                  <span className="text-muted-foreground">{lang === 'en' ? 'Color Family' : 'রঙের ধরন'}</span>
                  {' '}
                  <span className="font-semibold text-foreground">{selectedColor || uniqueColors[0]?.color_name || ''}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {uniqueColors.map(v => {
                    const isActive = selectedColor === v.color_name || (!selectedColor && v === uniqueColors[0]);
                    return (
                      <button
                        key={v.color_name}
                        onClick={() => handleColorSelect(v.color_name!)}
                        className={cn(
                          'w-[42px] h-[42px] rounded border-2 overflow-hidden transition-all',
                          isActive
                            ? 'border-accent shadow-sm'
                            : 'border-border/40 hover:border-accent/60',
                        )}
                      >
                        {v.image_url ? (
                          <img src={v.image_url} alt={v.color_name ?? ''} className="w-full h-full object-cover" />
                        ) : (
                          <div
                            className="w-full h-full"
                            style={{ backgroundColor: v.color_hex ?? '#ccc' }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── Design Selector ─── */}
            {uniqueDesigns.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">{lang === 'en' ? 'Design' : 'ডিজাইন'}: </span>
                  <span className="font-semibold text-foreground">{selectedDesign || uniqueDesigns[0]?.design_type}</span>
                </div>
                <Select
                  value={selectedDesign ?? ''}
                  onValueChange={v => handleDesignSelect(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={lang === 'en' ? 'Select design…' : 'ডিজাইন বেছে নিন…'} />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueDesigns.map(v => (
                      <SelectItem key={v.design_type!} value={v.design_type!}>
                        {v.design_type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="h-px bg-border/50" />

            {/* About this item / Description */}
            {desc && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-foreground">{lang === 'en' ? 'About this item' : 'এই পণ্য সম্পর্কে'}</h3>
                <ul className="space-y-1.5 text-sm text-foreground/90 leading-relaxed">
                  {desc.split(/[.।]\s*/).filter(Boolean).map((sentence, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-foreground/40 shrink-0" />
                      <span>{sentence.trim()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Highlights */}
            <div className="space-y-1.5">
              {[
                lang === 'en' ? 'Custom branding & logo engraving available' : 'কাস্টম ব্র্যান্ডিং ও লোগো খোদাই উপলব্ধ',
                lang === 'en' ? 'Bulk order discounts for 50+ units' : '৫০+ ইউনিটে বাল্ক অর্ডার ডিসকাউন্ট',
                lang === 'en' ? 'Premium quality materials & craftsmanship' : 'প্রিমিয়াম মানের উপকরণ ও কারুশিল্প',
              ].map((h, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[hsl(var(--sm-gold))] shrink-0" />
                  {h}
                </div>
              ))}
            </div>

            <div className="h-px bg-border/50" />

            {/* ─── Buy Box (Amazon right sidebar style, inline here) ─── */}
            <div className="rounded-lg border border-border/50 p-4 space-y-3 bg-card">
              {/* Price in buy box */}
              {unitPrice > 0 && (
                <div className="text-xl font-medium text-foreground">
                  ৳{discountedPrice.toFixed(0)}<span className="text-xs align-top text-muted-foreground ml-0.5">00</span>
                </div>
              )}

              {/* Stock */}
              <div className={cn(
                'text-lg font-medium',
                stock === null || stock === undefined
                  ? 'text-green-600'
                  : stock > 0
                    ? 'text-green-600'
                    : 'text-destructive'
              )}>
                {stock === null || stock === undefined
                  ? (lang === 'en' ? 'In stock' : 'স্টকে আছে')
                  : stock > 0
                    ? (lang === 'en' ? `In stock (${stock} left)` : `স্টকে আছে (${stock}টি বাকি)`)
                    : (lang === 'en' ? 'Out of stock' : 'স্টক নেই')}
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{lang === 'en' ? 'Quantity' : 'পরিমাণ'}:</span>
                <div className="flex items-center border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-2.5 py-1.5 hover:bg-muted transition-colors border-r border-border"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <Input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-14 text-center border-0 rounded-none h-8 focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-sm"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-2.5 py-1.5 hover:bg-muted transition-colors border-l border-border"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* CTA Buttons — Amazon style stacked */}
              <Button
                onClick={handleAddToQuote}
                className="w-full bg-[hsl(var(--sm-gold))] hover:bg-[hsl(var(--sm-gold))]/90 text-white gap-2 rounded-full h-10"
              >
                <ShoppingBag className="h-4 w-4" />
                {lang === 'en' ? 'Add to Quote Basket' : 'কোটেশন বাস্কেটে যোগ করুন'}
              </Button>
              <Button
                onClick={handleWhatsApp}
                className="w-full bg-[hsl(142,70%,40%)] hover:bg-[hsl(142,70%,35%)] text-white gap-2 rounded-full h-10"
              >
                <MessageCircle className="h-4 w-4" />
                {lang === 'en' ? 'Order via WhatsApp' : 'WhatsApp এ অর্ডার করুন'}
              </Button>

              {/* Share */}
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 text-xs text-accent hover:underline"
              >
                <Share2 className="h-3.5 w-3.5" />
                {lang === 'en' ? 'Share' : 'শেয়ার'}
              </button>
            </div>

            {/* Bulk pricing */}
            {unitPrice > 0 && (
              <div className="rounded-lg border border-border/50 p-4 space-y-3 bg-card">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <Calculator className="h-4 w-4 text-[hsl(var(--sm-gold))]" />
                  {lang === 'en' ? 'Bulk Pricing' : 'বাল্ক মূল্য'}
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {BULK_TIERS.map(tier => (
                    <button
                      key={tier.label}
                      onClick={() => setQuantity(tier.min)}
                      className={cn(
                        'text-center p-2 rounded-lg text-xs transition-all border',
                        currentTier.label === tier.label
                          ? 'bg-[hsl(var(--sm-gold))]/10 border-[hsl(var(--sm-gold))]/50 font-semibold text-foreground'
                          : 'bg-background border-border/50 text-muted-foreground hover:border-border',
                      )}
                    >
                      <div className="font-medium">{tier.label}</div>
                      <div className="text-[10px]">{tier.discount > 0 ? `${tier.discount}% off` : (lang === 'en' ? 'Base' : 'বেস')}</div>
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/30 text-sm">
                  <span className="text-muted-foreground">{quantity} × ৳{discountedPrice.toFixed(0)}</span>
                  <div className="text-right">
                    <span className="font-bold text-lg">৳{totalPrice.toFixed(0)}</span>
                    {savings > 0 && (
                      <span className="block text-xs text-green-600">
                        {lang === 'en' ? `You save ৳${savings.toFixed(0)}` : `সঞ্চয় ৳${savings.toFixed(0)}`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-bold mb-6">
              {lang === 'en' ? 'Related Products' : 'সম্পর্কিত পণ্য'}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((rp: any) => {
                const rpCat = rp.categories;
                const rpTitle = lang === 'en' ? rp.name_en : (rp.name_bn || rp.name_en);
                return (
                  <Link
                    key={rp.id}
                    to={`/product/${productSlug(rp)}`}
                    className="group rounded-lg overflow-hidden bg-background border border-border/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="aspect-square overflow-hidden bg-white">
                      {rp.image_url ? (
                        <OptimizedImage
                          src={rp.image_url}
                          alt={rpTitle}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          wrapperClassName="w-full h-full"
                          sizes="(min-width: 768px) 25vw, 50vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">{rpTitle}</div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm line-clamp-2">{rpTitle}</h3>
                      {rpCat && (
                        <span className="text-[10px] text-muted-foreground">
                          {lang === 'en' ? rpCat.name_en : (rpCat.name_bn || rpCat.name_en)}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;

import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuoteBasket } from '@/contexts/QuoteBasketContext';
import { ArrowLeft, ShoppingBag, MessageCircle, Share2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import OptimizedImage from '@/components/OptimizedImage';
import { toast } from 'sonner';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { addItem } = useQuoteBasket();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name_en, name_bn)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch related products from same category
  const { data: relatedProducts = [] } = useQuery({
    queryKey: ['related-products', product?.category_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name_en, name_bn)')
        .eq('category_id', product!.category_id!)
        .neq('id', id!)
        .eq('is_active', true)
        .limit(4);
      if (error) throw error;
      return data;
    },
    enabled: !!product?.category_id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <Skeleton className="h-6 w-48 mb-8" />
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-48" />
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
            <ArrowLeft className="mr-2 h-4 w-4" />
            {lang === 'en' ? 'Go Back' : 'ফিরে যান'}
          </Button>
        </div>
      </div>
    );
  }

  const cat = (product as any).categories;
  const title = lang === 'en' ? product.name_en : (product.name_bn || product.name_en);
  const desc = lang === 'en' ? (product.description_en || '') : (product.description_bn || product.description_en || '');
  const categoryLabel = cat ? (lang === 'en' ? cat.name_en : (cat.name_bn || cat.name_en)) : '';
  const altTitle = lang === 'en' ? product.name_bn : product.name_en;

  const handleAddToQuote = () => {
    addItem({
      id: product.id,
      titleEn: product.name_en,
      titleBn: product.name_bn || '',
      src: product.image_url || '',
      category: product.category_id || '',
    });
    toast.success(lang === 'en' ? 'Added to quote basket' : 'কোটেশন বাস্কেটে যোগ হয়েছে');
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`Hi, I'm interested in: ${product.name_en}. Please share details.`);
    window.open(`https://wa.me/8801700000000?text=${msg}`, '_blank');
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success(lang === 'en' ? 'Link copied!' : 'লিংক কপি হয়েছে!');
    }
  };

  return (
    <div className="min-h-screen bg-background pt-4 pb-16">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
          <Link to="/" className="hover:text-foreground transition-colors">
            {lang === 'en' ? 'Home' : 'হোম'}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/#products" className="hover:text-foreground transition-colors">
            {lang === 'en' ? 'Products' : 'পণ্য'}
          </Link>
          {categoryLabel && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground">{categoryLabel}</span>
            </>
          )}
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium truncate max-w-[200px]">{title}</span>
        </nav>

        {/* Main product section */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Image */}
          <div className="relative">
            <div className="aspect-square rounded-2xl overflow-hidden bg-white border border-border/30 shadow-sm">
              {product.image_url ? (
                <OptimizedImage
                  src={product.image_url}
                  alt={title}
                  className="w-full h-full object-contain p-4"
                  wrapperClassName="w-full h-full"
                  sizes="(min-width: 768px) 50vw, 100vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  {title}
                </div>
              )}
            </div>
            {!product.is_active && (
              <Badge variant="secondary" className="absolute top-4 left-4">
                {lang === 'en' ? 'Currently Unavailable' : 'বর্তমানে অনুপলব্ধ'}
              </Badge>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col gap-5">
            {categoryLabel && (
              <Badge variant="outline" className="self-start text-xs">
                {categoryLabel}
              </Badge>
            )}

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
              {title}
            </h1>

            {altTitle && (
              <p className="text-muted-foreground text-sm">
                {lang === 'en' ? 'বাংলা' : 'English'}: {altTitle}
              </p>
            )}

            {desc && (
              <p className="text-muted-foreground leading-relaxed text-base">
                {desc}
              </p>
            )}

            {/* Key features placeholder */}
            <div className="border-t border-border pt-5 space-y-3">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                {lang === 'en' ? 'Highlights' : 'বৈশিষ্ট্য'}
              </h3>
              <ul className="space-y-2 text-sm text-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[hsl(var(--sm-gold))] shrink-0" />
                  {lang === 'en' ? 'Custom branding & logo engraving available' : 'কাস্টম ব্র্যান্ডিং ও লোগো খোদাই উপলব্ধ'}
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[hsl(var(--sm-gold))] shrink-0" />
                  {lang === 'en' ? 'Bulk order discounts for 50+ units' : '৫০+ ইউনিটে বাল্ক অর্ডার ডিসকাউন্ট'}
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[hsl(var(--sm-gold))] shrink-0" />
                  {lang === 'en' ? 'Premium quality materials & craftsmanship' : 'প্রিমিয়াম মানের উপকরণ ও কারুশিল্প'}
                </li>
              </ul>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                size="lg"
                onClick={handleAddToQuote}
                className="bg-[hsl(var(--sm-gold))] hover:bg-[hsl(var(--sm-gold))]/90 text-white gap-2 rounded-full"
              >
                <ShoppingBag className="h-5 w-5" />
                {lang === 'en' ? 'Add to Quote Basket' : 'কোটেশন বাস্কেটে যোগ করুন'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleWhatsApp}
                className="gap-2 rounded-full"
              >
                <MessageCircle className="h-5 w-5" />
                {lang === 'en' ? 'WhatsApp Inquiry' : 'হোয়াটসঅ্যাপে জানুন'}
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={handleShare}
                className="gap-2 rounded-full"
              >
                <Share2 className="h-4 w-4" />
                {lang === 'en' ? 'Share' : 'শেয়ার'}
              </Button>
            </div>
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
                    to={`/product/${rp.id}`}
                    className="group rounded-2xl overflow-hidden bg-background border border-border/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
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
                        <span className="text-[10px] text-muted-foreground">{lang === 'en' ? rpCat.name_en : (rpCat.name_bn || rpCat.name_en)}</span>
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

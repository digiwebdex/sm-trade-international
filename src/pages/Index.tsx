import { lazy, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import HeroSection from '@/components/HeroSection';

// Lazy-load below-fold sections for faster initial paint
const AboutSection = lazy(() => import('@/components/AboutSection'));
const ServicesSection = lazy(() => import('@/components/ServicesSection'));
const ProcessSection = lazy(() => import('@/components/ProcessSection'));
const ProductsSection = lazy(() => import('@/components/ProductsSection'));
const ClientsSection = lazy(() => import('@/components/ClientsSection'));

const QuoteRequestForm = lazy(() => import('@/components/QuoteRequestForm'));
const ContactSection = lazy(() => import('@/components/ContactSection'));

const sectionComponents: Record<string, React.ComponentType> = {
  hero: HeroSection,
  about: AboutSection,
  services: ServicesSection,
  process: ProcessSection,
  products: ProductsSection,
  clients: ClientsSection,
  
  quote: QuoteRequestForm,
  contact: ContactSection,
};

const defaultOrder = ['hero', 'about', 'services', 'process', 'products', 'clients', 'quote', 'contact'];

const Index = () => {
  const { data: config } = useQuery({
    queryKey: ['site-settings-home-sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'home_sections')
        .maybeSingle();
      if (error) throw error;
      return data?.setting_value as { order?: string[]; hidden?: string[] } | null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const order = config?.order?.length ? config.order : defaultOrder;
  const hidden = new Set(config?.hidden ?? []);

  return (
    <main>
      {order.map(id => {
        if (hidden.has(id)) return null;
        const Component = sectionComponents[id];
        if (!Component) return null;
        // Hero loads eagerly; everything else is lazy
        return id === 'hero'
          ? <Component key={id} />
          : <Suspense key={id} fallback={<div className="min-h-[200px]" />}><Component /></Suspense>;
      })}
    </main>
  );
};

export default Index;

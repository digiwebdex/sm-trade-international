import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Target, Eye, Info, Building2 } from 'lucide-react';

interface AboutRecord {
  field_key: string;
  content_en: string;
  content_bn: string;
  image_url?: string | null;
}

const sections = [
  { key: 'company_description', label: { en: 'About Us', bn: 'আমাদের সম্পর্কে' }, icon: Info },
  { key: 'mission', label: { en: 'Our Mission', bn: 'আমাদের মিশন' }, icon: Target },
  { key: 'vision', label: { en: 'Our Vision', bn: 'আমাদের ভিশন' }, icon: Eye },
  { key: 'company_history', label: { en: 'Our History', bn: 'আমাদের ইতিহাস' }, icon: Building2 },
];

const About = () => {
  const { lang } = useLanguage();

  const { data: aboutData = [], isLoading } = useQuery({
    queryKey: ['about-page-public'],
    queryFn: async () => {
      const { data, error } = await supabase.from('about_page' as any).select('*');
      if (error) throw error;
      return (data as unknown) as AboutRecord[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const map = Object.fromEntries(aboutData.map(r => [r.field_key, r]));
  const companyImage = map['company_description']?.image_url;

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-muted/40 border-b border-border py-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            {lang === 'bn' ? 'আমাদের সম্পর্কে' : 'About S.M. Trade International'}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {lang === 'bn'
              ? 'বাংলাদেশের শীর্ষস্থানীয় কর্পোরেট গিফট এবং প্রমোশনাল পণ্য সরবরাহকারী।'
              : "Bangladesh's premier supplier of corporate gifts and promotional merchandise."}
          </p>
        </div>
      </section>

      {/* Company Image */}
      {(companyImage || isLoading) && (
        <section className="container mx-auto px-4 max-w-5xl -mt-8 mb-12">
          {isLoading ? (
            <Skeleton className="w-full h-64 rounded-2xl" />
          ) : companyImage ? (
            <div className="rounded-2xl overflow-hidden shadow-xl border border-border">
              <img
                src={companyImage}
                alt="S.M. Trade International"
                className="w-full max-h-96 object-cover"
                loading="eager"
              />
            </div>
          ) : null}
        </section>
      )}

      {/* Content sections */}
      <section className="container mx-auto px-4 max-w-4xl pb-20 space-y-16">
        {isLoading ? (
          <div className="space-y-12">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            ))}
          </div>
        ) : (
          sections.map(sec => {
            const record = map[sec.key];
            const content = lang === 'bn' ? record?.content_bn : record?.content_en;
            if (!content) return null;
            const Icon = sec.icon;
            return (
              <div key={sec.key} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">{lang === 'bn' ? sec.label.bn : sec.label.en}</h2>
                </div>
                <div className="pl-13">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-base">
                    {content}
                  </p>
                </div>
              </div>
            );
          })
        )}

        {/* Stats strip */}
        {!isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-t border-b border-border">
            {[
              { label: lang === 'bn' ? 'বছরের অভিজ্ঞতা' : 'Years Experience', value: '10+' },
              { label: lang === 'bn' ? 'সন্তুষ্ট গ্রাহক' : 'Happy Clients', value: '500+' },
              { label: lang === 'bn' ? 'পণ্য বিভাগ' : 'Product Categories', value: '50+' },
              { label: lang === 'bn' ? 'সফল প্রকল্প' : 'Projects Delivered', value: '1000+' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default About;

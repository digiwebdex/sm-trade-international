import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

type BilingualValue = { en: string; bn: string };
type SettingsMap = Record<string, BilingualValue>;

export const useSiteSettings = () => {
  const { lang } = useLanguage();

  const { data: allSettings } = useQuery({
    queryKey: ['site-settings-public'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('*');
      if (error) throw error;
      const map: Record<string, SettingsMap> = {};
      data?.forEach((row) => {
        map[row.setting_key] = row.setting_value as unknown as SettingsMap;
      });
      return map;
    },
    staleTime: 5 * 60 * 1000, // cache 5 min
  });

  const get = (section: string, field: string, fallback = ''): string => {
    const val = allSettings?.[section]?.[field];
    if (!val) return fallback;
    const result = (val as BilingualValue)?.[lang];
    return result || fallback;
  };

  return { get, isLoaded: !!allSettings };
};

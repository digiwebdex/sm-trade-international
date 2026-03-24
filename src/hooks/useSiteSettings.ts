import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/apiClient';
import { useLanguage } from '@/contexts/LanguageContext';

type BilingualValue = { en: string; bn: string };
type SettingsMap = Record<string, BilingualValue | string>;

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
    staleTime: 5 * 60 * 1000,
  });

  /**
   * Get a setting value. Handles both bilingual {en, bn} and flat string/value formats.
   * For bilingual: section=hero, field=title → settings.hero.title[lang]
   * For flat: section=contact, field=phone → settings.contact.phone (string)
   * Also handles nested key maps like {title_en, title_bn} format
   */
  const get = (section: string, field: string, fallback = ''): string => {
    const sectionData = allSettings?.[section];
    if (!sectionData) return fallback;

    const val = sectionData[field];
    if (!val) {
      // Try lang-suffixed keys: field_en / field_bn
      const langKey = `${field}_${lang}`;
      const langVal = sectionData[langKey];
      if (langVal && typeof langVal === 'string') return langVal;
      // Try English fallback
      const enVal = sectionData[`${field}_en`];
      if (enVal && typeof enVal === 'string') return enVal;
      return fallback;
    }

    // If it's a string directly (flat format like contact.phone = "+88...")
    if (typeof val === 'string') return val;

    // If it's a bilingual object {en, bn}
    if (typeof val === 'object' && val !== null) {
      const biVal = val as BilingualValue;
      const result = biVal[lang];
      if (result) return result;
      // Fallback to English
      if (biVal.en) return biVal.en;
    }

    return fallback;
  };

  return { get, isLoaded: !!allSettings };
};

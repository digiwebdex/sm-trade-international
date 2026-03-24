import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '@/lib/apiClient';

/**
 * Returns a callback that, when invoked (e.g. on mouse-enter),
 * warms the React-Query cache for data used on the home page.
 * Calls are idempotent – if data is already cached it's a no-op.
 */
export const usePrefetchHome = () => {
  const qc = useQueryClient();

  return useCallback(() => {
    // Products (same queryKey as ProductsSection)
    qc.prefetchQuery({
      queryKey: ['public-products-all'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('products')
          .select('*, categories(name_en, name_bn)')
          .order('sort_order');
        if (error) throw error;
        return data;
      },
      staleTime: 5 * 60 * 1000,
    });

    // Categories
    qc.prefetchQuery({
      queryKey: ['public-categories'],
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

    // Site settings
    qc.prefetchQuery({
      queryKey: ['site-settings-public'],
      queryFn: async () => {
        const { data, error } = await supabase.from('site_settings').select('*');
        if (error) throw error;
        const map: Record<string, any> = {};
        data?.forEach((row: any) => { map[row.setting_key] = row.setting_value; });
        return map;
      },
      staleTime: 5 * 60 * 1000,
    });
  }, [qc]);
};

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/apiClient';

/**
 * Subscribes to Supabase Realtime changes on the `categories` table.
 * On any INSERT / UPDATE / DELETE event it invalidates the shared
 * `public-categories` query cache so the Navbar and Catalog both
 * re-fetch and display the latest bilingual labels immediately.
 *
 * Mount once high up in the tree (e.g. PublicLayout) — a single
 * channel is enough because all consumers share the same QueryClient.
 */
export function useCategoriesRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('categories-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        () => {
          // Invalidate every subscriber (Navbar + Catalog + any other user)
          qc.invalidateQueries({ queryKey: ['public-categories'] });
          // Also bust the admin cache so the category list refreshes too
          qc.invalidateQueries({ queryKey: ['admin-categories'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}

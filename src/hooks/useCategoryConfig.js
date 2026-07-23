import { useEffect, useState } from 'react';
import { fetchPublicConfigValue } from '../lib/supabasePublicRest';
import { deferSupabase } from '../utils/deferSupabase';
import {
  CATEGORY_CONFIG_KEY,
  normalizeCategoryConfig,
} from '../utils/categoryConfig';

export function useCategoryConfig() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const applyValue = (value) => {
      if (cancelled) return;
      setItems(normalizeCategoryConfig(value));
      setLoading(false);
    };

    fetchPublicConfigValue(CATEGORY_CONFIG_KEY, { signal: controller.signal })
      .then(({ data }) => applyValue(data?.valor))
      .catch(() => applyValue(null));

    const handleLocalUpdate = (event) => {
      if (event.detail?.clave === CATEGORY_CONFIG_KEY) {
        applyValue(event.detail.valor);
      }
    };
    window.addEventListener('fp:config-updated', handleLocalUpdate);

    return () => {
      cancelled = true;
      controller.abort();
      window.removeEventListener('fp:config-updated', handleLocalUpdate);
    };
  }, []);

  useEffect(() => {
    let realtimeClient;
    let channel;
    const cancelDeferredLoad = deferSupabase((supabase) => {
      realtimeClient = supabase;
      channel = supabase
        .channel('catalog-category-config-rt')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'configuracion',
            filter: `clave=eq.${CATEGORY_CONFIG_KEY}`,
          },
          ({ new: row }) => setItems(normalizeCategoryConfig(row?.valor)),
        )
        .subscribe();
    });

    return () => {
      cancelDeferredLoad();
      if (realtimeClient && channel) realtimeClient.removeChannel(channel);
    };
  }, []);

  return { items, loading };
}

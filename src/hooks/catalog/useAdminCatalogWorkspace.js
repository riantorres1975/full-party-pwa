import { startTransition, useCallback, useEffect, useState } from 'react';
import {
  deleteAdminCatalogEntity,
  getAdminCatalogOverview,
  listAdminCatalogResource,
  saveAdminCatalogEntity,
} from '../../services/catalog/adminCatalogRepository.js';
import { getAdminCatalogResource } from '../../services/catalog/adminCatalogModel.js';

export function useAdminCatalogWorkspace(initialResource = 'categories') {
  const [resourceKey, setResourceKeyState] = useState(initialResource);
  const [rows, setRows] = useState([]);
  const [lookups, setLookups] = useState({});
  const [overview, setOverview] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  const setResourceKey = useCallback((nextResource) => {
    if (!getAdminCatalogResource(nextResource)) return;
    startTransition(() => setResourceKeyState(nextResource));
  }, []);

  const refresh = useCallback(() => setReloadToken((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadResource() {
      setLoading(true);
      setError(null);
      try {
        const resource = getAdminCatalogResource(resourceKey);
        const dependencyKeys = [
          ...new Set(
            resource.fields
              .filter((field) => field.type === 'relation')
              .map((field) => field.resource),
          ),
        ];
        const [nextRows, ...dependencies] = await Promise.all([
          listAdminCatalogResource(resourceKey, { signal: controller.signal }),
          ...dependencyKeys.map((key) =>
            key === resourceKey
              ? Promise.resolve(null)
              : listAdminCatalogResource(key, { signal: controller.signal }),
          ),
        ]);
        if (cancelled) return;

        const nextLookups = {};
        dependencyKeys.forEach((key, index) => {
          nextLookups[key] = key === resourceKey ? nextRows : dependencies[index];
        });
        setRows(nextRows);
        setLookups(nextLookups);
      } catch (loadError) {
        if (cancelled || loadError?.name === 'AbortError') return;
        setError(loadError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadResource();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [resourceKey, reloadToken]);

  useEffect(() => {
    let cancelled = false;
    getAdminCatalogOverview()
      .then((counts) => {
        if (!cancelled) setOverview(counts);
      })
      .catch(() => {
        if (!cancelled) setOverview({});
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const saveEntity = useCallback(async (input, id = null) => {
    setSaving(true);
    try {
      const saved = await saveAdminCatalogEntity(resourceKey, input, { id });
      setRows((current) => {
        const exists = current.some((row) => row.id === saved.id);
        return exists
          ? current.map((row) => (row.id === saved.id ? saved : row))
          : [...current, saved];
      });
      setOverview((current) => ({
        ...current,
        [resourceKey]: id ? current[resourceKey] : (current[resourceKey] ?? 0) + 1,
      }));
      return saved;
    } finally {
      setSaving(false);
    }
  }, [resourceKey]);

  const deleteEntity = useCallback(async (id) => {
    setSaving(true);
    try {
      await deleteAdminCatalogEntity(resourceKey, id);
      setRows((current) => current.filter((row) => row.id !== id));
      setOverview((current) => ({
        ...current,
        [resourceKey]: Math.max(0, (current[resourceKey] ?? 1) - 1),
      }));
    } finally {
      setSaving(false);
    }
  }, [resourceKey]);

  return {
    resourceKey,
    setResourceKey,
    rows,
    lookups,
    overview,
    loading,
    saving,
    error,
    refresh,
    saveEntity,
    deleteEntity,
  };
}

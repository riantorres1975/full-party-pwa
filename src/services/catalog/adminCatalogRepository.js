import { supabase as defaultClient } from '../../lib/supabase.js';
import { classifyCatalogError } from './errors.js';
import {
  ADMIN_CATALOG_RESOURCES,
  getAdminCatalogResource,
  normalizeAdminCatalogPayload,
} from './adminCatalogModel.js';

function requireResource(resourceKey) {
  const resource = getAdminCatalogResource(resourceKey);
  if (!resource) throw new Error(`Recurso administrativo desconocido: ${resourceKey}`);
  return resource;
}

function selectedFields(resource) {
  return ['id', ...new Set(resource.fields.map((field) => field.name))].join(',');
}

function applyOrdering(query, orderBy) {
  return orderBy.reduce(
    (current, field) => current.order(field, { ascending: true }),
    query,
  );
}

export async function listAdminCatalogResource(
  resourceKey,
  { client = defaultClient, signal } = {},
) {
  const resource = requireResource(resourceKey);
  let query = applyOrdering(
    client.from(resource.table).select(selectedFields(resource)),
    resource.orderBy,
  );

  if (signal && typeof query.abortSignal === 'function') query = query.abortSignal(signal);

  const { data, error } = await query;
  if (error) {
    throw classifyCatalogError(error, `No se pudo cargar ${resource.label.toLowerCase()}.`);
  }
  return Array.isArray(data) ? data : [];
}

export async function getAdminCatalogOverview({ client = defaultClient } = {}) {
  const entries = await Promise.all(
    Object.entries(ADMIN_CATALOG_RESOURCES).map(async ([key, resource]) => {
      const { count, error } = await client
        .from(resource.table)
        .select('id', { count: 'exact', head: true });
      if (error) {
        throw classifyCatalogError(error, 'No se pudo cargar el resumen del catalogo.');
      }
      return [key, count ?? 0];
    }),
  );
  return Object.fromEntries(entries);
}

export async function saveAdminCatalogEntity(
  resourceKey,
  input,
  { id = null, client = defaultClient } = {},
) {
  const resource = requireResource(resourceKey);
  const payload = normalizeAdminCatalogPayload(resourceKey, input);
  let query = id
    ? client.from(resource.table).update(payload).eq('id', id)
    : client.from(resource.table).insert(payload);

  const { data, error } = await query.select(selectedFields(resource)).single();
  if (error) {
    throw classifyCatalogError(error, `No se pudo guardar la ${resource.singular}.`);
  }
  return data;
}

export async function deleteAdminCatalogEntity(
  resourceKey,
  id,
  { client = defaultClient } = {},
) {
  const resource = requireResource(resourceKey);
  const { error } = await client.from(resource.table).delete().eq('id', id);
  if (error) {
    throw classifyCatalogError(
      error,
      `No se pudo eliminar la ${resource.singular}. Revisa si tiene elementos asociados.`,
    );
  }
}

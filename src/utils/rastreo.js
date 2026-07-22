const DEFAULT_SITE_URL = 'https://www.fullpartyuruapan.com.mx';

export function construirUrlRastreo(folio, siteUrl = import.meta.env?.VITE_SITE_URL || DEFAULT_SITE_URL) {
  const baseUrl = String(siteUrl || DEFAULT_SITE_URL).replace(/\/+$/, '');
  return `${baseUrl}/rastrear/${encodeURIComponent(String(folio || '').trim().toUpperCase())}`;
}

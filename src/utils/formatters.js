/**
 * Enmascarar teléfono: muestra primeros 3 y últimos 4 dígitos
 * Ej: "4431234567" → "443•••4567"
 */
export function maskPhone(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) return phone;
  const first = digits.slice(0, 3);
  const last = digits.slice(-4);
  return `${first}•••${last}`;
}

/**
 * Formatear dinero en pesos mexicanos
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(amount || 0);
}

/**
 * Formatear fecha corta (DD/MM/YYYY)
 */
export function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('es-MX');
}

/**
 * Tiempo relativo (Ahora, Hace 5m, Hace 2h, Hace 3d)
 */
export function formatRelativeTime(date) {
  if (!date) return '—';
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins}m`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 30) return `Hace ${diffDays}d`;
  return formatDate(date);
}

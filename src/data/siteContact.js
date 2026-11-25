import { SUCURSALES } from './sucursales';

const configuredNumber = import.meta.env.VITE_WHATSAPP_NUMBER?.trim();
const whatsappNumber = /^\d{10,15}$/.test(configuredNumber ?? '')
  ? configuredNumber
  : SUCURSALES.find(({ id }) => id === 'sol-naciente').telefonoE164.slice(1);

export function buildContactWhatsAppUrl(message) {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

import { useEffect, useState, useRef } from 'react';
import { generarMensajeWhatsApp } from '../utils/whatsapp';
import { obtenerPrecioAplicable } from '../utils/precios';
import { validarTelefonoMX } from '../utils/validarTelefono';
import { SIMBOLO_MONEDA, DIRECCION_TIENDA, HORARIO_TIENDA, MAPS_URL_TIENDA } from '../data/productos';
import { usePedido } from '../hooks/usePedido';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useLanguage } from '../hooks/useLanguage';
import { getInlineProductPlaceholder } from '../utils/imagenes';
import { trackEvent } from '../utils/analytics';

// Session rate limit (max orders per time window)
const MAX_ORDERS_PER_SESSION = 5;
const WINDOW_MS = 30 * 60 * 1000; // 30 minutes
const CHECKOUT_DRAFT_KEY = 'fp_checkout_draft_v1';

function readCheckoutDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(CHECKOUT_DRAFT_KEY) || '{}');
    return {
      deliveryType: draft.deliveryType === 'envio' ? 'envio' : 'tienda',
      customerName: typeof draft.customerName === 'string' ? draft.customerName : '',
      phone: typeof draft.phone === 'string' ? draft.phone : '',
      address: typeof draft.address === 'string' ? draft.address : '',
    };
  } catch {
    return { deliveryType: 'tienda', customerName: '', phone: '', address: '' };
  }
}

function writeCheckoutDraft(draft) {
  try {
    const hasData = draft.customerName || draft.phone || draft.address || draft.deliveryType !== 'tienda';
    if (hasData) localStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draft));
    else localStorage.removeItem(CHECKOUT_DRAFT_KEY);
  } catch {
    // Ignore storage errors in private browsing.
  }
}

function clearCheckoutDraft() {
  try {
    localStorage.removeItem(CHECKOUT_DRAFT_KEY);
  } catch {
    // Ignore storage errors in private browsing.
  }
}

function checkRateLimit() {
  try {
    const raw = localStorage.getItem('fp_order_ts');
    const timestamps = raw ? JSON.parse(raw) : [];
    const ahora = Date.now();
    const recentOrders = timestamps.filter(t => ahora - t < WINDOW_MS);
    return recentOrders.length < MAX_ORDERS_PER_SESSION;
  } catch { return true; }
}

function recordOrderSubmission() {
  try {
    const raw = localStorage.getItem('fp_order_ts');
    const timestamps = raw ? JSON.parse(raw) : [];
    const ahora = Date.now();
    const recentOrders = timestamps.filter(t => ahora - t < WINDOW_MS);
    recentOrders.push(ahora);
    localStorage.setItem('fp_order_ts', JSON.stringify(recentOrders));
  } catch {
    // The database still enforces its own rate limit if storage is unavailable.
  }
}

// Mensaje de error de guardado según la causa clasificada (ver utils/erroresPedido.js).
const SAVE_ERROR_KEYS = {
  duplicado: 'cart.saveOrderDuplicate',
  limite: 'cart.saveOrderRateLimit',
  inventario: 'cart.saveOrderInventory',
  validacion: 'cart.saveOrderError',
  red: 'cart.saveOrderNetwork',
  desconocido: 'cart.saveOrderError',
};

const INPUT_CLASS = `
  w-full rounded-xl px-3 py-2.5 text-sm font-body font-semibold
  placeholder:text-ink-300 outline-none transition-all duration-200
  border-2 focus:border-fiesta-magenta
`;

const inputDynStyle = {
  backgroundColor: 'var(--surface-input)',
  color: 'var(--text-primary)',
  borderColor: 'var(--border-default)',
};

export default function CarritoDrawer({
  items,
  isOpen,
  onCerrar,
  onAgregar,
  onReducir,
  onLimpiar,
  productos = [],
  pedidosHabilitados = true,
  isOnline = true,
}) {

  const { guardarPedido, guardando } = usePedido();
  const { t } = useLanguage();
  const [initialDraft] = useState(readCheckoutDraft);

  const [deliveryType, setDeliveryType] = useState(initialDraft.deliveryType);
  const [customerName, setCustomerName] = useState(initialDraft.customerName);
  const [phone, setPhone] = useState(initialDraft.phone);
  const [address, setAddress] = useState(initialDraft.address);
  const [errors, setErrors] = useState({});
  const [honeypot,  setHoneypot]  = useState('');
  const [pendingOrder, setPendingOrder] = useState(null);
  const [reviewUpdated, setReviewUpdated] = useState(false);
  const [orderSaveError, setOrderSaveError] = useState('');
  const panelRef = useRef(null);
  useFocusTrap(panelRef, isOpen, 'first', onCerrar);

  useEffect(() => {
    if (isOpen) {
      document.documentElement.classList.add('overflow-hidden');
    } else {
      document.documentElement.classList.remove('overflow-hidden');
    }
    return () => document.documentElement.classList.remove('overflow-hidden');
  }, [isOpen]);

  useEffect(() => { setErrors({}); }, [deliveryType]);

  useEffect(() => {
    writeCheckoutDraft({ deliveryType, customerName, phone, address });
  }, [deliveryType, customerName, phone, address]);

  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setPendingOrder(null);
        setReviewUpdated(false);
      }, 600);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const capitalizeName = (str) =>
    str.replace(/(^|[\s\-])(\S)/gu, (_, sep, letra) => sep + letra.toUpperCase());

  const cleanedPhone = phone.replace(/\D/g, '');
  const phoneValidation = validarTelefonoMX(cleanedPhone);
  const isPhoneValid = phoneValidation.valido;

  const currentItems = items.map((item) => {
    const real = productos.find((producto) => String(producto.id) === String(item.id));
    return real ? { ...item, ...real, id: item.id, cantidad: item.cantidad } : item;
  });

  const stockIssues = currentItems.filter((item) => {
    if (item.activo === false) return true;
    if (item.stock_ilimitado !== false) return false;
    return item.cantidad > (Number(item.stock_actual) || 0);
  });
  const hasStockIssues = stockIssues.length > 0;

  const isFormReady = customerName.trim().length > 0 && isPhoneValid &&
    (deliveryType === 'tienda' || address.trim().length > 0) && !hasStockIssues &&
    pedidosHabilitados && isOnline;

  const calculatedTotal = currentItems.reduce((acc, item) => {
    const precioAplicable = obtenerPrecioAplicable(item, item.cantidad);
    return acc + (precioAplicable * item.cantidad);
  }, 0);
  const cantidadTotal = items.reduce((acc, item) => acc + item.cantidad, 0);
  const missingFields = [
    customerName.trim().length === 0 ? t('form.fieldName') : null,
    !isPhoneValid ? t('form.fieldPhone') : null,
    deliveryType === 'envio' && address.trim().length === 0 ? t('form.fieldAddress') : null,
  ].filter(Boolean);

  const createItemsSnapshot = () => currentItems.map((item) => ({
    ...item,
    precio_base: Number(item.precio) || 0,
    precio: obtenerPrecioAplicable(item, item.cantidad),
  }));

  const validateForm = () => {
    const e = {};
    const cleanName = customerName.trim();
    if (!cleanName) e.nombre = t('form.nameRequired');
    else if (cleanName.length > 100) e.nombre = t('form.nameTooLong');
    if (!isPhoneValid)   e.telefono = phoneValidation.error || t('form.phoneInvalid');
    if (deliveryType === 'envio') {
      const cleanAddress = address.trim();
      if (!cleanAddress) e.direccion = t('form.addressRequired');
      else if (cleanAddress.length > 300) e.direccion = t('form.addressTooLong');
    }
    if (items.length === 0) e.nombre = t('form.cartEmpty');
    if (items.length > 50) e.nombre = t('form.tooManyItems');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleConfirm = async () => {
    if (pendingOrder) return;
    if (!pedidosHabilitados) {
      setErrors({ nombre: t('cart.ordersPausedError') });
      return;
    }
    if (!validateForm()) return;

    if (honeypot) return;

    const itemsWithAppliedPrice = createItemsSnapshot();

    const normalizedAddress = deliveryType === 'envio' ? address.trim() : '';

    setPendingOrder({
      folio: null,
      itemsSnapshot: itemsWithAppliedPrice,
      total: calculatedTotal,
      tipoEntrega: deliveryType,
      nombre: customerName.trim(),
      telefono: cleanedPhone,
      direccion: normalizedAddress,
    });
    setOrderSaveError('');
    setReviewUpdated(false);
    trackEvent('checkout_review', {
      delivery_type: deliveryType,
      item_types: itemsWithAppliedPrice.length,
      item_count: cantidadTotal,
      value: calculatedTotal,
      currency: 'MXN',
    });
  };

  const handleOpenWhatsApp = async () => {
    // Guardas anti-reentrada: no re-enviar si ya hay un guardado en curso
    // o si el pedido ya fue registrado (folio asignado).
    if (!pendingOrder || guardando || pendingOrder.folio) return;
    if (!isOnline) {
      setErrors({ nombre: t('cart.offlineOrderError') });
      return;
    }
    if (!pedidosHabilitados) {
      setErrors({ nombre: t('cart.ordersPausedError') });
      setPendingOrder(null);
      return;
    }

    if (hasStockIssues) {
      setPendingOrder(null);
      setReviewUpdated(false);
      return;
    }

    const latestItems = createItemsSnapshot();
    const latestTotal = latestItems.reduce(
      (total, item) => total + (Number(item.precio) || 0) * item.cantidad,
      0,
    );
    const summarize = (orderItems) => JSON.stringify(orderItems.map((item) => ({
      id: String(item.id),
      cantidad: item.cantidad,
      precio: Number(item.precio) || 0,
    })));

    if (latestTotal !== pendingOrder.total || summarize(latestItems) !== summarize(pendingOrder.itemsSnapshot)) {
      setPendingOrder((current) => ({
        ...current,
        itemsSnapshot: latestItems,
        total: latestTotal,
      }));
      setReviewUpdated(true);
      return;
    }

    if (!checkRateLimit()) {
      setErrors({ nombre: t('form.tooManyOrders') });
      setPendingOrder(null);
      setReviewUpdated(false);
      return;
    }

    setOrderSaveError('');

    const whatsappWindow = window.open('about:blank', '_blank');
    if (whatsappWindow) {
      whatsappWindow.opener = null;
      whatsappWindow.document.title = t('cart.preparingWhatsApp');
      whatsappWindow.document.body.textContent = t('cart.preparingWhatsApp');
      whatsappWindow.document.body.style.fontFamily = 'sans-serif';
      whatsappWindow.document.body.style.padding = '24px';
    }

    const { itemsSnapshot, total, tipoEntrega: type, nombre: name, telefono: phoneNumber, direccion: customerAddress } = pendingOrder;
    const normalizedAddress = type === 'envio' ? customerAddress?.trim() || '' : '';

    // 1) Persist order in Supabase
    const { folio, error, tipo } = await guardarPedido({
      nombre: name, telefono: phoneNumber, tipoEntrega: type, direccion: normalizedAddress, total, items: itemsSnapshot,
    });

    if (error || !folio) {
      console.warn('[Pedido] No se pudo guardar en Supabase:', error);
      trackEvent('order_save_failed', {
        error_type: tipo || 'backend',
        delivery_type: type,
        item_count: itemsSnapshot.reduce((count, item) => count + item.cantidad, 0),
      });
      if (whatsappWindow && !whatsappWindow.closed) whatsappWindow.close();
      // El pendingOrder se conserva para permitir el reintento; el trigger
      // anti-duplicado del servidor evita pedidos repetidos si el primero sí
      // se registró pero la respuesta se perdió.
      setOrderSaveError(t(SAVE_ERROR_KEYS[tipo] || 'cart.saveOrderError'));
      return;
    }

    recordOrderSubmission();

    // 2) Build WhatsApp URL with order reference. Si la configuración de
    // WhatsApp falla, el pedido YA está guardado: el folio se muestra en
    // pantalla y el flujo continúa sin romperse.
    let url = null;
    try {
      url = generarMensajeWhatsApp(itemsSnapshot, total, {
        tipo: type, nombre: name, telefono: phoneNumber, direccion: normalizedAddress, folio,
      });
    } catch (whatsappError) {
      console.error('[Pedido] No se pudo generar el mensaje de WhatsApp:', whatsappError);
    }

    trackEvent('order_whatsapp_click', {
      delivery_type: type,
      item_types: itemsSnapshot.length,
      item_count: itemsSnapshot.reduce((count, item) => count + item.cantidad, 0),
      value: total,
      currency: 'MXN',
      order_saved: Boolean(folio),
    });

    // 3) Reuse the synchronously opened tab so popup blockers do not lose the order.
    if (url) {
      if (whatsappWindow && !whatsappWindow.closed) {
        whatsappWindow.location.replace(url);
      } else {
        window.location.assign(url);
      }
    } else if (whatsappWindow && !whatsappWindow.closed) {
      whatsappWindow.close();
    }

    // 4) Reset cart state pero conservar la confirmación con el folio a la
    // vista: es el mismo folio devuelto por el RPC y el que funciona en
    // /rastrear/:folio. El botón de enviar se reemplaza para no duplicar.
    onLimpiar();
    setCustomerName(''); setPhone(''); setAddress('');
    setDeliveryType('tienda');
    clearCheckoutDraft();
    setOrderSaveError('');
    setReviewUpdated(false);
    setPendingOrder((current) => (current ? { ...current, folio } : current));
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 animate-fade-in"
          style={{ background: 'rgba(26, 7, 51, 0.5)', backdropFilter: 'blur(4px)' }}
          onClick={onCerrar}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label={t('cart.title')}
        aria-modal="true"
        aria-hidden={!isOpen}
        {...(!isOpen ? { inert: '' } : {})}
        className={`
          fixed inset-x-0 bottom-0 z-50 rounded-t-3xl shadow-2xl
          max-h-[92vh] flex flex-col safe-bottom
          sm:w-[26rem] sm:max-w-[calc(100vw-3rem)] sm:left-auto sm:right-6 sm:rounded-3xl sm:bottom-6
          transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${isOpen ? 'translate-y-0' : 'pointer-events-none translate-y-full sm:translate-y-[calc(100%+2rem)]'}
        `}
        style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-soft)' }}
      >

        {/* Handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-ink-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b-2 border-ink-100 flex-shrink-0">
          <div>
            <h2 className="font-display text-xl text-ink-900">{t('cart.title')}</h2>
            {items.length > 0 && (
              <p className="text-xs text-ink-400 font-body font-semibold">
                {t('cart.itemsSummary', {
                  products: items.length,
                  productLabel: t(items.length === 1 ? 'cart.product' : 'cart.products'),
                  units: cantidadTotal,
                  unitLabel: t(cantidadTotal === 1 ? 'cart.unit' : 'cart.units'),
                })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && !pendingOrder && (
              <button
                onClick={onLimpiar}
                className="p-2 rounded-full bg-ink-100 hover:bg-red-50 text-ink-400
                           hover:text-red-400 transition-all duration-200 active:scale-90"
                aria-label={t('cart.emptyCart')}
                title={t('cart.emptyCart')}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
            <button onClick={onCerrar} aria-label={t('cart.closeCart')}
              className="p-2 rounded-full bg-ink-100 hover:bg-ink-200 text-ink-500 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scroll area */}
        <div className="flex-1 overflow-y-auto">

          {/* Post-checkout confirmation screen */}
          {pendingOrder ? (
            <div className="flex flex-col items-center px-5 py-6 gap-4 animate-fade-in">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-4xl font-black animate-scale-in"
                   style={{ background: 'var(--gradient-success)', boxShadow: 'var(--shadow-success-soft)' }}>
                ✓
              </div>
              <div className="text-center">
                <p className="font-display text-xl text-ink-900">
                  {t(pendingOrder.folio ? 'cart.orderSavedTitle' : 'cart.orderReady')}
                </p>
                <p className="text-sm text-ink-400 font-body mt-1">
                  {t(pendingOrder.folio ? 'cart.orderSavedSub' : 'cart.orderReadySub')}
                </p>
              </div>
              {pendingOrder.folio && (
                <div className="w-full rounded-2xl p-4 text-center"
                     style={{ background: 'var(--surface-card)', border: '2px solid var(--border-default)' }}>
                  <p className="text-xs font-body text-ink-400 font-semibold mb-1">{t('cart.orderNumber')}</p>
                  <p className="font-display text-2xl text-ink-900 tracking-wider">{pendingOrder.folio}</p>
                  <p className="text-xs text-ink-400 font-body mt-1 mb-2">{t('cart.saveToTrack')}</p>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <button
                      onClick={() => navigator.clipboard?.writeText(pendingOrder.folio).catch(() => {})}
                      className="text-xs font-body font-black px-3 py-1 rounded-full border transition-all hover:opacity-80"
                      style={{ color: 'var(--accent-primary)', borderColor: 'var(--color-brand-soft)', background: 'var(--surface-elevated, var(--surface-card))' }}
                    >
                      {t('cart.copyFolio')}
                    </button>
                    <a
                      href={`/rastrear/${encodeURIComponent(pendingOrder.folio)}`}
                      className="text-xs font-body font-black px-3 py-1 rounded-full border transition-all hover:opacity-80"
                      style={{ color: 'var(--accent-primary)', borderColor: 'var(--color-brand-soft)', background: 'var(--surface-elevated, var(--surface-card))' }}
                    >
                      {t('cart.trackOrderCta')}
                    </a>
                  </div>
                </div>
              )}
              <div className="w-full rounded-2xl p-4 space-y-2"
                   style={{ background: 'var(--surface-card)', border: '2px solid var(--border-default)' }}>
                <p className="text-xs font-body font-black uppercase tracking-wide text-ink-500">
                  {t('cart.customerDetails')}
                </p>
                <p className="font-body text-sm font-black text-ink-800">{pendingOrder.nombre}</p>
                <p className="font-body text-xs font-semibold text-ink-500">{pendingOrder.telefono}</p>
                {pendingOrder.tipoEntrega === 'envio' && pendingOrder.direccion && (
                  <p className="font-body text-xs leading-relaxed text-ink-500">{pendingOrder.direccion}</p>
                )}
              </div>
              <div className="w-full rounded-2xl p-4 space-y-3"
                   style={{ background: 'var(--surface-card)', border: '2px solid var(--border-default)' }}>
                <p className="text-xs font-body font-black uppercase tracking-wide text-ink-500">
                  {t('cart.productSummary')}
                </p>
                <ul className="max-h-44 space-y-2 overflow-y-auto pr-1">
                  {pendingOrder.itemsSnapshot.map((item) => (
                    <li key={item.id} className="flex items-start justify-between gap-3 text-xs font-body">
                      <div className="min-w-0">
                        <p className="font-black text-ink-800">{item.nombre}</p>
                        <p className="font-semibold text-ink-400">
                          {item.cantidad} × {SIMBOLO_MONEDA}{Number(item.precio).toFixed(2)}
                        </p>
                      </div>
                      <span className="flex-shrink-0 font-black text-ink-700">
                        {SIMBOLO_MONEDA}{(Number(item.precio) * item.cantidad).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="w-full rounded-2xl p-4 space-y-2"
                   style={{ background: 'var(--surface-section-gradient)', border: '2px solid var(--border-default)' }}>
                <div className="flex justify-between text-sm">
                  <span className="font-body text-ink-500">{t('cart.productsLabel')}</span>
                  <span className="font-body font-black text-ink-800">
                    {pendingOrder.itemsSnapshot.length} {pendingOrder.itemsSnapshot.length === 1 ? t('cart.item') : t('cart.items')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-body text-ink-500">{t('cart.deliveryLabel')}</span>
                  <span className="font-body font-black text-ink-800">
                    {pendingOrder.tipoEntrega === 'tienda' ? t('cart.pickupStore') : t('cart.deliveryHome')}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-ink-100">
                  <span className="font-body text-ink-500 text-sm">{t('common.total')}</span>
                  <span className="font-body font-black text-lg"
                        style={{ background: 'var(--gradient-accent)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {SIMBOLO_MONEDA}{pendingOrder.total.toFixed(2)}
                  </span>
                </div>
                {pendingOrder.tipoEntrega === 'envio' && (
                  <p className="text-[10px] font-body font-bold leading-relaxed text-ink-500">
                    {t('cart.shippingCostPending')}
                  </p>
                )}
              </div>
              {!pendingOrder.folio && (
                <p className="text-center text-[10px] font-body font-bold text-green-700">
                  {t('cart.catalogVerified')}
                </p>
              )}
              {reviewUpdated && !pendingOrder.folio && (
                <p className="w-full rounded-xl bg-amber-50 px-3 py-2 text-center text-[11px] font-body font-black text-amber-700"
                   role="status">
                  {t('cart.reviewUpdated')}
                </p>
              )}
            </div>
          ) : (
          <>

          {/* Cart items list */}
          <div className="px-5 py-3">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-4xl mb-4 animate-float">🎈</div>
                <p className="font-display text-xl text-ink-500">{t('cart.empty')}</p>
                <p className="text-xs text-ink-400 font-body font-semibold mt-1">{t('cart.emptyHint')}</p>
                <button
                  type="button"
                  onClick={onCerrar}
                  className="mt-5 min-h-11 rounded-2xl px-5 text-sm font-body font-black text-white transition-transform active:scale-95"
                  style={{ background: 'var(--gradient-accent)', boxShadow: 'var(--shadow-accent-soft)' }}
                >
                  {t('cart.continueShopping')}
                </button>
              </div>
            ) : (
              <ul className="space-y-3">
                {currentItems.map((item) => {
                  const c = 'var(--accent-primary)';
                  const precioBase = Number(item.precio) || 0;
                  const precioAplicable = obtenerPrecioAplicable(item, item.cantidad);
                  const hayDescuento = precioAplicable < precioBase;
                  const subtotal = precioAplicable * item.cantidad;
                  const fallbackImage = getInlineProductPlaceholder(item.nombre);
                  const imageSrc = (typeof item.imagen_url === 'string' && item.imagen_url.trim())
                    ? item.imagen_url.trim()
                    : fallbackImage;

                  const stockActualRT = Number(item.stock_actual) || 0;
                  const agotadoRT = item.activo === false || (
                    item.stock_ilimitado === false && stockActualRT === 0
                  );
                  const stockInsuficienteRT = !agotadoRT && item.stock_ilimitado === false &&
                    item.cantidad > stockActualRT;
                  const stockMaximoRT = !agotadoRT && !stockInsuficienteRT && item.stock_ilimitado === false &&
                    stockActualRT > 0 && item.cantidad >= stockActualRT;
                  const tieneProblemaStock = agotadoRT || stockInsuficienteRT;

                  return (
                      <li key={item.id}
                        className="relative flex gap-3 items-center bg-white rounded-2xl p-3"
                        style={{ border: `2px solid ${tieneProblemaStock ? 'var(--color-danger)' : 'var(--color-brand-soft)'}`, opacity: agotadoRT ? 0.7 : 1 }}>

                      {agotadoRT && (
                        <div className="absolute -top-2 -right-2 z-10 bg-red-500 text-white text-[9px] font-body font-black
                                        px-2 py-0.5 rounded-full shadow-md">
                          {t('common.soldOut')}
                        </div>
                      )}

                      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-ink-50"
                           style={{ border: '2px solid var(--color-brand-soft-2)', filter: agotadoRT ? 'grayscale(60%)' : 'none' }}>
                        <img src={imageSrc} alt={item.nombre}
                          width="56"
                          height="56"
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = fallbackImage;
                          }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm font-bold text-ink-800 leading-tight truncate">{item.nombre}</p>
                        {hayDescuento ? (
                          <div className="mt-0.5 flex items-baseline gap-2">
                            <span className="line-through text-gray-400 text-xs font-semibold">
                              {SIMBOLO_MONEDA}{precioBase.toFixed(2)} {t('product.eachUnit')}
                            </span>
                            <span className="text-sm font-black text-emerald-600">
                              {SIMBOLO_MONEDA}{precioAplicable.toFixed(2)} {t('product.eachUnit')}
                            </span>
                          </div>
                        ) : (
                          <p className="font-body text-xs text-ink-400 font-semibold mt-0.5">
                            {SIMBOLO_MONEDA}{precioBase.toFixed(2)} {t('product.eachUnit')}
                          </p>
                        )}
                        <p className="font-body text-sm font-black mt-0.5" style={{ color: agotadoRT ? 'var(--text-inactive)' : c }}>
                          {SIMBOLO_MONEDA}{subtotal.toFixed(2)}
                        </p>
                        {(stockInsuficienteRT || stockMaximoRT) && (
                          <span
                            className="mt-1 inline-flex rounded-full px-2 py-0.5 text-[9px] font-body font-black text-white"
                            style={{ background: 'linear-gradient(135deg, #f97316, #dc2626)' }}
                          >
                            {stockInsuficienteRT
                              ? t('cart.stockAvailable', { count: stockActualRT })
                              : t('product.max', { count: stockActualRT })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onClick={() => onReducir(item.id)}
                          aria-label={t('product.removeOne', { name: item.nombre })}
                          className="w-7 h-7 flex items-center justify-center rounded-full
                                     bg-ink-100 text-ink-600 border-2 border-ink-200
                                     transition-all hover:border-fiesta-magenta active:scale-90">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="font-body font-black text-sm text-ink-900 w-5 text-center">{item.cantidad}</span>

                        {(() => {
                          const maxStockAlcanzado = agotadoRT || (
                            item.stock_ilimitado === false &&
                            item.cantidad >= stockActualRT
                          );
                          return (
                            <button onClick={() => !maxStockAlcanzado && onAgregar(item)}
                              disabled={maxStockAlcanzado}
                              aria-label={t('product.addOne', { name: item.nombre })}
                              className={`w-7 h-7 flex items-center justify-center rounded-full text-white transition-all
                                          ${maxStockAlcanzado ? 'opacity-50 cursor-not-allowed' : 'active:scale-90'}`}
                              style={{ background: 'var(--gradient-accent)' }}>
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          );
                        })()}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Delivery section (visible only when cart has items) */}
          {items.length > 0 && (
            <div className="px-5 pb-3">
              <div className="rounded-2xl p-4 space-y-3 entrega-section"
                   style={{ background: 'var(--surface-section-gradient)', border: '2px solid var(--border-default)' }}>

                <p className="font-display text-base text-ink-900">{t('delivery.title')}</p>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: 'tienda', emoji: '🏪', label: t('delivery.pickupLabel') },
                    { val: 'envio',  emoji: '🚚', label: t('delivery.shippingLabel')  },
                  ].map(({ val, emoji, label }) => (
                    <button
                      key={val}
                      onClick={() => setDeliveryType(val)}
                      className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl font-body font-bold text-xs
                                 transition-all duration-200 active:scale-95 border-2 whitespace-pre-line text-center"
                      style={deliveryType === val
                        ? { background: 'var(--gradient-accent)', color: 'white',
                            border: '2px solid transparent', boxShadow: 'var(--shadow-accent-soft)' }
                        : { background: 'var(--surface-card)', color: 'var(--text-secondary)', border: '2px solid var(--border-default)' }
                      }
                    >
                      <span className="text-xl">{emoji}</span>
                      {label}
                    </button>
                  ))}
                </div>

                {deliveryType === 'tienda' && DIRECCION_TIENDA && (
                  <div className="animate-fade-in rounded-xl px-3 py-2.5 text-xs font-body space-y-0.5"
                       style={{ background: 'var(--surface-card)', border: '1px solid var(--border-soft)' }}>
                    <p className="font-black" style={{ color: 'var(--text-primary)' }}>📍 {DIRECCION_TIENDA}</p>
                    {HORARIO_TIENDA && <p style={{ color: 'var(--text-secondary)' }}>⏰ {HORARIO_TIENDA}</p>}
                    {MAPS_URL_TIENDA && (
                      <a href={MAPS_URL_TIENDA} target="_blank" rel="noopener noreferrer"
                         className="font-black text-[10px]" style={{ color: 'var(--accent-primary)' }}>
                        {t('common.viewOnMaps')}
                      </a>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <div>
                    <input
                      id="cliente-nombre"
                      name="cliente_nombre"
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(capitalizeName(e.target.value))}
                      placeholder={t('form.namePlaceholder')}
                      aria-label={t('form.nameLabel')}
                      autoComplete="name"
                      maxLength={100}
                      className={INPUT_CLASS}
                      style={errors.nombre ? { ...inputDynStyle, borderColor: 'var(--color-danger)' } : inputDynStyle}
                    />
                    {errors.nombre && (
                      <p className="text-[11px] text-fiesta-magenta font-body font-bold mt-1 pl-1">{errors.nombre}</p>
                    )}
                  </div>

                  <div>
                    <input
                      id="cliente-telefono"
                      name="cliente_telefono"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ''))}
                      placeholder={t('form.phonePlaceholder')}
                      aria-label={t('form.phoneLabel')}
                      autoComplete="tel-national"
                      inputMode="numeric"
                      maxLength={10}
                      className={INPUT_CLASS}
                      style={errors.telefono ? { ...inputDynStyle, borderColor: 'var(--color-danger)' } : isPhoneValid ? { ...inputDynStyle, borderColor: 'var(--accent-success)' } : inputDynStyle}
                    />
                    <p className={`text-[11px] font-body font-bold mt-1 pl-1 transition-colors
                                  ${errors.telefono ? 'text-fiesta-magenta' : isPhoneValid ? 'text-green-500' : 'text-ink-300'}`}>
                      {errors.telefono
                        ? errors.telefono
                        : isPhoneValid
                          ? t('form.phoneValid')
                          : t('form.phoneDigits', { count: cleanedPhone.length })}
                    </p>
                  </div>

                  {/* Honeypot anti-bot field */}
                  <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                    <label htmlFor="website">Website</label>
                    <input
                      id="website"
                      name="website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                    />
                  </div>

                  {deliveryType === 'envio' && (
                    <div className="animate-fade-in">
                      <textarea
                        id="cliente-direccion"
                        name="cliente_direccion"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder={t('form.addressPlaceholder')}
                        aria-label={t('form.addressLabel')}
                        autoComplete="street-address"
                        maxLength={300}
                        rows={2}
                        className={INPUT_CLASS + ' resize-none'}
                        style={errors.direccion ? { ...inputDynStyle, borderColor: 'var(--color-danger)' } : inputDynStyle}
                      />
                      {errors.direccion && (
                        <p className="text-[11px] text-fiesta-magenta font-body font-bold mt-1 pl-1">{errors.direccion}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          </>
          )}
        </div>

        {/* Fixed footer: total + primary action */}
        {(items.length > 0 || pendingOrder) && (
          <div className="px-5 pt-3 pb-4 border-t-2 border-ink-100 flex-shrink-0 space-y-3">
            {pendingOrder ? (
              pendingOrder.folio ? (
                <>
                  <a
                    href={`/rastrear/${encodeURIComponent(pendingOrder.folio)}`}
                    className="w-full flex items-center justify-center gap-2.5 text-white
                               font-body font-black text-base py-4 rounded-2xl
                               transition-all duration-300 active:scale-[0.98]"
                    style={{ background: 'var(--gradient-success)', boxShadow: 'var(--shadow-success-soft)' }}
                  >
                    {t('cart.trackOrderCta')}
                  </a>
                  <button
                    onClick={onCerrar}
                    className="w-full text-center text-xs font-body font-semibold py-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {t('cart.closeConfirmation')}
                  </button>
                </>
              ) : (
              <>
                {!isOnline && (
                  <p className="text-center text-xs font-body font-bold text-orange-700" role="status">
                    {t('cart.offlineOrderError')}
                  </p>
                )}
                {orderSaveError && (
                  <p className="rounded-xl bg-red-50 px-3 py-2 text-center text-xs font-body font-bold text-red-700" role="alert">
                    {orderSaveError}
                  </p>
                )}
                <button
                  onClick={handleOpenWhatsApp}
                  disabled={guardando || !isOnline}
                  className="w-full flex items-center justify-center gap-2.5 text-white
                             font-body font-black text-base py-4 rounded-2xl
                             transition-all duration-300 active:scale-[0.98]
                             disabled:cursor-not-allowed"
                  style={!guardando && isOnline
                    ? { background: 'var(--gradient-success)', boxShadow: 'var(--shadow-success-soft)' }
                    : { background: 'linear-gradient(135deg, #a8d5b5, #7cb89a)', boxShadow: 'none', opacity: 0.7 }
                  }
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {guardando ? t('cart.savingOrder') : t('cart.sendOrder')}
                </button>
                <button
                    onClick={() => {
                      setPendingOrder(null);
                      setReviewUpdated(false);
                    }}
                  className="w-full text-center text-xs font-body font-semibold py-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {t('cart.editOrder')}
                </button>
              </>
              )
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="font-body text-sm font-bold text-ink-500">{t('cart.orderTotal')}</span>
                  <span className="font-body text-xl font-black"
                        style={{ background: 'var(--gradient-accent)',
                                 WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {SIMBOLO_MONEDA}{calculatedTotal.toFixed(2)}
                  </span>
                </div>

                {hasStockIssues && (
                  <p className="text-xs font-body font-bold text-red-500 text-center py-1">
                    {t('cart.stockIssueWarning')}
                  </p>
                )}

                {!pedidosHabilitados && (
                  <p className="text-xs font-body font-bold text-red-600 text-center py-1">
                    {t('cart.ordersPausedError')}
                  </p>
                )}

                {!isOnline && (
                  <p className="text-xs font-body font-bold text-orange-700 text-center py-1" role="status">
                    {t('cart.offlineOrderError')}
                  </p>
                )}

                {!isFormReady && isOnline && !hasStockIssues && pedidosHabilitados && missingFields.length > 0 && (
                  <p className="text-center text-xs font-body font-bold" style={{ color: 'var(--text-secondary)' }} role="status">
                    {t('cart.completeFields', { fields: missingFields.join(', ') })}
                  </p>
                )}

                <button
                  onClick={handleConfirm}
                  disabled={!isFormReady}
                  className="w-full flex items-center justify-center gap-2.5 text-white
                             font-body font-black text-base py-4 rounded-2xl
                             transition-all duration-300 active:scale-[0.98]
                             disabled:cursor-not-allowed"
                  style={isFormReady
                    ? { background: 'var(--gradient-accent)',
                        boxShadow: 'var(--shadow-accent-soft)' }
                    : { background: 'linear-gradient(135deg, #d4a0c8, #b49ad4)',
                        boxShadow: 'none', opacity: 0.6 }
                  }
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {pedidosHabilitados ? t('cart.reviewOrder') : t('cart.ordersPausedCta')}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

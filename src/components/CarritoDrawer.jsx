import { useEffect, useState, useRef } from 'react';
import { generarMensajeWhatsApp } from '../utils/whatsapp';
import { obtenerPrecioAplicable } from '../utils/precios';
import { validarTelefonoMX } from '../utils/validarTelefono';
import { SIMBOLO_MONEDA, DIRECCION_TIENDA, HORARIO_TIENDA, MAPS_URL_TIENDA } from '../data/productos';
import { usePedido } from '../hooks/usePedido';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useLanguage } from '../hooks/useLanguage';

// Session rate limit (max orders per time window)
const MAX_ORDERS_PER_SESSION = 5;
const WINDOW_MS = 30 * 60 * 1000; // 30 minutes

function checkRateLimit() {
  try {
    const raw = sessionStorage.getItem('fp_order_ts');
    const timestamps = raw ? JSON.parse(raw) : [];
    const ahora = Date.now();
    const recentOrders = timestamps.filter(t => ahora - t < WINDOW_MS);
    if (recentOrders.length >= MAX_ORDERS_PER_SESSION) return false;
    recentOrders.push(ahora);
    sessionStorage.setItem('fp_order_ts', JSON.stringify(recentOrders));
    return true;
  } catch { return true; }
}

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

export default function CarritoDrawer({ items, total, isOpen, onCerrar, onAgregar, onReducir, onEliminar, onLimpiar, productos = [] }) {

  const { guardarPedido, guardando } = usePedido();
  const { t } = useLanguage();

  const [deliveryType, setDeliveryType] = useState('tienda');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState({});
  const [honeypot,  setHoneypot]  = useState('');
  const [pendingOrder, setPendingOrder] = useState(null);
  const panelRef = useRef(null);
  useFocusTrap(panelRef, isOpen);

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
    if (!isOpen) {
      const t = setTimeout(() => setPendingOrder(null), 600);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const capitalizeName = (str) =>
    str.replace(/(^|[\s\-])(\S)/gu, (_, sep, letra) => sep + letra.toUpperCase());

  const cleanedPhone = phone.replace(/\D/g, '');
  const phoneValidation = validarTelefonoMX(cleanedPhone);
  const isPhoneValid = phoneValidation.valido;

  const hasOutOfStockItems = items.some(item => {
    const real = productos.find(p => p.id === item.id);
    if (!real) return false;
    return real.activo === false || (real.stock_ilimitado === false && (real.stock_actual || 0) === 0);
  });

  const isFormReady = customerName.trim().length > 0 && isPhoneValid &&
    (deliveryType === 'tienda' || address.trim().length > 0) && !hasOutOfStockItems;

  const calculatedTotal = items.reduce((acc, item) => {
    const precioAplicable = obtenerPrecioAplicable(item, item.cantidad);
    return acc + (precioAplicable * item.cantidad);
  }, 0);

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
    if (!validateForm()) return;

    if (honeypot) return;

    if (!checkRateLimit()) {
      setErrors({ nombre: t('form.tooManyOrders') });
      return;
    }

    const itemsWithAppliedPrice = items.map(item => ({
      ...item,
      precio_base: Number(item.precio) || 0,
      precio: obtenerPrecioAplicable(item, item.cantidad),
    }));

    setPendingOrder({
      folio: null,
      url: null,
      itemsSnapshot: itemsWithAppliedPrice,
      total: calculatedTotal,
      tipoEntrega: deliveryType,
      nombre: customerName.trim(),
      telefono: cleanedPhone,
      direccion: address,
    });
  };

  const handleOpenWhatsApp = async () => {
    if (!pendingOrder) return;

    const { itemsSnapshot, total, tipoEntrega: type, nombre: name, telefono: phoneNumber, direccion: customerAddress } = pendingOrder;

    // 1) Persist order in Supabase
    const { folio, error } = await guardarPedido({
      nombre: name, telefono: phoneNumber, tipoEntrega: type, direccion: customerAddress, total, items: itemsSnapshot,
    });

    if (error) console.warn('[Pedido] No se pudo guardar en Supabase:', error);

    // 2) Build WhatsApp URL with order reference
    const url = generarMensajeWhatsApp(itemsSnapshot, total, {
      tipo: type, nombre: name, telefono: phoneNumber, direccion: customerAddress, folio,
    });

    // 3) Open WhatsApp
    window.open(url, '_blank', 'noopener,noreferrer');

    // 4) Reset local state
    onLimpiar();
    setCustomerName(''); setPhone(''); setAddress('');
    setDeliveryType('tienda');
    setPendingOrder(null);
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
        className={`
          fixed inset-x-0 bottom-0 z-50 rounded-t-3xl shadow-2xl
          max-h-[92vh] flex flex-col safe-bottom
          sm:w-[26rem] sm:max-w-[calc(100vw-3rem)] sm:left-auto sm:right-6 sm:rounded-3xl sm:bottom-6
          transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${isOpen ? 'translate-y-0' : 'translate-y-full sm:translate-y-[calc(100%+2rem)]'}
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
              <p className="text-xs text-ink-400 font-body font-semibold">{t('cart.itemsSelected', { count: items.length })}</p>
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
                   style={{ background: 'linear-gradient(135deg, #25D366, #1db954)', boxShadow: '0 8px 24px #25D36655' }}>
                ✓
              </div>
              <div className="text-center">
                <p className="font-display text-xl text-ink-900">{t('cart.orderReady')}</p>
                <p className="text-sm text-ink-400 font-body mt-1">{t('cart.orderReadySub')}</p>
              </div>
              {pendingOrder.folio && (
                <div className="w-full rounded-2xl p-4 text-center"
                     style={{ background: 'var(--surface-card)', border: '2px solid var(--border-default)' }}>
                  <p className="text-xs font-body text-ink-400 font-semibold mb-1">{t('cart.orderNumber')}</p>
                  <p className="font-display text-2xl text-ink-900 tracking-wider">{pendingOrder.folio}</p>
                  <p className="text-xs text-ink-400 font-body mt-1 mb-2">{t('cart.saveToTrack')}</p>
                  <button
                    onClick={() => navigator.clipboard?.writeText(pendingOrder.folio).catch(() => {})}
                    className="text-xs font-body font-black px-3 py-1 rounded-full border transition-all hover:opacity-80"
                    style={{ color: '#a855f7', borderColor: '#a855f720', background: 'var(--surface-elevated, var(--surface-card))' }}
                  >
                    {t('cart.copyFolio')}
                  </button>
                </div>
              )}
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
                        style={{ background: 'linear-gradient(135deg, #ff3dac, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {SIMBOLO_MONEDA}{pendingOrder.total.toFixed(2)}
                  </span>
                </div>
              </div>
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
              </div>
            ) : (
              <ul className="space-y-3">
                {items.map((item, index) => {
                  const colors = ['#ff3dac','#a855f7','#00d4ff','#ff7b2e','#39e87b','#ffe135'];
                  const c = colors[index % colors.length];
                  const precioBase = Number(item.precio) || 0;
                  const precioAplicable = obtenerPrecioAplicable(item, item.cantidad);
                  const hayDescuento = precioAplicable < precioBase;
                  const subtotal = precioAplicable * item.cantidad;

                  const prodReal = productos.find(p => p.id === item.id);
                  const agotadoRT = prodReal
                    ? (prodReal.activo === false || (prodReal.stock_ilimitado === false && (prodReal.stock_actual || 0) === 0))
                    : false;
                  const stockBajoRT = prodReal && !agotadoRT && prodReal.stock_ilimitado === false
                    && (prodReal.stock_actual || 0) > 0 && item.cantidad >= (prodReal.stock_actual || 0);

                  return (
                    <li key={item.id}
                        className="relative flex gap-3 items-center bg-white rounded-2xl p-3"
                        style={{ border: `2px solid ${agotadoRT ? '#ef4444' : c + '22'}`, opacity: agotadoRT ? 0.7 : 1 }}>

                      {agotadoRT && (
                        <div className="absolute -top-2 -right-2 z-10 bg-red-500 text-white text-[9px] font-body font-black
                                        px-2 py-0.5 rounded-full shadow-md">
                          {t('common.soldOut')}
                        </div>
                      )}

                      {stockBajoRT && !agotadoRT && (
                        <div className="absolute -top-2 -right-2 z-10 text-white text-[9px] font-body font-black
                                        px-2 py-0.5 rounded-full shadow-md"
                             style={{ background: 'linear-gradient(135deg, #f97316, #dc2626)' }}>
                          {t('product.max', { count: prodReal.stock_actual })}
                        </div>
                      )}

                      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-ink-50"
                           style={{ border: `2px solid ${c}44`, filter: agotadoRT ? 'grayscale(60%)' : 'none' }}>
                        <img src={item.imagen_url} alt={item.nombre}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = `https://placehold.co/56x56/f3e8ff/a855f7?text=?`; }} />
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
                        <p className="font-body text-sm font-black mt-0.5" style={{ color: agotadoRT ? '#9ca3af' : c }}>
                          {SIMBOLO_MONEDA}{subtotal.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onClick={() => !agotadoRT && onReducir(item.id)}
                          disabled={agotadoRT}
                          className={`w-7 h-7 flex items-center justify-center rounded-full
                                     bg-ink-100 text-ink-600 border-2 border-ink-200
                                     transition-all hover:border-fiesta-magenta
                                     ${agotadoRT ? 'opacity-40 cursor-not-allowed' : 'active:scale-90'}`}>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="font-body font-black text-sm text-ink-900 w-5 text-center">{item.cantidad}</span>

                        {(() => {
                          const maxStockAlcanzado = agotadoRT || (item.stock_ilimitado !== true && item.stock_actual != null && item.cantidad >= item.stock_actual);
                          return (
                            <button onClick={() => !maxStockAlcanzado && onAgregar(item)}
                              disabled={maxStockAlcanzado}
                              className={`w-7 h-7 flex items-center justify-center rounded-full text-white transition-all
                                          ${maxStockAlcanzado ? 'opacity-50 cursor-not-allowed' : 'active:scale-90'}`}
                              style={{ background: `linear-gradient(135deg, ${c}, #a855f7)` }}>
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
                        ? { background: 'linear-gradient(135deg, #ff3dac, #a855f7)', color: 'white',
                            border: '2px solid transparent', boxShadow: '0 4px 14px #ff3dac44' }
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
                         className="font-black text-[10px]" style={{ color: '#a855f7' }}>
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
                      className={INPUT_CLASS}
                      style={errors.nombre ? { ...inputDynStyle, borderColor: '#ff3dac' } : inputDynStyle}
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
                      maxLength={10}
                      className={INPUT_CLASS}
                      style={errors.telefono ? { ...inputDynStyle, borderColor: '#ff3dac' } : isPhoneValid ? { ...inputDynStyle, borderColor: '#25D366' } : inputDynStyle}
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
                        rows={2}
                        className={INPUT_CLASS + ' resize-none'}
                        style={errors.direccion ? { ...inputDynStyle, borderColor: '#ff3dac' } : inputDynStyle}
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
              <>
                <button
                  onClick={handleOpenWhatsApp}
                  disabled={guardando}
                  className="w-full flex items-center justify-center gap-2.5 text-white
                             font-body font-black text-base py-4 rounded-2xl
                             transition-all duration-300 active:scale-[0.98]
                             disabled:cursor-not-allowed"
                  style={!guardando
                    ? { background: 'linear-gradient(135deg, #25D366, #1db954)', boxShadow: '0 4px 20px #25D36655' }
                    : { background: 'linear-gradient(135deg, #a8d5b5, #7cb89a)', boxShadow: 'none', opacity: 0.7 }
                  }
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {guardando ? t('cart.savingOrder') : t('cart.sendOrder')}
                </button>
                <button
                    onClick={() => setPendingOrder(null)}
                  className="w-full text-center text-xs font-body font-semibold py-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {t('cart.backToCart')}
                </button>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="font-body text-sm font-bold text-ink-500">{t('cart.orderTotal')}</span>
                  <span className="font-body text-xl font-black"
                        style={{ background: 'linear-gradient(135deg, #ff3dac, #a855f7)',
                                 WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {SIMBOLO_MONEDA}{calculatedTotal.toFixed(2)}
                  </span>
                </div>

                {hasOutOfStockItems && (
                  <p className="text-xs font-body font-bold text-red-500 text-center py-1">
                    {t('cart.outOfStockWarning')}
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
                    ? { background: 'linear-gradient(135deg, #ff3dac, #a855f7)',
                        boxShadow: '0 4px 20px #ff3dac44' }
                    : { background: 'linear-gradient(135deg, #d4a0c8, #b49ad4)',
                        boxShadow: 'none', opacity: 0.6 }
                  }
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {t('cart.confirmOrder')}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

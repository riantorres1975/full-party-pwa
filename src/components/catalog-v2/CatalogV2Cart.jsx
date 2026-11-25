import {
  AlertCircle,
  CheckCircle2,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { SUCURSALES } from '../../data/sucursales.js';
import { CATALOG_ERROR_TYPES } from '../../services/catalog/errors.js';
import { useFocusTrap } from '../../hooks/useFocusTrap.js';
import { createOrder } from '../../services/catalog/ordersRepository.js';
import { getCatalogCartFingerprint, groupCatalogCartItems } from '../../services/catalog/cart.js';
import { getMaximumPurchasableQuantity } from '../../services/catalog/variantSelection.js';
import { validarTelefonoMX } from '../../utils/validarTelefono.js';
import { generarMensajeWhatsAppCatalogoV2 } from '../../utils/whatsapp.js';
import { getInlineProductPlaceholder } from '../../utils/imagenes.js';

const CHECKOUT_STORAGE_KEY = 'fullPartyCatalogCheckoutV2';
const ORDER_ATTEMPT_STORAGE_KEY = 'fullPartyCatalogOrderAttemptV2';
const LAST_ORDER_FOLIO_KEY = 'fullPartyLastOrderFolio';
const DEFAULT_PICKUP_ID = 'sol-naciente';

function money(value) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(Number(value) || 0);
}

function readCheckoutDraft() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CHECKOUT_STORAGE_KEY));
    return {
      nombre: String(parsed?.nombre || ''),
      telefono: String(parsed?.telefono || ''),
      tipoEntrega: parsed?.tipoEntrega === 'envio' ? 'envio' : 'tienda',
      direccion: String(parsed?.direccion || ''),
      pickupId: SUCURSALES.some(({ id }) => id === parsed?.pickupId) ? parsed.pickupId : DEFAULT_PICKUP_ID,
    };
  } catch {
    return {
      nombre: '',
      telefono: '',
      tipoEntrega: 'tienda',
      direccion: '',
      pickupId: DEFAULT_PICKUP_ID,
    };
  }
}

function readLastOrderFolio() {
  try {
    return window.sessionStorage.getItem(LAST_ORDER_FOLIO_KEY) || '';
  } catch {
    return '';
  }
}

function saveLastOrderFolio(folio) {
  try {
    window.sessionStorage.setItem(LAST_ORDER_FOLIO_KEY, folio);
  } catch {
    // The receipt stays available until the page is closed.
  }
}

function OrderTrackingLink({ folio, children }) {
  return (
    <Link to={`/rastrear/${encodeURIComponent(folio)}`} className="catalog-v2-cart__tracking">
      {children}
    </Link>
  );
}

function generateUuid() {
  if (typeof window.crypto?.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0'));
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10).join(''),
  ].join('-');
}

function getOrderAttempt(fingerprint) {
  try {
    const existing = JSON.parse(
      window.localStorage.getItem(ORDER_ATTEMPT_STORAGE_KEY),
    );
    if (existing?.fingerprint === fingerprint && existing?.key) {
      return existing.key;
    }
  } catch {
    // A new key is safe when the previous local value is unreadable.
  }

  const key = generateUuid();
  try {
    window.localStorage.setItem(
      ORDER_ATTEMPT_STORAGE_KEY,
      JSON.stringify({ fingerprint, key }),
    );
  } catch {
    // The in-memory key still protects retries during this submission.
  }
  return key;
}

function clearOrderAttempt() {
  try {
    window.localStorage.removeItem(ORDER_ATTEMPT_STORAGE_KEY);
  } catch {
    // No action required when storage is unavailable.
  }
}

function getFormError(form) {
  const nombre = form.nombre.trim();
  const telefono = form.telefono.replace(/\D/g, '');
  if (nombre.length < 2 || nombre.length > 120) {
    return 'Escribe el nombre de quien recibirá el pedido.';
  }
  const phoneValidation = validarTelefonoMX(telefono);
  if (!phoneValidation.valido) {
    return phoneValidation.error || 'Escribe un teléfono mexicano válido.';
  }
  if (
    form.tipoEntrega === 'envio'
    && (form.direccion.trim().length < 5 || form.direccion.trim().length > 500)
  ) {
    return 'Escribe la dirección completa para el envío.';
  }
  return null;
}

function CartLine({ item, issue, onQuantity, onRemove }) {
  const step = Math.max(1, Number(item.presentation.quantityStep) || 1);
  const minimum = Math.max(
    1,
    Number(item.presentation.minimumOrderQuantity) || 1,
  );
  const fallback = getInlineProductPlaceholder(item.productName);
  const maximum = getMaximumPurchasableQuantity(item.presentation, item.presentation.availableQuantity);
  const options = [item.lineName, item.colorName, item.sizeName, item.finishName].filter(Boolean);
  const lineLabel = [item.productName, ...options, item.presentationName].filter(Boolean).join(', ');

  return (
    <li className={`catalog-v2-cart__line ${issue ? 'has-issue' : ''}`}>
      <img
        src={item.imageUrl || fallback}
        alt=""
        width="112"
        height="112"
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = fallback;
        }}
      />
      <div className="catalog-v2-cart__line-body">
        <div>
          <p className="catalog-v2-cart__presentation">{item.presentationName}</p>
          {options.length > 0 && <p className="catalog-v2-cart__variant">{options.join(' · ')}</p>}
        </div>
        <div className="catalog-v2-cart__line-price">
          <strong>{money(item.unitPrice)} c/u</strong>
          {item.tierLabel && <span>{item.tierLabel}</span>}
          {item.nextTier && (
            <small>
              Agrega {item.nextTier.missing} para pagar {money(item.nextTier.price)}
            </small>
          )}
        </div>
        <div className="catalog-v2-cart__line-actions">
          <div className="catalog-v2-quantity">
            <button
              type="button"
              disabled={item.quantity <= minimum}
              onClick={() => onQuantity(item.key, item.quantity - step)}
              aria-label={`Reducir ${lineLabel}`}
            >
              <Minus size={15} />
            </button>
            <strong>{item.quantity}</strong>
            <button
              type="button"
              disabled={maximum != null && item.quantity + step > maximum}
              onClick={() => onQuantity(item.key, item.quantity + step)}
              aria-label={`Aumentar ${lineLabel}`}
            >
              <Plus size={15} />
            </button>
          </div>
          <strong>{money(item.subtotal)}</strong>
          <button
            type="button"
            className="catalog-v2-cart__remove"
            onClick={() => onRemove(item.key)}
            aria-label={`Eliminar ${lineLabel}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
        {issue && (
          <p className="catalog-v2-cart__issue" role="alert">
            <AlertCircle size={15} />
            {issue.message}
          </p>
        )}
      </div>
    </li>
  );
}

export default function CatalogV2Cart({ open, onClose, cart }) {
  const panelRef = useRef(null);
  const scrollRef = useRef(null);
  const stepTitleRef = useRef(null);
  const [step, setStep] = useState('review');
  const [form, setForm] = useState(readCheckoutDraft);
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [completed, setCompleted] = useState(null);
  const [lastOrderFolio, setLastOrderFolio] = useState(readLastOrderFolio);
  const closeCart = () => {
    if (!submitting) onClose();
  };
  useFocusTrap(panelRef, open, 'first', closeCart);

  useEffect(() => {
    if (!open) {
      setStep('review');
      setCompleted(null);
      setSubmitError('');
      return undefined;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    try {
      window.localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(form));
    } catch {
      // Checkout remains usable without persisted customer data.
    }
  }, [form]);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    stepTitleRef.current?.focus({ preventScroll: true });
  }, [open, step, completed]);

  const issuesByLine = useMemo(
    () => new Map((cart.validation?.issues || []).map((issue) => [
      issue.line - 1,
      issue,
    ])),
    [cart.validation],
  );

  const groups = useMemo(() => groupCatalogCartItems(cart.items), [cart.items]);

  if (!open) return null;

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setSubmitError('');
  };

  const submitOrder = async (event) => {
    event.preventDefault();
    if (step !== 'delivery' || honeypot || submitting) return;

    const formError = getFormError(form);
    if (formError) {
      setSubmitError(formError);
      return;
    }
    if (!navigator.onLine) {
      setSubmitError('Necesitas conexión para confirmar precios y existencia.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    try {
      const validated = await cart.validate();
      if (!validated.valid) {
        setStep('review');
        throw new Error('Revisa los artículos marcados antes de confirmar.');
      }

      const customer = {
        nombre: form.nombre.trim(),
        telefono: form.telefono.replace(/\D/g, ''),
        tipoEntrega: form.tipoEntrega,
        direccion: form.tipoEntrega === 'envio' ? form.direccion.trim() : null,
      };
      const pickup = customer.tipoEntrega === 'tienda' ? SUCURSALES.find(({ id }) => id === form.pickupId) : null;
      const fingerprint = getCatalogCartFingerprint(cart.items, { ...customer, locationSlug: pickup?.id });
      const request = { ...customer, items: cart.items, idempotencyKey: getOrderAttempt(fingerprint) };
      let order;

      if (pickup) {
        order = await createOrder({ ...request, locationSlug: pickup.id });
      } else {
        const locations = [null, ...SUCURSALES.map(({ id }) => id)];
        for (const locationSlug of locations) {
          try {
            order = await createOrder({ ...request, locationSlug });
            break;
          } catch (error) {
            if (error.type !== CATALOG_ERROR_TYPES.OUT_OF_STOCK || locationSlug === locations.at(-1)) throw error;
          }
        }
      }
      if (!order?.folio) throw new Error('No pudimos confirmar el folio. Inténtalo de nuevo.');

      const whatsappUrl = generarMensajeWhatsAppCatalogoV2(
        validated.lines,
        order.total,
        {
          tipo: customer.tipoEntrega,
          nombre: customer.nombre,
          telefono: customer.telefono,
          direccion: customer.direccion,
          sucursal: pickup?.nombre,
          folio: order.folio,
        },
      );

      saveLastOrderFolio(order.folio);
      setLastOrderFolio(order.folio);
      clearOrderAttempt();
      cart.clear();
      setCompleted({
        folio: order.folio,
        total: order.total,
        whatsappUrl,
      });
    } catch (error) {
      if (error.type === CATALOG_ERROR_TYPES.OUT_OF_STOCK) {
        setSubmitError(form.tipoEntrega === 'tienda'
          ? 'No hay suficiente existencia para todo el pedido en esa sucursal. Elige otra o ajusta las cantidades.'
          : 'No hay existencia para surtir todo el pedido. Vuelve a tus productos y ajusta las cantidades.');
      } else {
        setSubmitError(error?.message || 'No pudimos registrar el pedido.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="catalog-v2-cart" role="dialog" aria-modal="true" aria-label="Mi pedido">
      <button
        type="button"
        className="catalog-v2-cart__backdrop"
        onClick={closeCart}
        aria-label="Cerrar pedido"
        tabIndex={-1}
      />
      <section ref={panelRef} className="catalog-v2-cart__panel" tabIndex="-1">
        <header className="catalog-v2-cart__header">
          <div>
            <span><ShoppingBag size={18} /></span>
            <div>
              <h2>Mi pedido</h2>
            </div>
          </div>
          <button type="button" className="catalog-v2-icon-button" onClick={closeCart} aria-label="Cerrar">
            <X size={20} />
          </button>
        </header>

        {completed ? (
          <div className="catalog-v2-cart__success">
            <span><CheckCircle2 size={32} /></span>
            <p>Pedido registrado</p>
            <h2 ref={stepTitleRef} tabIndex={-1}>{completed.folio}</h2>
            <strong>{money(completed.total)}</strong>
            <p>
              Guarda tu folio. Si quieres avisar a la sucursal, abre WhatsApp y envía el mensaje preparado.
            </p>
            <a className="catalog-v2-cart__whatsapp" href={completed.whatsappUrl} target="_blank" rel="noopener noreferrer">
              Abrir WhatsApp
            </a>
            <OrderTrackingLink folio={completed.folio}>Ver estado del pedido</OrderTrackingLink>
            <button type="button" onClick={closeCart}>Seguir comprando</button>
          </div>
        ) : cart.items.length === 0 ? (
          <div className="catalog-v2-cart__empty">
            <span><ShoppingBag size={28} /></span>
            <h2>Tu pedido está vacío</h2>
            <p>Agrega algún producto del catálogo para empezar.</p>
            <button type="button" onClick={closeCart}>Explorar productos</button>
            {lastOrderFolio && <OrderTrackingLink folio={lastOrderFolio}>Ver mi último pedido</OrderTrackingLink>}
          </div>
        ) : (
          <form onSubmit={submitOrder}>
            <div ref={scrollRef} className="catalog-v2-cart__scroll">
              {step === 'review' && cart.legacyCartDetected && (
                <div className="catalog-v2-cart__legacy">
                  <AlertCircle size={18} />
                  <p>Los artículos de un pedido anterior deben volver a agregarse desde el catálogo.</p>
                  <button type="button" onClick={cart.dismissLegacyCart}>Entendido</button>
                </div>
              )}

              {step === 'review' ? (
                <section className="catalog-v2-cart__items" aria-labelledby="catalog-cart-review-title">
                  <div className="catalog-v2-cart__step-heading">
                    <p>Paso 1 de 2</p>
                    <h2 ref={stepTitleRef} id="catalog-cart-review-title" tabIndex={-1}>Revisa tus productos</h2>
                  </div>
                  {groups.map(({ product, lines }) => (
                    <section key={product.productId} className="catalog-v2-cart__group" aria-label={product.productName}>
                      <h3>{product.productName}</h3>
                      <ul>
                        {lines.map(({ item, index }) => (
                          <CartLine
                            key={item.key}
                            item={item}
                            issue={issuesByLine.get(index)}
                            onQuantity={cart.setQuantity}
                            onRemove={cart.removeItem}
                          />
                        ))}
                      </ul>
                    </section>
                  ))}
                </section>
              ) : (
                <section className="catalog-v2-checkout" aria-labelledby="catalog-checkout-title">
                  <div className="catalog-v2-cart__step-heading">
                    <p>Paso 2 de 2</p>
                    <h2 ref={stepTitleRef} id="catalog-checkout-title" tabIndex={-1}>Tus datos y entrega</h2>
                  </div>

                  <label>
                    <span>Nombre completo</span>
                    <input
                      type="text"
                      autoComplete="name"
                      maxLength="120"
                      value={form.nombre}
                      onChange={(event) => updateForm('nombre', event.target.value)}
                      required
                    />
                  </label>
                  <label>
                    <span>Teléfono de WhatsApp</span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      maxLength="16"
                      value={form.telefono}
                      onChange={(event) => updateForm('telefono', event.target.value)}
                      placeholder="452 123 4567"
                      required
                    />
                  </label>

                  <fieldset>
                    <legend>Forma de entrega</legend>
                    <div className="catalog-v2-checkout__delivery">
                      <label className={form.tipoEntrega === 'tienda' ? 'is-selected' : ''}>
                        <input
                          type="radio"
                          name="delivery"
                          value="tienda"
                          checked={form.tipoEntrega === 'tienda'}
                          onChange={() => updateForm('tipoEntrega', 'tienda')}
                        />
                        <strong>Recoger en tienda</strong>
                        <span>La sucursal confirma por WhatsApp</span>
                      </label>
                      <label className={form.tipoEntrega === 'envio' ? 'is-selected' : ''}>
                        <input
                          type="radio"
                          name="delivery"
                          value="envio"
                          checked={form.tipoEntrega === 'envio'}
                          onChange={() => updateForm('tipoEntrega', 'envio')}
                        />
                        <strong>Envío a domicilio</strong>
                        <span>El costo se confirma por WhatsApp</span>
                      </label>
                    </div>
                  </fieldset>

                  {form.tipoEntrega === 'tienda' && (
                    <label>
                      <span>Sucursal para recoger</span>
                      <select className="catalog-v2-checkout__branch" value={form.pickupId} onChange={(event) => updateForm('pickupId', event.target.value)}>
                        {SUCURSALES.map(({ id, nombre }) => <option key={id} value={id}>{nombre}</option>)}
                      </select>
                    </label>
                  )}

                  {form.tipoEntrega === 'envio' && (
                    <label>
                      <span>Dirección completa</span>
                      <textarea
                        rows="3"
                        maxLength="500"
                        value={form.direccion}
                        onChange={(event) => updateForm('direccion', event.target.value)}
                        required
                      />
                    </label>
                  )}

                  <label className="catalog-v2-checkout__honeypot" aria-hidden="true">
                    Sitio web
                    <input
                      type="text"
                      tabIndex="-1"
                      autoComplete="off"
                      value={honeypot}
                      onChange={(event) => setHoneypot(event.target.value)}
                    />
                  </label>
                </section>
              )}
            </div>

            <footer className="catalog-v2-cart__footer">
              {submitError && (
                <p className="catalog-v2-cart__submit-error" role="alert">
                  <AlertCircle size={16} />
                  {submitError}
                </p>
              )}
              <div>
                <span>Total estimado</span>
                <strong>{money(cart.total)}</strong>
              </div>
              {step === 'review' ? (
                <button type="button" className="catalog-v2-primary-button" onClick={() => {
                  setSubmitError('');
                  setStep('delivery');
                }}>
                  Continuar a mis datos
                </button>
              ) : (
                <>
                  <small>Revisaremos el precio y la existencia antes de registrar tu pedido.</small>
                  <button type="submit" className="catalog-v2-primary-button" disabled={submitting || cart.validating}>
                    {submitting || cart.validating ? 'Registrando…' : 'Registrar pedido'}
                  </button>
                  <button type="button" className="catalog-v2-cart__back-link" disabled={submitting} onClick={() => {
                    setSubmitError('');
                    setStep('review');
                  }}>
                    Volver a mis productos
                  </button>
                </>
              )}
            </footer>
          </form>
        )}
      </section>
    </div>
  );
}

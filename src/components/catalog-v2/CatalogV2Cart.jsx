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

import { useFocusTrap } from '../../hooks/useFocusTrap.js';
import { createOrder } from '../../services/catalog/ordersRepository.js';
import { getCatalogCartFingerprint } from '../../services/catalog/cart.js';
import { validarTelefonoMX } from '../../utils/validarTelefono.js';
import { generarMensajeWhatsAppCatalogoV2 } from '../../utils/whatsapp.js';
import { getInlineProductPlaceholder } from '../../utils/imagenes.js';

const CHECKOUT_STORAGE_KEY = 'fullPartyCatalogCheckoutV2';
const ORDER_ATTEMPT_STORAGE_KEY = 'fullPartyCatalogOrderAttemptV2';

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
    };
  } catch {
    return {
      nombre: '',
      telefono: '',
      tipoEntrega: 'tienda',
      direccion: '',
    };
  }
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

  return (
    <article className={`catalog-v2-cart__line ${issue ? 'has-issue' : ''}`}>
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
          <span>{item.brandName || 'Full Party'}</span>
          <h3>{item.productName}</h3>
          <p>
            {[item.lineName, item.colorName, item.sizeName]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <small>{item.presentationName}</small>
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
              onClick={() => onQuantity(
                item.key,
                item.quantity <= minimum ? 0 : item.quantity - step,
              )}
              aria-label={`Reducir ${item.productName}`}
            >
              <Minus size={15} />
            </button>
            <strong>{item.quantity}</strong>
            <button
              type="button"
              onClick={() => onQuantity(item.key, item.quantity + step)}
              aria-label={`Aumentar ${item.productName}`}
            >
              <Plus size={15} />
            </button>
          </div>
          <strong>{money(item.subtotal)}</strong>
          <button
            type="button"
            className="catalog-v2-cart__remove"
            onClick={() => onRemove(item.key)}
            aria-label={`Eliminar ${item.productName}`}
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
    </article>
  );
}

export default function CatalogV2Cart({ open, onClose, cart }) {
  const panelRef = useRef(null);
  const [form, setForm] = useState(readCheckoutDraft);
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [completed, setCompleted] = useState(null);
  useFocusTrap(panelRef, open, 'first', onClose);

  useEffect(() => {
    if (!open) {
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

  const issuesByLine = useMemo(
    () => new Map((cart.validation?.issues || []).map((issue) => [
      issue.line - 1,
      issue,
    ])),
    [cart.validation],
  );

  if (!open) return null;

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setSubmitError('');
  };

  const submitOrder = async (event) => {
    event.preventDefault();
    if (honeypot) return;

    const formError = getFormError(form);
    if (formError) {
      setSubmitError(formError);
      return;
    }
    if (!navigator.onLine) {
      setSubmitError('Necesitas conexión para confirmar precios y existencia.');
      return;
    }

    const whatsappWindow = window.open('about:blank', '_blank');
    if (whatsappWindow) {
      whatsappWindow.opener = null;
      whatsappWindow.document.title = 'Preparando tu pedido';
      whatsappWindow.document.body.textContent = 'Confirmando precio y existencia...';
    }

    setSubmitting(true);
    setSubmitError('');
    try {
      const validated = await cart.validate();
      if (!validated.valid) {
        throw new Error('Revisa los artículos marcados antes de confirmar.');
      }

      const customer = {
        nombre: form.nombre.trim(),
        telefono: form.telefono.replace(/\D/g, ''),
        tipoEntrega: form.tipoEntrega,
        direccion: form.tipoEntrega === 'envio' ? form.direccion.trim() : null,
      };
      const fingerprint = getCatalogCartFingerprint(cart.items, customer);
      const order = await createOrder({
        ...customer,
        items: cart.items,
        idempotencyKey: getOrderAttempt(fingerprint),
      });
      const whatsappUrl = generarMensajeWhatsAppCatalogoV2(
        validated.lines,
        order.total,
        {
          tipo: customer.tipoEntrega,
          nombre: customer.nombre,
          telefono: customer.telefono,
          direccion: customer.direccion,
          folio: order.folio,
        },
      );

      clearOrderAttempt();
      cart.clear();
      setCompleted({
        folio: order.folio,
        total: order.total,
        whatsappUrl,
      });

      if (whatsappWindow && !whatsappWindow.closed) {
        whatsappWindow.location.replace(whatsappUrl);
      }
    } catch (error) {
      if (whatsappWindow && !whatsappWindow.closed) whatsappWindow.close();
      setSubmitError(error?.message || 'No pudimos registrar el pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="catalog-v2-cart" role="dialog" aria-modal="true" aria-label="Mi pedido">
      <button
        type="button"
        className="catalog-v2-cart__backdrop"
        onClick={onClose}
        aria-label="Cerrar pedido"
      />
      <section ref={panelRef} className="catalog-v2-cart__panel" tabIndex="-1">
        <header className="catalog-v2-cart__header">
          <div>
            <span><ShoppingBag size={18} /></span>
            <div>
              <p>Tu selección</p>
              <h2>Mi pedido</h2>
            </div>
          </div>
          <button type="button" className="catalog-v2-icon-button" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </header>

        {completed ? (
          <div className="catalog-v2-cart__success">
            <span><CheckCircle2 size={32} /></span>
            <p>Pedido registrado</p>
            <h2>{completed.folio}</h2>
            <strong>{money(completed.total)}</strong>
            <p>
              Ya reservamos la existencia. Envía el mensaje para que la sucursal
              confirme y prepare tu pedido.
            </p>
            <a href={completed.whatsappUrl} target="_blank" rel="noopener noreferrer">
              Abrir WhatsApp
            </a>
            <button type="button" onClick={onClose}>Seguir comprando</button>
          </div>
        ) : cart.items.length === 0 ? (
          <div className="catalog-v2-cart__empty">
            <span><ShoppingBag size={28} /></span>
            <h2>Tu pedido está vacío</h2>
            <p>Elige una combinación y una presentación para comenzar.</p>
            <button type="button" onClick={onClose}>Explorar productos</button>
          </div>
        ) : (
          <form onSubmit={submitOrder}>
            <div className="catalog-v2-cart__scroll">
              {cart.legacyCartDetected && (
                <div className="catalog-v2-cart__legacy">
                  <AlertCircle size={18} />
                  <p>
                    Encontramos un carrito anterior. No se mezcló porque no
                    contiene variantes ni presentaciones V2.
                  </p>
                  <button type="button" onClick={cart.dismissLegacyCart}>Entendido</button>
                </div>
              )}

              <section className="catalog-v2-cart__items" aria-label="Artículos del pedido">
                {cart.items.map((item, index) => (
                  <CartLine
                    key={item.key}
                    item={item}
                    issue={issuesByLine.get(index)}
                    onQuantity={cart.setQuantity}
                    onRemove={cart.removeItem}
                  />
                ))}
              </section>

              <section className="catalog-v2-checkout" aria-labelledby="catalog-checkout-title">
                <div>
                  <p>Paso final</p>
                  <h2 id="catalog-checkout-title">¿Quién recibe el pedido?</h2>
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
              <small>
                Supabase volverá a validar precio y existencia antes de crear el folio.
              </small>
              <button
                type="submit"
                className="catalog-v2-primary-button"
                disabled={submitting || cart.validating}
              >
                {submitting || cart.validating
                  ? 'Confirmando...'
                  : `Confirmar y enviar · ${money(cart.total)}`}
              </button>
            </footer>
          </form>
        )}
      </section>
    </div>
  );
}

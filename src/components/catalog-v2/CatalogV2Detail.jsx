import {
  Check,
  ChevronLeft,
  Heart,
  Minus,
  PackageX,
  Plus,
  Share2,
  X,
} from 'lucide-react';

import { usePresentationPricing } from '../../hooks/catalog/usePresentationPricing.js';
import { useProductDetail } from '../../hooks/catalog/useProductDetail.js';
import { useVariantSelection } from '../../hooks/catalog/useVariantSelection.js';
import { getInlineProductPlaceholder } from '../../utils/imagenes.js';
import {
  getPresentationDescription,
  resolveInitialLineId,
} from '../../services/catalog/publicCatalogModel.js';
import { getMaximumPurchasableQuantity } from '../../services/catalog/variantSelection.js';

function money(value) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(Number(value) || 0);
}

function OptionGroup({ label, state, onSelect, color = false }) {
  if (!state?.visible) return null;
  return (
    <fieldset className="catalog-v2-detail__options">
      <legend>{label}</legend>
      <div>
        {state.options.map((option) => {
          const selected = option.id === state.value;
          return (
            <button
              type="button"
              key={option.id}
              className={selected ? 'is-selected' : ''}
              onClick={() => onSelect(option.id)}
              aria-pressed={selected}
            >
              {color && (
                <span
                  className="catalog-v2-color-dot"
                  style={{ background: option.hex || '#e5e7eb' }}
                />
              )}
              {option.name}
              {selected && <Check size={13} />}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function CatalogV2Detail({
  slug,
  initialLineSlug,
  cartItems = [],
  favorite,
  onToggleFavorite,
  onAddToCart,
  onClose,
}) {
  const { detail, loading, error, refresh } = useProductDetail(slug);
  const initialLineId = resolveInitialLineId(detail?.variants, initialLineSlug);
  const selection = useVariantSelection(
    detail?.variants,
    initialLineId ? { lineId: initialLineId } : {},
  );

  const product = detail?.product;
  const variant = selection.variant;
  const presentation = selection.presentation;
  const cartQuantity = Math.max(
    0,
    Number(cartItems.find(
      (item) => item.variantId === variant?.id
        && item.salePresentationId === presentation?.id,
    )?.quantity) || 0,
  );
  const availableQuantity = presentation?.availableQuantity == null
    ? null
    : Math.max(0, Math.floor(Number(presentation.availableQuantity) || 0));
  const remainingQuantity = availableQuantity == null
    ? null
    : Math.max(0, availableQuantity - cartQuantity);
  const maximumQuantity = getMaximumPurchasableQuantity(
    presentation,
    remainingQuantity,
  );
  const pricingQuantity = maximumQuantity == null || maximumQuantity === 0
    ? selection.selection.quantity
    : Math.min(selection.selection.quantity, maximumQuantity);
  const price = usePresentationPricing(presentation, pricingQuantity);

  if (!slug) return null;

  const quantity = price.quantity;
  const quantityStep = Math.max(1, Number(presentation?.quantityStep) || 1);
  const minimumQuantity = Math.max(
    1,
    Number(presentation?.minimumOrderQuantity) || 1,
  );
  const image = variant?.image_url
    || product?.mainImageUrl
    || getInlineProductPlaceholder(product?.name || 'Producto');
  const sourceOutOfStock = presentation?.inStock === false || availableQuantity === 0;
  const cartUsesAllStock = availableQuantity != null
    && availableQuantity > 0
    && remainingQuantity === 0;
  const stockBelowMinimum = maximumQuantity === 0
    && !sourceOutOfStock
    && !cartUsesAllStock;
  const stockUnavailable = selection.complete
    && (sourceOutOfStock || cartUsesAllStock || stockBelowMinimum);
  const canIncreaseQuantity = !stockUnavailable
    && (maximumQuantity == null || quantity + quantityStep <= maximumQuantity);
  const canDecreaseQuantity = !stockUnavailable && quantity > minimumQuantity;
  const canAddToCart = selection.complete
    && Boolean(price.pricing)
    && !price.quantityError
    && !stockUnavailable
    && (remainingQuantity == null || quantity <= remainingQuantity);
  const selectedOptionName = [
    variant?.finish,
    variant?.color_name,
    variant?.size_name,
    variant?.line_name,
  ].find(Boolean);
  const finishValues = new Set(detail?.variants.map((item) => item.finish).filter(Boolean) ?? []);
  const matchingAttributeNames = detail?.attributes
    .filter((attribute) => finishValues.has(attribute.value))
    .map((attribute) => attribute.name)
    .filter(Boolean) ?? [];
  const finishLabel = matchingAttributeNames.length > 0
    && matchingAttributeNames.every((name) => name === matchingAttributeNames[0])
    ? matchingAttributeNames[0]
    : 'Acabado';

  const addToCart = () => {
    if (!canAddToCart) return;
    onAddToCart({
      product,
      variant,
      presentation,
      quantity,
    });
  };

  const shareProduct = async () => {
    const shareData = {
      title: product?.name || 'Producto Full Party',
      url: window.location.href,
    };
    if (navigator.share) {
      await navigator.share(shareData).catch(() => {});
      return;
    }
    await navigator.clipboard?.writeText(shareData.url);
  };

  return (
    <div className="catalog-v2-detail" role="dialog" aria-modal="true" aria-label={product?.name || 'Detalle del producto'}>
      <button type="button" className="catalog-v2-detail__backdrop" onClick={onClose} aria-label="Cerrar detalle" />
      <section className="catalog-v2-detail__panel">
        <div className="catalog-v2-detail__topbar">
          <button type="button" className="catalog-v2-icon-button" onClick={onClose} aria-label="Regresar">
            <ChevronLeft size={21} />
          </button>
          <span>Detalle del producto</span>
          <div>
            {product && (
              <button
                type="button"
                className="catalog-v2-icon-button"
                onClick={shareProduct}
                aria-label="Compartir producto"
              >
                <Share2 size={18} />
              </button>
            )}
            {product && (
              <button
                type="button"
                className="catalog-v2-icon-button"
                onClick={() => onToggleFavorite(product.id)}
                aria-label={favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                aria-pressed={favorite}
              >
                <Heart size={19} fill={favorite ? 'currentColor' : 'none'} />
              </button>
            )}
            <button type="button" className="catalog-v2-icon-button catalog-v2-detail__desktop-close" onClick={onClose} aria-label="Cerrar">
              <X size={20} />
            </button>
          </div>
        </div>

        {loading && (
          <div className="catalog-v2-detail__loading" role="status">
            <span />
            Cargando combinaciones...
          </div>
        )}
        {error && (
          <div className="catalog-v2-detail__error">
            <p>No pudimos cargar este producto.</p>
            <button type="button" onClick={() => refresh()}>Reintentar</button>
          </div>
        )}
        {detail && (
          <div className="catalog-v2-detail__layout">
            <div className="catalog-v2-detail__gallery">
              <div className="catalog-v2-detail__thumbs">
                {[image, ...detail.images.map((item) => item.imageUrl)]
                  .filter(Boolean)
                  .slice(0, 4)
                  .map((item, index) => (
                    <img key={`${item}-${index}`} src={item} alt="" width="80" height="80" />
                  ))}
              </div>
              <div className="catalog-v2-detail__hero">
                <img
                  src={image}
                  alt={product.name}
                  width="760"
                  height="760"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = getInlineProductPlaceholder(product.name);
                  }}
                />
              </div>
            </div>

            <div className="catalog-v2-detail__information">
              <div className="catalog-v2-detail__crumbs">
                {detail.breadcrumb.map((item) => item.name).filter(Boolean).join(' / ')}
              </div>
              {variant && (
                <div className="catalog-v2-detail__selection-tags" aria-label="Selección actual">
                  {[variant.line_name, variant.color_name, variant.size_name, variant.finish]
                    .filter(Boolean)
                    .map((label) => <span key={label}>{label}</span>)}
                </div>
              )}
              {product.brand?.name && <p className="catalog-v2-card__eyebrow">{product.brand.name}</p>}
              <h2>{product.name}</h2>
              {product.shortDescription && <p className="catalog-v2-detail__description">{product.shortDescription}</p>}

              <OptionGroup label="Gama" state={selection.dimensionStates.lineId} onSelect={selection.selectLine} />
              <OptionGroup label="Color" state={selection.dimensionStates.colorId} onSelect={selection.selectColor} color />
              <OptionGroup label="Medida" state={selection.dimensionStates.sizeId} onSelect={selection.selectSize} />
              <OptionGroup label={finishLabel} state={selection.dimensionStates.finish} onSelect={selection.selectFinish} />

              {variant && (
                <fieldset className="catalog-v2-detail__presentations">
                  <legend>¿Cómo deseas comprar?</legend>
                  <div>
                    {selection.presentations.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        className={[
                          item.id === selection.selection.presentationId ? 'is-selected' : '',
                          item.inStock === false ? 'is-out-of-stock' : '',
                        ].filter(Boolean).join(' ')}
                        onClick={() => selection.selectPresentation(item.id)}
                      >
                        <span>{item.name}</span>
                        <small>{getPresentationDescription(item)}</small>
                        <strong>{money(item.basePrice)}</strong>
                        {item.inStock === false && <em>Sin existencia</em>}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              {presentation && (
                <div className="catalog-v2-detail__purchase">
                  <div>
                    <span>Cantidad</span>
                    <div className="catalog-v2-quantity">
                      <button
                        type="button"
                        disabled={!canDecreaseQuantity}
                        onClick={() => selection.setQuantity(quantity - quantityStep)}
                        aria-label="Reducir cantidad"
                      >
                        <Minus size={16} />
                      </button>
                      <strong>{quantity}</strong>
                      <button
                        type="button"
                        disabled={!canIncreaseQuantity}
                        onClick={() => selection.setQuantity(quantity + quantityStep)}
                        aria-label="Aumentar cantidad"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    {remainingQuantity != null && (
                      <small className="catalog-v2-detail__stock-limit">
                        Puedes agregar hasta {maximumQuantity ?? remainingQuantity}
                        {cartQuantity > 0 && ` · ${cartQuantity} en tu pedido`}
                      </small>
                    )}
                  </div>
                  <div className="catalog-v2-detail__price-summary">
                    <span>Precio aplicado</span>
                    <strong>{money(price.pricing?.unitPrice)} c/u</strong>
                    {price.pricing?.nextTier && (
                      <small>
                        Agrega {price.pricing.nextTier.missing} para pagar {money(price.pricing.nextTier.price)} c/u
                      </small>
                    )}
                    <p>Contenido total: {price.pricing?.totalUnits ?? 0} unidades</p>
                  </div>
                </div>
              )}

              {stockUnavailable && (
                <div
                  id="catalog-v2-stock-message"
                  className="catalog-v2-detail__stock-message"
                  role="status"
                >
                  <PackageX size={21} aria-hidden="true" />
                  <div>
                    <strong>
                      {sourceOutOfStock
                        ? 'Esta opción está agotada'
                        : cartUsesAllStock
                          ? 'Ya agregaste toda la existencia'
                          : 'No alcanza para la compra mínima'}
                    </strong>
                    <span>
                      {cartUsesAllStock
                        ? `Ya tienes ${cartQuantity} en tu pedido. Reduce esa cantidad para agregar más aquí.`
                        : stockBelowMinimum
                          ? `Quedan ${remainingQuantity} y la compra mínima es de ${minimumQuantity}.`
                          : selectedOptionName
                            ? `${selectedOptionName} no tiene existencia por el momento. Elige otra opción disponible.`
                            : 'No hay existencia disponible por el momento. Elige otra opción disponible.'}
                    </span>
                  </div>
                </div>
              )}

              <button
                type="button"
                className={[
                  'catalog-v2-primary-button',
                  'catalog-v2-detail__cart-button',
                  stockUnavailable ? 'is-out-of-stock' : '',
                ].filter(Boolean).join(' ')}
                disabled={!canAddToCart}
                aria-describedby={stockUnavailable ? 'catalog-v2-stock-message' : undefined}
                onClick={addToCart}
              >
                {canAddToCart
                  ? `Agregar al pedido · ${money(price.pricing.subtotal)}`
                  : sourceOutOfStock
                    ? 'Agotado'
                    : cartUsesAllStock
                      ? 'Máximo agregado'
                      : stockBelowMinimum
                        ? 'Existencia insuficiente'
                    : 'Completa tus opciones'}
              </button>

              {presentation?.tiers?.length > 0 && (
                <section className="catalog-v2-detail__tiers">
                  <h3>Precios por cantidad</h3>
                  <div>
                    <span>Desde</span><span>Hasta</span><span>Precio</span>
                    <strong>1</strong>
                    <strong>{presentation.tiers[0].minimumQuantity - 1}</strong>
                    <strong>{money(presentation.basePrice)}</strong>
                    {presentation.tiers.map((tier) => (
                      <div key={`${tier.minimumQuantity}-${tier.maximumQuantity ?? 'plus'}`}>
                        <strong>{tier.minimumQuantity}</strong>
                        <strong>{tier.maximumQuantity ?? '+'}</strong>
                        <strong>{money(tier.pricePerPresentation)}</strong>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

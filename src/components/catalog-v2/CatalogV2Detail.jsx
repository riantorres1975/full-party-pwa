import {
  Check,
  ChevronDown,
  ChevronLeft,
  Heart,
  Layers3,
  Minus,
  PackageX,
  Palette,
  Plus,
  Search,
  Share2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { usePresentationPricing } from '../../hooks/catalog/usePresentationPricing.js';
import { useProductDetail } from '../../hooks/catalog/useProductDetail.js';
import { useVariantSelection } from '../../hooks/catalog/useVariantSelection.js';
import { getInlineProductPlaceholder } from '../../utils/imagenes.js';
import {
  getPresentationDescription,
  resolveInitialVariantSelection,
} from '../../services/catalog/publicCatalogModel.js';
import {
  getColorExplorerOptions,
  getMaximumPurchasableQuantity,
} from '../../services/catalog/variantSelection.js';

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
          const unavailable = option.available === false;
          return (
            <button
              type="button"
              key={option.id}
              className={[
                selected ? 'is-selected' : '',
                unavailable ? 'is-unavailable' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => onSelect(option.id)}
              aria-pressed={selected}
              disabled={unavailable && !selected}
            >
              {color && (
                <span
                  className="catalog-v2-color-dot"
                  style={{ background: option.hex || '#e5e7eb' }}
                />
              )}
              {option.name}
              {selected && <Check size={13} />}
              {unavailable && <small>Agotado</small>}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function normalizeColorSearch(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

const COLOR_FILTERS = [
  { id: 'todos', label: 'Todos' },
  { id: 'rosas', label: 'Rosas', keywords: ['rosa', 'fucsia', 'pink', 'coral'] },
  { id: 'azules', label: 'Azules', keywords: ['azul', 'turquesa'] },
  { id: 'verdes', label: 'Verdes', keywords: ['verde'] },
  {
    id: 'neutros',
    label: 'Neutros',
    keywords: [
      'arena', 'beige', 'blanco', 'cafe', 'caqui', 'crema', 'gris',
      'marfil', 'marron', 'negro', 'piel', 'plata',
    ],
  },
];

function getColorFilter(option) {
  const name = normalizeColorSearch(option?.name);
  return COLOR_FILTERS.find((filter) => (
    filter.keywords?.some((keyword) => name.includes(keyword))
  ))?.id ?? 'otros';
}

function getVisualColorOptions({
  options,
  variants,
  lines,
  images,
  selectedLineId,
  selectedSizeId,
  productImage,
}) {
  return options.map((option) => {
    const optionLineId = option.lineId ?? selectedLineId;
    const optionColorId = option.colorId ?? option.id;
    const selectedLine = lines.find((line) => line.id === optionLineId);
    const fallbackImages = new Set(
      [selectedLine?.imageUrl, productImage].filter(Boolean),
    );
    const lineColor = selectedLine?.colors?.find(
      (color) => color.colorId === optionColorId,
    );
    const colorImage = images
      .filter((image) => (
        image.colorId === optionColorId
        && (!optionLineId || image.lineId === optionLineId)
      ))
      .sort((first, second) => first.sortOrder - second.sortOrder)
      .find((image) => image.imageUrl);
    const colorVariants = variants
      .filter((variant) => (
        variant.color_id === optionColorId
        && (!optionLineId || variant.line_id === optionLineId)
      ))
      .sort((first, second) => {
        const score = (variant) => {
          if (variant.size_id === selectedSizeId) return 0;
          if (variant.size_numeric === 12) return 1;
          return 2;
        };
        return score(first) - score(second);
      });
    const imageUrl = [
      colorImage?.imageUrl,
      lineColor?.imageUrl,
      option.imageUrl,
      ...colorVariants.map((variant) => variant.image_url),
    ].find((candidate) => candidate && !fallbackImages.has(candidate))
      || colorImage?.imageUrl
      || null;

    return {
      ...option,
      imageUrl,
      filter: getColorFilter(option),
    };
  });
}

function ColorVisual({ option }) {
  if (option.imageUrl) {
    return (
      <img
        src={option.imageUrl}
        alt=""
        width="180"
        height="180"
        loading="lazy"
        onError={(event) => {
          event.currentTarget.hidden = true;
          event.currentTarget.nextElementSibling?.removeAttribute('hidden');
        }}
      />
    );
  }

  return (
    <span
      className="catalog-v2-detail__color-balloon"
      style={{ '--catalog-option-color': option.hex || '#d8d8df' }}
      aria-hidden="true"
    />
  );
}

function MobileColorOptionGroup({
  state,
  onSelect,
  variants = [],
  lines = [],
  images = [],
  selectedLineId,
  selectedSizeId,
  productImage,
  forceVisual = false,
  showLine = false,
  label = 'Color',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('todos');
  const [draftColorId, setDraftColorId] = useState(null);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  if (!state?.visible) return null;
  if (state.options.length <= 12 && !forceVisual) {
    return <OptionGroup label={label} state={state} onSelect={onSelect} color />;
  }

  const visualOptions = getVisualColorOptions({
    options: state.options,
    variants,
    lines,
    images,
    selectedLineId,
    selectedSizeId,
    productImage,
  });
  const selectedOption = visualOptions.find((option) => option.id === state.value);
  const draftOption = visualOptions.find((option) => option.id === draftColorId);
  const normalizedQuery = normalizeColorSearch(query);
  const availableFilters = COLOR_FILTERS.filter((filter) => (
    filter.id === 'todos'
    || visualOptions.some((option) => option.filter === filter.id)
  ));
  const filteredOptions = visualOptions.filter((option) => (
    (activeFilter === 'todos' || option.filter === activeFilter)
    && (!normalizedQuery || normalizeColorSearch(option.name).includes(normalizedQuery))
  ));

  const closePicker = () => {
    setQuery('');
    setActiveFilter('todos');
    setOpen(false);
  };

  const openPicker = () => {
    setDraftColorId(state.value);
    setQuery('');
    setActiveFilter('todos');
    setOpen(true);
  };

  const confirmColor = () => {
    if (!draftColorId) return;
    onSelect(draftColorId);
    closePicker();
  };

  return (
    <fieldset className={[
      'catalog-v2-detail__options',
      'catalog-v2-detail__color-options',
      forceVisual ? 'is-global' : '',
    ].filter(Boolean).join(' ')}>
      <legend>
        <span>{label}</span>
        <small>
          {state.options.length} {showLine ? 'opciones' : 'colores'}
        </small>
      </legend>

      {!forceVisual && <div className="catalog-v2-detail__color-desktop">
        {state.options.map((option) => {
          const selected = option.id === state.value;
          const unavailable = option.available === false;
          return (
            <button
              type="button"
              key={option.id}
              className={[
                selected ? 'is-selected' : '',
                unavailable ? 'is-unavailable' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => onSelect(option.id)}
              aria-pressed={selected}
              disabled={unavailable && !selected}
            >
              <span
                className="catalog-v2-color-dot"
                style={{ background: option.hex || '#e5e7eb' }}
              />
              {option.name}
              {selected && <Check size={13} />}
              {unavailable && <small>Agotado</small>}
            </button>
          );
        })}
      </div>}

      <div className={[
        'catalog-v2-detail__color-mobile',
        forceVisual ? 'is-global' : '',
      ].filter(Boolean).join(' ')}>
        <button
          type="button"
          className={[
            'catalog-v2-detail__color-summary',
            selectedOption ? 'has-selection' : '',
          ].filter(Boolean).join(' ')}
          onClick={openPicker}
          aria-expanded={open}
          aria-haspopup="dialog"
          data-testid={forceVisual ? 'catalog-v2-global-color-trigger' : undefined}
        >
          <span
            className="catalog-v2-color-dot"
            style={{ background: selectedOption?.hex || '#e5e7eb' }}
          />
          <span>
            <small>{selectedOption ? 'Color elegido' : 'Elige un color'}</small>
            <strong>
              {selectedOption?.name
                || `${state.options.length} ${showLine ? 'opciones' : 'colores disponibles'}`}
            </strong>
            {showLine && selectedOption?.lineName && <em>{selectedOption.lineName}</em>}
          </span>
          <span className="catalog-v2-detail__color-summary-action">
            Ver colores
            <ChevronDown size={16} aria-hidden="true" />
          </span>
        </button>

        {open && typeof document !== 'undefined' && createPortal(
          <div className="catalog-v2-color-sheet">
            <button
              type="button"
              className="catalog-v2-color-sheet__backdrop"
              onClick={closePicker}
              aria-label="Cerrar selector de colores"
            />
            <section
              id="catalog-v2-mobile-color-picker"
              className="catalog-v2-color-sheet__panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="catalog-v2-color-sheet-title"
            >
              <span className="catalog-v2-color-sheet__handle" aria-hidden="true" />
              <header>
                <div>
                  <h3 id="catalog-v2-color-sheet-title">
                    {showLine ? 'Explora por color' : 'Elige un color'}
                  </h3>
                  <p>
                    {state.options.length} {showLine ? 'opciones de color' : 'colores disponibles'}
                    {showLine ? ' entre todas las gamas' : ''}
                  </p>
                </div>
                <button type="button" onClick={closePicker} aria-label="Cerrar">
                  <X size={20} />
                </button>
              </header>

              <label className="catalog-v2-color-sheet__search">
                <Search size={17} aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar color..."
                  aria-label="Buscar color"
                  autoComplete="off"
                  autoFocus
                />
              </label>

              <div className="catalog-v2-color-sheet__filters" aria-label="Familias de color">
                {availableFilters.map((filter) => (
                  <button
                    type="button"
                    key={filter.id}
                    className={activeFilter === filter.id ? 'is-active' : ''}
                    onClick={() => setActiveFilter(filter.id)}
                    aria-pressed={activeFilter === filter.id}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <div className="catalog-v2-color-sheet__scroll">
                {filteredOptions.length > 0 ? (
                  <div className="catalog-v2-color-sheet__grid">
                    {filteredOptions.map((option) => {
                      const selected = option.id === draftColorId;
                      const unavailable = option.available === false;
                      return (
                        <button
                          type="button"
                          key={option.id}
                          className={[
                            selected ? 'is-selected' : '',
                            unavailable ? 'is-unavailable' : '',
                          ].filter(Boolean).join(' ')}
                          onClick={() => setDraftColorId(option.id)}
                          aria-pressed={selected}
                          aria-label={`${option.name}, ${option.imageUrl ? 'fotografía' : 'muestra de color'}`}
                          disabled={unavailable && !selected}
                        >
                          <span className="catalog-v2-color-sheet__visual">
                            <ColorVisual option={option} />
                            {option.imageUrl && (
                              <span
                                hidden
                                className="catalog-v2-detail__color-balloon"
                                style={{ '--catalog-option-color': option.hex || '#d8d8df' }}
                                aria-hidden="true"
                              />
                            )}
                            {selected && (
                              <span className="catalog-v2-color-sheet__check">
                                <Check size={15} />
                              </span>
                            )}
                          </span>
                          <span className="catalog-v2-color-sheet__name">
                            <span
                              className="catalog-v2-color-dot"
                              style={{ background: option.hex || '#e5e7eb' }}
                            />
                            {option.name}
                          </span>
                          {showLine && option.lineName && (
                            <small>
                              {option.lineName} · {option.sizeNames?.length || 0}
                              {' '}
                              {option.sizeNames?.length === 1 ? 'medida' : 'medidas'}
                            </small>
                          )}
                          {!showLine && !option.imageUrl && <small>Muestra de color</small>}
                          {unavailable && (
                            <small className="catalog-v2-color-sheet__unavailable">Agotado</small>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="catalog-v2-color-sheet__empty">
                    No encontramos un color con esos filtros.
                  </p>
                )}
              </div>

              <footer>
                <button
                  type="button"
                  className="catalog-v2-primary-button"
                  disabled={!draftOption}
                  onClick={confirmColor}
                >
                  {draftOption ? `Elegir ${draftOption.name}` : 'Selecciona un color'}
                </button>
              </footer>
            </section>
          </div>,
          document.querySelector('.catalog-v2-shell') ?? document.body,
        )}
      </div>
    </fieldset>
  );
}

export default function CatalogV2Detail({
  slug,
  initialLineSlug,
  initialColorSlug,
  initialSizeName,
  cartItems = [],
  favorite,
  onToggleFavorite,
  onAddToCart,
  onSelectionChange,
  onClose,
}) {
  const { detail, loading, error, refresh } = useProductDetail(slug);
  const [selectionPath, setSelectionPath] = useState(
    initialColorSlug ? 'color' : initialLineSlug ? 'line' : 'color',
  );
  useEffect(() => {
    setSelectionPath(initialColorSlug ? 'color' : initialLineSlug ? 'line' : 'color');
    // La URL cambia al elegir opciones; solo otro producto debe reiniciar este modo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);
  const initialSelection = resolveInitialVariantSelection(detail?.variants, {
    lineSlug: initialLineSlug,
    colorSlug: initialColorSlug,
    sizeName: initialSizeName,
  });
  const selection = useVariantSelection(
    detail?.variants,
    Object.fromEntries(
      Object.entries(initialSelection).filter(([, value]) => Boolean(value)),
    ),
  );

  const product = detail?.product;
  const variant = selection.variant;
  const presentation = selection.presentation;
  const colorExplorerOptions = getColorExplorerOptions(detail?.variants);
  const guidedSelection = colorExplorerOptions.length > 1
    && (selection.dimensionStates.lineId?.options.length ?? 0) > 1;
  const explorerSelectionId = selection.selection.lineId && selection.selection.colorId
    ? `${selection.selection.lineId}:${selection.selection.colorId}`
    : null;
  const selectedLine = detail?.lines.find(
    (line) => line.id === selection.selection.lineId,
  );
  const selectedVariantColor = detail?.variants.find(
    (item) => item.line_id === selection.selection.lineId
      && item.color_id === selection.selection.colorId,
  );
  const selectedSize = detail?.sizes.find(
    (size) => size.id === selection.selection.sizeId,
  );
  useEffect(() => {
    if (!detail || !selection.selection.lineId || !onSelectionChange) return;
    onSelectionChange({
      lineSlug: selectedLine?.slug ?? selectedVariantColor?.line_slug ?? null,
      colorSlug: selectedVariantColor?.color_slug ?? null,
      sizeName: selectedSize?.name ?? null,
    });
  }, [
    detail,
    onSelectionChange,
    selectedLine?.slug,
    selectedSize?.name,
    selectedVariantColor?.color_slug,
    selectedVariantColor?.line_slug,
    selection.selection.lineId,
  ]);
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
  const selectedColorVisual = getVisualColorOptions({
    options: selection.dimensionStates.colorId?.options ?? [],
    variants: detail?.variants ?? [],
    lines: detail?.lines ?? [],
    images: detail?.images ?? [],
    selectedLineId: selection.selection.lineId,
    selectedSizeId: selection.selection.sizeId,
    productImage: product?.mainImageUrl,
  }).find((option) => option.id === selection.selection.colorId);
  const image = variant?.image_url
    || selectedColorVisual?.imageUrl
    || product?.mainImageUrl
    || getInlineProductPlaceholder(product?.name || 'Producto');
  const sourceOutOfStock = presentation?.inStock === false || availableQuantity === 0;
  const cartUsesAllStock = availableQuantity != null
    && availableQuantity > 0
    && remainingQuantity === 0;
  const stockBelowMinimum = Boolean(presentation)
    && maximumQuantity === 0
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

  const selectExplorerColor = (optionId) => {
    const option = colorExplorerOptions.find((item) => item.id === optionId);
    if (!option) return;
    selection.updateSelection({
      lineId: option.lineId,
      colorId: option.colorId,
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

              {guidedSelection ? (
                <section
                  className="catalog-v2-detail__selection-guide"
                  aria-labelledby="catalog-v2-selection-guide-title"
                >
                  <div className="catalog-v2-detail__selection-guide-heading">
                    <div>
                      <span>Te ayudamos a elegir</span>
                      <h3 id="catalog-v2-selection-guide-title">¿Cómo quieres empezar?</h3>
                    </div>
                    <small>Puedes cambiar de opción cuando quieras</small>
                  </div>
                  <div className="catalog-v2-detail__selection-paths" role="group" aria-label="Forma de elegir">
                    <button
                      type="button"
                      className={selectionPath === 'color' ? 'is-selected' : ''}
                      onClick={() => setSelectionPath('color')}
                      aria-pressed={selectionPath === 'color'}
                    >
                      <Palette size={19} aria-hidden="true" />
                      <span>
                        <strong>Elegir por color</strong>
                        <small>Quiero ver fotos y tonos</small>
                      </span>
                      {selectionPath === 'color' && <Check size={15} />}
                    </button>
                    <button
                      type="button"
                      className={selectionPath === 'line' ? 'is-selected' : ''}
                      onClick={() => setSelectionPath('line')}
                      aria-pressed={selectionPath === 'line'}
                    >
                      <Layers3 size={19} aria-hidden="true" />
                      <span>
                        <strong>Conozco la gama</strong>
                        <small>Estándar, Pastel, Retro...</small>
                      </span>
                      {selectionPath === 'line' && <Check size={15} />}
                    </button>
                  </div>

                  {selectionPath === 'color' ? (
                    <MobileColorOptionGroup
                      state={{
                        visible: true,
                        options: colorExplorerOptions,
                        value: explorerSelectionId,
                      }}
                      onSelect={selectExplorerColor}
                      variants={detail.variants}
                      lines={detail.lines}
                      images={detail.images}
                      selectedLineId={null}
                      selectedSizeId={selection.selection.sizeId}
                      productImage={product.mainImageUrl}
                      forceVisual
                      showLine
                      label="Color"
                    />
                  ) : (
                    <>
                      <OptionGroup
                        label="Gama"
                        state={selection.dimensionStates.lineId}
                        onSelect={selection.selectLine}
                      />
                      {selection.selection.lineId ? (
                        <MobileColorOptionGroup
                          state={selection.dimensionStates.colorId}
                          onSelect={selection.selectColor}
                          variants={detail.variants}
                          lines={detail.lines}
                          images={detail.images}
                          selectedLineId={selection.selection.lineId}
                          selectedSizeId={selection.selection.sizeId}
                          productImage={product.mainImageUrl}
                        />
                      ) : (
                        <p className="catalog-v2-detail__selection-hint">
                          Elige una gama para mostrar sus colores.
                        </p>
                      )}
                    </>
                  )}
                </section>
              ) : (
                <>
                  <OptionGroup label="Gama" state={selection.dimensionStates.lineId} onSelect={selection.selectLine} />
                  <MobileColorOptionGroup
                    state={selection.dimensionStates.colorId}
                    onSelect={selection.selectColor}
                    variants={detail.variants}
                    lines={detail.lines}
                    images={detail.images}
                    selectedLineId={selection.selection.lineId}
                    selectedSizeId={selection.selection.sizeId}
                    productImage={product.mainImageUrl}
                  />
                </>
              )}
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

              {variant && (
                <div className="catalog-v2-detail__purchase-cluster">
                  <section className="catalog-v2-detail__choice-summary" aria-live="polite">
                    <span><Check size={17} aria-hidden="true" /></span>
                    <div>
                      <small>Tu elección</small>
                      <strong>
                        {[variant.color_name, variant.size_name].filter(Boolean).join(' · ')}
                      </strong>
                      <p>
                        {[variant.line_name, presentation?.name].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <div>
                      <small>Disponibilidad</small>
                      <strong>
                        {stockUnavailable
                          ? 'No disponible'
                          : remainingQuantity == null
                            ? 'Disponible'
                            : `${remainingQuantity} disponibles`}
                      </strong>
                    </div>
                  </section>

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
                            Máximo {maximumQuantity ?? remainingQuantity}
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
                        <p>{price.pricing?.totalUnits ?? 0} unidades en total</p>
                      </div>
                    </div>
                  )}
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
                <span>
                  {canAddToCart
                    ? `Agregar al pedido · ${money(price.pricing.subtotal)}`
                    : sourceOutOfStock
                      ? 'Agotado'
                      : cartUsesAllStock
                        ? 'Máximo agregado'
                        : stockBelowMinimum
                          ? 'Existencia insuficiente'
                          : 'Completa tus opciones'}
                </span>
                {selection.complete && (
                  <small>
                    {[variant?.color_name, variant?.size_name].filter(Boolean).join(' · ')}
                  </small>
                )}
              </button>

              {presentation?.tiers?.length > 0 && (
                <details className="catalog-v2-detail__tiers">
                  <summary>
                    <span>
                      <h3>Precios por cantidad</h3>
                      <small>
                        Desde {presentation.tiers[0].minimumQuantity}:&nbsp;
                        {money(presentation.tiers[0].pricePerPresentation)} c/u
                      </small>
                    </span>
                    <span>Ver tabla <ChevronDown size={15} aria-hidden="true" /></span>
                  </summary>
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
                </details>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

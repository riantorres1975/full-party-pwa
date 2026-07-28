import { Heart, Layers3, Palette, Ruler } from 'lucide-react';

import { getInlineProductPlaceholder } from '../../utils/imagenes.js';
import {
  buildCardTitle,
  getCardAction,
  getPrimaryPresentationType,
} from '../../services/catalog/publicCatalogModel.js';

function formatMoney(value) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(Number(value) || 0);
}

export default function CatalogV2Card({
  card,
  favorite,
  onToggleFavorite,
  onOpen,
}) {
  const action = getCardAction(card);
  const title = buildCardTitle(card);
  const image = card.imageUrl || getInlineProductPlaceholder(title);
  const sizeLabels = card.sizes.map((size) => size.name).filter(Boolean);
  const presentation = getPrimaryPresentationType(card.presentationTypes);

  return (
    <article className="catalog-v2-card">
      <div className="catalog-v2-card__media">
        <img
          src={image}
          alt={title}
          width="520"
          height="520"
          loading="lazy"
          decoding="async"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = getInlineProductPlaceholder(title);
          }}
        />
        <button
          type="button"
          className="catalog-v2-icon-button catalog-v2-card__favorite"
          onClick={() => onToggleFavorite(card.productId)}
          aria-pressed={favorite}
          aria-label={favorite ? `Quitar ${title} de favoritos` : `Agregar ${title} a favoritos`}
        >
          <Heart size={18} fill={favorite ? 'currentColor' : 'none'} />
        </button>
        <div className="catalog-v2-card__badges">
          {card.isNew && <span className="catalog-v2-badge catalog-v2-badge--pink">Nuevo</span>}
          {card.featured && <span className="catalog-v2-badge">Destacado</span>}
        </div>
      </div>

      <div className="catalog-v2-card__body">
        {(card.brandName || card.lineName) && (
          <p className="catalog-v2-card__eyebrow">
            {[card.brandName, card.lineName].filter(Boolean).join(' · ')}
          </p>
        )}
        <h2>{title}</h2>

        <div className="catalog-v2-card__facts">
          {card.colorCount > 0 && (
            <span><Palette size={14} /> {card.colorCount} colores</span>
          )}
          {sizeLabels.length > 0 && (
            <span><Ruler size={14} /> {sizeLabels.slice(0, 3).join(', ')}</span>
          )}
          <span><Layers3 size={14} /> {presentation}</span>
        </div>

        <div className="catalog-v2-card__price">
          <span>Desde</span>
          <strong>{formatMoney(card.minPrice)}</strong>
        </div>
        <p className="catalog-v2-card__wholesale">Precios especiales por cantidad</p>

        <button
          type="button"
          className="catalog-v2-primary-button"
          disabled={action.disabled}
          onClick={() => onOpen(card)}
        >
          {action.label}
        </button>
      </div>
    </article>
  );
}

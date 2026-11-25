import { Heart } from 'lucide-react';

import { getInlineProductPlaceholder } from '../../utils/imagenes.js';
import {
  buildCardTitle,
  getCardSearchMatch,
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
  searchQuery = '',
  eagerImage = false,
}) {
  const action = getCardAction(card);
  const title = buildCardTitle(card);
  const searchMatch = getCardSearchMatch(card, searchQuery);
  const image = card.imageUrl || getInlineProductPlaceholder(title);
  const presentation = card.presentationTypes.length === 1 ? getPrimaryPresentationType(card.presentationTypes) : null;

  return (
    <article className="catalog-v2-card">
      <div className="catalog-v2-card__media">
        {searchMatch?.colorImageUrl ? (
          <img
            src={searchMatch.colorImageUrl}
            alt={`${title}, ${searchMatch.colorName}`}
            width="520"
            height="520"
            loading={eagerImage ? 'eager' : 'lazy'}
            decoding="async"
            onError={(event) => {
              event.currentTarget.hidden = true;
              event.currentTarget.nextElementSibling?.removeAttribute('hidden');
            }}
          />
        ) : searchMatch?.colorHex ? (
          <div
            className="catalog-v2-card__matched-color"
            style={{ '--catalog-match-color': searchMatch.colorHex }}
            role="img"
            aria-label={`Muestra de ${searchMatch.colorName}`}
          >
            <span />
            <small>{searchMatch.colorName}</small>
          </div>
        ) : (
          <img
            src={image}
            alt={title}
            width="520"
            height="520"
            loading={eagerImage ? 'eager' : 'lazy'}
            decoding="async"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = getInlineProductPlaceholder(title);
            }}
          />
        )}
        {searchMatch?.colorImageUrl && (
          <div
            hidden
            className="catalog-v2-card__matched-color"
            style={{ '--catalog-match-color': searchMatch.colorHex || '#d8d8df' }}
            role="img"
            aria-label={`Muestra de ${searchMatch.colorName}`}
          >
            <span />
            <small>{searchMatch.colorName}</small>
          </div>
        )}
        <div className="catalog-v2-card__badges">
          {card.isNew && <span className="catalog-v2-badge catalog-v2-badge--pink">Nuevo</span>}
          {card.featured && <span className="catalog-v2-badge">Destacado</span>}
        </div>
      </div>
      <button
        type="button"
        className="catalog-v2-icon-button catalog-v2-card__favorite"
        onClick={() => onToggleFavorite(card.productId)}
        aria-pressed={favorite}
        aria-label={favorite ? `Quitar ${title} de favoritos` : `Agregar ${title} a favoritos`}
      >
        <Heart size={18} fill={favorite ? 'currentColor' : 'none'} />
      </button>

      <div className="catalog-v2-card__body">
        {(card.brandName || card.lineName) && (
          <p className="catalog-v2-card__eyebrow">
            {[card.brandName, card.lineName].filter(Boolean).join(' · ')}
          </p>
        )}
        <h2>{title}</h2>

        {searchMatch && (
          <div className="catalog-v2-card__search-match">
            <strong>
              {searchMatch.colorHex && (
                <i style={{ background: searchMatch.colorHex }} aria-hidden="true" />
              )}
              {searchMatch.label}
            </strong>
          </div>
        )}

        <div className="catalog-v2-card__price">
          {card.minPrice != null && action.kind !== 'simple' && <span>Desde</span>}
          <strong>{card.minPrice == null ? 'Precio por confirmar' : formatMoney(card.minPrice)}</strong>
        </div>
        {presentation && <p className="catalog-v2-card__unit">Por {presentation}</p>}

        <button
          type="button"
          className={`catalog-v2-primary-button catalog-v2-card__action ${action.disabled ? 'is-disabled' : ''}`}
          disabled={action.disabled}
          onClick={() => onOpen(card, searchMatch)}
        >
          <span>{searchMatch && !action.disabled ? 'Ver esta combinación' : action.label}</span>
        </button>
      </div>
    </article>
  );
}

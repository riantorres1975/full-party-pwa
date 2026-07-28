import {
  ChevronDown,
  Grid3X3,
  Heart,
  Home,
  Menu,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import CatalogV2Card from '../../components/catalog-v2/CatalogV2Card.jsx';
import CatalogV2Cart from '../../components/catalog-v2/CatalogV2Cart.jsx';
import CatalogV2Detail from '../../components/catalog-v2/CatalogV2Detail.jsx';
import CatalogV2Filters from '../../components/catalog-v2/CatalogV2Filters.jsx';
import {
  useCatalogCart,
  useCatalogCards,
  useCatalogCategories,
  useCatalogCollections,
  useCatalogFacets,
  useCatalogFilters,
} from '../../hooks/catalog/index.js';
import { useToast } from '../../components/ui/ToastProvider.jsx';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useProductPreferences } from '../../hooks/useProductPreferences.js';
import { useCatalogSeo } from '../../contexts/CatalogSeoContext.jsx';
import { resolveCategoryPath } from '../../services/catalog/categoriesRepository.js';
import {
  buildCardProductParams,
  buildCategoryHref,
  closeProductParams,
  getCatalogCategoryPath,
} from '../../services/catalog/publicCatalogModel.js';
import { getInlineProductPlaceholder } from '../../utils/imagenes.js';

const LOGO_COLORS = ['#7c3aed', '#22c55e', '#0ea5e9', '#f43f5e', '#f59e0b'];

function FullPartyLogo() {
  return (
    <a href="/catalogo" className="catalog-v2-logo" aria-label="Full Party, inicio del catálogo">
      <strong>
        {'Full'.split('').map((letter, index) => (
          <span key={`${letter}-${index}`} style={{ color: LOGO_COLORS[index] }}>{letter}</span>
        ))}
        {' Party'.split('').map((letter, index) => (
          <span key={`${letter}-${index}`} style={{ color: LOGO_COLORS[(index + 2) % LOGO_COLORS.length] }}>{letter}</span>
        ))}
      </strong>
      <small>URUAPAN</small>
    </a>
  );
}

function CategoryCircle({ category, onSelect }) {
  const image = category.imageUrl || getInlineProductPlaceholder(category.name);
  return (
    <button type="button" onClick={() => onSelect(category)}>
      <span>
        <img src={image} alt="" width="92" height="92" />
      </span>
      <strong>{category.name}</strong>
    </button>
  );
}

function CardSkeleton() {
  return (
    <div className="catalog-v2-card catalog-v2-card--skeleton" aria-hidden="true">
      <div className="catalog-v2-card__media skeleton-shimmer" />
      <div className="catalog-v2-card__body">
        <span /><span /><span /><span />
      </div>
    </div>
  );
}

export default function CatalogV2Page() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryPath = useMemo(
    () => getCatalogCategoryPath(location.pathname),
    [location.pathname],
  );
  const { setCategoryPresentation } = useCatalogSeo();
  const searchInputRef = useRef(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const cart = useCatalogCart();
  const toast = useToast();
  const { favoriteIds, isFavorite, toggleFavorite, recordViewedProduct } = useProductPreferences();
  const { tree: categories, bySlug, loading: categoriesLoading } = useCatalogCategories();
  const { collections } = useCatalogCollections();

  const pathParts = useMemo(
    () => categoryPath.split('/').map((part) => part.trim()).filter(Boolean),
    [categoryPath],
  );
  const resolvedCategory = useMemo(() => {
    const exact = resolveCategoryPath(bySlug, pathParts);
    if (exact) return exact;
    if (pathParts.length === 1) return bySlug.get(pathParts[0]) ?? null;
    return null;
  }, [bySlug, pathParts]);
  const canonicalCategoryPath = resolvedCategory?.path?.join('/') || '';
  const childCategories = useMemo(
    () => (resolvedCategory?.children ?? [])
      .map((category) => bySlug.get(category.slug) ?? category),
    [bySlug, resolvedCategory],
  );

  const facetContext = useMemo(() => ({
    categorySlug: resolvedCategory?.slug ?? null,
    collectionSlug: searchParams.get('coleccion') || null,
    search: searchParams.get('q') || null,
  }), [resolvedCategory?.slug, searchParams]);
  const { facets, loading: facetsLoading, error: facetsError } = useCatalogFacets(facetContext);
  const catalogFilters = useCatalogFilters({ facetSizes: facets.sizes });
  const [searchDraft, setSearchDraft] = useState(catalogFilters.filters.search);
  const debouncedSearch = useDebounce(searchDraft.trim(), 280);

  const rpcFilters = useMemo(() => ({
    ...catalogFilters.rpcFilters,
    categorySlug: resolvedCategory?.slug ?? null,
  }), [catalogFilters.rpcFilters, resolvedCategory?.slug]);
  const {
    cards,
    total,
    hasMore,
    loading,
    loadingMore,
    error,
    loadMore,
    refresh,
  } = useCatalogCards(rpcFilters);

  const selectedProductSlug = searchParams.get('producto');
  const selectedLineSlug = catalogFilters.filters.lines[0] || null;
  const selectedProductId = cards.find((card) => card.slug === selectedProductSlug)?.productId;

  useEffect(() => {
    if (categoriesLoading || !categoryPath) return;
    if (!resolvedCategory) {
      navigate({ pathname: '/catalogo', search: location.search }, { replace: true });
      return;
    }
    if (canonicalCategoryPath && canonicalCategoryPath !== categoryPath) {
      navigate({
        pathname: `/catalogo/${canonicalCategoryPath}`,
        search: location.search,
      }, { replace: true });
    }
  }, [
    canonicalCategoryPath,
    categoriesLoading,
    categoryPath,
    location.search,
    navigate,
    resolvedCategory,
  ]);

  useEffect(() => {
    setSearchDraft(catalogFilters.filters.search);
  }, [catalogFilters.filters.search]);

  useEffect(() => {
    if (debouncedSearch === catalogFilters.filters.search) return;
    catalogFilters.setFilter('search', debouncedSearch, { replace: true });
  }, [catalogFilters, debouncedSearch]);

  useEffect(() => {
    if (!resolvedCategory) {
      setCategoryPresentation(null);
      return;
    }
    setCategoryPresentation({
      pathname: location.pathname,
      label: resolvedCategory.name,
      description: resolvedCategory.description || '',
      imageUrl: resolvedCategory.imageUrl || '',
      count: total,
      canonicalPath: canonicalCategoryPath,
    });
  }, [
    canonicalCategoryPath,
    location.pathname,
    resolvedCategory,
    setCategoryPresentation,
    total,
  ]);

  useEffect(() => {
    if (selectedProductId) recordViewedProduct(selectedProductId);
  }, [recordViewedProduct, selectedProductId]);

  const visibleCards = useMemo(() => {
    if (!favoritesOnly) return cards;
    const favorites = new Set(favoriteIds);
    return cards.filter((card) => favorites.has(String(card.productId)));
  }, [cards, favoriteIds, favoritesOnly]);

  const pageTitle = favoritesOnly
    ? 'Mis favoritos'
    : resolvedCategory?.name
      || (catalogFilters.filters.collectionSlug
        ? collections.find((item) => item.slug === catalogFilters.filters.collectionSlug)?.name
        : null)
      || 'Catálogo completo';

  const openCard = (card) => {
    setSearchParams(buildCardProductParams(searchParams, card));
  };

  const closeDetail = () => {
    setSearchParams(closeProductParams(searchParams), { replace: true });
  };

  const selectCategory = (category) => {
    setMobileMenuOpen(false);
    navigate(buildCategoryHref(category));
  };

  const selectCollection = (slug) => {
    catalogFilters.setFilter(
      'collectionSlug',
      catalogFilters.filters.collectionSlug === slug ? null : slug,
    );
  };

  const focusSearch = () => {
    setMobileMenuOpen(false);
    requestAnimationFrame(() => searchInputRef.current?.focus());
  };

  const addToCart = (selection) => {
    const result = cart.addSelection(selection);
    if (!result.ok) {
      toast.warning(result.message);
      return;
    }
    toast.success(`${result.item.productName} se agregó a tu pedido.`);
  };

  return (
    <div className="catalog-v2-shell">
      <header className="catalog-v2-header">
        <div className="catalog-v2-header__main">
          <button
            type="button"
            className="catalog-v2-icon-button catalog-v2-header__menu"
            onClick={() => setMobileMenuOpen((current) => !current)}
            aria-label="Abrir categorías"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
          <FullPartyLogo />

          <label className="catalog-v2-search">
            <Search size={18} aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="search"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Buscar productos, marcas, colores, medidas..."
              aria-label="Buscar en el catálogo"
            />
            {searchDraft && (
              <button type="button" onClick={() => setSearchDraft('')} aria-label="Limpiar búsqueda">
                <X size={16} />
              </button>
            )}
          </label>

          <div className="catalog-v2-header__actions">
            <button
              type="button"
              className={favoritesOnly ? 'is-active' : ''}
              onClick={() => setFavoritesOnly((current) => !current)}
              aria-pressed={favoritesOnly}
            >
              <Heart size={18} fill={favoritesOnly ? 'currentColor' : 'none'} />
              <span>Mis favoritos</span>
              {favoriteIds.length > 0 && <small>{favoriteIds.length}</small>}
            </button>
            <button
              type="button"
              className={cartOpen ? 'is-active' : ''}
              onClick={() => setCartOpen(true)}
            >
              <ShoppingBag size={18} />
              <span>Mi pedido</span>
              {cart.quantity > 0 && <small>{cart.quantity}</small>}
            </button>
          </div>
        </div>

        <nav className={`catalog-v2-category-nav ${mobileMenuOpen ? 'is-open' : ''}`} aria-label="Categorías principales">
          <a href="/catalogo" className={!resolvedCategory ? 'is-active' : ''}>Inicio</a>
          {categories.map((category) => (
            <button
              type="button"
              key={category.id}
              className={resolvedCategory?.path?.[0] === category.slug ? 'is-active' : ''}
              onClick={() => selectCategory(category)}
            >
              {category.name}
              {category.children.length > 0 && <ChevronDown size={13} />}
            </button>
          ))}
        </nav>
      </header>

      <main className="catalog-v2-main">
        {!resolvedCategory && !catalogFilters.hasActive && (
          <section className="catalog-v2-discovery" aria-labelledby="catalog-discovery-title">
            <div className="catalog-v2-section-heading">
              <div>
                <p>Encuentra todo para celebrar</p>
                <h1 id="catalog-discovery-title">Categorías principales</h1>
              </div>
              <span>{categories.length} familias para explorar</span>
            </div>
            <div className="catalog-v2-category-circles">
              {categories.map((category) => (
                <CategoryCircle key={category.id} category={category} onSelect={selectCategory} />
              ))}
            </div>

            {collections.length > 0 && (
              <div className="catalog-v2-collections">
                <div className="catalog-v2-section-heading">
                  <div>
                    <p>Compra por evento</p>
                    <h2>Colecciones para cada ocasión</h2>
                  </div>
                </div>
                <div>
                  {collections.slice(0, 8).map((collection) => (
                    <button
                      type="button"
                      key={collection.id}
                      onClick={() => selectCollection(collection.slug)}
                    >
                      <span>{collection.name.slice(0, 1)}</span>
                      <strong>{collection.name}</strong>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <div className="catalog-v2-content">
          <CatalogV2Filters
            facets={facets}
            filters={catalogFilters.filters}
            activeCount={catalogFilters.activeCount}
            onToggle={catalogFilters.toggleFilter}
            onSet={catalogFilters.setFilter}
            onClear={catalogFilters.clearAll}
          />

          <section className="catalog-v2-results" aria-labelledby="catalog-results-title">
            <div className="catalog-v2-breadcrumbs">
              <a href="/catalogo">Inicio</a>
              {resolvedCategory?.path?.map((slug) => {
                const item = bySlug.get(slug);
                return item ? <span key={slug}>/ {item.name}</span> : null;
              })}
            </div>

            <div className="catalog-v2-results__heading">
              <div>
                <p>{resolvedCategory?.parentId ? 'Categoría' : 'Explora Full Party'}</p>
                <h1 id="catalog-results-title">{pageTitle}</h1>
                <span>
                  {favoritesOnly ? visibleCards.length : total} productos agrupados
                </span>
              </div>
              <div>
                <button
                  type="button"
                  className="catalog-v2-mobile-filter-button"
                  onClick={() => setMobileFiltersOpen(true)}
                >
                  <SlidersHorizontal size={16} />
                  Filtros
                  {catalogFilters.activeCount > 0 && <small>{catalogFilters.activeCount}</small>}
                </button>
                <label>
                  <span>Ordenar por</span>
                  <select
                    value={catalogFilters.filters.sort}
                    onChange={(event) => catalogFilters.setFilter('sort', event.target.value)}
                    aria-label="Ordenar productos"
                  >
                    <option value="featured">Destacados</option>
                    <option value="price_asc">Menor precio</option>
                    <option value="price_desc">Mayor precio</option>
                    <option value="name_asc">Nombre A-Z</option>
                  </select>
                </label>
              </div>
            </div>

            {childCategories.length > 0 && (
              <section
                className="catalog-v2-subcategories"
                aria-labelledby="catalog-subcategories-title"
              >
                <div className="catalog-v2-section-heading">
                  <div>
                    <p>Sigue explorando</p>
                    <h2 id="catalog-subcategories-title">
                      Categorías de {resolvedCategory.name}
                    </h2>
                  </div>
                  <span>{childCategories.length} opciones</span>
                </div>
                <div className="catalog-v2-category-circles">
                  {childCategories.map((category) => (
                    <CategoryCircle
                      key={category.id}
                      category={category}
                      onSelect={selectCategory}
                    />
                  ))}
                </div>
              </section>
            )}

            {collections.length > 0 && (
              <div className="catalog-v2-collection-pills" aria-label="Colecciones">
                {collections.slice(0, 7).map((collection) => (
                  <button
                    type="button"
                    key={collection.id}
                    className={catalogFilters.filters.collectionSlug === collection.slug ? 'is-selected' : ''}
                    onClick={() => selectCollection(collection.slug)}
                  >
                    {collection.name}
                  </button>
                ))}
              </div>
            )}

            {catalogFilters.hasActive && (
              <div className="catalog-v2-active-summary">
                <span>{catalogFilters.activeCount} filtros activos</span>
                <button type="button" onClick={catalogFilters.clearAll}>Limpiar filtros</button>
              </div>
            )}

            {(facetsError || error) && (
              <div className="catalog-v2-error" role="alert">
                <div>
                  <strong>No pudimos actualizar el catálogo</strong>
                  <span>Revisa tu conexión e inténtalo nuevamente.</span>
                </div>
                <button type="button" onClick={() => refresh()}>Reintentar</button>
              </div>
            )}

            <div className="catalog-v2-grid" aria-busy={loading || facetsLoading}>
              {loading
                ? Array.from({ length: 8 }, (_, index) => <CardSkeleton key={index} />)
                : visibleCards.map((card) => (
                  <CatalogV2Card
                    key={card.groupKey}
                    card={card}
                    favorite={isFavorite(card.productId)}
                    onToggleFavorite={toggleFavorite}
                    onOpen={openCard}
                  />
                ))}
            </div>

            {!loading && visibleCards.length === 0 && (
              <div className="catalog-v2-empty">
                <span><Search size={24} /></span>
                <h2>{favoritesOnly ? 'Aún no guardas favoritos' : 'No encontramos productos'}</h2>
                <p>Prueba otra categoría, color o término de búsqueda.</p>
                <button type="button" onClick={() => {
                  setFavoritesOnly(false);
                  catalogFilters.clearAll();
                }}>
                  Ver todo el catálogo
                </button>
              </div>
            )}

            {!favoritesOnly && hasMore && (
              <button
                type="button"
                className="catalog-v2-load-more"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Cargando...' : 'Ver más productos'}
              </button>
            )}
          </section>
        </div>
      </main>

      <nav className="catalog-v2-bottom-nav" aria-label="Navegación móvil">
        <button type="button" className={!resolvedCategory && !favoritesOnly ? 'is-active' : ''} onClick={() => navigate('/catalogo')}>
          <Home size={20} /><span>Inicio</span>
        </button>
        <button type="button" onClick={() => setMobileMenuOpen(true)}>
          <Grid3X3 size={20} /><span>Categorías</span>
        </button>
        <button type="button" onClick={focusSearch}>
          <Search size={20} /><span>Buscar</span>
        </button>
        <button type="button" className={favoritesOnly ? 'is-active' : ''} onClick={() => setFavoritesOnly((current) => !current)}>
          <Heart size={20} fill={favoritesOnly ? 'currentColor' : 'none'} /><span>Favoritos</span>
        </button>
        <button
          type="button"
          className={cartOpen ? 'is-active' : ''}
          onClick={() => setCartOpen(true)}
        >
          <ShoppingBag size={20} /><span>Mi pedido</span>
          {cart.quantity > 0 && <small>{cart.quantity}</small>}
        </button>
      </nav>

      <CatalogV2Filters
        mobile
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        facets={facets}
        filters={catalogFilters.filters}
        activeCount={catalogFilters.activeCount}
        onToggle={catalogFilters.toggleFilter}
        onSet={catalogFilters.setFilter}
        onClear={catalogFilters.clearAll}
      />

      <CatalogV2Detail
        slug={selectedProductSlug}
        initialLineSlug={selectedLineSlug}
        favorite={selectedProductId ? isFavorite(selectedProductId) : false}
        onToggleFavorite={toggleFavorite}
        onAddToCart={addToCart}
        onClose={closeDetail}
      />

      <CatalogV2Cart
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
      />
    </div>
  );
}

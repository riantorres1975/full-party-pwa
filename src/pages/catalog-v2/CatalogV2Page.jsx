import {
  Heart,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Link,
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
  buildProductSelectionParams,
  closeProductParams,
  getCatalogCategoryPath,
} from '../../services/catalog/publicCatalogModel.js';
import { getInlineProductPlaceholder } from '../../utils/imagenes.js';

const LOGO_COLORS = ['#7c3aed', '#22c55e', '#0ea5e9', '#f43f5e', '#f59e0b'];

function FullPartyLogo({ onClick }) {
  return (
    <Link to="/catalogo" onClick={onClick} className="catalog-v2-logo" aria-label="Full Party, inicio del catálogo">
      <strong>
        {'Full'.split('').map((letter, index) => (
          <span key={`${letter}-${index}`} style={{ color: LOGO_COLORS[index] }}>{letter}</span>
        ))}
        {' Party'.split('').map((letter, index) => (
          <span key={`${letter}-${index}`} style={{ color: LOGO_COLORS[(index + 2) % LOGO_COLORS.length] }}>{letter}</span>
        ))}
      </strong>
      <small>URUAPAN</small>
    </Link>
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
  const searchEditedRef = useRef(false);
  const detailOriginParamsRef = useRef(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const cart = useCatalogCart();
  const toast = useToast();
  const { favoriteIds, isFavorite, toggleFavorite, recordViewedProduct } = useProductPreferences();
  const { tree: categories, bySlug, loading: categoriesLoading, error: categoriesError, refresh: refreshCategories } = useCatalogCategories();
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
  const { facets, loading: facetsLoading, error: facetsError, refresh: refreshFacets } = useCatalogFacets(facetContext);
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
  const selectedColorSlug = searchParams.get('seleccionColor');
  const selectedSizeName = searchParams.get('seleccionMedida');
  const selectedProductId = cards.find((card) => card.slug === selectedProductSlug)?.productId;

  useEffect(() => {
    if (categoriesLoading || categoriesError || !categoryPath) return;
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
    categoriesError,
    categoryPath,
    location.search,
    navigate,
    resolvedCategory,
  ]);

  useEffect(() => {
    searchEditedRef.current = false;
    setSearchDraft(catalogFilters.filters.search);
  }, [catalogFilters.filters.search]);

  useEffect(() => {
    if (!searchEditedRef.current || debouncedSearch !== searchDraft.trim()) return;
    if (debouncedSearch !== catalogFilters.filters.search) {
      catalogFilters.setFilter('search', debouncedSearch, { replace: true });
    }
  }, [catalogFilters, debouncedSearch, searchDraft]);

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
      || (catalogFilters.filters.search ? `Resultados para «${catalogFilters.filters.search}»` : 'Catálogo completo');
  const visibleTotal = favoritesOnly ? visibleCards.length : total;

  const openCard = (card, searchMatch) => {
    detailOriginParamsRef.current = searchParams.toString();
    setSearchParams(buildCardProductParams(searchParams, card, searchMatch));
  };

  const closeDetail = () => {
    if (detailOriginParamsRef.current !== null) {
      const originParams = detailOriginParamsRef.current;
      detailOriginParamsRef.current = null;
      setSearchParams(new URLSearchParams(originParams), { replace: true });
      return;
    }
    setSearchParams(closeProductParams(searchParams), { replace: true });
  };

  const syncDetailSelection = useCallback((nextSelection) => {
    if (!selectedProductSlug) return;
    setSearchParams(
      (current) => buildProductSelectionParams(current, nextSelection),
      { replace: true },
    );
  }, [selectedProductSlug, setSearchParams]);

  const selectCategory = (category) => {
    const query = searchDraft.trim();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (catalogFilters.filters.sort !== 'featured') params.set('orden', catalogFilters.filters.sort);
    navigate({ pathname: buildCategoryHref(category), search: params.toString() });
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const editSearch = (value) => {
    searchEditedRef.current = true;
    setSearchDraft(value);
  };

  const resetCatalog = () => {
    searchEditedRef.current = false;
    setSearchDraft('');
    setFavoritesOnly(false);
  };

  const retryCatalog = () => {
    if (categoriesError) refreshCategories();
    if (facetsError) refreshFacets();
    if (error) refresh();
  };

  const viewOrderFromProduct = () => {
    closeDetail();
    setCartOpen(true);
  };

  const addToCart = (selection) => {
    const result = cart.addSelection(selection);
    if (!result.ok) {
      toast.warning(result.message);
      return;
    }
    toast.success(result.item.productName, {
      title: 'Agregado a tu pedido',
      actionLabel: 'Ver mi pedido',
      onAction: viewOrderFromProduct,
    });
  };

  return (
    <div className="catalog-v2-shell">
      <header className="catalog-v2-header">
        <div className="catalog-v2-header__main catalog-v2-simple-header">
          <FullPartyLogo onClick={resetCatalog} />
          <form className="catalog-v2-search catalog-v2-simple-search" role="search" onSubmit={(event) => {
            event.preventDefault();
            catalogFilters.setFilter('search', searchDraft.trim(), { replace: true });
            searchInputRef.current?.blur();
          }}>
            <Search size={19} aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="search"
              value={searchDraft}
              onChange={(event) => editSearch(event.target.value)}
              placeholder="Ej. globos rosas"
              aria-label="Buscar en el catálogo"
              maxLength={80}
            />
            {searchDraft && (
              <button type="button" aria-label="Limpiar búsqueda" onClick={() => {
                editSearch('');
                catalogFilters.setFilter('search', '', { replace: true });
                searchInputRef.current?.focus();
              }}>
                <X size={18} aria-hidden="true" />
              </button>
            )}
            <button type="submit" className="catalog-v2-search-submit">Buscar</button>
          </form>
          <button type="button" className="catalog-v2-order-button" onClick={() => setCartOpen(true)}>
            <ShoppingBag size={19} aria-hidden="true" />
            Mi pedido
            {cart.quantity > 0 && <span aria-label={`${cart.quantity} en tu pedido`}>{cart.quantity}</span>}
          </button>
        </div>
      </header>

      <main className="catalog-v2-main">
        <div className="catalog-v2-content catalog-v2-content--simple">
          <section
            className={`catalog-v2-results ${!resolvedCategory && !catalogFilters.hasActive ? 'catalog-v2-results--home' : ''}`}
            aria-labelledby="catalog-results-title"
          >
            <div className="catalog-v2-results__heading">
              <div>
                <h1 id="catalog-results-title">{pageTitle}</h1>
                {!loading && <span aria-live="polite">{visibleTotal} {visibleTotal === 1 ? 'producto' : 'productos'}</span>}
              </div>
            </div>

            <div className="catalog-v2-shopping-tools" aria-label="Opciones del catálogo">
              <div className="catalog-v2-category-picker">
                <label htmlFor="catalog-category-picker">Categoría</label>
                <select
                  id="catalog-category-picker"
                  value={resolvedCategory?.slug ?? ''}
                  disabled={categoriesLoading || categories.length === 0}
                  onChange={(event) => selectCategory(bySlug.get(event.target.value))}
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((category) => category.children.length > 0 ? (
                    <optgroup key={category.slug} label={category.name}>
                      <option value={category.slug}>Todo en {category.name}</option>
                      {Array.from(bySlug.values())
                        .filter((item) => item.path.length > 1 && item.path[0] === category.slug)
                        .map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
                    </optgroup>
                  ) : <option key={category.slug} value={category.slug}>{category.name}</option>)}
                </select>
              </div>

              <button type="button" className="catalog-v2-shopping-tool" aria-haspopup="dialog" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(true)}>
                <SlidersHorizontal size={18} aria-hidden="true" />
                Filtros
                {catalogFilters.activeCount > 0 && <small>{catalogFilters.activeCount}</small>}
              </button>
              <button
                type="button"
                className="catalog-v2-shopping-tool"
                onClick={() => setFavoritesOnly((current) => !current)}
                aria-pressed={favoritesOnly}
              >
                <Heart size={18} fill={favoritesOnly ? 'currentColor' : 'none'} aria-hidden="true" />
                Favoritos
              </button>
            </div>

            {childCategories.length > 0 && !favoritesOnly && !catalogFilters.filters.search && (
              <section className="catalog-v2-subcategories" aria-label={`Más categorías de ${resolvedCategory.name}`}>
                <div className="catalog-v2-category-circles">
                  {childCategories.map((category) => <CategoryCircle key={category.id} category={category} onSelect={selectCategory} />)}
                </div>
              </section>
            )}

            {catalogFilters.hasActive && (
              <div className="catalog-v2-active-summary">
                <span>{catalogFilters.activeCount} filtros activos</span>
                <button type="button" onClick={catalogFilters.clearAll}>Limpiar filtros</button>
              </div>
            )}

            {(facetsError || error || categoriesError) && (
              <div className="catalog-v2-error" role="alert">
                <div>
                  <strong>No pudimos actualizar el catálogo</strong>
                  <span>Revisa tu conexión e inténtalo nuevamente.</span>
                </div>
                <button type="button" onClick={retryCatalog}>Reintentar</button>
              </div>
            )}

            <div className="catalog-v2-grid" aria-busy={loading || facetsLoading}>
              {loading
                ? Array.from({ length: 8 }, (_, index) => <CardSkeleton key={index} />)
                : visibleCards.map((card, index) => (
                  <CatalogV2Card
                    key={card.groupKey}
                    card={card}
                    eagerImage={index < 4}
                    favorite={isFavorite(card.productId)}
                    onToggleFavorite={toggleFavorite}
                    onOpen={openCard}
                    searchQuery={catalogFilters.filters.search}
                  />
                ))}
            </div>

            {!loading && visibleCards.length === 0 && (
              <div className="catalog-v2-empty">
                <span><Search size={24} /></span>
                <h2>{favoritesOnly
                  ? (favoriteIds.length ? 'No encontramos tus favoritos en esta búsqueda' : 'Aún no guardas favoritos')
                  : 'No encontramos productos'}</h2>
                <p>{favoritesOnly && !favoriteIds.length
                  ? 'Toca el corazón de un producto para guardarlo aquí.'
                  : 'Prueba con otra categoría o usa menos filtros.'}</p>
                <button type="button" onClick={() => {
                  resetCatalog();
                  navigate('/catalogo');
                }}>
                  Ver todo el catálogo
                </button>
              </div>
            )}

            {hasMore && (!favoritesOnly || favoriteIds.length > 0) && (
              <button
                type="button"
                className="catalog-v2-load-more"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Cargando…' : favoritesOnly ? 'Buscar más favoritos' : 'Ver más productos'}
              </button>
            )}
          </section>
        </div>
      </main>

      <CatalogV2Filters
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        facets={facets}
        filters={catalogFilters.filters}
        collections={collections}
        activeCount={catalogFilters.activeCount}
        onToggle={catalogFilters.toggleFilter}
        onSet={catalogFilters.setFilter}
        onClear={catalogFilters.clearAll}
      />

      <CatalogV2Detail
        slug={selectedProductSlug}
        initialLineSlug={selectedLineSlug}
        initialColorSlug={selectedColorSlug}
        initialSizeName={selectedSizeName}
        cartItems={cart.items}
        favorite={selectedProductId ? isFavorite(selectedProductId) : false}
        onToggleFavorite={toggleFavorite}
        onAddToCart={addToCart}
        onViewOrder={viewOrderFromProduct}
        onSelectionChange={syncDetailSelection}
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

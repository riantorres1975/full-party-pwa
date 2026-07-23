import { createContext, useContext, useMemo, useState } from 'react';

const CatalogSeoContext = createContext({
  categoryPresentation: null,
  setCategoryPresentation: () => {},
});

export function CatalogSeoProvider({ children }) {
  const [categoryPresentation, setCategoryPresentation] = useState(null);
  const value = useMemo(() => ({
    categoryPresentation,
    setCategoryPresentation,
  }), [categoryPresentation]);

  return (
    <CatalogSeoContext.Provider value={value}>
      {children}
    </CatalogSeoContext.Provider>
  );
}

export function useCatalogSeo() {
  return useContext(CatalogSeoContext);
}

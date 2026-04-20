import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const BreadcrumbContext = createContext();

export function BreadcrumbProvider({ children }) {
  const [breadcrumb, setBreadcrumb] = useState([]);

  const value = useMemo(() => ({
    breadcrumb,
    setBreadcrumb,
  }), [breadcrumb]);

  return (
    <BreadcrumbContext.Provider value={value}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error('useBreadcrumb must be used within BreadcrumbProvider');
  }
  return context.setBreadcrumb;
}

export function useBreadcrumbValue() {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error('useBreadcrumbValue must be used within BreadcrumbProvider');
  }
  return context.breadcrumb;
}

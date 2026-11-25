import { BarChart3, ClipboardList, CreditCard, Home, LayoutGrid, Package, Settings, Users } from 'lucide-react';

export const adminNavigation = [
  { key: 'dashboard', path: '/admin/dashboard', label: 'admin.nav.dashboard', icon: Home, permission: 'reportes.view', group: 'main' },
  { key: 'pedidos', path: '/admin/pedidos', label: 'admin.nav.orders', icon: ClipboardList, permission: 'pedidos.view', group: 'main' },
  { key: 'catalogo', path: '/admin/catalogo', label: 'admin.nav.catalog', icon: LayoutGrid, permission: 'catalogo.view', group: 'catalog' },
  { key: 'inventario', path: '/admin/inventario', label: 'admin.nav.inventory', icon: Package, permission: 'catalogo.view', group: 'catalog' },
  { key: 'clientes', path: '/admin/clientes', label: 'admin.nav.clients', icon: Users, permission: 'clientes.view', group: 'commercial' },
  { key: 'pagos', path: '/admin/pagos', label: 'admin.nav.payments', icon: CreditCard, permission: 'pagos.view', group: 'commercial' },
  { key: 'reportes', path: '/admin/reportes', label: 'admin.nav.reports', icon: BarChart3, permission: 'reportes.view', group: 'analytics' },
  { key: 'usuarios', path: '/admin/usuarios', label: 'admin.nav.users', icon: Users, permission: 'usuarios.view', group: 'settings' },
  { key: 'tienda', path: '/admin/tienda', label: 'admin.nav.store', icon: Settings, permission: 'configuracion.view', group: 'settings' },
];

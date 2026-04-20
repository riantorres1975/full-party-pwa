import { Navigate } from 'react-router-dom';
import { usePermission } from '../../hooks/usePermission';

export default function ProtectedRoute({ permission, children, fallback = '/admin/pedidos' }) {
  const hasPermission = usePermission(permission);

  if (!hasPermission) {
    return <Navigate to={fallback} replace />;
  }

  return children;
}

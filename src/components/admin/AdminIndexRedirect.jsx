import { Navigate } from 'react-router-dom';
import { usePermission } from '../../hooks/usePermission';

export default function AdminIndexRedirect() {
  const canViewReports = usePermission('reportes.view');

  if (canViewReports) {
    return <Navigate to="dashboard" replace />;
  }

  return <Navigate to="pedidos" replace />;
}

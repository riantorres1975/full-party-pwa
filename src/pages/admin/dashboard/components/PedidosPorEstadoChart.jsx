import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from '../../../../hooks/useTheme';
import { useLanguage } from '../../../../hooks/useLanguage';

const ESTADO_COLORS = {
  'Por Surtir': '#ef4444',
  'Armando Pedido': '#eab308',
  'Listo para Entrega': '#06b6d4',
  'Enviado': '#22c55e',
  'Cancelado': '#6b7280',
};

export default function PedidosPorEstadoChart({ data, loading }) {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="h-80 bg-admin-muted rounded-lg animate-pulse" />
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center bg-admin-elevated rounded-lg">
        <p className="text-admin-text-secondary">{t('admin.dashboard.chart.no_data')}</p>
      </div>
    );
  }

  const colors = {
    grid: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    text: isDarkMode ? '#a8a8a8' : '#666',
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload[0]) {
      return (
        <div className="bg-admin-card border border-admin-border rounded p-2 shadow-lg text-xs">
          <p className="font-bold text-admin-text">{payload[0].payload.estado}</p>
          <p style={{ color: payload[0].color }}>
            {payload[0].value} pedidos
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-admin-card border border-admin-border rounded-lg p-4 h-80">
      <h3 className="text-sm font-body font-bold text-admin-text mb-4">
        {t('admin.dashboard.chart.orders_by_status')}
      </h3>
      <ResponsiveContainer width="100%" height="100%" minHeight={300}>
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
          <XAxis
            dataKey="estado"
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fill: colors.text, fontSize: 12 }}
            stroke={colors.grid}
          />
          <YAxis
            tick={{ fill: colors.text, fontSize: 12 }}
            stroke={colors.grid}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={ESTADO_COLORS[entry.estado] || '#666'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

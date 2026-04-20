import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../../../hooks/useTheme';
import { useLanguage } from '../../../../hooks/useLanguage';

export default function VentasChart({ data, loading }) {
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
    line: '#6b35b8', // ink-500
    fill: 'rgba(107, 53, 184, 0.1)',
    grid: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    text: isDarkMode ? '#a8a8a8' : '#666',
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-admin-card border border-admin-border rounded p-2 shadow-lg text-xs">
          <p className="font-bold text-admin-text">{data.fecha}</p>
          <p className="text-ink-500">
            ${data.total.toLocaleString('es-MX')} ({data.pedidos} pedidos)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-admin-card border border-admin-border rounded-lg p-4 h-80">
      <h3 className="text-sm font-body font-bold text-admin-text mb-4">
        {t('admin.dashboard.chart.sales')}
      </h3>
      <ResponsiveContainer width="100%" height="100%" minHeight={300}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
          <XAxis
            dataKey="fecha"
            tick={{ fill: colors.text, fontSize: 12 }}
            stroke={colors.grid}
          />
          <YAxis
            tick={{ fill: colors.text, fontSize: 12 }}
            stroke={colors.grid}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="total"
            stroke={colors.line}
            fill={colors.fill}
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

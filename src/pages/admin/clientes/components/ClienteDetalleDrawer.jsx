import { X, MessageCircle, Edit2, Save } from 'lucide-react';
import { useLanguage } from '../../../../hooks/useLanguage';
import { useEffect, useState } from 'react';
import Can from '../../../../components/auth/Can';
import { useToast } from '../../../../components/ui/ToastProvider';
import { supabase } from '../../../../lib/supabase';
import { validarTelefonoMX } from '../../../../utils/validarTelefono';
import ClienteHistorialPedidos from './ClienteHistorialPedidos';

function normalizarTelefono(telefono = '') {
  return telefono.replace(/\D/g, '');
}

export default function ClienteDetalleDrawer({ cliente, abierto, onClose, pedidos, onPedidoClick, onClienteUpdated }) {
  const { t } = useLanguage();
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editNombre, setEditNombre] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (abierto) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEsc);
      return () => {
        window.removeEventListener('keydown', handleEsc);
        document.body.style.overflow = '';
      };
    }
  }, [abierto, onClose]);

  useEffect(() => {
    if (!cliente) return;
    setEditNombre(cliente.nombre || '');
    setEditTelefono(cliente.telefono || '');
    setIsEditing(false);
    setSavingEdit(false);
  }, [cliente?.id, cliente?.nombre, cliente?.telefono]);

  if (!abierto || !cliente) return null;

  const telefonoClienteNorm = normalizarTelefono(cliente.telefono);

  const clientePedidos = pedidos.filter(p =>
    normalizarTelefono(p.cliente_telefono) === telefonoClienteNorm
  );

  const ultimoPedidoConMetodo = clientePedidos
    .filter((pedido) => pedido.estado !== 'Cancelado' && pedido.tipo_entrega)
    .reduce((ultimo, pedido) => {
      if (!ultimo) return pedido;
      return new Date(pedido.created_at) > new Date(ultimo.created_at) ? pedido : ultimo;
    }, null);

  const metodoEntregaActual = ultimoPedidoConMetodo?.tipo_entrega || cliente.metodo_entrega_preferido || null;

  const metodoEntregaLabel = metodoEntregaActual === 'envio'
    ? t('admin.orders.delivery.home')
    : metodoEntregaActual === 'tienda'
      ? t('admin.orders.delivery.pickup')
      : metodoEntregaActual;

  const ticketPromedio = clientePedidos.length > 0
    ? Math.round(cliente.gasto_total / clientePedidos.length)
    : 0;

  const handleWhatsApp = () => {
    const mensaje = encodeURIComponent(
      `Hola ${cliente.nombre}, tienes un pedido en Full Party. ¿Necesitas ayuda?`
    );
    window.open(
      `https://wa.me/${telefonoClienteNorm}?text=${mensaje}`,
      '_blank'
    );
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      setIsEditing(false);
      setEditNombre(cliente.nombre || '');
      setEditTelefono(cliente.telefono || '');
      return;
    }
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    const nombreLimpio = editNombre.trim();
    if (nombreLimpio.length < 2) {
      toast.error(t('clientes.edit.invalidName'));
      return;
    }

    const telefonoLimpio = normalizarTelefono(editTelefono);
    const validacionTelefono = validarTelefonoMX(telefonoLimpio);
    if (!validacionTelefono.valido) {
      toast.error(validacionTelefono.error || t('clientes.edit.invalidPhone'));
      return;
    }

    const pedidoIds = pedidos
      .filter((pedido) => normalizarTelefono(pedido.cliente_telefono) === telefonoClienteNorm)
      .map((pedido) => pedido.id)
      .filter(Boolean);

    if (pedidoIds.length === 0) {
      toast.warning(t('clientes.edit.noOrders'));
      return;
    }

    setSavingEdit(true);
    const { error } = await supabase
      .from('pedidos')
      .update({
        cliente_nombre: nombreLimpio,
        cliente_telefono: telefonoLimpio,
      })
      .in('id', pedidoIds);

    if (error) {
      toast.error(`Error: ${error.message}`);
      setSavingEdit(false);
      return;
    }

    onClienteUpdated?.({
      pedidoIds,
      nombre: nombreLimpio,
      telefono: telefonoLimpio,
    });

    toast.success(t('clientes.edit.success', { count: pedidoIds.length }));
    setIsEditing(false);
    setSavingEdit(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-30 lg:hidden"
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-full md:w-96 bg-admin-card border-l border-admin-border shadow-elevated z-40 transform transition-transform duration-300 ${
          abierto ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-admin-border sticky top-0 bg-admin-card z-10">
          <h2 className="text-lg font-body font-bold text-admin-text">
            {cliente.nombre}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-admin-muted transition-colors"
            aria-label={t('common.close')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-4rem)] pb-20">
          {/* Cliente info */}
          <div className="p-4 border-b border-admin-border-soft space-y-3">
            <div>
              <p className="text-xs font-bold text-admin-text-secondary mb-1">
                {t('common.phone')}
              </p>
              <div className="flex items-center justify-between">
                <a
                  href={`tel:${cliente.telefono}`}
                  className="text-sm font-body text-ink-500 hover:underline"
                >
                  {cliente.telefono}
                </a>
                <button
                  onClick={handleWhatsApp}
                  className="p-1.5 rounded bg-green-500 text-white hover:bg-green-600 transition-colors"
                  title="WhatsApp"
                >
                  <MessageCircle size={16} />
                </button>
              </div>
            </div>

            {cliente.email && (
              <div>
                <p className="text-xs font-bold text-admin-text-secondary mb-1">
                  {t('common.email')}
                </p>
                <a
                  href={`mailto:${cliente.email}`}
                  className="text-sm font-body text-ink-500 hover:underline"
                >
                  {cliente.email}
                </a>
              </div>
            )}

            {metodoEntregaActual && (
              <div>
                <p className="text-xs font-bold text-admin-text-secondary mb-1">
                  {t('common.deliveryMethod')}
                </p>
                <p className="text-sm font-body text-admin-text">
                  {metodoEntregaLabel}
                </p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 p-4 border-b border-admin-border-soft">
            <div className="bg-admin-elevated rounded p-3 text-center">
              <p className="text-2xl font-bold text-admin-text">
                {cliente.pedidos_total}
              </p>
              <p className="text-xs font-bold text-admin-text-secondary mt-1">
                {t('clientes.pedidos')}
              </p>
            </div>
            <div className="bg-admin-elevated rounded p-3 text-center">
              <p className="text-2xl font-bold text-admin-text">
                ${ticketPromedio.toLocaleString()}
              </p>
              <p className="text-xs font-bold text-admin-text-secondary mt-1">
                {t('clientes.ticket_promedio')}
              </p>
            </div>
            <div className="bg-admin-elevated rounded p-3 text-center col-span-2">
              <p className="text-lg font-bold text-admin-text">
                ${cliente.gasto_total.toLocaleString('es-MX')}
              </p>
              <p className="text-xs font-bold text-admin-text-secondary mt-1">
                {t('clientes.gasto_total')}
              </p>
            </div>
            <div className="bg-admin-elevated rounded p-3 text-center text-xs col-span-2">
              <p className="text-admin-text">
                {t('clientes.cliente_desde')} {new Date(cliente.primer_pedido).toLocaleDateString('es-MX')}
              </p>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-2 p-4 border-b border-admin-border-soft">
            <Can permission="clientes.edit" fallback={null}>
              <button
                onClick={handleToggleEdit}
                className={`flex-1 px-3 py-2 rounded font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
                  isEditing
                    ? 'bg-admin-input text-admin-text border border-admin-border'
                    : 'bg-admin-elevated text-admin-text hover:bg-admin-muted'
                }`}
              >
                <Edit2 size={16} />
                {isEditing ? t('common.cancel') : t('common.edit')}
              </button>
            </Can>
            <Can permission="pedidos.notify" fallback={null}>
              <button
                onClick={handleWhatsApp}
                className="flex-1 px-3 py-2 rounded bg-green-500 text-white font-bold text-sm hover:bg-green-600 transition-colors"
              >
                {t('clientes.send_message')}
              </button>
            </Can>
          </div>

          {isEditing && (
            <div className="p-4 border-b border-admin-border-soft space-y-3">
              <p className="text-xs font-bold text-admin-text-secondary uppercase tracking-wide">
                {t('clientes.edit.title')}
              </p>

              <div>
                <label className="block text-xs font-bold text-admin-text-secondary mb-1">
                  {t('clientes.nombre')}
                </label>
                <input
                  type="text"
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-admin-input border border-admin-border text-admin-text text-sm outline-none focus:border-fiesta-magenta"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-admin-text-secondary mb-1">
                  {t('common.phone')}
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={editTelefono}
                  onChange={(e) => setEditTelefono(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-admin-input border border-admin-border text-admin-text text-sm outline-none focus:border-fiesta-magenta"
                  maxLength={14}
                />
              </div>

              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="w-full px-3 py-2 rounded-lg bg-fiesta-magenta text-white font-bold text-sm hover:bg-fiesta-magenta/90 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              >
                {savingEdit
                  ? <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  : <Save size={16} />
                }
                {savingEdit ? t('clientes.edit.saving') : t('clientes.edit.save')}
              </button>
            </div>
          )}

          {/* Historial de pedidos */}
          <div className="p-4">
            <h3 className="text-sm font-body font-bold text-admin-text mb-3">
              {t('clientes.order_history')}
            </h3>
            <ClienteHistorialPedidos
              pedidos={clientePedidos}
              onRowClick={onPedidoClick}
            />
          </div>
        </div>
      </div>
    </>
  );
}

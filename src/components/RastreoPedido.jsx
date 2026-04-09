import { useState } from 'react';
import { usePedido } from '../hooks/usePedido';
import { SIMBOLO_MONEDA } from '../data/productos';

// ── Definición de pasos del stepper ─────────────────────────────────────────
const PASOS = [
  {
    estado:    'Por Surtir',
    emoji:     '🛍️',
    label:     'Por Surtir',
    sublabel:  'Pedido recibido',
    color:     '#ef4444',
    colorLight:'#fee2e2',
  },
  {
    estado:    'Armando Pedido',
    emoji:     '🎀',
    label:     'Armando Pedido',
    sublabel:  'Preparando tu pedido',
    color:     '#eab308',
    colorLight:'#fef9c3',
  },
  {
    estado:    'Listo para Entrega',
    emoji:     '🎉',
    label:     'Listo para Entrega',
    sublabel:  '¡Listo para la fiesta!',
    color:     '#22c55e',
    colorLight:'#dcfce7',
  },
];

const ORDEN = PASOS.map(p => p.estado);

function Stepper({ estadoActual }) {
  const indexActual = ORDEN.indexOf(estadoActual);

  return (
    <div className="w-full px-2 pt-2 pb-4">
      <div className="relative flex items-start justify-between">

        {/* Línea de fondo (gris) */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-ink-100 rounded-full mx-[10%]" />

        {/* Línea de progreso (coloreada) */}
        <div
          className="absolute top-5 left-0 h-1 rounded-full mx-[10%] transition-all duration-700"
          style={{
            background: 'linear-gradient(90deg, #ef4444, #eab308, #22c55e)',
            width: indexActual === 0 ? '0%'
                 : indexActual === 1 ? '50%'
                 : '83%',
          }}
        />

        {/* Nodos */}
        {PASOS.map((paso, i) => {
          const completado = i <= indexActual;
          const activo     = i === indexActual;

          return (
            <div key={paso.estado} className="relative flex flex-col items-center z-10" style={{ width: '33%' }}>
              {/* Círculo */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg
                           transition-all duration-500 border-2"
                style={completado
                  ? { background: paso.color, borderColor: paso.color,
                      boxShadow: activo ? `0 0 0 4px ${paso.color}33` : 'none',
                      transform:  activo ? 'scale(1.15)' : 'scale(1)' }
                  : { background: 'var(--surface-muted)', borderColor: 'var(--border-default)' }
                }
              >
                {completado ? paso.emoji : <span className="text-ink-300 text-xs font-black">{i + 1}</span>}
              </div>

              {/* Texto */}
              <p className="mt-2 font-body font-black text-[11px] text-center leading-tight transition-colors"
                 style={{ color: activo ? paso.color : completado ? '#6b35b8' : '#b388e8' }}>
                {paso.label}
              </p>
              {activo && (
                <p className="font-body text-[10px] text-center text-ink-400 mt-0.5 leading-tight">
                  {paso.sublabel}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TarjetaPedido({ pedido }) {
  const [expandido, setExpandido] = useState(false);
  const pasoActual = PASOS.find(p => p.estado === pedido.estado) ?? PASOS[0];
  const fecha = new Date(pedido.created_at).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <div className="bg-white rounded-3xl overflow-hidden animate-fade-in"
         style={{ border: `2px solid ${pasoActual.colorLight}`,
                  boxShadow: `0 4px 20px ${pasoActual.color}15` }}>

      {/* Header tarjeta */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-start justify-between mb-1">
          <div>
            <span className="font-display text-lg text-ink-900">{pedido.folio}</span>
            <p className="text-xs font-body text-ink-400 mt-0.5">{fecha}</p>
          </div>
          <span className="text-xs font-body font-black px-3 py-1.5 rounded-full"
                style={{ background: pasoActual.colorLight, color: pasoActual.color }}>
            {pasoActual.emoji} {pedido.estado}
          </span>
        </div>
        <p className="text-sm font-body font-bold text-ink-700">{pedido.cliente_nombre}</p>
        <p className="text-xs font-body text-ink-400">
          {pedido.tipo_entrega === 'envio' ? '🚚 Envío a domicilio' : '🏪 Recoger en tienda'}
        </p>
      </div>

      {/* Stepper */}
      <div className="px-4 py-2 border-t border-ink-100">
        <Stepper estadoActual={pedido.estado} />
      </div>

      {/* Total + toggle detalles */}
      <div className="px-4 pb-4 flex items-center justify-between border-t border-ink-100 pt-3">
        <span className="font-body font-black text-base"
              style={{ color: pasoActual.color }}>
          {SIMBOLO_MONEDA}{Number(pedido.total).toFixed(2)}
        </span>
        {pedido.detalles_json?.length > 0 && (
          <button
            onClick={() => setExpandido(v => !v)}
            className="text-xs font-body font-bold text-ink-400 hover:text-ink-700
                       underline underline-offset-2 transition-colors">
            {expandido ? 'Ocultar productos ▲' : `Ver ${pedido.detalles_json.length} productos ▼`}
          </button>
        )}
      </div>

      {/* Lista de productos (colapsable) */}
      {expandido && (
        <div className="px-4 pb-4 space-y-2 border-t border-ink-100 pt-3 animate-fade-in">
          {pedido.detalles_json.map((item, i) => (
            <div key={i} className="flex justify-between text-xs font-body text-ink-700">
              <span>{item.nombre} <span className="text-ink-400">×{item.cantidad}</span></span>
              <span className="font-black">{SIMBOLO_MONEDA}{(item.precio * item.cantidad).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function RastreoPedido({ onCerrar }) {
  const [query,    setQuery]   = useState('');
  const [pedidos,  setPedidos] = useState(null); // null = no buscado aún
  const [errorMsg, setErrorMsg] = useState('');
  const [enCooldown, setEnCooldown] = useState(false);
  const { buscarPedido, buscando } = usePedido();

  const handleBuscar = async () => {
    const q = query.trim();
    if (!q || enCooldown) return;

    setEnCooldown(true);
    setTimeout(() => setEnCooldown(false), 3000);

    setErrorMsg('');
    const { pedidos: resultado, error } = await buscarPedido(q);
    if (error) { setErrorMsg('Error al buscar. Intenta de nuevo.'); return; }
    setPedidos(resultado);
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleBuscar(); };

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ background: 'var(--surface-primary)' }}>
      <div className="w-full max-w-xl flex flex-col min-h-screen">

      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          {onCerrar && (
            <button onClick={onCerrar} aria-label="Cerrar modal"
              className="p-2 rounded-full bg-ink-100 hover:bg-ink-200 text-ink-500 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div>
            <h1 className="font-display text-2xl text-ink-900">📦 Rastrear Pedido</h1>
            <p className="text-xs font-body text-ink-400 mt-0.5">Ingresa tu folio o número de teléfono</p>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="flex-shrink-0 px-5 pb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setPedidos(null); setErrorMsg(''); }}
            onKeyDown={handleKeyDown}
            placeholder="FP-1234 o tu teléfono (10 dígitos)"
            className="flex-1 bg-white rounded-2xl px-4 py-3 text-sm font-body font-semibold
                       text-ink-900 placeholder:text-ink-300 outline-none
                       border-2 border-ink-200 focus:border-fiesta-magenta transition-colors"
          />
          <button
            onClick={handleBuscar}
            disabled={!query.trim() || buscando || enCooldown}
            className="px-4 py-3 rounded-2xl text-white font-body font-black text-sm
                       transition-all duration-200 active:scale-95 disabled:opacity-50
                       flex items-center gap-2 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #ff3dac, #a855f7)',
                     boxShadow: '0 4px 14px #ff3dac33' }}
          >
            {buscando
              ? <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              : '🔍'}
            {enCooldown ? 'Espera...' : 'Buscar'}
          </button>
        </div>
        {errorMsg && (
          <p className="text-xs font-body font-bold text-fiesta-magenta mt-2 pl-1">{errorMsg}</p>
        )}
      </div>

      {/* Resultados */}
      <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-4">

        {/* Estado inicial */}
        {pedidos === null && !buscando && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-3 animate-float">🎁</div>
            <p className="font-display text-lg text-ink-500">¿Dónde está tu pedido?</p>
            <p className="text-xs font-body text-ink-400 mt-1 max-w-xs">
              Usa el folio que recibiste por WhatsApp o tu número de teléfono
            </p>
          </div>
        )}

        {/* Sin resultados */}
        {pedidos !== null && pedidos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-3">😔</div>
            <p className="font-display text-lg text-ink-500">No encontramos pedidos</p>
            <p className="text-xs font-body text-ink-400 mt-1">
              Verifica el folio o teléfono e intenta de nuevo
            </p>
          </div>
        )}

        {/* Tarjetas de pedidos */}
        {pedidos?.map(pedido => (
          <TarjetaPedido key={pedido.folio} pedido={pedido} />
        ))}
      </div>
      </div>
    </div>
  );
}

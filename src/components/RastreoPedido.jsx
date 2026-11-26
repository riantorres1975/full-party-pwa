import { ArrowLeft, PackageSearch, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { usePedido } from '../hooks/usePedido';
import { SIMBOLO_MONEDA } from '../data/productos';
import { useLanguage } from '../hooks/useLanguage';

// ── Definición de pasos del stepper ─────────────────────────────────────────
function usePasos(esEnvio) {
  const { t } = useLanguage();
  return [
    {
      estado:    'Por Surtir',
      emoji:     '🛍️',
      label:     t('tracking.status.pending'),
      sublabel:  t('tracking.status.pendingSub'),
      color:     '#ef4444',
      colorLight:'#fee2e2',
    },
    {
      estado:    'Armando Pedido',
      emoji:     '🎀',
      label:     t('tracking.status.preparing'),
      sublabel:  t('tracking.status.preparingSub'),
      color:     '#eab308',
      colorLight:'#fef9c3',
    },
    {
      estado:    'Listo para Entrega',
      emoji:     '🎉',
      label:     t(esEnvio ? 'tracking.status.readyToShip' : 'tracking.status.readyForPickup'),
      sublabel:  t(esEnvio ? 'tracking.status.readyToShipSub' : 'tracking.status.readyForPickupSub'),
      color:     '#22c55e',
      colorLight:'#dcfce7',
    },
    {
      estado:    'Enviado',
      emoji:     esEnvio ? '🚚' : '✅',
      label:     t(esEnvio ? 'tracking.status.shipped' : 'tracking.status.pickedUp'),
      sublabel:  t(esEnvio ? 'tracking.status.shippedSub' : 'tracking.status.pickedUpSub'),
      color:     '#3b82f6',
      colorLight:'#dbeafe',
    },
  ];
}

function Stepper({ estadoActual, pasos }) {
  const { t } = useLanguage();

  if (estadoActual === 'Cancelado') {
    return (
      <div className="w-full px-2 pt-2 pb-4 flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl border-2"
             style={{ background: '#f3f4f6', borderColor: '#d1d5db' }}>
          <span aria-hidden="true">❌</span>
        </div>
        <p className="font-body font-black text-sm text-center" style={{ color: '#6b7280' }}>
          {t('tracking.cancelled')}
        </p>
        <p className="font-body text-[11px] text-center text-ink-400">
          {t('tracking.cancelledDesc')}
        </p>
      </div>
    );
  }

  const indexActual = pasos.findIndex(paso => paso.estado === estadoActual);

  return (
    <div className="w-full px-2 pt-2 pb-4">
      <div className="relative flex items-start justify-between">
        <div className="absolute top-5 left-0 right-0 h-1 bg-ink-100 rounded-full mx-[10%]" />
        <div
          className="absolute top-5 left-0 h-1 rounded-full mx-[10%] transition-all duration-700"
          style={{
            background: 'linear-gradient(90deg, #ef4444, #eab308, #22c55e, #3b82f6)',
            width: indexActual === 0 ? '0%'
                 : indexActual === 1 ? '33%'
                 : indexActual === 2 ? '67%'
                 : '100%',
          }}
        />

        {pasos.map((paso, i) => {
          const completado = i <= indexActual;
          const activo     = i === indexActual;

          return (
            <div key={paso.estado} aria-current={activo ? 'step' : undefined} className="relative flex flex-col items-center z-10" style={{ width: `${100 / pasos.length}%` }}>
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
                {completado ? <span aria-hidden="true">{paso.emoji}</span> : <span className="text-ink-300 text-xs font-black">{i + 1}</span>}
              </div>

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
  const { t } = useLanguage();
  const pasos = usePasos(pedido.tipo_entrega === 'envio');
  const esCancelado = pedido.estado === 'Cancelado';
  const pasoActual = esCancelado
    ? { color: '#6b7280', colorLight: '#f3f4f6', emoji: '❌', label: t('tracking.cancelled') }
    : (pasos.find(paso => paso.estado === pedido.estado) ?? pasos[0]);
  const fecha = new Date(pedido.created_at).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <div className="bg-white rounded-3xl overflow-hidden animate-fade-in"
         style={{ border: `2px solid ${pasoActual.colorLight}`,
                  boxShadow: `0 4px 20px ${pasoActual.color}15` }}>

      <div className="px-4 pt-4 pb-2">
        <div className="flex items-start justify-between mb-1">
          <div>
            <span className="font-display text-lg text-ink-900">{pedido.folio}</span>
            <p className="text-xs font-body text-ink-400 mt-0.5">{fecha}</p>
          </div>
          <span className="text-xs font-body font-black px-3 py-1.5 rounded-full"
                style={{ background: pasoActual.colorLight, color: pasoActual.color }}>
            <span aria-hidden="true">{pasoActual.emoji}</span> {pasoActual.label}
          </span>
        </div>
        <p className="text-sm font-body font-bold text-ink-700">{pedido.cliente_nombre}</p>
        <p className="text-xs font-body text-ink-400">
          {pedido.tipo_entrega === 'envio' ? <><span aria-hidden="true">🚚</span> {t('tracking.shippingHome')}</> : <><span aria-hidden="true">🏪</span> {t('tracking.pickupStore')}</>}
        </p>
      </div>

      <div className="px-4 py-2 border-t border-ink-100">
        <Stepper estadoActual={pedido.estado} pasos={pasos} />
      </div>

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
            {expandido ? t('tracking.hideProducts') : t('tracking.viewProducts', { count: pedido.detalles_json.length })}
          </button>
        )}
      </div>

      {expandido && (
        <div className="px-4 pb-4 space-y-2 border-t border-ink-100 pt-3 animate-fade-in">
          {pedido.detalles_json.map((item, i) => {
            const cantSurtida = Number(item.cantidad_surtida ?? item.cantidad) || 0;
            const cantPedida = Number(item.cantidad) || 0;
            const sinStock = cantSurtida === 0 && item.encontrado === false;
            const parcial = cantSurtida > 0 && cantSurtida < cantPedida;
            const subtotal = (Number(item.precio) || 0) * cantSurtida;

            if (sinStock) {
              return (
                <div key={i} className="flex justify-between text-xs font-body text-ink-400 line-through">
                  <span>{item.nombre} <span>×{cantPedida}</span></span>
                  <span className="font-black">No disponible</span>
                </div>
              );
            }

            return (
              <div key={i} className="flex justify-between text-xs font-body text-ink-700">
                <span>
                  {item.nombre}{' '}
                  <span className="text-ink-400">
                    ×{cantSurtida}
                    {parcial && <span className="text-amber-600"> (pediste {cantPedida})</span>}
                  </span>
                </span>
                <span className="font-black">{SIMBOLO_MONEDA}{subtotal.toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
const TRACKING_MAX_SEARCHES = 10;
const TRACKING_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function checkTrackingRateLimit() {
  try {
    const raw = localStorage.getItem('fp_tracking_ts');
    const timestamps = raw ? JSON.parse(raw) : [];
    const ahora = Date.now();
    const recent = timestamps.filter(t => ahora - t < TRACKING_WINDOW_MS);
    if (recent.length >= TRACKING_MAX_SEARCHES) return false;
    recent.push(ahora);
    localStorage.setItem('fp_tracking_ts', JSON.stringify(recent));
    return true;
  } catch { return true; }
}

export default function RastreoPedido({ onCerrar, initialFolio = '' }) {
  const normalizedInitialFolio = String(initialFolio || '').trim().toUpperCase();
  const [query,    setQuery]   = useState(normalizedInitialFolio);
  const [pedidos,  setPedidos] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [enCooldown, setEnCooldown] = useState(false);
  const searchedInitialFolio = useRef('');
  const { buscarPedido, buscando } = usePedido();
  const { t } = useLanguage();

  const buscarFolio = async (value) => {
    const q = String(value || '').trim().toUpperCase();
    if (!q || enCooldown) return;

    if (!checkTrackingRateLimit()) {
      setErrorMsg(t('tracking.rateLimitError'));
      return;
    }

    setEnCooldown(true);
    setTimeout(() => setEnCooldown(false), 2000);

    setErrorMsg('');
    const { pedidos: resultado, error } = await buscarPedido(q);
    if (error) { setErrorMsg(error); return; }
    setPedidos(resultado);
  };

  useEffect(() => {
    if (!normalizedInitialFolio || searchedInitialFolio.current === normalizedInitialFolio) return;
    searchedInitialFolio.current = normalizedInitialFolio;
    setQuery(normalizedInitialFolio);
    buscarFolio(normalizedInitialFolio);
  }, [normalizedInitialFolio]);

  return (
    <main className="rastreo-container min-h-screen" style={{ background: 'var(--surface-primary)' }}>
      <div className="mx-auto w-full max-w-xl px-5 py-7 sm:py-12">
        <header className="rounded-t-[1.25rem] border border-b-0 border-[color:var(--tracking-border)] bg-[color:var(--tracking-tint)] p-5 sm:p-7">
          {onCerrar && (
            <button
              type="button"
              onClick={onCerrar}
              className="mb-3 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-extrabold text-[color:var(--tracking-accent)] underline underline-offset-4"
            >
              <ArrowLeft size={17} aria-hidden="true" /> {t('tracking.backToCatalog')}
            </button>
          )}
          <h1 className="font-display text-3xl text-ink-900">{t('tracking.title')}</h1>
          <p className="mt-2 text-sm text-[color:var(--tracking-copy)]">{t('tracking.subtitle')}</p>
        </header>

        <form
          className="rounded-b-[1.25rem] border border-[color:var(--tracking-border)] bg-white p-5 sm:p-7"
          onSubmit={(event) => {
            event.preventDefault();
            if (!buscando) buscarFolio(query);
          }}
        >
          <label htmlFor="tracking-folio" className="mb-2 block text-sm font-extrabold text-ink-900">
            {t('tracking.folioLabel')}
          </label>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <input
              id="tracking-folio"
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPedidos(null);
                setErrorMsg('');
              }}
              autoCapitalize="characters"
              autoComplete="off"
              placeholder={t('tracking.placeholder')}
              className="min-w-0 rounded-xl border border-ink-200 bg-white px-3 py-2.5 font-bold text-ink-900 placeholder:text-ink-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tracking-accent)]"
            />
            <button
              type="submit"
              disabled={!query.trim() || buscando || enCooldown}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#8c286f] px-4 py-2.5 text-sm font-black text-white hover:bg-[#71205c] disabled:opacity-60"
            >
              {buscando
                ? <span className="size-4 rounded-full border-2 border-white/40 border-t-white motion-safe:animate-spin" aria-hidden="true" />
                : <Search size={16} aria-hidden="true" />}
              {enCooldown ? t('tracking.wait') : t('common.search')}
            </button>
          </div>
          {errorMsg && (
            <p role="alert" className="mt-3 text-sm font-bold text-[color:var(--tracking-accent)]">{errorMsg}</p>
          )}
        </form>

        <div className="mt-5 space-y-4" aria-live="polite" aria-busy={buscando}>
          {!buscando && !errorMsg && (!pedidos || pedidos.length === 0) && (
            <div className="flex flex-col items-center rounded-2xl border border-[color:var(--tracking-border)] bg-white p-6 text-center">
              <PackageSearch size={30} className="mb-3 text-[color:var(--tracking-accent)]" aria-hidden="true" />
              {pedidos && <p className="mb-1 font-display text-lg text-ink-900">{t('tracking.noResults')}</p>}
              <p className="max-w-xs text-sm text-[color:var(--tracking-copy)]">
                {t(pedidos ? 'tracking.noResultsHint' : 'tracking.initialHint')}
              </p>
            </div>
          )}
          {pedidos?.map((pedido) => <TarjetaPedido key={pedido.folio} pedido={pedido} />)}
        </div>
      </div>
    </main>
  );
}

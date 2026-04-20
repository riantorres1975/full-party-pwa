import { Trash2, Plus } from 'lucide-react';

function generarIdPrecio() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function GestorPrecios({ precios, setPrecios }) {
  const listaPrecios = Array.isArray(precios) ? precios : [];
  const primeraFila = listaPrecios[0] ?? null;
  const primeraCompleta = !!primeraFila &&
    Number(primeraFila.cantidad_minima) > 0 &&
    Number(primeraFila.precio) > 0;

  const normalizarEntero = (valor) => {
    if (valor === '') return '';
    const limpio = String(valor ?? '').replace(/\D+/g, '');
    if (!limpio) return '';
    return Number(limpio.replace(/^0+(?=\d)/, ''));
  };

  const normalizarDecimal = (valor) => {
    if (valor === '') return '';
    const base = String(valor ?? '').replace(',', '.').replace(/[^\d.]/g, '');
    if (!base) return '';

    const [enteroRaw = '0', ...decParts] = base.split('.');
    const entero = enteroRaw.replace(/^0+(?=\d)/, '') || '0';
    const decimal = decParts.join('');
    const compuesto = decimal ? `${entero}.${decimal}` : entero;
    const num = Number(compuesto);
    return Number.isFinite(num) && num >= 0 ? num : '';
  };

  const handleChangePrecio = (id, campo, valor) => {
    setPrecios(prev =>
      prev.map(item => {
        if (item.id !== id) return item;

        if (campo === 'cantidad_minima') {
          return { ...item, cantidad_minima: normalizarEntero(valor) };
        }

        if (campo === 'precio') {
          return { ...item, precio: normalizarDecimal(valor) };
        }

        return { ...item, [campo]: valor };
      })
    );
  };

  const agregarPrecioMayoreo = () => {
    if (!primeraCompleta) return;
    setPrecios(prev => [
      ...prev,
      {
        id: generarIdPrecio(),
        etiqueta: `Precio ${prev.length + 1}`,
        cantidad_minima: '',
        precio: '',
      },
    ]);
  };

  const eliminarPrecio = id => {
    setPrecios(prev => {
      if (prev.length <= 1) return prev;
      const indice = prev.findIndex(item => item.id === id);
      if (indice <= 0) return prev;
      return prev.filter(item => item.id !== id);
    });
  };

  return (
    <section className="col-span-full bg-gray-50 rounded-2xl p-5 border border-gray-100">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="text-sm font-bold text-gray-900">Precios por mayoreo</h4>
          <p className="text-xs font-medium text-gray-500">Define escalas por cantidad para ventas al por mayor.</p>
        </div>
      </div>

      <div className="space-y-3">
        {listaPrecios.map((item, index) => (
          <div
            key={item.id}
            className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr_1fr_auto] gap-2 md:gap-3 items-end bg-white border border-gray-200 rounded-xl p-3 shadow-[0_2px_10px_rgb(0,0,0,0.02)]"
          >
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Etiqueta
              </label>
              <div className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-bold text-gray-600">
                {item.etiqueta || `Precio ${index + 1}`}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Cantidad minima
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={item.cantidad_minima}
                onChange={e => handleChangePrecio(item.id, 'cantidad_minima', e.target.value)}
                onFocus={e => e.target.select()}
                placeholder="Ej. 12"
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Precio por pieza
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={item.precio}
                onChange={e => handleChangePrecio(item.id, 'precio', e.target.value)}
                onFocus={e => e.target.select()}
                placeholder="Ej. 79.90"
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all"
              />
            </div>

            <button
              type="button"
              onClick={() => eliminarPrecio(item.id)}
              disabled={index === 0}
              className="h-10 w-10 inline-flex items-center justify-center rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-red-50 transition-colors"
              title={index === 0 ? 'El primer precio no se puede eliminar' : 'Eliminar precio'}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={agregarPrecioMayoreo}
        disabled={!primeraCompleta}
        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-purple-50"
        title={!primeraCompleta ? 'Completa primero la primera escala (etiqueta, cantidad y precio).' : 'Agregar otra escala de mayoreo'}
      >
        <Plus size={16} />
        Agregar precio de mayoreo
      </button>
    </section>
  );
}

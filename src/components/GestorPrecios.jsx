import { Trash2, Plus } from 'lucide-react';

function generarIdPrecio() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function GestorPrecios({ precios, setPrecios }) {
  const listaPrecios = Array.isArray(precios) ? precios : [];
  const primeraCompleta = listaPrecios.length > 0 && Number(listaPrecios[0]?.precio) > 0;

  const normalizarDecimal = (valor) => {
    if (valor === '') return '';
    const base = String(valor ?? '').replace(',', '.').replace(/[^\d.]/g, '');
    if (!base) return '';
    const [enteroRaw = '0', ...decParts] = base.split('.');
    const entero = enteroRaw.replace(/^0+(?=\d)/, '') || '0';
    const decimal = decParts.join('');
    const num = Number(decimal ? `${entero}.${decimal}` : entero);
    return Number.isFinite(num) && num >= 0 ? num : '';
  };

  const normalizarEntero = (valor) => {
    if (valor === '') return '';
    const limpio = String(valor ?? '').replace(/\D+/g, '');
    if (!limpio) return '';
    return Number(limpio.replace(/^0+(?=\d)/, ''));
  };

  const handleChange = (id, campo, valor) => {
    setPrecios(prev => prev.map(item => {
      if (item.id !== id) return item;
      if (campo === 'cantidad_minima') return { ...item, cantidad_minima: normalizarEntero(valor) };
      if (campo === 'precio') return { ...item, precio: normalizarDecimal(valor) };
      return { ...item, [campo]: valor };
    }));
  };

  const agregar = () => {
    if (!primeraCompleta) return;
    setPrecios(prev => [...prev, {
      id: generarIdPrecio(),
      etiqueta: `Precio ${prev.length + 1}`,
      cantidad_minima: '',
      precio: '',
    }]);
  };

  const eliminar = id => {
    setPrecios(prev => {
      const idx = prev.findIndex(item => item.id === id);
      if (idx <= 0) return prev;
      return prev.filter(item => item.id !== id);
    });
  };

  return (
    <div className="space-y-2">
      {/* Cabecera de columnas */}
      <div className="grid grid-cols-[80px_1fr_1fr_32px] gap-2 px-1">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider"></span>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cant. mínima</span>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Precio / pieza</span>
        <span />
      </div>

      {listaPrecios.map((item, index) => (
        <div key={item.id} className="grid grid-cols-[80px_1fr_1fr_32px] gap-2 items-center">
          {/* Etiqueta */}
          <span className="text-sm font-bold text-gray-600 truncate">
            {item.etiqueta || `Precio ${index + 1}`}
          </span>

          {/* Cantidad mínima */}
          {index === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-400 font-bold">
              1
            </div>
          ) : (
            <input
              type="number"
              min="2"
              step="1"
              value={item.cantidad_minima}
              onChange={e => handleChange(item.id, 'cantidad_minima', e.target.value)}
              onFocus={e => e.target.select()}
              placeholder="Ej. 12"
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all"
            />
          )}

          {/* Precio */}
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={item.precio}
            onChange={e => handleChange(item.id, 'precio', e.target.value)}
            onFocus={e => e.target.select()}
            placeholder="0.00"
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all"
          />

          {/* Eliminar */}
          <button
            type="button"
            onClick={() => eliminar(item.id)}
            disabled={index === 0}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 disabled:pointer-events-none transition-colors"
            title="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={agregar}
        disabled={!primeraCompleta}
        className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-purple-600 hover:text-purple-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Plus size={14} />
        Agregar precio
      </button>
    </div>
  );
}

import { Trash2, Plus } from 'lucide-react';

function generarIdPrecio() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function GestorPrecios({ precios, setPrecios }) {
  const listaPrecios = Array.isArray(precios) ? precios : [];

  const handleChangePrecio = (id, campo, valor) => {
    setPrecios(prev =>
      prev.map(item => {
        if (item.id !== id) return item;

        if (campo === 'cantidad_minima') {
          return { ...item, cantidad_minima: valor === '' ? 0 : Math.max(0, Number(valor)) };
        }

        if (campo === 'precio') {
          return { ...item, precio: valor === '' ? 0 : Math.max(0, Number(valor)) };
        }

        return { ...item, [campo]: valor };
      })
    );
  };

  const agregarPrecioMayoreo = () => {
    setPrecios(prev => [
      ...prev,
      {
        id: generarIdPrecio(),
        etiqueta: '',
        cantidad_minima: 1,
        precio: 0,
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
              <input
                type="text"
                value={item.etiqueta}
                onChange={e => handleChangePrecio(item.id, 'etiqueta', e.target.value)}
                placeholder="Ej. Caja x12"
                maxLength={80}
                className="w-full bg-gray-50 border border-transparent rounded-lg px-3 py-2.5 text-sm font-medium text-gray-800 focus:bg-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all"
              />
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
                className="w-full bg-gray-50 border border-transparent rounded-lg px-3 py-2.5 text-sm font-medium text-gray-800 focus:bg-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all"
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
                className="w-full bg-gray-50 border border-transparent rounded-lg px-3 py-2.5 text-sm font-medium text-gray-800 focus:bg-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all"
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
        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 px-4 py-2.5 text-sm font-bold transition-colors"
      >
        <Plus size={16} />
        + Agregar precio de mayoreo
      </button>
    </section>
  );
}

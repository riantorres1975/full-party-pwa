import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Package, Pencil, Trash2, Search, AlertTriangle, Plus, X, Tag, Check, Bookmark, Ruler, Megaphone, Download, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { guardedQuery } from '../lib/supabaseGuard';
import {
  SIMBOLO_MONEDA,
  registrarCategoria,
  registrarMarca,
  registrarTamano,
} from '../data/productos';
import {
  actualizarDisponibilidadProducto,
  eliminarProducto,
  renameCategoria,
  eliminarCategoria,
  renameMarca,
  eliminarMarca,
  renameTamano,
  eliminarTamano,
} from '../lib/productosAdmin';
import { getConfig, setConfig } from '../lib/configAdmin';
import FormularioNuevoProducto from './FormularioNuevoProducto';
import ModalEditarProducto from './ModalEditarProducto';
import Toggle from './ui/Toggle';
import ConfirmModal from './ui/ConfirmModal';
import { useToast } from './ui/ToastProvider';
import { useConfirm } from '../hooks/useConfirm';
import { useDebounce } from '../hooks/useDebounce';
import { useLanguage } from '../hooks/useLanguage';

function MiniaturaProducto({ url, nombre }) {
  const [fallo, setFallo] = useState(false);
  if (!url || fallo) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Package size={24} className="text-ink-300" />
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={nombre || ''}
      className="w-full h-full object-contain"
      onError={() => setFallo(true)}
    />
  );
}

export default function AdminCatalogo() {
  const toast = useToast();
  const { t } = useLanguage();
  const { isOpen: confirmOpen, config: confirmConfig, confirm: confirmDialog, onConfirm, onCancel } = useConfirm();
  const [creando, setCreando] = useState(false);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorLista, setErrorLista] = useState('');
  const [busquedaInput, setBusquedaInput] = useState('');
  const busqueda = useDebounce(busquedaInput, 300);
  const [filtroActivo, setFiltroActivo] = useState('todos');
  const [editando, setEditando] = useState(null);
  const [toggleId, setToggleId] = useState(null);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [pagina, setPagina] = useState(0);
  const [hayMas, setHayMas] = useState(false);
  const PAGE_SIZE = 100;

  const fetchProductos = useCallback(async (page = 0, append = false) => {
    if (!append) setCargando(true);
    setErrorLista('');
    const from = page * PAGE_SIZE;
    const { data, error, count } = await guardedQuery((client) =>
      client
        .from('productos')
        .select('*', { count: 'exact' })
        .order('nombre', { ascending: true })
        .range(from, from + PAGE_SIZE - 1)
    );

    if (error) {
      setErrorLista(error.message);
      if (!append) setProductos([]);
    } else {
      const lista = data ?? [];
      lista.forEach(p => {
        registrarCategoria(p.categoria);
        registrarMarca(p.marca);
        registrarTamano(p.tamano);
      });
      setProductos(prev => append ? [...prev, ...lista] : lista);
      setHayMas((count ?? 0) > from + PAGE_SIZE);
      setPagina(page);
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  const [showCatMgr, setShowCatMgr] = useState(false);
  const [catEditando, setCatEditando] = useState(null);
  const [catNuevoNombre, setCatNuevoNombre] = useState('');
  const [catGuardando, setCatGuardando] = useState(null);

  const [showMarcaMgr, setShowMarcaMgr] = useState(false);
  const [marcaEditando, setMarcaEditando] = useState(null);
  const [marcaNuevoNombre, setMarcaNuevoNombre] = useState('');
  const [marcaGuardando, setMarcaGuardando] = useState(null);

  const [showTamanoMgr, setShowTamanoMgr] = useState(false);
  const [tamanoEditando, setTamanoEditando] = useState(null);
  const [tamanoNuevoNombre, setTamanoNuevoNombre] = useState('');
  const [tamanoGuardando, setTamanoGuardando] = useState(null);

  // ── Anuncio / Banner ──
  const [showAnuncioEditor, setShowAnuncioEditor] = useState(false);
  const [anuncioMsg, setAnuncioMsg] = useState('');
  const [anuncioActivo, setAnuncioActivo] = useState(false);
  const [anuncioGuardando, setAnuncioGuardando] = useState(false);

  useEffect(() => {
    getConfig('anuncio', { mensaje: '', activo: false }).then(v => {
      setAnuncioMsg(v.mensaje || '');
      setAnuncioActivo(!!v.activo);
    });
  }, []);

  // ── Importar / Exportar ──
  const [importando, setImportando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const CAMPOS_EXPORTABLES = [
    'nombre', 'descripcion', 'precio', 'categoria', 'marca', 'tamano',
    'imagen_url', 'activo', 'stock_ilimitado', 'stock_actual', 'stock_minimo',
    'es_nuevo', 'precios_mayoreo', 'familia_mayoreo',
  ];

  // ── CSV helpers ──
  function escapeCsv(val) {
    if (val == null) return '';
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes(';')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  function parseCsvLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
        else if (ch === '"') { inQuotes = false; }
        else { current += ch; }
      } else {
        if (ch === '"') { inQuotes = true; }
        else if (ch === ',') { result.push(current); current = ''; }
        else { current += ch; }
      }
    }
    result.push(current);
    return result;
  }

  function parseCsv(text) {
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
    if (lines.length < 2) throw new Error('El CSV debe tener al menos un encabezado y una fila de datos.');
    const headers = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase());
    return lines.slice(1).map(line => {
      const vals = parseCsvLine(line);
      const obj = {};
      headers.forEach((h, i) => {
        const v = vals[i]?.trim() ?? '';
        if (v !== '') obj[h] = v;
      });
      return obj;
    });
  }

  function convertCsvRow(raw) {
    const row = {};
    CAMPOS_EXPORTABLES.forEach(k => { if (raw[k] !== undefined) row[k] = raw[k]; });
    // Convertir tipos
    if (row.precio != null) row.precio = Number(row.precio);
    if (row.stock_actual != null) row.stock_actual = Number(row.stock_actual);
    if (row.stock_minimo != null) row.stock_minimo = Number(row.stock_minimo);
    ['activo', 'stock_ilimitado', 'es_nuevo'].forEach(k => {
      if (row[k] != null) {
        const v = String(row[k]).toLowerCase();
        row[k] = v === 'true' || v === '1' || v === 'si' || v === 'sí';
      }
    });
    // precios_mayoreo puede venir como JSON string
    if (typeof row.precios_mayoreo === 'string') {
      try { row.precios_mayoreo = JSON.parse(row.precios_mayoreo); } catch { delete row.precios_mayoreo; }
    }
    return row;
  }

  // ── Exportar ──
  async function fetchAllProductos() {
    const { data, error } = await guardedQuery((client) =>
      client.from('productos').select('*').order('nombre', { ascending: true })
    );
    if (error) throw new Error(error.message);
    return (data ?? []).map(p => {
      const obj = {};
      CAMPOS_EXPORTABLES.forEach(k => { if (p[k] !== undefined) obj[k] = p[k]; });
      return obj;
    });
  }

  function descargarArchivo(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleExportar(formato) {
    setShowExportMenu(false);
    setExportando(true);
    try {
      const exportData = await fetchAllProductos();
      const fecha = new Date().toISOString().slice(0, 10);

      if (formato === 'csv') {
        const header = CAMPOS_EXPORTABLES.join(',');
        const rows = exportData.map(p =>
          CAMPOS_EXPORTABLES.map(k => escapeCsv(p[k])).join(',')
        );
        // BOM for Excel UTF-8 recognition
        const bom = '\uFEFF';
        const blob = new Blob([bom + header + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8' });
        descargarArchivo(blob, `productos_${fecha}.csv`);
      } else {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        descargarArchivo(blob, `productos_${fecha}.json`);
      }

      toast.success(`${exportData.length} artículos exportados (${formato.toUpperCase()})`);
    } catch (err) {
      toast.error(err.message || 'Error al exportar');
    } finally {
      setExportando(false);
    }
  }

  // ── Importar ──
  async function handleImportar(file) {
    if (!file) return;
    setImportando(true);
    try {
      const text = await file.text();
      const esCsv = file.name.toLowerCase().endsWith('.csv');
      let datos;

      if (esCsv) {
        const rawRows = parseCsv(text);
        datos = rawRows.map(convertCsvRow);
      } else {
        try { datos = JSON.parse(text); } catch { throw new Error('El archivo no es un JSON válido.'); }
        if (!Array.isArray(datos)) throw new Error('El JSON debe contener un arreglo de productos.');
      }

      if (datos.length === 0) throw new Error('El archivo está vacío.');

      // Validar campos mínimos
      const invalidos = datos.filter(p => !p.nombre?.trim() || p.precio == null);
      if (invalidos.length > 0) throw new Error(`Hay ${invalidos.length} producto(s) sin nombre o precio.`);

      // Limpiar y preparar rows
      const rows = datos.map(p => {
        const row = {};
        CAMPOS_EXPORTABLES.forEach(k => { if (p[k] !== undefined) row[k] = p[k]; });
        row.nombre = String(row.nombre).trim();
        row.precio = Number(row.precio);
        if (Number.isNaN(row.precio) || row.precio < 0) row.precio = 0;
        if (row.activo === undefined) row.activo = true;
        return row;
      });

      // Insertar en lotes de 50
      const BATCH = 50;
      let insertados = 0;
      for (let i = 0; i < rows.length; i += BATCH) {
        const lote = rows.slice(i, i + BATCH);
        const { error } = await supabase.from('productos').insert(lote);
        if (error) throw new Error(`Error en lote ${Math.floor(i / BATCH) + 1}: ${error.message}`);
        insertados += lote.length;
      }

      toast.success(`${insertados} artículos importados`);
      fetchProductos();
    } catch (err) {
      toast.error(err.message || 'Error al importar');
    } finally {
      setImportando(false);
    }
  }

  const productosEnAlerta = useMemo(() => {
    return productos.filter(p => p.stock_ilimitado === false && p.stock_actual <= (p.stock_minimo || 5));
  }, [productos]);

  const productosNuevos = useMemo(() => {
    return productos.filter(p => p.es_nuevo === true);
  }, [productos]);

  const todasCategorias = useMemo(() => {
    const seen = new Set();
    productos.forEach(p => { if (p.categoria) seen.add(p.categoria); });
    return Array.from(seen).sort();
  }, [productos]);

  const todasMarcas = useMemo(() => {
    const seen = new Set();
    productos.forEach(p => { if (p.marca) seen.add(p.marca); });
    return Array.from(seen).sort();
  }, [productos]);

  const todosTamanos = useMemo(() => {
    const seen = new Set();
    productos.forEach(p => { if (p.tamano) seen.add(p.tamano); });
    return Array.from(seen).sort();
  }, [productos]);

  const filtrados = useMemo(() => {
    let lista = productos;

    if (filtroActivo === 'stock-bajo') {
      lista = productosEnAlerta;
    } else if (filtroActivo === 'nuevo') {
      lista = productosNuevos;
    }

    const q = busqueda.trim().toLowerCase();
    if (!q) return lista;
    
    return lista.filter(p => {
      const n = (p.nombre || '').toLowerCase();
      const m = (p.marca || '').toLowerCase();
      const t = (p.tamano || '').toLowerCase();
      const c = (p.categoria || '').toLowerCase();
      return n.includes(q) || m.includes(q) || t.includes(q) || c.includes(q);
    });
  }, [productos, busqueda, filtroActivo, productosEnAlerta, productosNuevos]);

  async function handleToggleDisponibilidad(p) {
    const siguiente = !p.activo;
    setProductos(prev => prev.map(x => (x.id === p.id ? { ...x, activo: siguiente } : x)));
    setToggleId(p.id);
    try {
      await actualizarDisponibilidadProducto(p.id, siguiente);
    } catch (err) {
      setProductos(prev => prev.map(x => (x.id === p.id ? { ...x, activo: p.activo } : x)));
      toast.error(err.message || 'No se pudo actualizar');
    } finally {
      setToggleId(null);
    }
  }

  async function handleEliminar(p) {
    const ok = await confirmDialog({
      title: '¿Eliminar producto?',
      message: `"${p.nombre}" se eliminará del catálogo. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    setEliminandoId(p.id);
    try {
      await eliminarProducto(p.id);
      setProductos(prev => prev.filter(x => x.id !== p.id));
      toast.success(`"${p.nombre}" eliminado`);
    } catch (err) {
      toast.error(err.message || 'No se pudo eliminar');
    } finally {
      setEliminandoId(null);
    }
  }

  async function handleRenameCategoria(vieja) {
    const nueva = catNuevoNombre.trim();
    if (!nueva || nueva === vieja) { setCatEditando(null); return; }
    setCatGuardando(vieja);
    try {
      await renameCategoria(vieja, nueva);
      setProductos(prev => prev.map(p => p.categoria === vieja ? { ...p, categoria: nueva } : p));
      toast.success(`Categoría renombrada a "${nueva}"`);
      setCatEditando(null);
      setCatNuevoNombre('');
    } catch (err) {
      toast.error(err.message || 'Error al renombrar');
    } finally {
      setCatGuardando(null);
    }
  }

  async function handleEliminarCategoria(nombre) {
    const ok = await confirmDialog({
      title: '¿Eliminar categoría?',
      message: `Los productos con la categoría "${nombre}" quedarán sin categoría. ¿Continuar?`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    setCatGuardando(nombre);
    try {
      await eliminarCategoria(nombre);
      setProductos(prev => prev.map(p => p.categoria === nombre ? { ...p, categoria: null } : p));
      toast.success(`Categoría "${nombre}" eliminada`);
    } catch (err) {
      toast.error(err.message || 'Error al eliminar');
    } finally {
      setCatGuardando(null);
    }
  }

  async function handleRenameMarca(vieja) {
    const nueva = marcaNuevoNombre.trim();
    if (!nueva || nueva === vieja) { setMarcaEditando(null); return; }
    setMarcaGuardando(vieja);
    try {
      await renameMarca(vieja, nueva);
      setProductos(prev => prev.map(p => p.marca === vieja ? { ...p, marca: nueva } : p));
      toast.success(`Marca renombrada a "${nueva}"`);
      setMarcaEditando(null);
      setMarcaNuevoNombre('');
    } catch (err) {
      toast.error(err.message || 'Error al renombrar');
    } finally {
      setMarcaGuardando(null);
    }
  }

  async function handleEliminarMarca(nombre) {
    const ok = await confirmDialog({
      title: '¿Eliminar marca?',
      message: `Los productos con la marca "${nombre}" quedarán sin marca. ¿Continuar?`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    setMarcaGuardando(nombre);
    try {
      await eliminarMarca(nombre);
      setProductos(prev => prev.map(p => p.marca === nombre ? { ...p, marca: null } : p));
      toast.success(`Marca "${nombre}" eliminada`);
    } catch (err) {
      toast.error(err.message || 'Error al eliminar');
    } finally {
      setMarcaGuardando(null);
    }
  }

  async function handleRenameTamano(viejo) {
    const nuevo = tamanoNuevoNombre.trim();
    if (!nuevo || nuevo === viejo) { setTamanoEditando(null); return; }
    setTamanoGuardando(viejo);
    try {
      await renameTamano(viejo, nuevo);
      setProductos(prev => prev.map(p => p.tamano === viejo ? { ...p, tamano: nuevo } : p));
      toast.success(`Tamaño renombrado a "${nuevo}"`);
      setTamanoEditando(null);
      setTamanoNuevoNombre('');
    } catch (err) {
      toast.error(err.message || 'Error al renombrar');
    } finally {
      setTamanoGuardando(null);
    }
  }

  async function handleEliminarTamano(nombre) {
    const ok = await confirmDialog({
      title: '¿Eliminar tamaño?',
      message: `Los productos con el tamaño "${nombre}" quedarán sin tamaño. ¿Continuar?`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    setTamanoGuardando(nombre);
    try {
      await eliminarTamano(nombre);
      setProductos(prev => prev.map(p => p.tamano === nombre ? { ...p, tamano: null } : p));
      toast.success(`Tamaño "${nombre}" eliminado`);
    } catch (err) {
      toast.error(err.message || 'Error al eliminar');
    } finally {
      setTamanoGuardando(null);
    }
  }

  return (
    <div className="min-w-0">
      {/* Sticky toolbar: search + actions + filters */}
      <div className="sticky top-[57px] lg:top-0 z-20 flex flex-col gap-3 bg-admin-bg pt-3 pb-3 -mx-3 px-3 sm:-mx-4 sm:px-4 lg:-mx-8 lg:px-8 border-b border-admin-border-soft">
        <div className="flex gap-2 items-center shrink-0">
          <div className="relative flex-1 min-w-0">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-admin-muted pointer-events-none"
            />
            <input
              type="search"
              value={busquedaInput}
              onChange={e => setBusquedaInput(e.target.value)}
              placeholder={t('admin.catalog.searchPlaceholder')}
              className="w-full bg-admin-card rounded-2xl pl-12 pr-4 py-3 text-sm font-body font-semibold
                         text-admin-text placeholder:text-admin-inactive outline-none border-2 border-admin-border
                         focus:border-blue-400 transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={() => setCreando(true)}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl text-sm font-body font-black
                       text-white transition-all duration-200 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #2563eb, #6366f1)', boxShadow: '0 4px 14px #2563eb22' }}
          >
            <Plus size={18} strokeWidth={3} />
            <span className="hidden sm:inline">{t('admin.catalog.newItem')}</span>
          </button>

          {/* Exportar con menú de formato */}
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowExportMenu(prev => !prev)}
              disabled={exportando || productos.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-3 rounded-2xl text-sm font-body font-black
                         border-2 border-admin-border text-admin-text hover:border-blue-400 hover:text-blue-600
                         transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
              title={t('admin.catalog.export')}
            >
              <Download size={18} strokeWidth={2.5} className={exportando ? 'animate-bounce' : ''} />
              <span className="hidden sm:inline">{exportando ? t('admin.catalog.exporting') : t('admin.catalog.export')}</span>
            </button>
            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-40 bg-admin-card border-2 border-admin-border rounded-xl shadow-lg overflow-hidden min-w-[160px]">
                  <button
                    type="button"
                    onClick={() => handleExportar('csv')}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-body font-bold text-admin-text hover:bg-admin-hover transition-colors"
                  >
                    <span className="w-5 text-center text-xs font-black text-green-600">CSV</span>
                    Excel / CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportar('json')}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-body font-bold text-admin-text hover:bg-admin-hover transition-colors"
                  >
                    <span className="w-5 text-center text-xs font-black text-blue-600">{ '{}' }</span>
                    JSON
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Importar (JSON o CSV) */}
          <label
            className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-3 rounded-2xl text-sm font-body font-black
                       border-2 border-admin-border text-admin-text hover:border-fiesta-cyan hover:text-fiesta-cyan
                       transition-all duration-200 active:scale-95 cursor-pointer
                       ${importando ? 'opacity-40 pointer-events-none' : ''}`}
            title={t('admin.catalog.importHint')}
          >
            <Upload size={18} strokeWidth={2.5} className={importando ? 'animate-bounce' : ''} />
            <span className="hidden sm:inline">{importando ? t('admin.catalog.importing') : t('admin.catalog.import')}</span>
            <input
              type="file"
              accept=".json,.csv"
              className="hidden"
              disabled={importando}
              onChange={(e) => { handleImportar(e.target.files?.[0]); e.target.value = ''; }}
            />
          </label>
        </div>

        <div className="flex gap-2 overflow-x-auto hide-scrollbar items-center pb-1">
          <button
            type="button"
            onClick={() => setFiltroActivo('todos')}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-body font-black border-2 transition-colors"
            style={filtroActivo === 'todos'
              ? { background: '#2563eb', color: 'white', borderColor: '#2563eb' }
              : { background: '#f3f4f6', color: '#6b7280', borderColor: '#e5e7eb' }}
          >
            {t('common.all')}
          </button>

          <button
            type="button"
            onClick={() => setFiltroActivo('stock-bajo')}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body font-black border-2 transition-colors"
            style={filtroActivo === 'stock-bajo'
              ? { background: '#fef2f2', color: '#b91c1c', borderColor: '#fca5a5' }
              : { background: 'white', color: '#dc2626', borderColor: '#fecaca' }}
          >
            <span className="w-2 h-2 rounded-full bg-red-500" />
            {t('admin.catalog.lowStock', { count: productosEnAlerta.length })}
          </button>

          <button
            type="button"
            onClick={() => setFiltroActivo('nuevo')}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body font-black border-2 transition-colors"
            style={filtroActivo === 'nuevo'
              ? { background: '#f0fdf4', color: '#166534', borderColor: '#86efac' }
              : { background: 'white', color: '#16a34a', borderColor: '#bbf7d0' }}
          >
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {t('admin.catalog.newItems', { count: productosNuevos.length })}
          </button>

          <span className="w-px h-5 bg-admin-border shrink-0" />

          <button
            type="button"
            onClick={() => setShowCatMgr(true)}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body font-black
                       border-2 transition-all duration-200 active:scale-95"
            style={{ borderColor: '#c084fc', color: '#7c3aed', background: '#faf5ff' }}
            title={t('admin.catalog.manageCategories')}
          >
            <Tag size={14} />
            {t('filters.category')}
          </button>
          <button
            type="button"
            onClick={() => setShowMarcaMgr(true)}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body font-black
                       border-2 transition-all duration-200 active:scale-95"
            style={{ borderColor: '#93c5fd', color: '#2563eb', background: '#eff6ff' }}
            title={t('admin.catalog.manageBrands')}
          >
            <Bookmark size={14} />
            {t('filters.brand')}
          </button>
          <button
            type="button"
            onClick={() => setShowTamanoMgr(true)}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body font-black
                       border-2 transition-all duration-200 active:scale-95"
            style={{ borderColor: '#86efac', color: '#16a34a', background: '#f0fdf4' }}
            title={t('admin.catalog.manageSizes')}
          >
            <Ruler size={14} />
            {t('filters.size')}
          </button>
          <button
            type="button"
            onClick={() => setShowAnuncioEditor(v => !v)}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body font-black
                       border-2 transition-all duration-200 active:scale-95"
            style={anuncioActivo
              ? { borderColor: '#f59e0b', color: '#92400e', background: '#fffbeb' }
              : { borderColor: '#d1d5db', color: '#6b7280', background: '#f9fafb' }}
            title={t('admin.catalog.customerBanner')}
          >
            <Megaphone size={14} />
            {t('admin.catalog.banner')}
            {anuncioActivo && <span className="w-2 h-2 rounded-full bg-amber-500" />}
          </button>
        </div>

        {/* ── Editor de anuncio inline ── */}
        {showAnuncioEditor && (
          <div className="bg-admin-card border border-admin-border rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone size={16} className="text-amber-500" />
                <span className="text-xs font-body font-black text-admin-text">{t('admin.catalog.customerBanner')}</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-[11px] font-body font-bold text-admin-muted">
                  {anuncioActivo ? t('admin.catalog.active') : t('admin.catalog.inactive')}
                </span>
                <Toggle
                  checked={anuncioActivo}
                  onChange={async () => {
                    const nuevoVal = !anuncioActivo;
                    setAnuncioActivo(nuevoVal);
                    setAnuncioGuardando(true);
                    try {
                      await setConfig('anuncio', { mensaje: anuncioMsg, activo: nuevoVal });
                      toast.success(nuevoVal ? t('admin.catalog.bannerEnabled') : t('admin.catalog.bannerDisabled'));
                    } catch (err) {
                      toast.error(err.message || t('admin.catalog.saveError'));
                      setAnuncioActivo(!nuevoVal);
                    } finally {
                      setAnuncioGuardando(false);
                    }
                  }}
                />
              </label>
            </div>
            <textarea
              value={anuncioMsg}
              onChange={e => setAnuncioMsg(e.target.value)}
              maxLength={200}
              rows={2}
              placeholder={t('admin.catalog.bannerPlaceholder')}
              className="w-full bg-admin-bg rounded-xl px-3 py-2 text-sm font-body text-admin-text placeholder:text-admin-inactive
                         outline-none border border-admin-border focus:border-fiesta-magenta transition-colors resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-body text-admin-muted">{anuncioMsg.length}/200</span>
              <button
                type="button"
                disabled={anuncioGuardando}
                onClick={async () => {
                  setAnuncioGuardando(true);
                  try {
                    await setConfig('anuncio', { mensaje: anuncioMsg.trim(), activo: anuncioActivo });
                    toast.success(t('admin.catalog.bannerSaved'));
                  } catch (err) {
                    toast.error(err.message || t('admin.catalog.saveError'));
                  } finally {
                    setAnuncioGuardando(false);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body font-black text-white
                           transition-all duration-200 active:scale-95 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
              >
                <Check size={14} />
                {anuncioGuardando ? t('admin.catalog.saving') : t('admin.catalog.saveMessage')}
              </button>
            </div>
          </div>
        )}

            {/* Modal gestión de categorías */}
            {showCatMgr && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={e => { if (e.target === e.currentTarget) { setShowCatMgr(false); setCatEditando(null); } }}>
                <div className="bg-admin-card border border-admin-border rounded-2xl w-full max-w-sm shadow-2xl flex flex-col max-h-[80vh]">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-admin-border shrink-0">
                    <div className="flex items-center gap-2">
                      <Tag size={18} className="text-blue-500" />
                      <h2 className="text-base font-body font-black text-admin-text">{t('admin.catalog.manageCategories')}</h2>
                    </div>
                    <button onClick={() => { setShowCatMgr(false); setCatEditando(null); setCatNuevoNombre(''); }} className="text-admin-muted hover:text-admin-text transition-colors" aria-label={t('common.close')}>
                      <X size={20} />
                    </button>
                  </div>
                  <div className="overflow-y-auto px-4 py-3 space-y-2 flex-1">
                    {todasCategorias.length === 0 && (
                      <p className="text-sm text-admin-muted text-center py-6">{t('admin.catalog.noCategoriesYet')}</p>
                    )}
                    {todasCategorias.map(cat => (
                      <div key={cat} className="flex items-center gap-2 bg-admin-elevated rounded-xl px-3 py-2 border border-admin-border">
                        {catEditando === cat ? (
                          <>
                            <input
                              autoFocus
                              type="text"
                              value={catNuevoNombre}
                              onChange={e => setCatNuevoNombre(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleRenameCategoria(cat);
                                if (e.key === 'Escape') { setCatEditando(null); setCatNuevoNombre(''); }
                              }}
                              className="flex-1 bg-admin-card border border-admin-border rounded-lg px-2 py-1 text-sm font-body text-admin-text outline-none focus:border-blue-400"
                            />
                            <button
                              onClick={() => handleRenameCategoria(cat)}
                              disabled={catGuardando === cat}
                              className="shrink-0 text-emerald-600 hover:text-emerald-500 disabled:opacity-40 transition-colors"
                              aria-label="Confirmar"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => { setCatEditando(null); setCatNuevoNombre(''); }}
                              className="shrink-0 text-admin-muted hover:text-admin-text transition-colors"
                              aria-label="Cancelar"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 text-sm font-body font-bold text-admin-text truncate">{cat}</span>
                            <span className="text-xs text-admin-muted shrink-0">{productos.filter(p => p.categoria === cat).length} {t('admin.catalog.productsShort')}</span>
                            <button
                              onClick={() => { setCatEditando(cat); setCatNuevoNombre(cat); }}
                              className="shrink-0 text-admin-muted hover:text-blue-500 transition-colors"
                              aria-label={`Renombrar ${cat}`}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleEliminarCategoria(cat)}
                              disabled={catGuardando === cat}
                              className="shrink-0 text-admin-muted hover:text-red-500 disabled:opacity-40 transition-colors"
                              aria-label={`Eliminar ${cat}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Brand management modal */}
            {showMarcaMgr && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={e => { if (e.target === e.currentTarget) { setShowMarcaMgr(false); setMarcaEditando(null); } }}>
                <div className="bg-admin-card border border-admin-border rounded-2xl w-full max-w-sm shadow-2xl flex flex-col max-h-[80vh]">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-admin-border shrink-0">
                    <div className="flex items-center gap-2">
                      <Bookmark size={18} className="text-blue-500" />
                      <h2 className="text-base font-body font-black text-admin-text">{t('admin.catalog.manageBrands')}</h2>
                    </div>
                    <button onClick={() => { setShowMarcaMgr(false); setMarcaEditando(null); setMarcaNuevoNombre(''); }} className="text-admin-muted hover:text-admin-text transition-colors" aria-label={t('common.close')}>
                      <X size={20} />
                    </button>
                  </div>
                  <div className="overflow-y-auto px-4 py-3 space-y-2 flex-1">
                    {todasMarcas.length === 0 && (
                      <p className="text-sm text-admin-muted text-center py-6">{t('admin.catalog.noBrandsYet')}</p>
                    )}
                    {todasMarcas.map(m => (
                      <div key={m} className="flex items-center gap-2 bg-admin-elevated rounded-xl px-3 py-2 border border-admin-border">
                        {marcaEditando === m ? (
                          <>
                            <input
                              autoFocus
                              type="text"
                              value={marcaNuevoNombre}
                              onChange={e => setMarcaNuevoNombre(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleRenameMarca(m);
                                if (e.key === 'Escape') { setMarcaEditando(null); setMarcaNuevoNombre(''); }
                              }}
                              className="flex-1 bg-admin-card border border-admin-border rounded-lg px-2 py-1 text-sm font-body text-admin-text outline-none focus:border-blue-400"
                            />
                            <button onClick={() => handleRenameMarca(m)} disabled={marcaGuardando === m} className="shrink-0 text-emerald-600 hover:text-emerald-500 disabled:opacity-40 transition-colors" aria-label="Confirmar">
                              <Check size={18} />
                            </button>
                            <button onClick={() => { setMarcaEditando(null); setMarcaNuevoNombre(''); }} className="shrink-0 text-admin-muted hover:text-admin-text transition-colors" aria-label="Cancelar">
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 text-sm font-body font-bold text-admin-text truncate">{m}</span>
                            <span className="text-xs text-admin-muted shrink-0">{productos.filter(p => p.marca === m).length} {t('admin.catalog.productsShort')}</span>
                            <button onClick={() => { setMarcaEditando(m); setMarcaNuevoNombre(m); }} className="shrink-0 text-admin-muted hover:text-blue-500 transition-colors" aria-label={`Renombrar ${m}`}>
                              <Pencil size={15} />
                            </button>
                            <button onClick={() => handleEliminarMarca(m)} disabled={marcaGuardando === m} className="shrink-0 text-admin-muted hover:text-red-500 disabled:opacity-40 transition-colors" aria-label={`Eliminar ${m}`}>
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Modal gestión de tamaños */}
            {showTamanoMgr && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={e => { if (e.target === e.currentTarget) { setShowTamanoMgr(false); setTamanoEditando(null); } }}>
                <div className="bg-admin-card border border-admin-border rounded-2xl w-full max-w-sm shadow-2xl flex flex-col max-h-[80vh]">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-admin-border shrink-0">
                    <div className="flex items-center gap-2">
                      <Ruler size={18} className="text-green-500" />
                      <h2 className="text-base font-body font-black text-admin-text">{t('admin.catalog.manageSizes')}</h2>
                    </div>
                    <button onClick={() => { setShowTamanoMgr(false); setTamanoEditando(null); setTamanoNuevoNombre(''); }} className="text-admin-muted hover:text-admin-text transition-colors" aria-label={t('common.close')}>
                      <X size={20} />
                    </button>
                  </div>
                  <div className="overflow-y-auto px-4 py-3 space-y-2 flex-1">
                    {todosTamanos.length === 0 && (
                      <p className="text-sm text-admin-muted text-center py-6">{t('admin.catalog.noSizesYet')}</p>
                    )}
                    {todosTamanos.map(tamanoItem => (
                      <div key={tamanoItem} className="flex items-center gap-2 bg-admin-elevated rounded-xl px-3 py-2 border border-admin-border">
                        {tamanoEditando === tamanoItem ? (
                          <>
                            <input
                              autoFocus
                              type="text"
                              value={tamanoNuevoNombre}
                              onChange={e => setTamanoNuevoNombre(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleRenameTamano(tamanoItem);
                                if (e.key === 'Escape') { setTamanoEditando(null); setTamanoNuevoNombre(''); }
                              }}
                              className="flex-1 bg-admin-card border border-admin-border rounded-lg px-2 py-1 text-sm font-body text-admin-text outline-none focus:border-green-400"
                            />
                            <button onClick={() => handleRenameTamano(tamanoItem)} disabled={tamanoGuardando === tamanoItem} className="shrink-0 text-emerald-600 hover:text-emerald-500 disabled:opacity-40 transition-colors" aria-label="Confirmar">
                              <Check size={18} />
                            </button>
                            <button onClick={() => { setTamanoEditando(null); setTamanoNuevoNombre(''); }} className="shrink-0 text-admin-muted hover:text-admin-text transition-colors" aria-label="Cancelar">
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 text-sm font-body font-bold text-admin-text truncate">{tamanoItem}</span>
                            <span className="text-xs text-admin-muted shrink-0">{productos.filter(p => p.tamano === tamanoItem).length} {t('admin.catalog.productsShort')}</span>
                            <button onClick={() => { setTamanoEditando(tamanoItem); setTamanoNuevoNombre(tamanoItem); }} className="shrink-0 text-admin-muted hover:text-green-500 transition-colors" aria-label={`Renombrar ${tamanoItem}`}>
                              <Pencil size={15} />
                            </button>
                            <button onClick={() => handleEliminarTamano(tamanoItem)} disabled={tamanoGuardando === tamanoItem} className="shrink-0 text-admin-muted hover:text-red-500 disabled:opacity-40 transition-colors" aria-label={`Eliminar ${tamanoItem}`}>
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

      </div>

      {/* Contenido scrollable */}
      <div className="space-y-4 mt-4">

            {cargando && (
              <div className="flex items-center justify-center py-16 gap-3">
                <div className="w-6 h-6 rounded-full border-[3px] border-admin-border border-t-blue-500 animate-spin" />
                <span className="text-sm font-body font-bold text-admin-muted">{t('admin.catalog.loadingInventory')}</span>
              </div>
            )}

            {!cargando && errorLista && (
              <div className="bg-admin-card rounded-2xl p-5 border-2 border-red-100 text-center">
                <p className="text-sm font-body font-bold text-red-500">⚠️ {errorLista}</p>
                <button
                  type="button"
                  onClick={fetchProductos}
                  className="mt-3 text-xs font-body font-black text-admin-muted underline"
                >
                  {t('error.retry')}
                </button>
              </div>
            )}

            {!cargando && !errorLista && filtrados.length === 0 && (
              <div className="text-center py-14 bg-admin-card rounded-2xl border-2 border-admin-border">
                <p className="text-3xl mb-2">📭</p>
                <p className="font-body font-bold text-admin-muted">
                  {busqueda ? t('admin.catalog.noSearchMatches') : t('admin.catalog.empty')}
                </p>
              </div>
            )}

            {!cargando && !errorLista && filtrados.length > 0 && (
              <div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-24"
              >
                {filtrados.map(p => (
                  <div
                    key={p.id}
                    className="bg-admin-card rounded-2xl border border-admin-border p-4 flex flex-col gap-4
                               transition-shadow hover:shadow-card-hover"
                  >
                    <div className="flex gap-3 min-w-0 items-start">
                      <div
                        className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-admin-elevated border border-admin-border
                                   flex items-center justify-center"
                      >
                        <MiniaturaProducto url={p.imagen_url} nombre={p.nombre} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-body font-black text-admin-text text-sm leading-snug line-clamp-2" title={p.nombre}>
                          {p.nombre}
                        </p>
                        <p className="text-[11px] font-body text-admin-muted mt-1 line-clamp-1">
                          {p.marca ? (
                            <span>{t('filters.brand')}: {p.marca}</span>
                          ) : (
                            <span className="text-ink-300">{t('admin.catalog.noBrand')}</span>
                          )}
                          <span className="mx-1.5 text-ink-200">·</span>
                          {p.tamano ? (
                            <span>{t('filters.size')}: {p.tamano}</span>
                          ) : (
                            <span className="text-ink-300">{t('admin.catalog.noSize')}</span>
                          )}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <p className="text-sm font-body font-black text-admin-text">
                            {SIMBOLO_MONEDA}
                            {Number(p.precio).toFixed(2)}
                          </p>
                          {p.stock_ilimitado !== false ? (
                            <span className="inline-flex items-center w-fit gap-0.5 text-[10px] font-body font-bold text-ink-500 bg-ink-50 px-1.5 py-0.5 rounded border border-ink-100">
                              <span className="text-[12px] leading-none mb-[1px]">∞</span> {t('admin.catalog.unlimited')}
                            </span>
                          ) : (
                            Number(p.stock_actual) <= Number(p.stock_minimo) ? (
                              <span className="inline-flex items-center w-fit gap-1 text-[10px] font-body font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                                <AlertTriangle size={10} strokeWidth={2.5} />
                                {p.stock_actual} {t('admin.catalog.low')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center w-fit gap-1 text-[10px] font-body font-bold text-ink-600 bg-ink-50 px-1.5 py-0.5 rounded border border-ink-200">
                                {t('admin.catalog.inStock', { count: p.stock_actual })}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-auto pt-4 border-t border-admin-border">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-body font-bold text-admin-text-secondary">
                          {p.activo !== false ? t('admin.catalog.active') : t('admin.catalog.hidden')}
                        </span>
                        <Toggle
                          checked={p.activo !== false}
                          disabled={toggleId === p.id}
                          onChange={() => handleToggleDisponibilidad(p)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => setEditando(p)}
                          className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-body font-bold
                                     text-admin-text-secondary bg-admin-card border border-admin-border transition-colors hover:bg-admin-elevated hover:text-admin-text active:scale-95"
                        >
                          <Pencil size={14} />
                          {t('admin.catalog.edit')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminar(p)}
                          disabled={eliminandoId === p.id}
                          className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-body font-bold
                                     text-rose-600 bg-admin-card transition-colors hover:bg-rose-50 hover:text-rose-700 active:scale-95 disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                          {eliminandoId === p.id ? '…' : t('admin.catalog.delete')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Load more button */}
            {!cargando && hayMas && (
              <div className="flex justify-center pt-4 pb-8">
                <button
                  type="button"
                  onClick={() => fetchProductos(pagina + 1, true)}
                  className="px-6 py-2.5 rounded-xl text-sm font-body font-bold text-admin-text-secondary
                             bg-admin-elevated hover:bg-admin-input border border-admin-border transition-colors"
                >
                  {t('admin.catalog.loadMore')}
                </button>
              </div>
            )}
          </div>

      {/* Modal Nuevo Artículo */}
      {creando && createPortal(
        <div
          className="fixed inset-0 z-50 overflow-y-auto animate-fade-in"
          style={{ background: 'rgba(26, 7, 51, 0.55)' }}
          role="dialog"
          aria-modal="true"
          aria-label="Nuevo artículo"
          onClick={(e) => { if (e.target === e.currentTarget) setCreando(false); }}
        >
          <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-6">
            <div className="relative w-full max-w-5xl bg-white sm:rounded-2xl shadow-2xl sm:my-4">
              <button
                type="button"
                onClick={() => setCreando(false)}
                className="sticky top-3 float-right mr-3 z-10 p-2 rounded-full bg-ink-100 hover:bg-ink-200 text-ink-500 transition-colors"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
              <FormularioNuevoProducto isModal onProductoCreado={() => { fetchProductos(); setCreando(false); }} />
            </div>
          </div>
        </div>,
        document.body
      )}

      {editando && (
        <ModalEditarProducto
          producto={editando}
          onClose={() => setEditando(null)}
          onGuardado={() => {
            fetchProductos();
            setEditando(null);
          }}
        />
      )}
      <ConfirmModal
        open={confirmOpen}
        onConfirm={onConfirm}
        onCancel={onCancel}
        {...confirmConfig}
      />
    </div>
  );
}

import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  FileSpreadsheet,
  Play,
  Upload,
  WandSparkles,
} from 'lucide-react';
import {
  buildVariantMatrix,
  createBulkGeneratorDraft,
  createProductCsvTemplate,
  exportProductCsv,
  matrixRowToBulkPayload,
  previewProductCsv,
  validateMatrixRows,
} from '../../../services/catalog/adminBulkModel.js';

const INPUT_CLASS = 'w-full rounded-xl border border-admin-border bg-admin-input px-3 py-2 text-xs text-admin-text outline-none focus:border-fiesta-magenta';

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-admin-muted">{label}</span>
      {children}
    </label>
  );
}

function ToggleOptions({ label, items, selected, labelKey = 'name', onChange }) {
  const toggle = (id) => onChange(
    selected.includes(id)
      ? selected.filter((value) => value !== id)
      : [...selected, id],
  );
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-wide text-admin-muted">{label}</p>
        <button type="button" onClick={() => onChange(selected.length === items.length ? [] : items.map((item) => item.id))} className="text-[10px] font-black text-fiesta-magenta">
          {selected.length === items.length ? 'Limpiar' : 'Seleccionar todo'}
        </button>
      </div>
      <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-admin-border bg-admin-bg/45 p-2">
        {items.map((item) => {
          const active = selected.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggle(item.id)}
              className={`rounded-lg border px-2 py-1 text-[10px] font-bold ${
                active
                  ? 'border-fiesta-magenta/40 bg-fiesta-magenta/10 text-fiesta-magenta'
                  : 'border-admin-border text-admin-muted hover:bg-admin-elevated'
              }`}
            >
              {item[labelKey]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ResultSummary({ report }) {
  if (!report) return null;
  return (
    <div className="grid gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/8 p-3 sm:grid-cols-3">
      <div><p className="text-[9px] font-black uppercase text-emerald-700">Creadas</p><p className="text-lg font-black text-admin-text">{report.created}</p></div>
      <div><p className="text-[9px] font-black uppercase text-sky-700">Actualizadas</p><p className="text-lg font-black text-admin-text">{report.updated}</p></div>
      <div><p className="text-[9px] font-black uppercase text-red-600">Rechazadas</p><p className="text-lg font-black text-admin-text">{report.rejected}</p></div>
      {report.rejected > 0 && (
        <div className="sm:col-span-3">
          {report.results.filter((row) => row.status === 'rejected').map((row) => (
            <p key={row.row_key} className="mt-1 text-[10px] font-bold text-red-600">{row.row_key}: {row.error}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function downloadCsv(filename, content) {
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function GeneratorTool({ product, lookups, saving, onApply }) {
  const [draft, setDraft] = useState(() => createBulkGeneratorDraft(product));
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [report, setReport] = useState(null);
  const lines = lookups.lines.filter((line) => !product.brand_id || line.brand_id === product.brand_id);
  const updateDraft = (name, value) => {
    setDraft((current) => ({ ...current, [name]: value }));
    setErrors([]);
    setReport(null);
  };
  const generate = () => {
    setRows(buildVariantMatrix(product, draft, lookups));
    setErrors([]);
    setReport(null);
  };
  const updateRow = (key, name, value) => setRows((current) =>
    current.map((row) => (row.key === key ? { ...row, [name]: value } : row)));
  const copyFirst = () => {
    const source = rows.find((row) => row.enabled);
    if (!source) return;
    setRows((current) => current.map((row) => (
      row.enabled
        ? {
          ...row,
          contained_quantity: source.contained_quantity,
          base_price: source.base_price,
          wholesale_minimum: source.wholesale_minimum,
          wholesale_price: source.wholesale_price,
          inventory_quantity: source.inventory_quantity,
        }
        : row
    )));
  };
  const apply = async () => {
    const validationErrors = validateMatrixRows(rows, draft);
    if (validationErrors.length) return setErrors(validationErrors);
    const payloads = rows
      .filter((row) => row.enabled)
      .map((row) => matrixRowToBulkPayload(row, draft));
    try {
      const nextReport = await onApply(payloads);
      const completed = new Set(
        nextReport.results
          .filter((result) => result.status !== 'rejected')
          .map((result) => result.row_key),
      );
      setReport(nextReport);
      setRows((current) => current.map((row) => (
        completed.has(row.key)
          ? { ...row, enabled: false, existing: { id: 'processed' } }
          : row
      )));
    } catch {
      // The workspace reports transport and permission errors through its toast.
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-admin-border bg-admin-bg/45 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-fiesta-magenta/10 p-2 text-fiesta-magenta"><WandSparkles size={18} /></div>
          <div>
            <h3 className="text-sm font-black text-admin-text">Generador de combinaciones</h3>
            <p className="mt-1 text-[11px] text-admin-muted">Elige solo las combinaciones que existen fisicamente. La matriz no guarda nada hasta confirmar.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Field label="Gama o linea">
            <select value={draft.line_id} onChange={(event) => updateDraft('line_id', event.target.value)} className={INPUT_CLASS}>
              <option value="">Sin gama</option>
              {lines.map((line) => <option key={line.id} value={line.id}>{line.name}</option>)}
            </select>
          </Field>
          <Field label="Acabado">
            <input value={draft.finish} onChange={(event) => updateDraft('finish', event.target.value)} className={INPUT_CLASS} placeholder="Mate, brillante..." />
          </Field>
          <Field label="Patron de SKU">
            <input value={draft.sku_pattern} onChange={(event) => updateDraft('sku_pattern', event.target.value)} className={INPUT_CLASS} />
            <span className="mt-1 block text-[9px] text-admin-muted">{'{product} {line} {color} {size} {index}'}</span>
          </Field>
          <div className="lg:col-span-3 grid gap-4 lg:grid-cols-2">
            <ToggleOptions label="Colores" items={lookups.colors} selected={draft.color_ids} labelKey="exact_name" onChange={(value) => updateDraft('color_ids', value)} />
            <ToggleOptions label="Medidas" items={lookups.sizes} selected={draft.size_ids} onChange={(value) => updateDraft('size_ids', value)} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-admin-border bg-admin-card p-4">
        <p className="text-[10px] font-black uppercase tracking-wide text-fiesta-magenta">Configuracion que se copiara</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Presentacion"><input value={draft.presentation_name} onChange={(event) => updateDraft('presentation_name', event.target.value)} className={INPUT_CLASS} /></Field>
          <Field label="Tipo">
            <select value={draft.presentation_type} onChange={(event) => updateDraft('presentation_type', event.target.value)} className={INPUT_CLASS}>
              {['pieza', 'bolsa', 'paquete', 'lata', 'rollo', 'botella', 'juego', 'otro'].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </Field>
          <Field label="Piezas por presentacion"><input type="number" min="0.001" step="0.001" value={draft.contained_quantity} onChange={(event) => updateDraft('contained_quantity', event.target.value)} className={INPUT_CLASS} /></Field>
          <Field label="Precio normal"><input type="number" min="0" step="0.01" value={draft.base_price} onChange={(event) => updateDraft('base_price', event.target.value)} className={INPUT_CLASS} /></Field>
          <Field label="Mayoreo desde"><input type="number" min="1" value={draft.wholesale_minimum} onChange={(event) => updateDraft('wholesale_minimum', event.target.value)} className={INPUT_CLASS} placeholder="Opcional" /></Field>
          <Field label="Precio mayoreo"><input type="number" min="0" step="0.01" value={draft.wholesale_price} onChange={(event) => updateDraft('wholesale_price', event.target.value)} className={INPUT_CLASS} placeholder="Opcional" /></Field>
          <Field label="Sucursal inicial">
            <select value={draft.location_id} onChange={(event) => updateDraft('location_id', event.target.value)} className={INPUT_CLASS}>
              <option value="">Sin inventario inicial</option>
              {lookups.locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
            </select>
          </Field>
          <Field label="Existencia inicial"><input type="number" min="0" step="0.001" value={draft.inventory_quantity} onChange={(event) => updateDraft('inventory_quantity', event.target.value)} className={INPUT_CLASS} /></Field>
        </div>
        <div className="mt-3 rounded-xl border border-admin-border p-3">
          <button type="button" onClick={() => updateDraft('include_box', !draft.include_box)} className={`flex w-full items-center justify-between text-xs font-black ${draft.include_box ? 'text-fiesta-magenta' : 'text-admin-muted'}`}>
            Crear caja para cada combinacion
            <span className={`h-5 w-9 rounded-full p-0.5 ${draft.include_box ? 'bg-fiesta-magenta' : 'bg-admin-inactive'}`}><span className={`block h-4 w-4 rounded-full bg-white transition-transform ${draft.include_box ? 'translate-x-4' : ''}`} /></span>
          </button>
          {draft.include_box && (
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Field label="Nombre"><input value={draft.box_name} onChange={(event) => updateDraft('box_name', event.target.value)} className={INPUT_CLASS} /></Field>
              <Field label="Presentaciones por caja"><input type="number" min="1" step="1" value={draft.box_quantity} onChange={(event) => updateDraft('box_quantity', event.target.value)} className={INPUT_CLASS} /></Field>
              <Field label="Precio por caja"><input type="number" min="0" step="0.01" value={draft.box_price} onChange={(event) => updateDraft('box_price', event.target.value)} className={INPUT_CLASS} /></Field>
            </div>
          )}
        </div>
        <button type="button" onClick={generate} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-fiesta-magenta/35 bg-fiesta-magenta/8 px-4 py-2 text-xs font-black text-fiesta-magenta">
          <Play size={14} /> Generar vista previa
        </button>
      </section>

      {rows.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-admin-border">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-admin-border bg-admin-bg/70 px-4 py-3">
            <div>
              <p className="text-xs font-black text-admin-text">Matriz de {rows.length} combinaciones</p>
              <p className="text-[10px] text-admin-muted">{rows.filter((row) => row.enabled).length} activas para guardar</p>
            </div>
            <button type="button" onClick={copyFirst} className="inline-flex items-center gap-1.5 rounded-lg border border-admin-border px-3 py-1.5 text-[10px] font-black text-admin-text hover:text-fiesta-magenta"><Copy size={12} /> Copiar primera activa</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-left">
              <thead className="bg-admin-bg/50 text-[9px] font-black uppercase tracking-wide text-admin-muted">
                <tr>
                  <th className="px-3 py-2">Usar</th><th className="px-3 py-2">Combinacion</th><th className="px-3 py-2">SKU</th><th className="px-3 py-2">Codigo</th><th className="px-3 py-2">Piezas</th><th className="px-3 py-2">Precio</th><th className="px-3 py-2">Mayoreo</th><th className="px-3 py-2">Precio may.</th><th className="px-3 py-2">Stock</th><th className="px-3 py-2">Imagen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {rows.map((row) => (
                  <tr key={row.key} className={row.existing ? 'bg-admin-bg/50' : 'bg-admin-card'}>
                    <td className="px-3 py-2"><input type="checkbox" checked={row.enabled} disabled={Boolean(row.existing)} onChange={(event) => updateRow(row.key, 'enabled', event.target.checked)} /></td>
                    <td className="px-3 py-2"><p className="max-w-44 text-[10px] font-black text-admin-text">{row.label}</p>{row.existing && <span className="text-[9px] font-bold text-amber-600">Ya existe</span>}</td>
                    {[
                      ['sku', 'text', 'w-40'],
                      ['barcode', 'text', 'w-32'],
                      ['contained_quantity', 'number', 'w-20'],
                      ['base_price', 'number', 'w-24'],
                      ['wholesale_minimum', 'number', 'w-20'],
                      ['wholesale_price', 'number', 'w-24'],
                      ['inventory_quantity', 'number', 'w-20'],
                      ['image_url', 'url', 'w-44'],
                    ].map(([name, type, width]) => (
                      <td key={name} className="px-2 py-2">
                        <input type={type} value={row[name] ?? ''} disabled={Boolean(row.existing)} onChange={(event) => updateRow(row.key, name, event.target.value)} className={`${INPUT_CLASS} ${width} disabled:opacity-45`} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {errors.length > 0 && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/8 p-3">
          {errors.slice(0, 8).map((error) => <p key={error} className="text-[10px] font-bold text-red-600">{error}</p>)}
        </div>
      )}
      <ResultSummary report={report} />
      {rows.length > 0 && (
        <div className="flex justify-end">
          <button type="button" onClick={apply} disabled={saving || !rows.some((row) => row.enabled)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-violet-600 px-5 py-2.5 text-xs font-black text-white disabled:opacity-40">
            <CheckCircle2 size={15} /> {saving ? 'Procesando...' : `Guardar ${rows.filter((row) => row.enabled).length} combinaciones`}
          </button>
        </div>
      )}
    </div>
  );
}

function CsvTool({ product, lookups, saving, onApply }) {
  const [preview, setPreview] = useState(null);
  const [filename, setFilename] = useState('');
  const [report, setReport] = useState(null);
  const readFile = async (file) => {
    if (!file) return;
    setFilename(file.name);
    setPreview(previewProductCsv(await file.text(), { product, lookups }));
    setReport(null);
  };
  const apply = async () => {
    const direct = preview.rows.filter((row) => row.valid && !row.payload.presentation.contains_presentation_name);
    const composed = preview.rows.filter((row) => row.valid && row.payload.presentation.contains_presentation_name);
    try {
      setReport(await onApply([...direct, ...composed].map((row) => row.payload)));
    } catch {
      // The workspace reports transport and permission errors through its toast.
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-admin-border bg-admin-bg/45 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-sky-500/10 p-2 text-sky-600"><FileSpreadsheet size={18} /></div>
            <div>
              <h3 className="text-sm font-black text-admin-text">CSV del producto</h3>
              <p className="mt-1 max-w-xl text-[11px] text-admin-muted">Exporta el arbol actual o importa filas para esta familia. Los catálogos maestros deben existir previamente.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => downloadCsv(`${product.slug}-plantilla.csv`, createProductCsvTemplate(product))} className="inline-flex items-center gap-1.5 rounded-xl border border-admin-border px-3 py-2 text-[10px] font-black text-admin-text"><Download size={13} /> Plantilla</button>
            <button type="button" onClick={() => downloadCsv(`${product.slug}-catalogo.csv`, exportProductCsv(product))} className="inline-flex items-center gap-1.5 rounded-xl border border-admin-border px-3 py-2 text-[10px] font-black text-admin-text"><Download size={13} /> Exportar actual</button>
          </div>
        </div>
        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-admin-border bg-admin-card px-5 py-8 text-center hover:border-fiesta-magenta/40">
          <Upload size={24} className="text-fiesta-magenta" />
          <span className="mt-2 text-xs font-black text-admin-text">{filename || 'Seleccionar archivo CSV'}</span>
          <span className="mt-1 text-[10px] text-admin-muted">Primero se valida y muestra la vista previa. No se guarda automaticamente.</span>
          <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => readFile(event.target.files?.[0])} />
        </label>
      </section>

      {preview?.errors?.length > 0 && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/8 p-3">
          {preview.errors.map((error) => <p key={error} className="text-[10px] font-bold text-red-600">{error}</p>)}
        </div>
      )}
      {preview?.rows?.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-admin-border">
          <div className="flex items-center justify-between border-b border-admin-border bg-admin-bg/70 px-4 py-3">
            <div>
              <p className="text-xs font-black text-admin-text">Vista previa: {preview.rows.length} filas</p>
              <p className="text-[10px] text-admin-muted">{preview.validCount} validas, {preview.rejectedCount} con errores</p>
            </div>
            <button type="button" onClick={apply} disabled={saving || preview.validCount === 0} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-violet-600 px-4 py-2 text-[10px] font-black text-white disabled:opacity-40">
              <Upload size={13} /> {saving ? 'Importando...' : `Importar ${preview.validCount}`}
            </button>
          </div>
          <div className="max-h-96 overflow-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="sticky top-0 bg-admin-card text-[9px] font-black uppercase text-admin-muted">
                <tr><th className="px-3 py-2">Linea</th><th className="px-3 py-2">Estado</th><th className="px-3 py-2">Variante</th><th className="px-3 py-2">Presentacion</th><th className="px-3 py-2">Detalle</th></tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {preview.rows.map((row) => (
                  <tr key={row.lineNumber} className={row.valid ? 'bg-admin-card' : 'bg-red-500/5'}>
                    <td className="px-3 py-2 text-[10px] font-black text-admin-text">{row.lineNumber}</td>
                    <td className="px-3 py-2">{row.valid ? <span className="text-[9px] font-black text-emerald-600">{row.action}</span> : <span className="inline-flex items-center gap-1 text-[9px] font-black text-red-600"><AlertTriangle size={11} /> rechazada</span>}</td>
                    <td className="px-3 py-2 text-[10px] text-admin-text">{[row.source.gama, row.source.color_exacto, row.source.medida].filter(Boolean).join(' / ') || row.source.sku_variante}</td>
                    <td className="px-3 py-2 text-[10px] font-bold text-admin-text">{row.source.presentacion}</td>
                    <td className="px-3 py-2 text-[9px] text-red-600">{row.errors.join(' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      <ResultSummary report={report} />
    </div>
  );
}

export default function ProductBulkTools(props) {
  const [mode, setMode] = useState('generator');
  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-xl border border-admin-border bg-admin-bg/60 p-1">
        <button type="button" onClick={() => setMode('generator')} className={`rounded-lg px-3 py-1.5 text-[10px] font-black ${mode === 'generator' ? 'bg-admin-card text-fiesta-magenta shadow-sm' : 'text-admin-muted'}`}>Generador</button>
        <button type="button" onClick={() => setMode('csv')} className={`rounded-lg px-3 py-1.5 text-[10px] font-black ${mode === 'csv' ? 'bg-admin-card text-fiesta-magenta shadow-sm' : 'text-admin-muted'}`}>Importar / exportar CSV</button>
      </div>
      {mode === 'generator'
        ? <GeneratorTool {...props} />
        : <CsvTool {...props} />}
    </div>
  );
}

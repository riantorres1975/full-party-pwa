import { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';
import {
  createAdminCatalogDraft,
  getAdminCatalogResource,
  getAdminCatalogRowTitle,
  slugifyCatalogValue,
  validateAdminCatalogPayload,
} from '../../../services/catalog/adminCatalogModel.js';

function toInputDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function buildDraft(resourceKey, entity) {
  const draft = createAdminCatalogDraft(resourceKey);
  if (!entity) return draft;
  for (const field of getAdminCatalogResource(resourceKey).fields) {
    const value = entity[field.name];
    draft[field.name] = field.type === 'datetime-local'
      ? toInputDate(value)
      : value ?? (field.type === 'boolean' ? false : '');
  }
  return draft;
}

function FieldInput({
  field,
  value,
  error,
  disabled,
  lookupRows,
  resourceKey,
  entityId,
  onChange,
}) {
  const baseClass = `w-full rounded-xl border bg-admin-input px-3 py-2.5 text-sm text-admin-text outline-none transition-colors ${
    error ? 'border-red-400 focus:border-red-500' : 'border-admin-border focus:border-fiesta-magenta'
  } disabled:cursor-not-allowed disabled:opacity-60`;

  if (field.type === 'boolean') {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={value === true}
        disabled={disabled}
        onClick={() => onChange(value !== true)}
        className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm font-bold transition-colors ${
          value === true
            ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-600'
            : 'border-admin-border bg-admin-input text-admin-muted'
        }`}
      >
        <span>{value === true ? 'Si' : 'No'}</span>
        <span className={`h-5 w-9 rounded-full p-0.5 transition-colors ${
          value === true ? 'bg-emerald-500' : 'bg-admin-border'
        }`}>
          <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${
            value === true ? 'translate-x-4' : ''
          }`} />
        </span>
      </button>
    );
  }

  if (field.type === 'textarea') {
    return (
      <textarea
        rows={4}
        value={value ?? ''}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={`${baseClass} resize-none`}
      />
    );
  }

  if (field.type === 'select') {
    return (
      <select
        value={value ?? ''}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={baseClass}
      >
        <option value="">Selecciona una opcion</option>
        {field.options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    );
  }

  if (field.type === 'relation') {
    return (
      <select
        value={value ?? ''}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={baseClass}
      >
        <option value="">{field.nullable ? 'Sin categoria superior' : 'Selecciona una opcion'}</option>
        {lookupRows
          .filter((row) => !(resourceKey === field.resource && row.id === entityId))
          .map((row) => (
            <option key={row.id} value={row.id}>
              {getAdminCatalogRowTitle(field.resource, row)}
            </option>
          ))}
      </select>
    );
  }

  if (field.type === 'color') {
    return (
      <div className="flex gap-2">
        <input
          type="color"
          value={/^#[0-9A-Fa-f]{6}$/.test(value ?? '') ? value : '#e83e9c'}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="h-11 w-14 rounded-xl border border-admin-border bg-admin-input p-1"
        />
        <input
          type="text"
          value={value ?? ''}
          disabled={disabled}
          placeholder="#E83E9C"
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className={baseClass}
        />
      </div>
    );
  }

  return (
    <input
      type={field.type === 'slug' ? 'text' : field.type}
      step={field.step}
      value={value ?? ''}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={baseClass}
      placeholder={field.type === 'slug' ? 'se-genera-automaticamente' : undefined}
    />
  );
}
export default function CatalogEntityForm({
  resourceKey,
  entity,
  lookups,
  saving,
  canEdit,
  onSave,
  onClose,
}) {
  const resource = getAdminCatalogResource(resourceKey);
  const [draft, setDraft] = useState(() => buildDraft(resourceKey, entity));
  const [errors, setErrors] = useState({});
  const [slugTouched, setSlugTouched] = useState(Boolean(entity?.slug));

  useEffect(() => {
    setDraft(buildDraft(resourceKey, entity));
    setErrors({});
    setSlugTouched(Boolean(entity?.slug));
  }, [resourceKey, entity]);

  const updateField = (field, value) => {
    setDraft((current) => {
      const next = { ...current, [field.name]: value };
      if (field.name === resource.nameField && !slugTouched && 'slug' in current) {
        next.slug = slugifyCatalogValue(value);
      }
      return next;
    });
    if (field.name === 'slug') setSlugTouched(Boolean(value));
    setErrors((current) => ({ ...current, [field.name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = validateAdminCatalogPayload(resourceKey, draft, { entityId: entity?.id });
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }
    await onSave(result.payload, entity?.id ?? null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#120720]/55 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="catalog-entity-form-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="flex h-full w-full max-w-xl flex-col border-l border-admin-border bg-admin-card shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-admin-border px-5 py-5 sm:px-7">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fiesta-magenta">
              Catalogo V2
            </p>
            <h2 id="catalog-entity-form-title" className="mt-1 text-xl font-black text-admin-text">
              {entity ? `Editar ${resource.singular}` : `${resource.article} ${resource.singular}`}
            </h2>
            <p className="mt-1 text-xs text-admin-muted">{resource.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-admin-muted hover:bg-admin-elevated hover:text-admin-text"
            aria-label="Cerrar formulario"
          >
            <X size={20} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          <div className="grid gap-4 sm:grid-cols-2">
            {resource.fields.map((field) => {
              const wide = ['textarea', 'url'].includes(field.type);
              return (
                <label key={field.name} className={wide ? 'sm:col-span-2' : ''}>
                  <span className="mb-1.5 flex items-center gap-1 text-xs font-black text-admin-text">
                    {field.label}
                    {field.required && <span className="text-fiesta-magenta">*</span>}
                  </span>
                  <FieldInput
                    field={field}
                    value={draft[field.name]}
                    error={errors[field.name]}
                    disabled={!canEdit || saving}
                    lookupRows={lookups[field.resource] ?? []}
                    resourceKey={resourceKey}
                    entityId={entity?.id}
                    onChange={(value) => updateField(field, value)}
                  />
                  {errors[field.name] && (
                    <span className="mt-1 block text-[11px] font-bold text-red-500">
                      {errors[field.name]}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-admin-border bg-admin-bg/70 px-5 py-4 sm:px-7">
          <p className="hidden text-[11px] text-admin-muted sm:block">
            Los cambios se publican de acuerdo con el estado visible.
          </p>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-admin-border px-4 py-2.5 text-sm font-black text-admin-muted hover:bg-admin-elevated"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canEdit || saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-violet-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-pink-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}

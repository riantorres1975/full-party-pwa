import { useEffect } from 'react';
import { Store, MapPin, Share2, Plus, Trash2, Save, ExternalLink } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';
import PageHeader from '../../../components/admin/PageHeader';
import { useTiendaConfig } from './hooks/useTiendaConfig';
import { usePermission } from '../../../hooks/usePermission';
import { useConfirm } from '../../../hooks/useConfirm';
import ConfirmModal from '../../../components/ui/ConfirmModal';

function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-admin-card rounded-xl border border-admin-border overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-admin-border">
        <Icon size={15} className="text-admin-muted" />
        <h3 className="text-sm font-body font-black text-admin-text">{title}</h3>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  );
}

function Field({ id, label, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-body font-bold text-admin-muted uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-admin-muted mt-1">{hint}</p>}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 rounded-lg border border-admin-border bg-admin-bg text-admin-text text-sm font-body focus:outline-none focus:ring-2 focus:ring-fiesta-magenta/40 transition-colors';

export default function TiendaPage() {
  const { t } = useLanguage();
  const setBreadcrumb = useBreadcrumb();
  const canEdit = usePermission('configuracion.edit');
  const { isOpen, config, confirm, onConfirm, onCancel } = useConfirm();
  const {
    info, sucursales, redes,
    loading, saving, isDirty,
    updateInfo, updateSucursal, updateRedes,
    addSucursal, removeSucursal,
    save,
  } = useTiendaConfig();

  useEffect(() => {
    setBreadcrumb([t('tienda.title')]);
  }, [setBreadcrumb, t]);

  useEffect(() => {
    if (!canEdit || !isDirty) return undefined;
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [canEdit, isDirty]);

  const handleRemoveSucursal = async (id) => {
    const accepted = await confirm({
      title: t('tienda.eliminarSucursal'),
      message: t('tienda.eliminarSucursalConfirm'),
      confirmLabel: t('tienda.eliminarSucursal'),
      variant: 'danger',
    });
    if (accepted) removeSucursal(id);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-7 h-7 rounded-full border-[3px] border-purple-700 border-t-purple-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('tienda.title')}
        subtitle={t('tienda.subtitle')}
        actions={canEdit && (
          <div className="flex items-center gap-3">
            {isDirty && (
              <span className="hidden sm:inline text-xs font-body font-bold text-amber-500" aria-live="polite">
                {t('tienda.cambiosPendientes')}
              </span>
            )}
            <button
              type="button"
              onClick={save}
              disabled={saving || !isDirty}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-fiesta-magenta text-white text-sm font-body font-bold hover:bg-fiesta-magenta/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={14} />
              {saving ? t('common.saving') : t('tienda.guardar')}
            </button>
          </div>
        )}
      />

      {!canEdit && (
        <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm font-body text-admin-text">
          {t('tienda.soloLectura')}
        </div>
      )}

      <fieldset disabled={!canEdit} className={`space-y-5 ${!canEdit ? 'opacity-75' : ''}`}>

      {/* Info general */}
      <Section icon={Store} title={t('tienda.seccion.info')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="tienda-nombre" label={t('tienda.campo.nombre')}>
            <input
              id="tienda-nombre"
              type="text"
              value={info.nombre}
              onChange={e => updateInfo('nombre', e.target.value)}
              placeholder="Full Party"
              className={inputCls}
            />
          </Field>
          <Field id="tienda-whatsapp" label={t('tienda.campo.whatsapp')} hint={t('tienda.campo.whatsappHint')}>
            <input
              id="tienda-whatsapp"
              type="text"
              value={info.whatsapp}
              onChange={e => updateInfo('whatsapp', e.target.value)}
              placeholder="521XXXXXXXXXX"
              className={inputCls}
            />
          </Field>
          <Field id="tienda-horario" label={t('tienda.campo.horario')}>
            <input
              id="tienda-horario"
              type="text"
              value={info.horario}
              onChange={e => updateInfo('horario', e.target.value)}
              placeholder="Lun–Sáb 9am–7pm"
              className={inputCls}
            />
          </Field>
          <Field id="tienda-direccion" label={t('tienda.campo.direccion')}>
            <input
              id="tienda-direccion"
              type="text"
              value={info.direccion}
              onChange={e => updateInfo('direccion', e.target.value)}
              placeholder="Calle, Colonia, Ciudad"
              className={inputCls}
            />
          </Field>
          <Field id="tienda-maps-url" label={t('tienda.campo.mapsUrl')} hint={t('tienda.campo.mapsHint')}>
            <input
              id="tienda-maps-url"
              type="url"
              value={info.maps_url}
              onChange={e => updateInfo('maps_url', e.target.value)}
              placeholder="https://maps.google.com/..."
              className={inputCls}
            />
          </Field>
        </div>
      </Section>

      {/* Sucursales */}
      <Section icon={MapPin} title={t('tienda.seccion.sucursales')}>
        <div className="space-y-4">
          {sucursales.map((suc, i) => (
            <div key={suc.id} className="rounded-lg border border-admin-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-body font-black text-admin-text">
                  {t('tienda.sucursal')} {i + 1}
                  {suc.badge && <span className="ml-2 text-xs font-bold text-admin-muted">— {suc.badge}</span>}
                </span>
                {sucursales.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSucursal(suc.id)}
                    aria-label={t('tienda.eliminarSucursal')}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-admin-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field id={`sucursal-${suc.id}-badge`} label={t('tienda.campo.badge')}>
                  <input id={`sucursal-${suc.id}-badge`} type="text" value={suc.badge} onChange={e => updateSucursal(suc.id, 'badge', e.target.value)} placeholder="Sucursal Centro" className={inputCls} />
                </Field>
                <Field id={`sucursal-${suc.id}-nombre`} label={t('tienda.campo.nombre')}>
                  <input id={`sucursal-${suc.id}-nombre`} type="text" value={suc.nombre} onChange={e => updateSucursal(suc.id, 'nombre', e.target.value)} placeholder="Av. Principal 123" className={inputCls} />
                </Field>
                <Field id={`sucursal-${suc.id}-direccion`} label={t('tienda.campo.direccion')}>
                  <input id={`sucursal-${suc.id}-direccion`} type="text" value={suc.direccion} onChange={e => updateSucursal(suc.id, 'direccion', e.target.value)} placeholder="Dirección completa" className={inputCls} />
                </Field>
                <Field id={`sucursal-${suc.id}-maps-url`} label={t('tienda.campo.mapsUrl')}>
                  <div className="flex gap-2">
                    <input id={`sucursal-${suc.id}-maps-url`} type="url" value={suc.maps_url} onChange={e => updateSucursal(suc.id, 'maps_url', e.target.value)} placeholder="https://maps.google.com/..." className={inputCls} />
                    {suc.maps_url && (
                      <a href={suc.maps_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-9 h-9 rounded-lg border border-admin-border text-admin-muted hover:text-admin-text hover:bg-admin-elevated transition-colors shrink-0">
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                </Field>
                <Field id={`sucursal-${suc.id}-facebook`} label="Facebook">
                  <input id={`sucursal-${suc.id}-facebook`} type="url" value={suc.facebook} onChange={e => updateSucursal(suc.id, 'facebook', e.target.value)} placeholder="https://facebook.com/..." className={inputCls} />
                </Field>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addSucursal}
            className="flex items-center gap-2 text-sm font-body font-bold text-fiesta-magenta hover:text-fiesta-magenta/80 transition-colors"
          >
            <Plus size={14} />
            {t('tienda.agregarSucursal')}
          </button>
        </div>
      </Section>

      {/* Redes sociales */}
      <Section icon={Share2} title={t('tienda.seccion.redes')}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field id="redes-facebook" label="Facebook">
            <input id="redes-facebook" type="url" value={redes.facebook} onChange={e => updateRedes('facebook', e.target.value)} placeholder="https://facebook.com/..." className={inputCls} />
          </Field>
          <Field id="redes-instagram" label="Instagram">
            <input id="redes-instagram" type="url" value={redes.instagram} onChange={e => updateRedes('instagram', e.target.value)} placeholder="https://instagram.com/..." className={inputCls} />
          </Field>
          <Field id="redes-tiktok" label="TikTok">
            <input id="redes-tiktok" type="url" value={redes.tiktok} onChange={e => updateRedes('tiktok', e.target.value)} placeholder="https://tiktok.com/..." className={inputCls} />
          </Field>
        </div>
      </Section>

      {/* Guardar sticky bottom mobile */}
      {canEdit && <div className="sm:hidden fixed bottom-16 right-4 z-20">
        <button
          type="button"
          onClick={save}
          disabled={saving || !isDirty}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-fiesta-magenta text-white text-sm font-body font-bold shadow-elevated hover:bg-fiesta-magenta/90 disabled:opacity-60 transition-colors"
        >
          <Save size={14} />
          {saving ? t('common.saving') : t('tienda.guardar')}
        </button>
      </div>}
      </fieldset>

      <ConfirmModal
        open={isOpen}
        {...config}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </div>
  );
}

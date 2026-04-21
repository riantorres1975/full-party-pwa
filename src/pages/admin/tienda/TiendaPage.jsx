import { useEffect } from 'react';
import { Store, MapPin, Share2, Plus, Trash2, Save, ExternalLink } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';
import PageHeader from '../../../components/admin/PageHeader';
import { useTiendaConfig } from './hooks/useTiendaConfig';

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

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-body font-bold text-admin-muted uppercase tracking-wide mb-1.5">
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
  const {
    info, sucursales, redes,
    loading, saving,
    updateInfo, updateSucursal, updateRedes,
    addSucursal, removeSucursal,
    save,
  } = useTiendaConfig();

  useEffect(() => {
    setBreadcrumb([t('tienda.title')]);
  }, [setBreadcrumb, t]);

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
        actions={
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-fiesta-magenta text-white text-sm font-body font-bold hover:bg-fiesta-magenta/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <Save size={14} />
            {saving ? t('common.saving') : t('tienda.guardar')}
          </button>
        }
      />

      {/* Info general */}
      <Section icon={Store} title={t('tienda.seccion.info')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t('tienda.campo.nombre')}>
            <input
              type="text"
              value={info.nombre}
              onChange={e => updateInfo('nombre', e.target.value)}
              placeholder="Full Party"
              className={inputCls}
            />
          </Field>
          <Field label={t('tienda.campo.whatsapp')} hint={t('tienda.campo.whatsappHint')}>
            <input
              type="text"
              value={info.whatsapp}
              onChange={e => updateInfo('whatsapp', e.target.value)}
              placeholder="521XXXXXXXXXX"
              className={inputCls}
            />
          </Field>
          <Field label={t('tienda.campo.horario')}>
            <input
              type="text"
              value={info.horario}
              onChange={e => updateInfo('horario', e.target.value)}
              placeholder="Lun–Sáb 9am–7pm"
              className={inputCls}
            />
          </Field>
          <Field label={t('tienda.campo.direccion')}>
            <input
              type="text"
              value={info.direccion}
              onChange={e => updateInfo('direccion', e.target.value)}
              placeholder="Calle, Colonia, Ciudad"
              className={inputCls}
            />
          </Field>
          <Field label={t('tienda.campo.mapsUrl')} hint={t('tienda.campo.mapsHint')}>
            <input
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
                    onClick={() => removeSucursal(suc.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-admin-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label={t('tienda.campo.badge')}>
                  <input type="text" value={suc.badge} onChange={e => updateSucursal(suc.id, 'badge', e.target.value)} placeholder="Sucursal Centro" className={inputCls} />
                </Field>
                <Field label={t('tienda.campo.nombre')}>
                  <input type="text" value={suc.nombre} onChange={e => updateSucursal(suc.id, 'nombre', e.target.value)} placeholder="Av. Principal 123" className={inputCls} />
                </Field>
                <Field label={t('tienda.campo.direccion')}>
                  <input type="text" value={suc.direccion} onChange={e => updateSucursal(suc.id, 'direccion', e.target.value)} placeholder="Dirección completa" className={inputCls} />
                </Field>
                <Field label={t('tienda.campo.mapsUrl')}>
                  <div className="flex gap-2">
                    <input type="url" value={suc.maps_url} onChange={e => updateSucursal(suc.id, 'maps_url', e.target.value)} placeholder="https://maps.google.com/..." className={inputCls} />
                    {suc.maps_url && (
                      <a href={suc.maps_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-9 h-9 rounded-lg border border-admin-border text-admin-muted hover:text-admin-text hover:bg-admin-elevated transition-colors shrink-0">
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                </Field>
                <Field label="Facebook">
                  <input type="url" value={suc.facebook} onChange={e => updateSucursal(suc.id, 'facebook', e.target.value)} placeholder="https://facebook.com/..." className={inputCls} />
                </Field>
              </div>
            </div>
          ))}
          <button
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
          <Field label="Facebook">
            <input type="url" value={redes.facebook} onChange={e => updateRedes('facebook', e.target.value)} placeholder="https://facebook.com/..." className={inputCls} />
          </Field>
          <Field label="Instagram">
            <input type="url" value={redes.instagram} onChange={e => updateRedes('instagram', e.target.value)} placeholder="https://instagram.com/..." className={inputCls} />
          </Field>
          <Field label="TikTok">
            <input type="url" value={redes.tiktok} onChange={e => updateRedes('tiktok', e.target.value)} placeholder="https://tiktok.com/..." className={inputCls} />
          </Field>
        </div>
      </Section>

      {/* Guardar sticky bottom mobile */}
      <div className="sm:hidden fixed bottom-16 right-4 z-20">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-fiesta-magenta text-white text-sm font-body font-bold shadow-elevated hover:bg-fiesta-magenta/90 disabled:opacity-60 transition-colors"
        >
          <Save size={14} />
          {saving ? t('common.saving') : t('tienda.guardar')}
        </button>
      </div>
    </div>
  );
}

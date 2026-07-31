/** Wordmark editorial para representar una marca sin inventar su logotipo. */
export default function BrandCard({ nombre, desc, color, code, tag, featured = false, index }) {
  return (
    <article
      className={`lp-brand-card${featured ? ' lp-brand-card--featured' : ''}`}
      style={{ '--brand-accent': color }}
    >
      <div className="lp-brand-card-head">
        <span className="lp-brand-index">{String(index + 1).padStart(2, '0')}</span>
        <span className="lp-brand-tag">{tag}</span>
      </div>

      <div className="lp-brand-identity">
        <p className="lp-brand-wordmark">{nombre}</p>
        <div className="lp-brand-seal" aria-hidden="true">
          <span>{code}</span>
        </div>
      </div>

      <p className="lp-brand-description">{desc}</p>

      <div className="lp-brand-card-foot">
        <span>{featured ? 'Marca principal en globos de látex' : 'Selección Full Party'}</span>
        <i aria-hidden="true" />
      </div>
    </article>
  );
}

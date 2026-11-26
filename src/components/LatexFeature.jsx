import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BALLOON_ARCH_GUIDE_SLUG, LATEX_CATALOG_PATH } from '../data/siteLinks';
import './SitePages.css';

export function BalloonPhoto({ className }) {
  return (
    <img
      className={className}
      src="/landing-globos-640.webp"
      width="640"
      height="480"
      loading="lazy"
      decoding="async"
      alt="Globos de distintos colores y tamaños en una decoración de fiesta"
    />
  );
}

export default function LatexFeature() {
  return (
    <section className="site-latex-feature" aria-labelledby="latex-feature-title">
      <BalloonPhoto className="site-latex-feature__photo" />
      <div className="site-latex-feature__content">
        <p className="site-latex-feature__label">Globos de látex</p>
        <h2 className="font-display" id="latex-feature-title">Dale forma a tu decoración</h2>
        <p>Combina colores y medidas para armar arcos, guirnaldas o racimos. Los globos pequeños rellenan espacios y los grandes crean puntos de acento.</p>
        <div className="site-actions">
          <Link to={LATEX_CATALOG_PATH} className="site-button site-button--primary">
            Explorar globos de látex <ArrowRight size={17} aria-hidden="true" />
          </Link>
          <Link to={`/blog/${BALLOON_ARCH_GUIDE_SLUG}`} className="site-button site-button--outline">
            Cómo armar un arco
          </Link>
        </div>
      </div>
    </section>
  );
}

import { ArrowLeft, MessageCircle } from 'lucide-react';
import { useLayoutEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { buildContactWhatsAppUrl } from '../data/siteContact';
import PublicSiteHeader from './PublicSiteHeader';
import SiteFooter from './SiteFooter';
import './SitePages.css';

export function SitePageHero({ title, description, back, meta, children }) {
  return (
    <header className="site-page-hero">
      <div className="site-page-container site-page-hero__inner">
        <Link to={back?.to ?? '/'} className="site-page-hero__back">
          <ArrowLeft size={16} aria-hidden="true" /> {back?.label ?? 'Volver al inicio'}
        </Link>
        {meta}
        <h1 className="font-display">{title}</h1>
        <p>{description}</p>
        {children && <div className="site-actions">{children}</div>}
      </div>
    </header>
  );
}

export function SiteCallout({ title, description, children }) {
  return (
    <section className="site-callout">
      <div>
        <h2 className="font-display">{title}</h2>
        <p>{description}</p>
      </div>
      <div className="site-actions">{children}</div>
    </section>
  );
}

export function SiteWhatsAppLink({ message, children }) {
  return (
    <a href={buildContactWhatsAppUrl(message)} target="_blank" rel="noopener noreferrer" className="site-button site-button--outline">
      <MessageCircle size={17} aria-hidden="true" /> {children}
    </a>
  );
}

export default function SiteLayout({ children }) {
  const { pathname, hash } = useLocation();

  useLayoutEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [pathname, hash]);

  return (
    <div className="site-page min-h-screen flex flex-col">
      <a className="site-skip-link" href="#site-main">Saltar al contenido</a>
      <PublicSiteHeader />

      <main className="flex-1" id="site-main" tabIndex={-1}>
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}

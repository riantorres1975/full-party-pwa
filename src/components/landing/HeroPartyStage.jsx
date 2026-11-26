import { useEffect, useState } from 'react';
import { PartyPopper } from 'lucide-react';

const CONFETTI_COLORS = ['#f83a98', '#a456f2', '#ffd34c', '#43d6ce', '#ff8f56', '#fff4fb'];
const CONFETTI_PATHS = [
  [-142, -36, -85], [-174, -68, 103], [-119, -139, 155], [-158, -167, -120],
  [-105, -91, 80], [-187, -13, -145], [-106, 18, 115], [-81, -175, -170],
  [-71, -57, 80], [-40, -151, 110], [-6, -115, -105], [23, -75, 165],
  [-145, -115, 95], [-37, -73, -190], [-54, -24, 85], [20, -38, 72],
  [-112, -186, -90], [-60, -131, 153], [-27, -190, 120], [-61, 12, -80],
];

export default function HeroPartyStage() {
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    if (!burst) return undefined;
    const timer = window.setTimeout(() => setBurst(0), 1050);
    return () => window.clearTimeout(timer);
  }, [burst]);

  return (
    <div className="lp-party-stage">
      <picture className="lp-hero-media" aria-hidden="true">
        <img
          src="/landing-globos.webp"
          srcSet="/landing-globos-640.webp 640w, /landing-globos.webp 1280w"
          sizes="(min-width: 1180px) 550px, (min-width: 880px) 46vw, calc(100vw - 72px)"
          width="1280"
          height="960"
          fetchPriority="high"
          alt=""
        />
      </picture>
      <div className="lp-party-stage__trim" aria-hidden="true">
        <span className="lp-party-spark lp-party-spark--large" />
        <span className="lp-party-spark lp-party-spark--small" />
        <span className="lp-party-stage__curl" />
      </div>
      {burst > 0 && (
        <div className="lp-party-burst" key={burst} aria-hidden="true">
          {CONFETTI_PATHS.map(([x, y, rotation], index) => (
            <span
              key={index}
              className="lp-party-burst__piece"
              style={{
                '--piece-color': CONFETTI_COLORS[index % CONFETTI_COLORS.length],
                '--piece-x': x,
                '--piece-y': y,
                '--piece-rotation': `${rotation}deg`,
                '--piece-delay': `${(index % 5) * 24}ms`,
              }}
            />
          ))}
        </div>
      )}
      <button type="button" className="lp-party-stage__button" onClick={() => setBurst(current => current + 1)}>
        <PartyPopper size={17} aria-hidden="true" />
        Lanzar confeti
      </button>
      <span className="sr-only" role="status">{burst > 0 ? 'Confeti lanzado' : ''}</span>
    </div>
  );
}

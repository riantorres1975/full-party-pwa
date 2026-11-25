export default function NovedadesPlaceholder() {
  return (
    <section className="lp-section-white lp-novedades-section px-5 pt-8 pb-16" aria-hidden="true">
      <div className="max-w-[1100px] mx-auto">
        <p className="font-display text-3xl sm:text-4xl text-[#241238] mb-7">Descubre algo nuevo</p>
        <div className="lp-novedades-shell">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className={`lp-novedad-skeleton ${item > 1 ? 'hidden sm:block' : ''}`} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

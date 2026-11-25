import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBanners } from '../services/banners';

const INTERVAL_MS = 6000; // tiempo que se ve cada diapositiva
const SWIPE_THRESHOLD_PX = 50; // cuánto hay que deslizar el dedo para cambiar de diapositiva

// El link de cada diapositiva puede ser una ruta interna (Link, sin recargar),
// un ancla de la misma página ("#productos") o una URL externa https (pestaña nueva).
function SlideLink({ href, className, children }) {
  if (href.startsWith('/')) {
    return (
      <Link className={className} to={href}>
        {children}
      </Link>
    );
  }
  if (href.startsWith('#')) {
    return (
      <a className={className} href={href}>
        {children}
      </a>
    );
  }
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="sr-only"> (se abre en una pestaña nueva)</span>
    </a>
  );
}

// Carrusel de novedades y promociones del inicio. Las diapositivas vienen de /banners.json
// (ver src/services/banners.js), por lo que se editan sin tocar el código.
export default function Banner() {
  const [slides, setSlides] = useState(null); // null mientras se cargan
  const [index, setIndex] = useState(0);
  // Quien prefiere menos movimiento empieza con el avance automático en pausa.
  const [paused, setPaused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  // Pausa temporal mientras el mouse está encima o hay un elemento del carrusel con foco.
  const [interacting, setInteracting] = useState(false);
  const startX = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    getBanners(controller.signal)
      .then(setSlides)
      .catch((error) => {
        if (error.name !== 'AbortError') setSlides([]);
      });
    return () => controller.abort();
  }, []);

  const total = slides?.length ?? 0;

  // Avance automático: un temporizador que se reinicia cada vez que cambia la diapositiva.
  useEffect(() => {
    if (total < 2 || paused || interacting) return undefined;
    const t = setTimeout(() => setIndex((i) => (i + 1) % total), INTERVAL_MS);
    return () => clearTimeout(t);
  }, [index, total, paused, interacting]);

  const next = () => setIndex((i) => (i + 1) % total);
  const prev = () => setIndex((i) => (i - 1 + total) % total);

  // Deslizar con el dedo (o arrastrar con el mouse) cambia de diapositiva.
  const onPointerDown = (e) => {
    startX.current = e.clientX;
  };
  const onPointerUp = (e) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) > SWIPE_THRESHOLD_PX) {
      if (dx < 0) next();
      else prev();
    }
  };

  const onKeyDown = (e) => {
    if (total < 2) return;
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  };

  // Mientras carga se reserva el espacio para que la página no "salte".
  if (slides === null) return <div className="banner banner--cargando" aria-hidden="true" />;

  // Sin diapositivas vigentes no se muestra el banner.
  if (total === 0) return null;

  const playing = !paused && !interacting;

  return (
    <section
      className="banner"
      aria-roledescription="carousel"
      aria-label="Novedades y promociones"
      onKeyDown={onKeyDown}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setInteracting(true)}
      onPointerLeave={() => setInteracting(false)}
      onFocus={() => setInteracting(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setInteracting(false);
      }}
    >
      {/* Todas las diapositivas ocupan la misma celda: el alto es el de la más alta y no hay saltos al cambiar */}
      <div
        className="banner__slides"
        aria-live={playing ? 'off' : 'polite'}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          startX.current = null;
        }}
      >
        {slides.map((slide, i) => {
          const active = i === index;
          const classes = [
            'banner__slide',
            `banner__slide--${slide.theme}`,
            slide.image && slide.imageFit === 'cover' ? 'banner__slide--foto' : '',
            slide.image ? '' : 'banner__slide--solo-texto',
            active ? 'banner__slide--activa' : '',
          ];

          return (
            <div
              key={slide.id}
              className={classes.filter(Boolean).join(' ')}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} de ${total}`}
              // React 18 no soporta el booleano inert: se pasa como atributo de texto.
              inert={active ? undefined : ''}
            >
              <div className="banner__texto">
                <h2 className="banner__titulo">{slide.title}</h2>
                {slide.text && <p className="banner__descripcion">{slide.text}</p>}
                {slide.buttonText && slide.link && (
                  <SlideLink className="banner__boton" href={slide.link}>
                    {slide.buttonText}
                  </SlideLink>
                )}
              </div>

              {slide.image && (
                <img
                  className="banner__imagen"
                  src={slide.image}
                  alt={slide.imageAlt}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  draggable="false"
                />
              )}
            </div>
          );
        })}
      </div>

      {total > 1 && (
        <div className="banner__controles">
          <button type="button" className="banner__flecha" onClick={prev} aria-label="Diapositiva anterior">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>

          <div className="banner__puntos" role="group" aria-label="Elegir diapositiva">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                className="banner__punto"
                onClick={() => setIndex(i)}
                aria-label={`Ir a la diapositiva ${i + 1}`}
                aria-current={i === index}
              />
            ))}
          </div>

          <button type="button" className="banner__flecha" onClick={next} aria-label="Diapositiva siguiente">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            type="button"
            className="banner__flecha banner__pausa"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? 'Reanudar el avance automático' : 'Pausar el avance automático'}
          >
            {paused ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path className="banner__relleno" d="M8 5l11 7-11 7z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path className="banner__relleno" d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
              </svg>
            )}
          </button>
        </div>
      )}
    </section>
  );
}

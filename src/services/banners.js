// Banners del inicio (carrusel de novedades y promociones).
//
// Las diapositivas NO están escritas en el código: se leen de /banners.json (carpeta public) o, si existe
// la variable VITE_BANNERS_URL, de esa URL remota. Así se cambian, agregan o quitan sin tocar el código.
// Si no se puede leer nada, se muestra una diapositiva de respaldo para que el inicio nunca quede sin banner.

const BANNERS_URL = import.meta.env.VITE_BANNERS_URL || '/banners.json';
const MAX_SLIDES = 10;

const THEMES = ['arena', 'niebla', 'grafito'];
const FITS = ['contain', 'cover'];

const FALLBACK = [
  {
    id: 'respaldo',
    title: 'Joyas en plata que acompañan todos los días',
    text: 'Anillos, aros, collares, pulseras y charms en Plata 925.',
    buttonText: 'Ver productos',
    link: '#productos',
    image: '/img/cat-27.jpg',
    imageAlt: 'Aros de plata sobre una tarjeta de eunoia',
    imageFit: 'cover',
    theme: 'arena',
  },
];

// Solo se aceptan rutas internas ("/category/aros"), anclas ("#productos") o https.
// Así un JSON mal escrito (o manipulado) no puede inyectar, por ejemplo, "javascript:...".
const isSafeLink = (v) =>
  typeof v === 'string' && (/^\/(?!\/)/.test(v) || /^#[\w-]+$/.test(v) || /^https:\/\//i.test(v));

// Para las imágenes, solo rutas internas o https.
const isSafeImage = (v) => typeof v === 'string' && (/^\/(?!\/)/.test(v) || /^https:\/\//i.test(v));

// ¿Hoy está dentro del período de la diapositiva? ("from" y "to" son opcionales, formato AAAA-MM-DD)
const isCurrent = (slide, now = new Date()) => {
  const from = slide.from ? new Date(`${slide.from}T00:00:00`) : null;
  const to = slide.to ? new Date(`${slide.to}T23:59:59`) : null;
  if (from && !Number.isNaN(from.getTime()) && now < from) return false;
  if (to && !Number.isNaN(to.getTime()) && now > to) return false;
  return true;
};

// Limpia lo que llega del JSON: descarta lo inválido y completa lo que falta.
export const normalizeSlides = (data) => {
  const list = Array.isArray(data) ? data : data?.slides;
  if (!Array.isArray(list)) return [];

  return list
    .filter((s) => s && typeof s.title === 'string' && s.title.trim() !== '')
    .filter((s) => s.active !== false && isCurrent(s))
    .slice(0, MAX_SLIDES)
    .map((s, i) => ({
      id: String(s.id ?? `slide-${i}`),
      title: s.title.trim(),
      text: typeof s.text === 'string' ? s.text : '',
      buttonText: typeof s.buttonText === 'string' ? s.buttonText : '',
      link: isSafeLink(s.link) ? s.link : '',
      image: isSafeImage(s.image) ? s.image : '',
      imageAlt: typeof s.imageAlt === 'string' ? s.imageAlt : '',
      imageFit: FITS.includes(s.imageFit) ? s.imageFit : 'cover',
      theme: THEMES.includes(s.theme) ? s.theme : 'arena',
    }));
};

// Devuelve las diapositivas vigentes. Ante cualquier error de lectura devuelve el respaldo.
export const getBanners = async (signal) => {
  try {
    // no-cache: el navegador siempre revalida, así los cambios del JSON se ven al recargar.
    const res = await fetch(BANNERS_URL, { signal, cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    // Un JSON válido sin nada vigente significa "sin banner" a propósito.
    return normalizeSlides(await res.json());
  } catch (error) {
    // Una lectura cancelada (el componente se desmontó) no es un error real.
    if (error.name === 'AbortError') throw error;
    return FALLBACK;
  }
};

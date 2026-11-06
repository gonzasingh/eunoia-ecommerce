// Placeholder para joyas sin foto.
export const PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 3"><rect width="4" height="3" fill="#ececec"/><text x="2" y="1.72" font-size=".34" text-anchor="middle" fill="#b5b5b5" font-family="Georgia,serif">eunoia</text></svg>'
  );

// Foto para listados: miniatura subida desde el panel, o la foto estática de /public/img.
export const photoOf = (p) => (p && (p.thumb || p.image)) || PLACEHOLDER;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('El archivo no es una imagen válida.'));
      img.onload = () => resolve(img);
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function scale(img, maxWidth, quality) {
  const k = Math.min(1, maxWidth / img.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * k);
  canvas.height = Math.round(img.height * k);
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}

// Achica la foto: "full" para la página del producto y "thumb" para los listados.
// Ambas quedan muy por debajo del límite de 1 MB por documento de Firestore.
export async function makePhoto(file) {
  const img = await loadImage(file);
  return { full: scale(img, 720, 0.78), thumb: scale(img, 360, 0.72) };
}

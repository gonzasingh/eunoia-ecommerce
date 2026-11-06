import { collection, doc, writeBatch, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { makePhoto } from '../utils/image';

// Alta de una joya. El costo va en una colección aparte (solo la ven los socios).
export async function createProduct({ name, category, price, cost, stock, lot, photoFile }) {
  const ref = doc(collection(db, 'products'));
  const batch = writeBatch(db);
  const data = {
    name: name.trim(),
    category,
    price: Number(price),
    stock: Number(stock),
    lot,
    description: '',
    image: null,
    thumb: null,
    photoFull: false,
    order: Date.now(),
    createdAt: Date.now(),
  };
  if (photoFile && photoFile.size) {
    const { full, thumb } = await makePhoto(photoFile);
    data.thumb = thumb;
    data.photoFull = true;
    batch.set(doc(db, 'productImages', ref.id), { data: full });
  }
  batch.set(ref, data);
  batch.set(doc(db, 'costs', ref.id), { cost: Number(cost) || 0 });
  await batch.commit();
  return ref.id;
}

// Edición de datos de una joya (y su costo).
export async function updateProduct(id, patch, cost) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'products', id), { ...patch, updatedAt: Date.now() });
  if (cost !== undefined) batch.set(doc(db, 'costs', id), { cost: Number(cost) || 0 });
  await batch.commit();
}

export const saveCost = (id, cost) => writeBatch(db).set(doc(db, 'costs', id), { cost: Number(cost) || 0 }).commit();

// Reemplaza (o sube por primera vez) la foto.
export async function replacePhoto(id, file) {
  const { full, thumb } = await makePhoto(file);
  const batch = writeBatch(db);
  batch.set(doc(db, 'productImages', id), { data: full });
  batch.update(doc(db, 'products', id), { thumb, image: null, photoFull: true, updatedAt: Date.now() });
  await batch.commit();
}

export async function removePhoto(id) {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'productImages', id));
  batch.update(doc(db, 'products', id), { thumb: null, image: null, photoFull: false, updatedAt: Date.now() });
  await batch.commit();
}

export async function deleteProduct(id) {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'products', id));
  batch.delete(doc(db, 'costs', id));
  batch.delete(doc(db, 'productImages', id));
  await batch.commit();
}

// Suma o resta unidades de stock (nunca deja negativo desde la pantalla).
export const adjustStock = (id, delta) => updateDoc(doc(db, 'products', id), { stock: increment(delta) });

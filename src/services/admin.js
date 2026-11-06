import { addDoc, collection, deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

// ---- Lotes ----
export const addLot = (name) => addDoc(collection(db, 'lots'), { name: name.trim(), order: Date.now() });
export const renameLot = (id, name) => updateDoc(doc(db, 'lots', id), { name: name.trim() });
export const deleteLot = (id) => deleteDoc(doc(db, 'lots', id));

// ---- Caja ----
export const addMovement = (m) => addDoc(collection(db, 'movements'), { ...m, createdAt: Date.now() });

// Saldos inicial y real de efectivo y cuenta (settings/cash).
export const saveCash = (patch) => setDoc(doc(db, 'settings', 'cash'), patch, { merge: true });

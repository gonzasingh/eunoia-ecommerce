import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

// Suscripción en tiempo real a una colección.
export function useCollection(name, enabled = true) {
  const [state, setState] = useState({ data: [], loading: true, error: null });

  useEffect(() => {
    if (!db || !enabled) {
      setState({ data: [], loading: false, error: null });
      return undefined;
    }
    setState((s) => ({ ...s, loading: true }));
    return onSnapshot(
      collection(db, name),
      (snap) =>
        setState({ data: snap.docs.map((d) => ({ id: d.id, ...d.data() })), loading: false, error: null }),
      (error) => setState({ data: [], loading: false, error })
    );
  }, [name, enabled]);

  return state;
}

// Suscripción en tiempo real a un documento.
export function useDocument(coll, id, enabled = true) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    if (!db || !enabled) {
      setState({ data: null, loading: false, error: null });
      return undefined;
    }
    return onSnapshot(
      doc(db, coll, id),
      (snap) => setState({ data: snap.exists() ? snap.data() : null, loading: false, error: null }),
      (error) => setState({ data: null, loading: false, error })
    );
  }, [coll, id, enabled]);

  return state;
}

// Carga en Firestore el inventario y las ventas reales del Excel (EUNOIA_Inventario_y_Ventas.xlsx).
//
// Uso:   npm run seed            -> crea lo que falte (no pisa lo que ya existe)
//        npm run seed -- --force -> pisa todo con los datos del archivo (¡resetea el stock!)
//
// Se identifica con el mail y la contraseña de un socio (Kiara o Matías), porque las reglas de
// Firestore solo permiten escribir a ellos. La contraseña no se guarda en ningún lado.
import { readFile } from 'node:fs/promises';
import readline from 'node:readline';
import { stdin, stdout } from 'node:process';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';

const env = process.env;
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};
if (!config.apiKey || !config.projectId) {
  console.error('Falta completar el archivo .env (copiá .env.example a .env y cargá las variables de Firebase).');
  process.exit(1);
}

const force = process.argv.includes('--force');
const data = JSON.parse(await readFile(new URL('./seed-data.json', import.meta.url), 'utf8'));

function ask(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: stdin, output: stdout, terminal: true });
    if (hidden) {
      rl._writeToOutput = (s) => stdout.write(s.includes(question) ? s : '*');
    }
    rl.question(question, (answer) => {
      rl.close();
      stdout.write('\n');
      resolve(answer);
    });
  });
}

const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

const email = (await ask('Mail de un socio (Kiara o Matías): ')).trim();
const password = await ask('Contraseña: ', true);

try {
  await signInWithEmailAndPassword(auth, email, password);
} catch (e) {
  console.error('No se pudo ingresar:', e.code || e.message);
  process.exit(1);
}
console.log(`Ingresaste como ${email}. ${force ? 'Modo --force: se pisan los datos existentes.' : 'Se crea solo lo que falte.'}`);

const counts = { creados: 0, existentes: 0 };
async function put(path, value) {
  const ref = doc(db, ...path);
  if (!force && (await getDoc(ref)).exists()) {
    counts.existentes += 1;
    return;
  }
  await setDoc(ref, value);
  counts.creados += 1;
}

// Corre las escrituras de a tandas para no saturar la conexión.
async function inBatches(items, fn, size = 15) {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(fn));
  }
}

try {
  const now = Date.now();

  await inBatches(data.lots, (l) => put(['lots', l.id], { name: l.name, order: l.order }));
  console.log(`Lotes: ${data.lots.length}`);

  await inBatches(data.products, async (p) => {
    await put(['products', p.id], {
      name: p.name,
      category: p.category,
      price: p.price,
      stock: p.stock,
      lot: p.lot,
      description: p.description,
      image: p.image,
      thumb: null,
      photoFull: false,
      order: p.order,
      createdAt: now,
    });
    await put(['costs', p.id], { cost: p.cost });
  });
  console.log(`Productos: ${data.products.length}`);

  await inBatches(data.orders, (o) =>
    put(['orders', o.id], {
      number: o.number,
      source: 'excel',
      status: 'confirmado',
      customer: { name: o.customer },
      items: [{ productId: o.productId, name: o.name, qty: o.qty, price: o.price }],
      paymentMethod: null,
      subtotal: o.total,
      shipping: 0,
      total: o.total,
      // El Excel no dice cómo se cobró: queda "sin asignar" hasta que lo asignen en Caja o en Ventas.
      pays: o.paid > 0 ? [{ amount: o.paid, method: 'sin_asignar', by: 'importación Excel', at: now }] : [],
      createdAt: now,
    })
  );
  console.log(`Ventas: ${data.orders.length}`);

  await put(['settings', 'cash'], { start: { cash: 0, bank: 0 }, real: { cash: 0, bank: 0 } });

  console.log(`Listo. Documentos creados: ${counts.creados}. Ya existían (no se tocaron): ${counts.existentes}.`);
  process.exit(0);
} catch (e) {
  if (e.code === 'permission-denied') {
    console.error('Firestore no dejó escribir. Revisá que pegaste los UID de Kiara y Matías en firestore.rules y publicaste las reglas.');
  } else {
    console.error('Error:', e.message || e);
  }
  process.exit(1);
}

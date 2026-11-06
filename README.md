# eunoia. · Tienda online + panel de socios

E-commerce de joyas en Plata 925 con panel interno para Kiara y Matías (ventas, stock, caja).
Hecho con **React + Vite**, **Firebase** (Firestore + Authentication) y desplegado en **Vercel**.

## Qué incluye

**Tienda pública**
- Catálogo con categorías, buscador y ficha de cada joya (botón **Ver** con foto grande).
- Solo se muestran las joyas con stock: lo que se vende desaparece solo.
- Aviso "¡Agregado al carrito!" al sumar una joya. El carrito se guarda en el navegador.
- Página de carrito con **Resumen**: datos de envío (código postal, provincia, localidad, dirección),
  método de pago (transferencia o tarjeta +15%), costo de envío de Andreani según la provincia
  y entrega estimada de 4 días hábiles.
- **Finalizar compra** solo se habilita cuando todos los campos están completos. Guarda el pedido en
  Firestore y abre WhatsApp con el carrito y los datos de envío ya escritos.

**Panel de socios** (`/socios`, solo Kiara y Matías)
- **Ventas**: semáforo (disponible / vendido / venta parcial / en deuda), cobros parciales con su medio
  de pago, pedidos web pendientes de confirmar, agrupado por semana (por ejemplo `02/11/2026 a 08/11/2026`).
- **Stock**: lotes (crear, renombrar, eliminar), alta de joyas con foto, venta fuera de la web, filtros por
  lote, categoría, estado y precio, y edición de cada joya (datos, foto, eliminar).
- **Caja**: cuánto debería haber en efectivo y en cuenta vs. cuánto hay, egresos por destino
  (reinversión, gastos de pareja, retiros) y cada movimiento con fecha, hora y la cuenta que lo registró.

## Rutas

| Ruta | Qué muestra |
|---|---|
| `/` | Inicio y catálogo |
| `/category/:categoryId` | Categoría (`anillos`, `aros`, `argollas`, `collares`, `pulseras`, `charms`) |
| `/item/:id` | Ficha de una joya |
| `/cart` | Carrito, datos de envío y finalizar compra |
| `/ingresar` | Login de socios |
| `/socios` | Panel (Ventas, Stock, Caja) |

## Cómo funciona el stock

1. El cliente finaliza la compra: se crea un **pedido web "pendiente"** y se abre WhatsApp. El stock **no** se descuenta todavía.
2. Cuando Kiara o Matías confirman el pedido en **Ventas** (botón *Confirmar y descontar stock*), el stock se descuenta
   y la joya deja de mostrarse si llegó a 0. Esto lo hace el panel y no el cliente, para que nadie desde afuera pueda tocar el stock.
3. Las ventas por Instagram u otros medios se cargan en **Stock > Venta fuera de la web** y descuentan al instante.
4. Los **costos** se guardan en una colección aparte (`costs`) que solo pueden leer los socios. Los clientes nunca los ven.

## Estructura

```
eunoia-ecommerce/
├── public/img/            logos, íconos y fotos de las joyas (42 con foto previa)
├── scripts/
│   ├── seed.mjs           carga el inventario y las ventas del Excel en Firestore
│   └── seed-data.json     80 productos, 3 lotes y 19 ventas del Excel
├── src/
│   ├── admin/             panel de socios (Ventas, Stock, Caja, editor)
│   ├── components/        encabezado, tarjetas, aviso, pie
│   ├── context/           sesión, catálogo y carrito
│   ├── hooks/             suscripción en tiempo real a Firestore
│   ├── pages/             catálogo, ficha, carrito, login
│   ├── services/          escrituras en Firestore (productos, pedidos, caja)
│   ├── utils/             formato, envío, checkout, fotos
│   ├── firebase.js        conexión a Firebase
│   └── styles.css
├── firestore.rules        reglas de seguridad
├── vercel.json            rutas de la app de una sola página
└── .env.example           variables de entorno
```

---

## Puesta en marcha (una sola vez)

Necesitás **Node 20.6 o más nuevo**, una cuenta de Google (Firebase), una de GitHub y una de Vercel.

### 1. Instalar las dependencias

```bash
cd eunoia-ecommerce
npm install
cp .env.example .env      # en Windows: copy .env.example .env
```

### 2. Crear el proyecto de Firebase

1. Entrá a https://console.firebase.google.com y elegí **Agregar proyecto** (por ejemplo `eunoia`). Podés desactivar Google Analytics.
2. En **Configuración del proyecto** (la rueda dentada) > **Tus apps** > ícono **</>** (web) > registrá la app con el nombre `eunoia-web`.
   No hace falta activar Firebase Hosting.
3. Firebase te muestra un bloque `firebaseConfig`. Copiá cada valor en el archivo **`.env`**:

| Variable de `.env` | Valor de `firebaseConfig` |
|---|---|
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` |

### 3. Activar el ingreso de socios (Authentication)

1. **Compilación > Authentication > Comenzar > Método de acceso > Correo electrónico/contraseña > Habilitar > Guardar**.
2. Pestaña **Users > Agregar usuario** y creá las dos cuentas con una contraseña **fuerte y distinta para cada una**:
   - `kiara@eunoia.com`
   - `matias@eunoia.com`
3. En la tabla de usuarios, copiá el **UID** de cada uno (columna "User UID"). Lo vas a usar en el paso siguiente.

### 4. Crear la base de datos y publicar las reglas

1. **Compilación > Firestore Database > Crear base de datos**. Elegí **modo de producción** y una región cercana (`southamerica-east1`, São Paulo).
2. Abrí el archivo **`firestore.rules`** y reemplazá los dos textos de la función `isAdmin()`:
   ```
   request.auth.uid in ['PEGAR_UID_DE_KIARA', 'PEGAR_UID_DE_MATIAS']
   ```
   por los UID reales del paso anterior.
3. En Firestore, pestaña **Reglas**: pegá el contenido completo de `firestore.rules` y tocá **Publicar**.

### 5. Cargar el inventario y las ventas del Excel

```bash
npm run seed
```

Te pide el mail y la contraseña de un socio (Kiara o Matías) y carga 80 productos, 3 lotes y 19 ventas.
Podés correrlo de nuevo sin riesgo: **no pisa** lo que ya existe. Solo `npm run seed -- --force` lo pisa (y resetea el stock).

### 6. Probar en tu compu

```bash
npm run dev
```

Abrí http://localhost:5173. Probá la tienda, hacé un pedido de prueba y entrá a http://localhost:5173/ingresar con un socio.

---

## Subirlo a GitHub

1. En https://github.com/new creá un repositorio **vacío** (por ejemplo `eunoia`). No marques "Add a README".
2. En la carpeta del proyecto:

```bash
git init
git add .
git commit -m "eunoia: tienda online y panel de socios"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/eunoia.git
git push -u origin main
```

El archivo `.env` **no se sube** (está en `.gitignore`). Las variables se cargan en Vercel.
Después de `npm install` aparece `package-lock.json`: dejalo en el repositorio.

## Desplegar en Vercel

1. En https://vercel.com/new importá el repositorio de GitHub.
2. Vercel detecta **Vite** solo (build `npm run build`, salida `dist`). No cambies nada.
3. En **Environment Variables** cargá las mismas variables de tu `.env`:
   las seis `VITE_FIREBASE_*`, y también `VITE_ADMIN_EMAILS`, `VITE_WHATSAPP` y `VITE_INSTAGRAM`.
4. **Deploy**. Cada `git push` a `main` vuelve a publicar la página automáticamente.
5. Si querés usar tu propio dominio, agregalo en Vercel > Settings > Domains.

> Si cambiás una variable en Vercel, hay que volver a desplegar (Deployments > Redeploy) para que se aplique.

### Verificación final (con la página ya publicada)

- [ ] La tienda carga con los productos y las fotos.
- [ ] Sumás una joya y aparece el aviso "¡Agregado al carrito!".
- [ ] En el carrito, **Finalizar compra** sigue apagado hasta completar todos los campos.
- [ ] Hacés un pedido de prueba: se abre WhatsApp con el mensaje y el pedido aparece en **Ventas** como pendiente.
- [ ] Entrás con Kiara y con Matías a `/ingresar` y ves Ventas, Stock y Caja.
- [ ] Confirmás el pedido de prueba: el stock baja. Después **cancelalo o eliminá la joya de prueba** si hace falta.
- [ ] En un celular, la tienda se ve bien.

---

## Cosas para revisar de los datos cargados

- **Costos**: se cargó como costo la columna *"Precio 2 / Costo ($)"* del Excel. Las primeras 24 filas no tenían costo y quedaron en $0.
  Se corrige en **Stock** (campo Costo de cada fila, o tocando la joya).
- **Medios de pago de las 18 ventas pagadas**: el Excel no los indica, así que quedan "sin asignar" y no suman a la Caja.
  En **Caja** hay un selector para asignarlos todos juntos, y en **Ventas** uno por cada venta.
- **Fecha de las ventas**: el Excel no tiene fechas. Quedaron en la semana en que corriste `npm run seed`.
- **Anillo corazón calado T13** venía sin cantidad y quedó con stock 0 (agotado).
- **Nombres**: se respetaron los del Excel. Algunos están cortados o con errores de tipeo; se corrigen tocando la joya en **Stock**.
- **Fotos**: 42 productos usan una foto del catálogo anterior (`public/img`); los 38 restantes muestran un recuadro gris
  hasta que subas la foto desde **Stock > tocá la joya > Subir foto**.

## Cambios frecuentes

| Qué querés cambiar | Dónde |
|---|---|
| Tarifas de envío de Andreani y zonas | `src/utils/shipping.js` |
| Recargo de tarjeta (15%) y días de entrega | `src/utils/constants.js` |
| Número de WhatsApp o Instagram | variables `VITE_WHATSAPP` y `VITE_INSTAGRAM` |
| Mails de los socios | `VITE_ADMIN_EMAILS` **y** los UID en `firestore.rules` |
| Colores y tipografías | variables CSS al principio de `src/styles.css` |
| Categorías de la tienda | `src/utils/constants.js` (`CATEGORIES`) |

## Fotos subidas desde el panel

Para no obligarte a activar Firebase Storage (que hoy exige el plan Blaze con tarjeta), las fotos que subís desde el panel se
achican en el navegador y se guardan en Firestore: una miniatura para el catálogo y una foto más grande para la ficha.
Cada foto pesa unos pocos KB, muy por debajo del límite de 1 MB por documento.

## Cuotas gratuitas de Firebase

El plan gratuito (Spark) incluye 50.000 lecturas de documentos por día. Cada visita a la tienda lee el catálogo completo
(unas 80 lecturas), así que alcanza para unas 600 visitas por día. Si la tienda crece, pasá a Blaze (se paga solo lo que se excede)
o agregá paginación al catálogo.

## Seguridad

- Las reglas de `firestore.rules` son las que protegen los datos. Lo que se ve u oculta en pantalla es solo comodidad.
- Cualquiera puede **leer** el catálogo y **crear** un pedido web "pendiente" (con datos validados). Nadie más puede escribir
  productos, stock, costos, cobros ni movimientos de caja.
- Los pedidos (con nombre y dirección de los clientes), los costos y la caja solo los leen Kiara y Matías.
- Usá contraseñas fuertes y distintas, y cambialas en Authentication si alguna vez se compartió por chat.
- Cualquiera podría mandar pedidos falsos: no descuentan stock hasta que un socio los confirma, y se pueden cancelar desde Ventas.

## Problemas comunes

| Síntoma | Solución |
|---|---|
| Pantalla "Falta configurar Firebase" | Faltan variables `VITE_FIREBASE_*`. Revisá `.env` (local) o Environment Variables (Vercel) y volvé a desplegar. |
| "Firestore no te dio permiso" o `permission-denied` | Los UID en `firestore.rules` no coinciden con los de Authentication, o no publicaste las reglas. |
| `npm run seed` dice que no puede ingresar | Mail o contraseña incorrectos, o falta habilitar Correo/contraseña en Authentication. |
| `npm run seed` falla con `--env-file` | Necesitás Node 20.6 o más nuevo (`node -v`). |
| La tienda carga pero sin productos | No corriste `npm run seed`, o las reglas no permiten leer `products`. |
| Error 404 al recargar `/cart` en Vercel | Verificá que `vercel.json` esté en la raíz del repositorio. |
| Las fotos del catálogo no se ven | Las carpetas `public/img` deben estar en el repositorio (`git add public`). |

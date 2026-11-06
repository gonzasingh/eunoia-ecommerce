import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { firebaseReady } from './firebase';
import { AuthProvider } from './context/AuthContext';
import { ProductsProvider } from './context/ProductsContext';
import { CartProvider } from './context/CartContext';
import AnnouncementBar from './components/AnnouncementBar';
import Header from './components/Header';
import Footer from './components/Footer';
import Toast from './components/Toast';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Admin from './admin/Admin';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function SetupNotice() {
  return (
    <div className="w" style={{ padding: '60px 20px' }}>
      <h1>Falta configurar Firebase</h1>
      <p>
        Copiá <code>.env.example</code> a <code>.env</code>, completá las variables <code>VITE_FIREBASE_*</code> y reiniciá
        <code> npm run dev</code>. En Vercel, cargalas en Settings &gt; Environment Variables y volvé a desplegar.
      </p>
    </div>
  );
}

export default function App() {
  const { pathname } = useLocation();
  const adminArea = pathname.startsWith('/socios') || pathname === '/ingresar';

  if (!firebaseReady) return <SetupNotice />;

  return (
    <AuthProvider>
      <ProductsProvider>
        <CartProvider>
          <div className={adminArea ? 'adm' : ''}>
            <ScrollToTop />
            <AnnouncementBar />
            <Header />
            <main className="w">
              <Routes>
                <Route path="/" element={<Catalog />} />
                <Route path="/category/:categoryId" element={<Catalog />} />
                <Route path="/item/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/ingresar" element={<Login />} />
                <Route path="/socios" element={<Admin />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
            <Toast />
          </div>
        </CartProvider>
      </ProductsProvider>
    </AuthProvider>
  );
}

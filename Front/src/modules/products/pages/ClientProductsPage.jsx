import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPublicProducts } from '../services/list';
import { toast } from 'sonner';
import useAuth from '../../auth/hook/useAuth';
import LoginForm from '../../auth/components/LoginForm';
import { jwtDecode } from 'jwt-decode'; //igual que para cartPage ya que si un admin inicia sesion en la pagina cliente, lo redirige al dashboard

function ClientProductsPage() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [loading, setLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [startInRegisterMode, setStartInRegisterMode] = useState(false);

  const navigate = useNavigate();
  const [quantities, setQuantities] = useState({});
  const { isAuthenticated, user, singout } = useAuth();

  const openAuthModal = (isRegister) => {
    setStartInRegisterMode(isRegister);
    setShowLoginModal(true);
    setIsMenuOpen(false);
  };

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await getPublicProducts(searchTerm, pageNumber, pageSize);

      if (error) throw error;

      setTotal(data?.total || 0);
      setProducts(data?.productItems || []);
    } catch (error) {
      setTotal(0); setProducts([]);
      console.error('Error al cargar productos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [pageNumber, pageSize, searchTerm]);

  const handleSearch = () => { setPageNumber(1); setIsMenuOpen(false); };
  const getQuantity = (productId) => quantities[productId] ?? 0;
  const changeQuantity = (productId, delta) => setQuantities((prev) => ({ ...prev, [productId]: Math.max(0, (prev[productId] || 0) + delta) }));

  const handleAddToCart = (product) => {
    const quantity = getQuantity(product.sku);

    if (quantity < 1) { toast.error('Selecciona al menos 1 unidad.');

      return; }

    let cart = [];

    try { cart = JSON.parse(localStorage.getItem('cart')) || []; } catch { cart = []; }

    const existingIndex = cart.findIndex((item) => item.productId === product.id);

    if (existingIndex >= 0) cart[existingIndex].quantity += quantity;
    else cart.push({ productId: product.id, sku: product.sku, name: product.name, price: product.currentUnitPrice, quantity, image: product.image });

    localStorage.setItem('cart', JSON.stringify(cart));
    toast.success(`Agregado ${quantity} de ${product.name}`);
    changeQuantity(product.sku, -quantity);
  };

  const handleLoginSuccess = () => {

    const token = localStorage.getItem('token');

    if (token) {
      try {
        const decoded = jwtDecode(token);
        //verificar el rol del usuario
        const userRole = decoded.role || decoded.Role || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

        if (userRole === 'Admin') {
          setShowLoginModal(false);
          toast.success('Bienvenido al Panel de Administración');
          navigate('/admin/home');

          return;
        }
      } catch (error) {
        console.error('Error al verificar rol:', error);
      }
    }

    setShowLoginModal(false);
    toast.success('Has iniciado sesión correctamente');
  };

  const handleLogout = () => { singout(); toast.info('Sesión cerrada'); setIsMenuOpen(false); };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800 relative">
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100 py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2 cursor-pointer group select-none" onClick={() => navigate('/')}>
              <div className="relative w-9 h-9">
                <svg viewBox="0 0 24 24" fill="none" className="w-full h-full drop-shadow-sm transition-transform group-hover:scale-110">
                  <path d="M9 11V8C9 6.34315 10.3431 5 12 5C13.6569 5 15 6.34315 15 8V11" stroke="#9333ea" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M5 9H19L20 21H4L5 9Z" stroke="#9333ea" strokeWidth="2" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="font-extrabold text-xl tracking-tight text-gray-800">DSW2025<span className="text-purple-600">Store</span></span>
            </div>

            <nav className="hidden md:flex gap-4 text-sm font-medium text-gray-500">
              <button onClick={() => { setSearchTerm(''); setPageNumber(1); fetchProducts(); }} className="text-black cursor-pointer bg-gray-100 px-3 py-1 rounded-md border-none">Productos</button>
              <button onClick={() => navigate('/cart')} className="hover:text-black cursor-pointer px-3 py-1">Carrito de compras</button>
            </nav>
            <button className="md:hidden text-2xl p-2 focus:outline-none ml-auto md:ml-0" onClick={() => setIsMenuOpen(!isMenuOpen)}>{isMenuOpen ? '✕' : '☰'}</button>
          </div>

          <div className="w-full md:max-w-md relative">
            <input type="text" placeholder="Search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="w-full bg-gray-50 border border-gray-200 rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none" />
            <button onClick={handleSearch} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-purple-600 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                <path d="M15.7955 15.8111L21 21M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="hidden md:flex gap-3 text-sm items-center">
            {!isAuthenticated ? (
              <>
                <button onClick={() => openAuthModal(false)} className="bg-purple-100 text-purple-900 px-4 py-2 rounded-md font-medium hover:bg-purple-200">Iniciar Sesión</button>
                <button onClick={() => openAuthModal(true)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-300">Registrarse</button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-purple-700 font-bold">Hola, {user?.sub || 'Usuario'}</span>
                <button onClick={handleLogout} className="text-xs text-red-500 hover:text-red-700 underline font-medium">Cerrar Sesión</button>
              </div>
            )}
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-gray-100 flex flex-col gap-4 animate-fadeIn">
            <nav className="flex flex-col gap-2">
              <button onClick={() => { setSearchTerm(''); setPageNumber(1); fetchProducts(); setIsMenuOpen(false); }} className="text-left px-4 py-2 hover:bg-gray-50 rounded-md font-medium">Productos</button>
              <button onClick={() => { navigate('/cart'); setIsMenuOpen(false); }} className="text-left px-4 py-2 hover:bg-gray-50 rounded-md font-medium">Carrito de compras</button>
            </nav>
            <div className="flex flex-col gap-2 px-4 pb-2">
              {!isAuthenticated ? (
                <>
                  <button onClick={() => openAuthModal(false)} className="w-full bg-purple-100 text-purple-900 px-4 py-2 rounded-md font-medium text-center">Iniciar Sesión</button>
                  <button onClick={() => openAuthModal(true)} className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium text-center">Registrarse</button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 bg-purple-50 p-2 rounded-md">
                  <span className="text-purple-700 font-bold">Hola, {user?.sub || 'Usuario'}</span>
                  <button onClick={handleLogout} className="text-sm text-red-500 font-semibold border border-red-200 px-3 py-1 rounded hover:bg-red-50">Cerrar Sesión</button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64 text-gray-400">Cargando catálogo...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-2">No se encontraron productos.</p>
            <button onClick={() => { setSearchTerm(''); handleSearch(); }} className="text-purple-600 underline">Ver todos</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.sku} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden flex flex-col border border-gray-100">
                <div className="w-full aspect-square bg-gray-200 flex items-center justify-center text-gray-400">
                  <svg className="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
                  <p className="text-xs text-gray-500 mb-4 line-clamp-2 h-8 overflow-hidden">{product.description}</p>
                  <div className="text-lg font-bold text-gray-900 mb-4">${product.currentUnitPrice}</div>
                  <div className="mt-auto flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button onClick={() => changeQuantity(product.sku, -1)} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-black font-bold">−</button>
                      <span className="w-6 text-center text-sm font-medium bg-gray-50 rounded border border-gray-200 py-0.5">{getQuantity(product.sku)}</span>
                      <button onClick={() => changeQuantity(product.sku, 1)} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-black font-bold">+</button>
                    </div>
                    <button onClick={() => handleAddToCart(product)} className="bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold py-2 px-3 rounded transition-colors uppercase tracking-wide">Agregar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12 text-sm text-gray-600">
          <button disabled={pageNumber === 1} onClick={() => setPageNumber(p => Math.max(1, p - 1))} className="px-3 py-1 rounded hover:bg-gray-100 disabled:opacity-30">← Anterior</button>
          <span>Página {pageNumber} de {totalPages}</span>
          <button disabled={pageNumber >= totalPages} onClick={() => setPageNumber(p => (p < totalPages ? p + 1 : p))} className="px-3 py-1 rounded hover:bg-gray-100 disabled:opacity-30">Siguiente →</button>
          <div className="flex items-center gap-2 ml-4 border-l pl-4 border-gray-300">
            <span className="text-xs">Ver:</span>
            <select value={pageSize} onChange={(e) => { setPageNumber(1); setPageSize(Number(e.target.value)); }} className="border rounded p-1 text-sm"><option value={4}>4</option><option value={8}>8</option><option value={12}>12</option><option value={24}>24</option></select>
          </div>
        </div>
      </main>

      {showLoginModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center backdrop-blur-sm">
          <div className="relative bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm mx-4">
            <button onClick={() => setShowLoginModal(false)} className="absolute right-3 top-3 text-gray-400 hover:text-black font-bold text-xl">✕</button>
            <LoginForm onSuccess={handleLoginSuccess} initiallyRegistering={startInRegisterMode} />
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientProductsPage;
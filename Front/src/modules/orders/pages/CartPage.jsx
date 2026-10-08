import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../services/createServices';
import useAuth from '../../auth/hook/useAuth';
import LoginForm from '../../auth/components/LoginForm';
import { toast } from 'sonner';
import { jwtDecode } from 'jwt-decode';

function CartPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [startInRegisterMode, setStartInRegisterMode] = useState(false);

  const openAuthModal = (isRegister) => {
    setStartInRegisterMode(isRegister);
    setShowLoginModal(true);
    setIsMenuOpen(false);
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cart');

      if (stored) setCartItems(JSON.parse(stored) || []);
    } catch (e) {
      console.error('Error leyendo el carrito desde localStorage:', e);
      localStorage.removeItem('cart');
      setCartItems([]);
    }
  }, []);

  const updateCartState = (newItems) => {
    setCartItems(newItems);
    newItems.length === 0 ? localStorage.removeItem('cart') : localStorage.setItem('cart', JSON.stringify(newItems));
  };

  const changeQuantity = (productId, delta) => {
    const updated = cartItems.map((item) => {
      if (item.productId === productId) return { ...item, quantity: Math.max(1, item.quantity + delta) };

      return item;
    });

    updateCartState(updated);
  };

  const removeItem = (productId) => {
    updateCartState(cartItems.filter((item) => item.productId !== productId));
    toast.info('Producto eliminado del carrito');
  };

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const processOrder = async () => {
    try {
      if (!shippingAddress.trim() || !billingAddress.trim()) {
        toast.error('Por favor completa las direcciones de envío y facturación.');

        return;
      }

      setProcessingOrder(true);
      let currentUserId = user?.customerId || user?.id || user?.sub;

      if (!currentUserId) {
        const token = localStorage.getItem('token');

        if (token) {
          try {
            const decoded = jwtDecode(token);

            currentUserId = decoded.customerId || decoded.id || decoded.sub;
          } catch (e) {
            console.error('Error decodificando token manualmente', e);
          }
        }
      }

      if (!currentUserId) {
        toast.error('Error de sesión. Por favor inicia sesión nuevamente.');
        setProcessingOrder(false);

        return;
      }

      const orderPayload = {
        customerId: currentUserId,
        shippingAddress,
        billingAddress,
        notes,
        items: cartItems.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      };

      await createOrder(orderPayload);

      localStorage.removeItem('cart');
      setCartItems([]);
      toast.success('¡Pedido creado exitosamente!');
      navigate('/');
    } catch (error) {
      console.error('Error creando orden:', error);
      const msg = error.response?.data?.title || 'Error al procesar el pedido.';

      toast.error(`Error: ${msg}`);
    } finally {
      setProcessingOrder(false);
    }
  };

  const handleFinalize = () => {
    if (!cartItems.length) return;

    if (!shippingAddress.trim() || !billingAddress.trim()) {
      toast.error('Por favor completa las direcciones de envío y facturación.');

      return;
    }

    if (!isAuthenticated) {
      toast.warning('Inicia sesión para finalizar tu compra');
      openAuthModal(false);

      return;
    }

    processOrder();
  };

  const handleLoginSuccess = async () => {
    const token = localStorage.getItem('token');

    if (token) {
      try {
        const decoded = jwtDecode(token);
        const userRole = decoded.role || decoded.Role || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

        if (userRole === 'Admin') {
          setShowLoginModal(false);
          toast.success('Bienvenido Administrador');
          navigate('/admin/home');

          return;
        }
      } catch (error) {
        console.error('Error al verificar rol en login:', error);
      }
    }

    setShowLoginModal(false);
    toast.success('Sesión iniciada. Procesando tu pedido...');

    setTimeout(() => {
      processOrder();
    }, 100);
  };

  const handleCloseModal = () => {
    setShowLoginModal(false);
  };

  return (
    <div className="min-h-screen bg-[#F7F5FB] font-sans text-gray-800 relative">
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
              <span className="font-extrabold text-xl tracking-tight text-gray-800">DSW2025<span className="text-purple-600">App</span></span>
            </div>
            <nav className="hidden md:flex gap-4 text-sm font-medium text-gray-500">
              <button onClick={() => navigate('/')} className="hover:text-black cursor-pointer px-3 py-1 bg-transparent border-none">Productos</button>
              <span className="text-black cursor-pointer bg-gray-100 px-3 py-1 rounded-md">Carrito de compras</span>
            </nav>
            <button className="md:hidden text-2xl ml-auto" onClick={() => setIsMenuOpen(!isMenuOpen)}>{isMenuOpen ? '✕' : '☰'}</button>
          </div>

          <div className="hidden md:flex gap-3 text-sm items-center">
            {!isAuthenticated ? (
              <>
                <button onClick={() => openAuthModal(false)} className="bg-purple-100 text-purple-900 px-4 py-2 rounded-md font-medium hover:bg-purple-200">Iniciar Sesión</button>
                <button onClick={() => openAuthModal(true)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-300">Registrarse</button>
              </>
            ) : (
              <span className="text-purple-700 font-bold self-center">Hola, {user?.sub || 'Usuario'}</span>
            )}
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-gray-100 flex flex-col gap-4 animate-fadeIn">
            <nav className="flex flex-col gap-2">
              <button onClick={() => { navigate('/'); setIsMenuOpen(false); }} className="text-left px-4 py-2 hover:bg-gray-50 rounded-md font-medium">Productos</button>
              <button onClick={() => setIsMenuOpen(false)} className="text-left px-4 py-2 bg-purple-50 text-purple-700 rounded-md font-medium">Carrito de compras</button>
            </nav>
            {!isAuthenticated && (
              <div className="flex flex-col gap-2 px-4 pb-2">
                <button onClick={() => openAuthModal(false)} className="w-full bg-purple-100 text-purple-900 px-4 py-2 rounded-md font-medium text-center">Iniciar Sesión</button>
                <button onClick={() => openAuthModal(true)} className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium text-center">Registrarse</button>
              </div>
            )}
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">

            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-32 h-32 text-purple-100 mb-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>

            <h2 className="text-2xl font-bold mb-2 text-gray-800">Tu carrito está vacío</h2>
            <p className="text-gray-500 mb-6">¡Agrega productos para comenzar!</p>

            <button
              onClick={() => navigate('/')}
              className="mt-2 bg-purple-600 text-white px-8 py-3 rounded-full font-bold hover:bg-purple-700 transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Volver al catálogo
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <section className="flex-1 space-y-4">
              {cartItems.map((item) => (
                <article key={item.productId} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-4 flex flex-col gap-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">{item.name}</h3>
                    <p className="text-xs text-gray-500">Cantidad: {item.quantity}</p>
                    <p className="text-xs text-gray-500">Sub Total: ${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <button onClick={() => changeQuantity(item.productId, -1)} className=" text-base w-8 h-8 border rounded leading-none text-lg pb-0.5">−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => changeQuantity(item.productId, 1)} className="text-base w-8 h-8 border rounded leading-none text-lg pb-0.5">+</button>
                    </div>
                    <button onClick={() => removeItem(item.productId)} className="text-red-500 text-sm hover:underline">Borrar</button>
                  </div>
                </article>
              ))}
            </section>
            <aside className="w-full lg:w-96 space-y-4">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Datos de Envío</h2>
                <div className="space-y-3">
                  <input type="text" className="w-full border p-2 rounded-md text-sm" placeholder="Dirección de Envío" value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} />
                  <input type="text" className="w-full border p-2 rounded-md text-sm" placeholder="Dirección de Facturación" value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} />
                  <textarea className="w-full border p-2 rounded-md text-sm" rows="2" placeholder="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 lg:sticky lg:top-24">
                <h2 className="text-2xl font-bold text-gray-800 mb-5 border-b pb-3">Detalle del Pedido</h2>
                <div className="flex flex-col gap-2 mb-6">
                  <div className="flex justify-between items-center text-gray-600">
                    <span className="text-sm">Total de artículos:</span>
                    <span className="font-semibold">{totalItems} u.</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-900 mt-2 pt-2 border-t border-gray-100">
                    <span className="text-lg font-bold">Total:</span>
                    <span className="text-2xl font-bold text-purple-600">${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
                <button onClick={handleFinalize} disabled={processingOrder} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-full transition disabled:opacity-60 shadow-lg shadow-purple-200">
                  {processingOrder ? 'Procesando...' : 'Confirmar Compra'}
                </button>
              </div>
            </aside>
          </div>
        )}
      </main>

      {showLoginModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center backdrop-blur-sm">
          <div className="relative bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm mx-4">
            <button onClick={handleCloseModal} className="absolute right-3 top-3 text-gray-400 hover:text-black font-bold text-xl">✕</button>
            <LoginForm onSuccess={handleLoginSuccess} initiallyRegistering={startInRegisterMode} />
          </div>
        </div>
      )}
    </div>
  );
}

export default CartPage;
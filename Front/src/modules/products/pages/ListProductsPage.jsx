import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../shared/components/Card';
import { getAdminProducts } from '../services/list';

const productStatusOptions = [
  { label: 'Estado de Producto (Todos)', value: '' },
  { label: 'Activo', value: 'true' },
  { label: 'Inactivo', value: 'false' },
];

function ListProductsPage() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [total, setTotal] = useState(0);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const statusToSend = status === '' ? null : status;

      const result = await getAdminProducts(searchTerm, statusToSend, pageNumber, pageSize);
      const { data, error } = result;

      if (error) throw error;

      const lista = data?.productItems || data?.items || [];
      const totalItems = data?.total || 0;

      setProducts(lista);
      setTotal(totalItems);

    } catch (error) {
      console.error('Error al cargar productos:', error);
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, pageNumber, pageSize]);

  const handleSearch = () => {
    setPageNumber(1);
    fetchProducts();
  };

  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));

  return (
    <div className="p-4 space-y-4">

      <Card className="p-4 bg-white rounded-lg shadow-sm">
        <div className="flex flex-col gap-4">

          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Productos</h2>

            <button
              onClick={() => navigate('/admin/products/create')}
              className="bg-purple-100 text-purple-700 hover:bg-purple-200 transition flex items-center justify-center font-medium w-10 h-10 p-0 rounded-lg md:w-auto md:h-auto md:px-4 md:py-2 md:rounded-md"
              aria-label="Crear Producto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 md:hidden">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>

              <span className="hidden md:inline">Crear Producto</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-1 gap-2 relative">
              <input
                type="text"
                placeholder="Buscar"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />

              <button
                onClick={handleSearch}
                className="bg-purple-100 text-purple-700 p-2 rounded-md hover:bg-purple-200 flex items-center justify-center w-10 h-10"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6"
                >
                  <path
                    d="M15.7955 15.8111L21 21M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <select
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200 min-w-[220px]"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPageNumber(1);
              }}
            >
              {productStatusOptions.map((opt) => (
                <option key={opt.label} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Cargando productos...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-10 text-gray-500 bg-white rounded shadow-sm">No hay productos.</div>
        ) : (
          products.map((product) => (
            <Card key={product.id || product.sku} className="hover:shadow-md transition-shadow bg-white rounded-lg p-4 border border-gray-100">
              <div className="flex justify-between items-center">

                <div className="flex flex-col">
                  <h3 className="text-lg font-bold text-gray-900">
                    {product.sku} - {product.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                  Stock: {product.stockQuantity} - {product.isActive ? 'Activo' : 'Inactivo'}
                  </p>
                </div>

                <button
                  className="bg-purple-100 text-purple-700 px-6 py-2 rounded-md font-medium hover:bg-purple-200 transition"
                  onClick={() => console.log('Ver detalle', product.id)}
                >
                Ver
                </button>

              </div>
            </Card>
          ))
        )}
      </div>

      {total > 0 && (
        <>
          <div className="flex justify-between items-center text-sm text-gray-600 sm:hidden py-4 w-full px-4">
            <button
              disabled={pageNumber === 1}
              onClick={() => setPageNumber(p => p - 1)}
              className="disabled:opacity-30"
            >
            ← Anterior
            </button>

            <button
              disabled={pageNumber >= totalPages}
              onClick={() => setPageNumber(p => p + 1)}
              className="disabled:opacity-30"
            >
            Siguiente →
            </button>
          </div>

          <div className="hidden sm:flex justify-center items-center gap-4 py-4 text-sm text-gray-600">
            <button
              disabled={pageNumber === 1}
              onClick={() => setPageNumber(p => p - 1)}
              className="hover:text-black disabled:opacity-30 disabled:hover:text-gray-600 flex items-center gap-1"
            >
            ← Anterior
            </button>

            <span className="bg-gray-900 text-white px-3 py-1 rounded text-xs font-bold">
            Página {pageNumber} de {totalPages}
            </span>

            <button
              disabled={pageNumber >= totalPages}
              onClick={() => setPageNumber(p => p + 1)}
              className="hover:text-black disabled:opacity-30 disabled:hover:text-gray-600 flex items-center gap-1"
            >
            Siguiente →
            </button>

            <div className="flex items-center gap-2 border-l sm:pl-4">
              <span className="text-xs text-gray-400">Ver:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageNumber(1);
                  setPageSize(Number(e.target.value));
                }}
                className="border border-gray-200 rounded p-1 text-sm bg-white focus:outline-none focus:border-purple-300 cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </>
      )}

    </div>
  );

}

export default ListProductsPage;
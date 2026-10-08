import { useEffect, useState } from 'react';
import Button from '../../shared/components/Button';
import Card from '../../shared/components/Card';
import { listOrders } from '../services/listServices';

const statusLabels = {
  'PENDING': 'Pendiente',
  'PROCESSING': 'Procesando',
  'SHIPPED': 'Enviado',
  'DELIVERED': 'Entregado',
  'CANCELLED': 'Cancelado',
};

const getStatusChipClass = (status) => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'PROCESSING':
      return 'bg-blue-100 text-blue-800';
    case 'SHIPPED':
      return 'bg-indigo-100 text-indigo-800';
    case 'DELIVERED':
      return 'bg-green-100 text-green-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

function ListOrdersPage() {

  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [total, setTotal] = useState(0);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const filters = {
        page: pageNumber,
        pageSize: pageSize,
        search: searchTerm,
      };

      if (status !== '') {
        filters.status = status;
      }

      console.log('1. Enviando filtros al servicio:', filters);

      const data = await listOrders(filters);

      console.log('2. Respuesta del Backend:', data);
      console.log('3. Chequeo de propiedades: ');
      console.log('   - data.total:', data?.total);
      console.log('   - data.items:', data?.items);
      console.log('   - data.productItems:', data?.productItems);

      const listaFinal = data?.items || data?.productItems || [];

      console.log('4. Lista final a guardar en estado:', listaFinal);

      if (listaFinal.length === 0) {
        console.warn('La lista está vacía. ¿La base de datos tiene órdenes?');
      }

      setTotal(data?.total || 0);
      setOrders(listaFinal);

    } catch (error) {
      console.error(' Error  en fetchOrders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    //Lo silencio porque si hago que le quiere se puede generar un bucle infinito
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, pageSize, pageNumber]);

  const totalPages = Math.ceil(total / pageSize);

  const handleSearch = async () => {
    console.log('Buscando manualmente:', searchTerm);
    setPageNumber(1);
    await fetchOrders();
  };

  return (
    <div className="p-4 space-y-4">
      <Card className="p-4 bg-white rounded-lg shadow-sm">
        <div className='flex justify-between items-center mb-3'>
          <h1 className='text-2xl font-bold text-gray-800'>Ordenes</h1>
          <div className='h-11 w-11 sm:hidden'></div>
        </div>

        <div className='flex flex-col sm:flex-row gap-4'>
          <div className='flex items-center gap-3 w-full relative'>
            <input
              value={searchTerm}
              onChange={(evt) => setSearchTerm(evt.target.value)}
              type="text"
              placeholder='Buscar ordenes...'
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200 pl-2 pr-12"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />

            <Button
              className='h-10 w-10 flex justify-center items-center absolute right-0 !bg-purple-100 rounded-md hover:bg-purple-200 text-purple-700'
              onClick={handleSearch}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
              >
                <path
                  d="M15.7955 15.8111L21 21M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>
          </div>

          <select
            onChange={evt => {
              setStatus(evt.target.value);
              setPageNumber(1);
            }}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200 min-w-[200px]"
            value={status}
          >
            <option value="">Estado de Orden</option>
            <option value="1">Pendientes</option>
            <option value="2">Procesando</option>
            <option value="3">Enviadas</option>
            <option value="4">Entregadas</option>
            <option value="5">Canceladas</option>
          </select>
        </div>
      </Card>

      <div className='mt-4 flex flex-col gap-3'>
        {loading ? (
          <div className='text-center py-10 text-gray-500 bg-white rounded shadow-sm'>
            <span>Cargando ordenes...</span>
          </div>
        ) : orders.length > 0 ? (
          orders.map(order => (
            <Card key={order.orderId || Math.random()} className="hover:shadow-md transition-shadow bg-white rounded-lg p-4 border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">

                <div className="flex flex-col items-start gap-2">
                  <h1 className='text-lg font-bold text-gray-900'>
                  #{order.clientName || order.customerName || 'Consumidor Final'}
                  </h1>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusChipClass(order.status)}`}
                  >
                    {statusLabels[order.status] || 'Desconocido'}
                  </span>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                  <Button
                    className="bg-purple-100 text-purple-700 px-4 py-2 rounded-md font-medium hover:bg-purple-200 transition text-sm w-full sm:w-auto"
                    onClick={() => console.log('Ver detalle', order.orderId)}
                  >
                  Ver
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center bg-white rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500">No se encontraron órdenes.</p>
          </Card>
        )}
      </div>

      {totalPages > 0 && (
        <>
          <div className="flex justify-between items-center text-sm text-gray-600 sm:hidden py-4 w-full px-4 border-t border-gray-100 mt-2">
            <button
              disabled={pageNumber === 1}
              onClick={() => setPageNumber(p => p - 1)}
              className="disabled:opacity-30 font-medium"
            >
            ← Anterior
            </button>

            <span className="text-xs font-bold text-gray-500">
              {pageNumber} / {totalPages}
            </span>

            <button
              disabled={pageNumber >= totalPages}
              onClick={() => setPageNumber(p => p + 1)}
              className="disabled:opacity-30 font-medium"
            >
            Siguiente →
            </button>
          </div>

          <div className="hidden sm:flex justify-center items-center gap-4 py-4 text-sm text-gray-600 mt-2">
            <button
              disabled={pageNumber === 1}
              onClick={() => setPageNumber(p => p - 1)}
              className="hover:text-black disabled:opacity-30 disabled:hover:text-gray-600 flex items-center gap-1 transition-colors"
            >
            ← Anterior
            </button>

            <span className="bg-gray-900 text-white px-3 py-1 rounded text-xs font-bold shadow-sm">
            Página {pageNumber} de {totalPages || 1}
            </span>

            <button
              disabled={pageNumber >= totalPages}
              onClick={() => setPageNumber(p => p + 1)}
              className="hover:text-black disabled:opacity-30 disabled:hover:text-gray-600 flex items-center gap-1 transition-colors"
            >
            Siguiente →
            </button>

            <div className="flex items-center gap-2 border-l border-gray-300 pl-4 ml-2">
              <span className="text-xs text-gray-400">Ver:</span>
              <select
                value={pageSize}
                onChange={(evt) => {
                  setPageNumber(1);
                  setPageSize(Number(evt.target.value));
                }}
                className="border border-gray-200 rounded p-1 text-sm bg-white focus:outline-none focus:border-purple-300 cursor-pointer hover:shadow-sm transition-shadow"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ListOrdersPage;
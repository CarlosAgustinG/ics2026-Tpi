import { useEffect, useState } from 'react';
import { instance } from '../../shared/api/axiosInstance';
import Card from '../../shared/components/Card';

function Home() {
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {

      setLoading(true);
      console.log('BUSCANDO ESTADÍSTICAS EN EL SERVIDOR...');

      try {
        const productsReq = instance.get('/api/products?pageNumber=1&pageSize=1');
        const ordersReq = instance.get('/api/orders?pageNumber=1&pageSize=1');

        const [productsRes, ordersRes] = await Promise.all([productsReq, ordersReq]);

        setStats({
          products: productsRes.data.total || 0,
          orders: ordersRes.data.total || 0,
        });

        setLoading(false);

      } catch (error) {
        console.error('Error obteniendo estadísticas:', error);

        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className='flex flex-col gap-3 sm:grid sm:grid-cols-2'>

      <Card>
        <div className="flex flex-col gap-2 p-2">
          <h3 className="text-xl font-bold text-gray-700">Productos</h3>
          <p className="text-3xl font-semibold text-purple-600">

            {loading ? '...' : stats.products}
          </p>
          <span className="text-xs text-gray-400">Total en catálogo</span>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-2 p-2">
          <h3 className="text-xl font-bold text-gray-700">Órdenes</h3>
          <p className="text-3xl font-semibold text-blue-600">
            {loading ? '...' : stats.orders}
          </p>
          <span className="text-xs text-gray-400">Total registradas</span>
        </div>
      </Card>

    </div>
  );
};

export default Home;
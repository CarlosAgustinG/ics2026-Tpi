import { instance } from '../../shared/api/axiosInstance';

export const createOrder = async (orderData) => {
  console.log('Creating order with data:', orderData);

  const response = await instance.post('/api/orders', orderData);

  return response.data;
};
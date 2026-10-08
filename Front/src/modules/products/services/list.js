import { instance } from '../../shared/api/axiosInstance';

export const getPublicProducts = async (searchTerm, pageNumber, pageSize) => {
  const params = {
    search: searchTerm,
    pageNumber,
    pageSize,
  };

  const response = await instance.get('/api/products', { params });

  return { data: response.data, error: null };
};

export const getAdminProducts = async (searchTerm, status, pageNumber, pageSize) => {
  const params = {
    search: searchTerm,
    status: status,
    pageNumber,
    pageSize,
  };

  const response = await instance.get('/api/products/admin', { params });

  return { data: response.data, error: null };
};
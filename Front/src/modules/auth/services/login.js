import { instance } from '../../shared/api/axiosInstance';

export const login = async (username, password) => {
  try {
    const response = await instance.post('/api/auth/login', { username, password });

    return { data: response.data.token, error: null };
  } catch (error) {

    const msg = typeof error.response?.data === 'string'
      ? error.response.data
      : 'Credenciales inválidas o error de conexión';

    return { data: null, error: msg };
  }
};

export const register = async (username, password, email) => {
  try {
    const response = await instance.post('/api/auth/register', {
      username,
      password,
      email,
    });

    return { data: response.data.token, error: null };
  } catch (error) {
    console.error('Error en registro:', error);

    let msg = 'Error al registrarse';

    if (error.response) {
      const { data, status } = error.response;

      if (typeof data === 'string') {
        msg = data;
      }

      else if (Array.isArray(data) && data.length > 0) {
        msg = data[0].description;
      }

      else if (data?.message || data?.title) {
        msg = data.message || data.title;
      }

      else if (status === 409) {
        msg = 'El correo electrónico ya está registrado.';
      } else if (status === 500) {
        msg = 'Error interno del servidor. Intente más tarde.';
      }
    }

    return { data: null, error: msg };
  }
};
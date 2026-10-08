import { createContext, useState } from 'react';
import { login } from '../services/login';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

function AuthProvider({ children }) {

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem('token');

    return Boolean(token);
  });

  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');

    if (token) {
      try {

        return jwtDecode(token);
      } catch (error) {
        console.error('Token inválido', error);

        return null;
      }
    }

    return null;
  });

  const singout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setUser(null);
  };

  const singin = async (username, password) => {
    const { data, error } = await login(username, password);

    if (error) {
      return { error };
    }

    localStorage.setItem('token', data);

    try {
      const decodedUser = jwtDecode(data);

      setUser(decodedUser);
      setIsAuthenticated(true);
    } catch (e) {
      console.error('Error al decodificar token en login', e);

      return { error: 'Error de autenticación' };
    }

    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        singin,
        singout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export {
  AuthProvider,
  AuthContext,
};
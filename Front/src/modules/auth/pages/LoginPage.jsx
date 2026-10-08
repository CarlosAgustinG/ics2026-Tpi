import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm';

const LoginPage = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {

    navigate('/admin/home');

  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-purple-700">Panel Admin</h1>
        </div>

        <LoginForm onSuccess={handleSuccess} />

      </div>
    </div>
  );
};

export default LoginPage;
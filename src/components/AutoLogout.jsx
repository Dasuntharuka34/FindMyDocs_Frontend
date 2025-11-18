import { useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const AutoLogout = () => {
  const { logout } = useContext(AuthContext);

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'token' && !event.newValue) {
        logout();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [logout]);

  return null;
};

export default AutoLogout;

// import { useContext } from 'react';
import { useAuthContext } from './AuthProvider';

export const useAuth = () => {
  return useAuthContext();
};
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
  const token = localStorage.getItem('auth_token');
  // If logged in, render child routes. Otherwise, redirect to login.
  return token ? <Outlet /> : <Navigate to="/login" />;
}

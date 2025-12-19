//pages/admin/AdminLandingPage.tsx
import DashboardLayout from '@/components/Layouts/DashboardLayout';
import { Outlet } from 'react-router-dom';

const AdminLandingPage = () => {
  return (
    <DashboardLayout title="Admin Dashboard">  
      <Outlet />
    </DashboardLayout>
  );
};

export default AdminLandingPage
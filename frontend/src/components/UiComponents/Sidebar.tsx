import React, { useState } from 'react';
import {
  Home,
  Users,
  Stethoscope,
  Calendar,
  MessageCircle,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  FileText
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface SidebarItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: string;
}

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  // Define menu items based on user role
  const getMenuItems = (): SidebarItem[] => {
    if (user?.role==="admin") {
      return [
        { icon: Home, label: 'Dashboard', path: '/admin' },
        { icon: Users, label: 'Users', path: '/admin/users' },
        { icon: Stethoscope, label: 'Doctors', path: '/admin/doctors' },
        { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
        { icon: FileText, label: 'Reports', path: '/admin/reports' },
        { icon: Settings, label: 'Settings', path: '/admin/settings' }
      ];
    } else if (user?.role==="doctor") {
      return [
        { icon: Home, label: 'Dashboard', path: '/doctor' },
        { icon: Calendar, label: 'Appointments', path: '/doctor/appointments', badge: '3' },
        { icon: Users, label: 'Patients', path: '/doctor/patients' },
        { icon: MessageCircle, label: 'Messages', path: '/doctor/messages', badge: '12' },
        { icon: FileText, label: 'Records', path: '/doctor/records' },
        { icon: Settings, label: 'Settings', path: '/doctor/settings' }
      ];
    } else {
      return [
        { icon: Home, label: 'Dashboard', path: '/' },
        { icon: Calendar, label: 'Appointments', path: '/appointments' },
        { icon: Stethoscope, label: 'Find Doctors', path: '/doctors' },
        { icon: MessageCircle, label: 'Messages', path: '/messages' },
        { icon: FileText, label: 'Medical Records', path: '/records' },
        { icon: Settings, label: 'Settings', path: '/settings' }
      ];
    }
  };

  const menuItems = getMenuItems();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className={`bg-white shadow-lg h-screen fixed left-0 top-0 z-40 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'
      }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="font-bold text-xl text-gray-800">TailMate</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.username || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.role ? 'Administrator' : user?.role ? 'Doctor' : 'Patient'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 py-4">
        <ul className="space-y-2 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors relative group ${active
                      ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                >
                  <Icon className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : ''}`} />
                  {!isCollapsed && (
                    <>
                      <span className="font-medium">{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                      {item.label}
                      {item.badge && (
                        <span className="ml-2 bg-red-500 rounded-full px-1.5 py-0.5 text-xs">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 w-full px-3 py-2.5 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors group"
        >
          <LogOut className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : ''}`} />
          {!isCollapsed && <span className="font-medium">Logout</span>}

          {/* Tooltip for collapsed state */}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
              Logout
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

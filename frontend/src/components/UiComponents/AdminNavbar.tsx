import React, { useEffect, useRef, useState } from 'react';
import {
  Search,
  ChevronDown,
  LogOut,
  Menu,
  Bell,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';

interface NavbarProps {
  title?: string;
  onMobileMenuToggle?: () => void;
}

type NotificationItem = {
  id: string;
  title: string;
  time: string;
  read: boolean;
};

const SOCKET_URL = 'http://localhost:4000'; // Change if needed!

const Navbar: React.FC<NavbarProps> = ({
  title = 'Dashboard',
  onMobileMenuToggle,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  // Unread notification count
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (user?.role === 'admin') {
      const socket = io(SOCKET_URL, {
        withCredentials: true,
        transports: ['websocket'],
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('Socket.IO: Connected (admin)', socket.id);
      });

      socket.on('admin_notification', (data) => {
        toast.info(data.message || 'You have a new notification!');
        setNotifications((prev) => [
          {
            id: `${Date.now()}`,
            title: data.message,
            time: new Date(data.time || Date.now()).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', year: 'numeric', month: 'short', day: 'numeric' }),
            read: false,
          },
          ...prev,
        ]);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [user]);

  // Mark all notifications as read (keeps showing, just marked as read)
  const handleMarkAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );
  };

  // Show all notifications (historical) when button is clicked
  const handleViewAllNotifications = () => {
    setShowAllNotifications(true);
    setIsNotificationOpen(true);
  };

  // Dropdown notification list (all notifications always shown)
  const renderNotifications = notifications.length === 0 ? (
    <div className="p-4 text-sm text-gray-500">
      No notifications yet.
    </div>
  ) : (
    notifications.map((notification) => (
      <div
        key={notification.id}
        className={`p-4 border-b border-gray-100 transition-colors ${
          !notification.read ? 'bg-orange-50' : 'hover:bg-gray-50'
        }`}
      >
        <p className="text-sm font-medium text-gray-900">
          {notification.title}
          {!notification.read && (
            <span className="ml-2 inline-block align-middle w-2 h-2 bg-orange-500 rounded-full"></span>
          )}
        </p>
        <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
      </div>
    ))
  );

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          {/* Page Title */}
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-500 hidden sm:block">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Center Section - Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patients, appointments..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* Search Button (Mobile) */}
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Search className="w-5 h-5 text-gray-600" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {(isNotificationOpen || showAllNotifications) && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => {
                    setIsNotificationOpen(false);
                    setShowAllNotifications(false);
                  }}
                />
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    {notifications.length > 0 && (
                      <button
                        className="text-xs px-3 py-1 bg-orange-100 text-orange-600 rounded hover:bg-orange-200 transition-colors"
                        onClick={handleMarkAllAsRead}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {renderNotifications}
                  </div>
                  <div className="p-2 border-t border-gray-200">
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-gray-900">{user?.username || 'User'}</p>
                <p className="text-xs text-gray-500">
                  {user?.role === 'admin'
                    ? 'Admin'
                    : user?.role === 'doctor'
                    ? 'Doctor'
                    : 'Patient'}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {isProfileOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsProfileOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                  <div className="py-1">
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

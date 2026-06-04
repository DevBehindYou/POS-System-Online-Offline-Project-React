import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ collapsed }) => {
  const { user } = useAuth();

  const menuItems = [
    {
      path: '/dashboard',
      icon: '📊',
      label: 'Dashboard',
      roles: ['admin', 'cashier']
    },
    {
      path: '/sales',
      icon: '🛒',
      label: 'Sales',
      roles: ['admin', 'cashier']
    },
    {
      path: '/products',
      icon: '📦',
      label: 'Products',
      roles: ['admin', 'cashier']
    },
    {
      path: '/customers',
      icon: '👥',
      label: 'Customers',
      roles: ['admin', 'cashier']
    },
    {
      path: '/reports',
      icon: '📈',
      label: 'Reports',
      roles: ['admin']
    },
    {
      path: '/settings',
      icon: '⚙️',
      label: 'Settings',
      roles: ['admin', 'cashier']
    }
  ];

  const visibleItems = menuItems.filter(item => 
    item.roles.includes(user?.role)
  );

  return (
    <div className={`fixed inset-y-0 left-0 z-50 bg-white shadow-lg transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-gray-200">
        <div className="flex items-center">
          <span className="text-2xl">🏪</span>
          {!collapsed && (
            <span className="ml-2 text-xl font-bold text-gray-800">POS System</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-8">
        <ul className="space-y-2 px-3">
          {visibleItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
                title={collapsed ? item.label : ''}
              >
                <span className="text-lg">{item.icon}</span>
                {!collapsed && (
                  <span className="ml-3">{item.label}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Info */}
      <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-700">{user?.username}</div>
              <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
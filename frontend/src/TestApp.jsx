// Create this simple test file: src/TestApp.jsx
import React, { useState } from 'react';

const TestApp = () => {
  const [user, setUser] = useState(null);

  const handleLogin = () => {
    setUser({
      username: 'admin',
      role: 'admin',
      email: 'admin@demo.com'
    });
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6">🏪 POS System Test</h1>
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Login as Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Simple Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span>Welcome, {user.username}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Simple Dashboard */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-600">Today's Sales</h3>
            <p className="text-2xl font-bold text-blue-600">12</p>
            <p className="text-sm text-gray-500">$1,450.75</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-600">This Month</h3>
            <p className="text-2xl font-bold text-green-600">156</p>
            <p className="text-sm text-gray-500">$18,750.30</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-600">Products</h3>
            <p className="text-2xl font-bold text-purple-600">42</p>
            <p className="text-sm text-gray-500">Active products</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-600">Customers</h3>
            <p className="text-2xl font-bold text-orange-600">28</p>
            <p className="text-sm text-gray-500">Registered</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">✅ Frontend is Working!</h2>
          <p className="text-gray-600 mb-4">
            Your React frontend is successfully running with Tailwind CSS.
          </p>
          <div className="space-y-2 text-sm">
            <p>✅ React components loading</p>
            <p>✅ Tailwind CSS styling active</p>
            <p>✅ State management working</p>
            <p>✅ No console errors</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestApp;
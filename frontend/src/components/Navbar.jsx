import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useWebSocket } from '../context/WebSocketContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { isConnected } = useWebSocket();

  if (!user) return null;

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center font-bold text-lg">
            Smart Meal Optimizer
          </div>
          <div className="flex items-center">
            {user.role === 'admin' && (
              <span className={`mr-4 text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                {isConnected ? '● Connected' : '● Disconnected'}
              </span>
            )}
            <span className="mr-4 text-gray-600">Welcome, {user.username} ({user.role})</span>
            <button onClick={logout} className="p-2 rounded-md text-gray-700 hover:bg-gray-100 transition">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
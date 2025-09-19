import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWebSocket } from '../../context/WebSocketContext';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import {
  ChartBarIcon,
  CogIcon,
  CubeIcon,
  UserGroupIcon,
  BellIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const { messages, isConnected } = useWebSocket();
  const [optimizing, setOptimizing] = useState(false);

  const handleOptimizeMeals = async () => {
    setOptimizing(true);
    try {
      await api.post('/admin/actions/', { action: 'optimize_meals' });
      toast.success('Meal optimization started! This may take a few moments.');
    } catch (error) {
      toast.error('Failed to start optimization. Please try again.');
    } finally {
      setOptimizing(false);
    }
  };

  const quickActions = [
    {
      name: 'Stock Management',
      href: '/admin/stock',
      icon: CubeIcon,
      description: 'Manage inventory and stock levels'
    },
    {
      name: 'Dish Management',
      href: '/admin/dishes',
      icon: ChartBarIcon,
      description: 'Add and manage available dishes'
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: ChartBarIcon,
      description: 'View usage statistics and reports'
    },
    {
      name: 'User Management',
      href: '/admin/users',
      icon: UserGroupIcon,
      description: 'Manage sailors and chefs'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Admin Dashboard
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={handleOptimizeMeals}
            disabled={optimizing}
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <PlayIcon className="-ml-1 mr-2 h-5 w-5" />
            {optimizing ? 'Optimizing...' : 'Optimize Meals'}
          </button>
        </div>
      </div>

      {/* WebSocket Status */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className={`flex-shrink-0 h-3 w-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                Live Updates: {isConnected ? 'Connected' : 'Disconnected'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => (
          <Link
            key={action.name}
            to={action.href}
            className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div>
              <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white">
                <action.icon className="h-6 w-6" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-8">
              <h3 className="text-lg font-medium">
                <span className="absolute inset-0" aria-hidden="true" />
                {action.name}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {action.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Live Notifications */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            <BellIcon className="inline h-5 w-5 mr-2" />
            Live Notifications
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-sm text-gray-500">No notifications yet</p>
            ) : (
              messages.map((message, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-900">
                    {typeof message === 'string' ? message : JSON.stringify(message)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
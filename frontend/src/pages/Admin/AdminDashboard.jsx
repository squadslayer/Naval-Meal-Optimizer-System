import { useState, useCallback, Fragment, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWebSocket } from '../../context/WebSocketContext';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { Dialog, Transition } from '@headlessui/react';
import {
  ChartBarIcon,
  CubeIcon,
  UserGroupIcon,
  BellIcon,
  PlayIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { differenceInCalendarDays, format } from 'date-fns';

export default function AdminDashboard() {
  const { messages, isConnected } = useWebSocket();
  const [optimizing, setOptimizing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [voyageData, setVoyageData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    total_days: 0,
  });

  const handleOptimizeMeals = useCallback(async () => {
    setOptimizing(true);
    try {
      const response = await api.post('/admin/actions/', { action: 'optimize_meals' });
      toast.success(response.data.message || 'Meal optimization started!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to start optimization.');
    } finally {
      setOptimizing(false);
    }
  }, []);

  // --- Voyage Modal Logic ---
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
        setVoyageData({ name: '', start_date: '', end_date: '', total_days: 0 });
    }, 300);
  };

  const handleVoyageChange = (e) => {
    setVoyageData({ ...voyageData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    if (voyageData.start_date && voyageData.end_date) {
      const startDate = new Date(voyageData.start_date);
      const endDate = new Date(voyageData.end_date);
      if (endDate >= startDate) {
        const days = differenceInCalendarDays(endDate, startDate) + 1;
        setVoyageData(prev => ({ ...prev, total_days: days }));
      } else {
        setVoyageData(prev => ({ ...prev, total_days: 0 }));
      }
    }
  }, [voyageData.start_date, voyageData.end_date]);

  const handleVoyageSubmit = async (e) => {
    e.preventDefault();
    if (voyageData.total_days <= 0) {
      toast.error('End date must be on or after the start date.');
      return;
    }
    setIsCreating(true);
    try {
      const payload = {
        action: 'create_voyage',
        ...voyageData
      };
      await api.post('/admin/actions/', payload);
      toast.success(`Voyage "${voyageData.name}" created successfully!`);
      closeModal();
    } catch (error) {
        const errorMsg = error.response?.data?.error?.total_days?.[0] || error.response?.data?.error || 'Failed to create voyage.';
        toast.error(errorMsg);
    } finally {
      setIsCreating(false);
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
    <>
      <div className="space-y-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Admin Dashboard
            </h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              type="button"
              onClick={openModal}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Create Voyage
            </button>
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

        {/* WebSocket Status, Quick Actions, and Live Notifications... */}
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

      {/* Create Voyage Modal */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Create a New Voyage
                  </Dialog.Title>
                  <form onSubmit={handleVoyageSubmit} className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">Voyage Name</label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        value={voyageData.name}
                        onChange={handleVoyageChange}
                        required
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">Start Date</label>
                        <input
                          type="date"
                          name="start_date"
                          id="start_date"
                          value={voyageData.start_date}
                          onChange={handleVoyageChange}
                          required
                          min={format(new Date(), 'yyyy-MM-dd')}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">End Date</label>
                        <input
                          type="date"
                          name="end_date"
                          id="end_date"
                          value={voyageData.end_date}
                          onChange={handleVoyageChange}
                          required
                          min={voyageData.start_date || format(new Date(), 'yyyy-MM-dd')}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                     {voyageData.total_days > 0 && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-center">
                            <p className="text-sm font-medium text-blue-800">
                                Total Duration: {voyageData.total_days} day(s)
                            </p>
                        </div>
                    )}
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        onClick={closeModal}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isCreating}
                        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                      >
                        {isCreating ? 'Creating...' : 'Create Voyage'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
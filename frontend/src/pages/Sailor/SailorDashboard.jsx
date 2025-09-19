import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sailorAPI } from '../../services/apiService';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import { CalendarDaysIcon, UserCircleIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

const SailorDashboard = () => {
  const [mealPlans, setMealPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMealPlans = async () => {
      try {
        const response = await sailorAPI.getMealPlans();
        // Sort meal plans by date
        const sortedPlans = response.data.sort((a, b) => new Date(a.meal_date) - new Date(b.meal_date));
        setMealPlans(sortedPlans);
      } catch (error) {
        toast.error("Could not fetch your meal schedule.");
        console.error("Error fetching meal plans:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMealPlans();
  }, []);

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Sailor Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashboardCard
            title="My Profile"
            description="Manage preferences and allergies"
            link="/sailor/profile"
            Icon={UserCircleIcon}
            color="blue"
          />
          <DashboardCard
            title="Feedback"
            description="Submit meal satisfaction feedback"
            link="/sailor/feedback"
            Icon={ChatBubbleLeftRightIcon}
            color="purple"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
          <CalendarDaysIcon className="h-6 w-6 mr-3 text-primary-600" />
          Your Meal Schedule
        </h2>
        {loading ? (
          <div className="py-16"><LoadingSpinner /></div>
        ) : (
          <div className="overflow-x-auto">
            {mealPlans.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meal Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dish</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mealPlans.map((plan) => (
                    <tr key={plan.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{plan.meal_date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{plan.meal_type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{plan.dish.dish_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No meals have been assigned to you yet.</p>
                <p className="text-sm text-gray-400 mt-2">Please wait for the administrator to optimize and assign the meal plan for the voyage.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const DashboardCard = ({ title, description, link, Icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
    purple: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
  };
  return (
    <Link to={link} className={`p-6 rounded-lg transition-all duration-300 shadow-sm hover:shadow-lg ${colorClasses[color]}`}>
      <Icon className="h-8 w-8 mb-3" />
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p>{description}</p>
    </Link>
  );
};

export default SailorDashboard;
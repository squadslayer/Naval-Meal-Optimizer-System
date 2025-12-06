import React, { useState, useEffect } from 'react';
import { chefAPI } from '../../services/apiService';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import { CalendarDaysIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';

const groupAssignmentsByDate = (assignments) => {
  if (!assignments || assignments.length === 0) {
    return {};
  }
  return assignments.reduce((acc, assignment) => {
    const date = assignment.meal_plan.meal_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(assignment);
    return acc;
  }, {});
};

const ChefDashboard = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await chefAPI.getAssignments();
        setAssignments(response.data);
      } catch (error) {
        toast.error("Could not fetch your assignments.");
        console.error("Error fetching chef assignments:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, []);

  const groupedAssignments = groupAssignmentsByDate(assignments);
  const dates = Object.keys(groupedAssignments).sort();

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Chef Dashboard</h1>
        <p className="text-gray-600">Welcome! Here are your upcoming cooking assignments.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <ClipboardDocumentListIcon className="h-6 w-6 mr-3 text-primary-600" />
            Your Schedule
          </h2>
        </div>

        {loading ? (
          <div className="py-16"><LoadingSpinner /></div>
        ) : (
          <div>
            {assignments.length > 0 ? (
              dates.map(date => (
                <div key={date} className="border-b last:border-b-0">
                  <h3 className="bg-gray-50 px-6 py-3 text-lg font-semibold text-gray-800">
                    {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                  </h3>
                  <div className="divide-y divide-gray-200">
                    {groupedAssignments[date].map((assignment) => (
                      <div key={assignment.id} className="px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        <p className="text-md font-medium text-gray-900 capitalize">
                          {assignment.meal_plan.meal_type}
                        </p>
                        <p className="text-md text-gray-700">
                          {assignment.meal_plan.dish.dish_name}
                        </p>
                        <p className="text-md text-gray-500">
                          Counter #{assignment.counter_number}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 px-6">
                <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-xl font-semibold text-gray-900">No assignments found</h3>
                <p className="mt-1 text-md text-gray-500">
                  You do not have any upcoming cooking assignments.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChefDashboard;
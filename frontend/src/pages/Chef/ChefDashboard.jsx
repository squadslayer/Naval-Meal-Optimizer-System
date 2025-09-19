import React from 'react';

const ChefDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Chef Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-blue-900 mb-2">Meal Planning</h2>
              <p className="text-blue-700">Plan and manage daily meals</p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-green-900 mb-2">Kitchen Status</h2>
              <p className="text-green-700">Monitor kitchen operations</p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-purple-900 mb-2">Inventory</h2>
              <p className="text-purple-700">Track ingredient usage</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChefDashboard;
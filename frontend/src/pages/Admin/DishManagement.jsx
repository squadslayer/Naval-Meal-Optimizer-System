import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function DishManagement() {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    dish_name: '',
    dish_type: 'veg',
    has_gluten: false,
    has_nuts: false,
    has_dairy: false,
    calories: '',
    protein: '',
    carbs: '',
    fats: ''
  });

  const loadDishes = async () => {
    try {
      const { data } = await api.get('/admin/dishes/');
      setDishes(data);
    } catch (error) {
      toast.error('Failed to load dishes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDishes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        calories: formData.calories ? parseFloat(formData.calories) : null,
        protein: formData.protein ? parseFloat(formData.protein) : null,
        carbs: formData.carbs ? parseFloat(formData.carbs) : null,
        fats: formData.fats ? parseFloat(formData.fats) : null
      };
      await api.post('/admin/dishes/', submitData);
      toast.success('Dish added successfully');
      setFormData({
        dish_name: '',
        dish_type: 'veg',
        has_gluten: false,
        has_nuts: false,
        has_dairy: false,
        calories: '',
        protein: '',
        carbs: '',
        fats: ''
      });
      setShowForm(false);
      loadDishes();
    } catch (error) {
      toast.error('Failed to add dish');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Dish Management
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Dish
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Add New Dish
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="dish_name" className="block text-sm font-medium text-gray-700">
                    Dish Name
                  </label>
                  <input
                    type="text"
                    name="dish_name"
                    id="dish_name"
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.dish_name}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="dish_type" className="block text-sm font-medium text-gray-700">
                    Dish Type
                  </label>
                  <select
                    name="dish_type"
                    id="dish_type"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.dish_type}
                    onChange={handleChange}
                  >
                    <option value="veg">Vegetarian</option>
                    <option value="non_veg">Non-Vegetarian</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allergens
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="has_gluten"
                      checked={formData.has_gluten}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Contains Gluten</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="has_nuts"
                      checked={formData.has_nuts}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Contains Nuts</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="has_dairy"
                      checked={formData.has_dairy}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Contains Dairy</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label htmlFor="calories" className="block text-sm font-medium text-gray-700">
                    Calories (per serving)
                  </label>
                  <input
                    type="number"
                    name="calories"
                    id="calories"
                    min="0"
                    step="0.1"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.calories}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="protein" className="block text-sm font-medium text-gray-700">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    name="protein"
                    id="protein"
                    min="0"
                    step="0.1"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.protein}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="carbs" className="block text-sm font-medium text-gray-700">
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    name="carbs"
                    id="carbs"
                    min="0"
                    step="0.1"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.carbs}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="fats" className="block text-sm font-medium text-gray-700">
                    Fats (g)
                  </label>
                  <input
                    type="number"
                    name="fats"
                    id="fats"
                    min="0"
                    step="0.1"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.fats}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {dishes.map((dish) => (
          <div key={dish.id} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">{dish.dish_name}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  dish.dish_type === 'veg'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {dish.dish_type === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'}
                </span>
              </div>

              {dish.calories && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>Calories: {dish.calories}</p>
                  {dish.protein && <p>Protein: {dish.protein}g</p>}
                  {dish.carbs && <p>Carbs: {dish.carbs}g</p>}
                  {dish.fats && <p>Fats: {dish.fats}g</p>}
                </div>
              )}

              <div className="mt-3">
                <div className="flex flex-wrap gap-1">
                  {dish.has_gluten && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Gluten
                    </span>
                  )}
                  {dish.has_nuts && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      Nuts
                    </span>
                  )}
                  {dish.has_dairy && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Dairy
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

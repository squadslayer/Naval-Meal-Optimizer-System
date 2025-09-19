import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { UserIcon } from '@heroicons/react/24/outline';

export default function SailorProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProfile = async () => {
    try {
      const { data } = await api.get('/sailor/profile/');
      setProfile(data);
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/sailor/profile/', profile);
      toast.success('Profile updated successfully');
      loadProfile();
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfile({
      ...profile,
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

  if (!profile) {
    return (
      <div className="text-center">
        <p className="text-gray-500">No profile data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            My Profile
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Update your dietary preferences and allergy information
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Diet Type */}
            <div>
              <label htmlFor="preference_type" className="block text-sm font-medium text-gray-700">
                Diet Type
              </label>
              <select
                name="preference_type"
                id="preference_type"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={profile.preference_type}
                onChange={handleChange}
              >
                <option value="veg">Vegetarian</option>
                <option value="non_veg">Non-Vegetarian</option>
              </select>
            </div>

            {/* Allergies */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Allergies & Dietary Restrictions
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="has_gluten_allergy"
                    checked={profile.has_gluten_allergy}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    Gluten Allergy/Intolerance
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="has_nut_allergy"
                    checked={profile.has_nut_allergy}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    Nut Allergy
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="has_dairy_allergy"
                    checked={profile.has_dairy_allergy}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    Dairy Allergy/Lactose Intolerance
                  </span>
                </label>
              </div>
            </div>

            {/* Profile Summary */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Profile Summary</h4>
              <p className="text-sm text-gray-600">
                {profile.preference_type === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'} diet
                {profile.has_gluten_allergy && ', Gluten-free'}
                {profile.has_nut_allergy && ', Nut-free'}
                {profile.has_dairy_allergy && ', Dairy-free'}
                {!profile.has_gluten_allergy && !profile.has_nut_allergy && !profile.has_dairy_allergy && ' with no known allergies'}
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export function CreateOpportunity() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    date: '',
    requiredSkills: '',
    imageUrl: '',
    type: 'need-help', // or 'offering-help'
    category: 'home-maintenance',
    estimatedDuration: '1-2',
    urgency: 'normal',
  });

  const categories = [
    { value: 'home-maintenance', label: 'Home Maintenance' },
    { value: 'yard-work', label: 'Yard Work' },
    { value: 'technology', label: 'Technology Help' },
    { value: 'education', label: 'Education & Tutoring' },
    { value: 'senior-care', label: 'Senior Care' },
    { value: 'pet-care', label: 'Pet Care' },
    { value: 'moving', label: 'Moving Help' },
    { value: 'cleaning', label: 'Cleaning' },
    { value: 'errands', label: 'Errands' },
    { value: 'other', label: 'Other' }
  ];

  const durations = [
    { value: '1-2', label: '1-2 hours' },
    { value: '2-4', label: '2-4 hours' },
    { value: '4-8', label: '4-8 hours' },
    { value: '8+', label: 'More than 8 hours' }
  ];

  const urgencyLevels = [
    { value: 'low', label: 'Low - Whenever convenient' },
    { value: 'normal', label: 'Normal - Within a week' },
    { value: 'high', label: 'High - Within 2-3 days' },
    { value: 'urgent', label: 'Urgent - As soon as possible' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase.from('opportunities').insert({
        title: formData.title,
        description: formData.description,
        organization: user?.email || 'Anonymous', // Using email as display name for now
        location: formData.location,
        date: formData.date,
        image_url: formData.imageUrl || 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        required_skills: formData.requiredSkills.split(',').map(skill => skill.trim()),
        organization_id: user?.id,
        type: formData.type,
        category: formData.category,
        estimated_duration: formData.estimatedDuration,
        urgency: formData.urgency,
        spots: 1, // Most client-to-client help needs only one person
      });

      if (error) throw error;
      navigate('/');
    } catch (error) {
      console.error('Error creating opportunity:', error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Create New Request</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am...
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`
                  flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer
                  ${formData.type === 'need-help' 
                    ? 'border-primary-500 bg-primary-50 text-primary-700' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}>
                  <input
                    type="radio"
                    name="type"
                    value="need-help"
                    checked={formData.type === 'need-help'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span>Looking for Help</span>
                </label>
                <label className={`
                  flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer
                  ${formData.type === 'offering-help' 
                    ? 'border-primary-500 bg-primary-50 text-primary-700' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}>
                  <input
                    type="radio"
                    name="type"
                    value="offering-help"
                    checked={formData.type === 'offering-help'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span>Offering to Help</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder={formData.type === 'need-help' ? "e.g., Need help fixing a leaky faucet" : "e.g., Available for yard work and gardening"}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder={formData.type === 'need-help' 
                  ? "Describe what you need help with, including any specific requirements or preferences..."
                  : "Describe your skills and experience, and what kind of help you can offer..."
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Downtown area, North Side, etc."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Duration
                </label>
                <select
                  name="estimatedDuration"
                  value={formData.estimatedDuration}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  required
                >
                  {durations.map(duration => (
                    <option key={duration.value} value={duration.value}>
                      {duration.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Urgency Level
              </label>
              <select
                name="urgency"
                value={formData.urgency}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              >
                {urgencyLevels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.type === 'need-help' ? 'Required Skills' : 'Your Skills'}
              </label>
              <input
                type="text"
                name="requiredSkills"
                value={formData.requiredSkills}
                onChange={handleChange}
                placeholder="e.g., Plumbing, Gardening, Computer Repair (comma-separated)"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL (Optional)
              </label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          {formData.type === 'need-help' ? 'Post Request' : 'Offer Help'}
        </button>
      </form>
    </div>
  );
}
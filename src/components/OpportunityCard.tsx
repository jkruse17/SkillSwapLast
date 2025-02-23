import React from 'react';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { Opportunity } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface OpportunityCardProps {
  opportunity: Opportunity;
}

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const { user } = useAuth();
  const [applying, setApplying] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setApplying(true);
      setError(null);

      // First ensure profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('Please complete your profile before applying');
      }

      const { error: applicationError } = await supabase
        .from('applications')
        .insert({
          opportunity_id: opportunity.id,
          user_id: user.id,
          message: message,
        });

      if (applicationError) throw applicationError;

      setSuccess(true);
      setMessage('');
    } catch (error) {
      console.error('Error applying:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <img 
        src={opportunity.imageUrl || 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'} 
        alt={opportunity.title}
        className="w-full h-48 object-cover"
      />
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{opportunity.title}</h3>
        <p className="text-gray-600 text-sm mb-4">{opportunity.organization}</p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-500">
            <Calendar className="w-4 h-4 mr-2" />
            <span className="text-sm">{opportunity.date}</span>
          </div>
          <div className="flex items-center text-gray-500">
            <MapPin className="w-4 h-4 mr-2" />
            <span className="text-sm">{opportunity.location}</span>
          </div>
          <div className="flex items-center text-gray-500">
            <Users className="w-4 h-4 mr-2" />
            <span className="text-sm">{opportunity.spots} spots available</span>
          </div>
          <div className="flex items-center text-gray-500">
            <Clock className="w-4 h-4 mr-2" />
            <span className="text-sm">Posted {new Date(opportunity.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <p className="text-gray-700 mb-4">{opportunity.description}</p>

        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Required Skills</h4>
          <div className="flex flex-wrap gap-2">
            {opportunity.requiredSkills.map((skill) => (
              <span 
                key={skill}
                className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {success ? (
          <div className="text-primary-600 text-center py-2">
            Application submitted successfully!
          </div>
        ) : user ? (
          <form onSubmit={handleApply}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Why are you interested? (Optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                placeholder="Share why you'd be a great fit..."
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm mb-4">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={applying}
              className={`w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors ${
                applying ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {applying ? 'Applying...' : 'Apply Now'}
            </button>
          </form>
        ) : (
          <button
            onClick={() => window.location.href = '/auth'}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors"
          >
            Sign in to Apply
          </button>
        )}
      </div>
    </div>
  );
}
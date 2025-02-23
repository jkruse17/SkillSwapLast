import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Opportunity, Application } from '../types';
import { Calendar, MapPin, Users, Clock, Trash2, Edit, AlertCircle, CheckCircle, Star } from 'lucide-react';

interface OpportunityWithApplications extends Opportunity {
  applications: Application[];
  completed?: boolean;
}

export function ManagePosts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState<OpportunityWithApplications[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      navigate('/auth');
      return;
    }
    loadOpportunities();
  }, [user, navigate]);

  const loadOpportunities = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Get all opportunities created by the user
      const { data: opportunitiesData, error: opportunitiesError } = await supabase
        .from('opportunities')
        .select('*')
        .eq('organization_id', user.id)
        .order('created_at', { ascending: false });

      if (opportunitiesError) throw opportunitiesError;

      if (!opportunitiesData) {
        setOpportunities([]);
        return;
      }

      // Get completions for these opportunities
      const { data: completionsData } = await supabase
        .from('completions')
        .select('opportunity_id, status')
        .in('opportunity_id', opportunitiesData.map(opp => opp.id))
        .eq('status', 'completed');

      const opportunitiesWithApplications = await Promise.all(
        opportunitiesData.map(async (opp) => {
          const { data: applicationsData } = await supabase
            .from('applications')
            .select(`
              id,
              status,
              created_at,
              user_id,
              message
            `)
            .eq('opportunity_id', opp.id);

          const applications = await Promise.all(
            (applicationsData || []).map(async (app) => {
              if (!app.user_id) return null;

              const { data: userData } = await supabase
                .from('profiles')
                .select('name, email')
                .eq('id', app.user_id)
                .single();

              return userData ? {
                ...app,
                user: userData
              } : null;
            })
          );

          return {
            ...opp,
            requiredSkills: opp.required_skills,
            imageUrl: opp.image_url,
            applications: applications.filter((app): app is Application => app !== null),
            completed: completionsData?.some(comp => comp.opportunity_id === opp.id)
          };
        })
      );

      setOpportunities(opportunitiesWithApplications);
    } catch (err) {
      console.error('Error loading opportunities:', err);
      setError('Failed to load your posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.id) return;
    
    try {
      setDeleting(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('opportunities')
        .delete()
        .match({ id, organization_id: user.id });

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw new Error('Failed to delete the post');
      }

      setOpportunities(prev => prev.filter(opp => opp.id !== id));
      setDeleteId(null);
    } catch (err) {
      console.error('Error deleting opportunity:', err);
      setError('Failed to delete post. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleComplete = async (opportunityId: string, applicationId: string, volunteerId: string) => {
    if (!user?.id || !opportunityId || !applicationId || !volunteerId) {
      console.error('Missing required data for completion');
      setError('Missing required data for completion');
      return;
    }

    try {
      setCompleting(applicationId);
      setError(null);

      // 1. Create completion record
      const { data: completion, error: completionError } = await supabase
        .from('completions')
        .insert({
          opportunity_id: opportunityId,
          volunteer_id: volunteerId,
          organizer_id: user.id,
          status: 'completed',
          hours_spent: 1, // Default to 1 hour
          completion_date: new Date().toISOString()
        })
        .select()
        .single();

      if (completionError) throw completionError;
      if (!completion) throw new Error('Failed to create completion record');

      // 2. Update application status
      const { error: applicationError } = await supabase
        .from('applications')
        .update({ status: 'accepted' })
        .eq('id', applicationId)
        .eq('user_id', volunteerId);

      if (applicationError) throw applicationError;

      // 3. Create notifications
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: volunteerId,
            message: `Your work has been marked as complete. Please leave a review!`,
            type: 'completion',
            reference_id: completion.id
          },
          {
            user_id: user.id,
            message: `You marked a task as complete. Don't forget to leave a review!`,
            type: 'completion',
            reference_id: completion.id
          }
        ]);

      if (notificationError) throw notificationError;

      // 4. Update local state to mark opportunity as completed
      setOpportunities(prev => prev.map(opp => 
        opp.id === opportunityId ? { ...opp, completed: true } : opp
      ));
    } catch (err) {
      console.error('Error marking as complete:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark opportunity as complete');
    } finally {
      setCompleting(null);
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/edit-opportunity/${id}`);
  };

  const filteredOpportunities = opportunities.filter(opp => showCompleted ? true : !opp.completed);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="bg-white p-6 rounded-lg shadow-md">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Manage Your Posts</h1>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={`text-sm font-medium px-3 py-1 rounded-full transition-colors ${
              showCompleted 
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {showCompleted ? 'Hide Completed' : 'Show Completed'}
          </button>
        </div>
        <button
          onClick={() => navigate('/create-opportunity')}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
        >
          Create New Post
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {opportunities.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-500 text-lg mb-4">You haven't created any posts yet.</p>
            <button
              onClick={() => navigate('/create-opportunity')}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Create your first post
            </button>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-500 text-lg">No {showCompleted ? '' : 'active '}posts to display.</p>
          </div>
        ) : (
          filteredOpportunities.map(opportunity => (
            <div 
              key={opportunity.id} 
              className={`bg-white rounded-lg shadow-md overflow-hidden ${
                opportunity.completed ? 'opacity-75' : ''
              }`}
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{opportunity.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{opportunity.organization}</p>
                  </div>
                  <div className="flex gap-2">
                    {!opportunity.completed && (
                      <>
                        <button
                          onClick={() => handleEdit(opportunity.id)}
                          className="text-gray-600 hover:text-primary-600 p-2"
                          title="Edit post"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(opportunity.id)}
                          className="text-gray-600 hover:text-red-600 p-2"
                          title="Delete post"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

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

                {opportunity.applications.length > 0 && (
                  <div className="mt-6 border-t pt-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Applications</h4>
                    <div className="space-y-4">
                      {opportunity.applications.map((application) => (
                        <div key={application.id} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">{application.user.name}</p>
                              <p className="text-sm text-gray-500">{application.user.email}</p>
                              <p className="text-sm text-gray-600 mt-2">
                                Applied {new Date(application.created_at).toLocaleDateString()}
                              </p>
                              {application.message && (
                                <p className="text-sm text-gray-700 mt-2 bg-white p-3 rounded-md">
                                  "{application.message}"
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`
                                px-2 py-1 text-xs font-medium rounded-full
                                ${application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                                ${application.status === 'accepted' ? 'bg-green-100 text-green-800' : ''}
                                ${application.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                              `}>
                                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                              </span>
                              {!opportunity.completed && application.status === 'pending' && (
                                <button
                                  onClick={() => handleComplete(opportunity.id, application.id, application.user_id)}
                                  disabled={completing === application.id}
                                  className="ml-2 flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {completing === application.id ? (
                                    <>
                                      <Clock className="w-3 h-3 animate-spin" />
                                      <span>Processing...</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="w-3 h-3" />
                                      <span>Mark Complete</span>
                                    </>
                                  )}
                                </button>
                              )}
                              {(opportunity.completed || application.status === 'accepted') && (
                                <button
                                  className="ml-2 flex items-center gap-1 px-2 py-1 bg-primary-600 text-white text-xs rounded hover:bg-primary-700 transition-colors"
                                  onClick={() => navigate('/reviews')}
                                >
                                  <Star className="w-3 h-3" />
                                  <span>Leave Review</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {deleteId === opportunity.id && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Post</h3>
                    <p className="text-gray-600 mb-6">
                      Are you sure you want to delete this post? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-4">
                      <button
                        onClick={() => setDeleteId(null)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-700"
                        disabled={deleting}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(opportunity.id)}
                        className={`px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed`}
                        disabled={deleting}
                      >
                        {deleting ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
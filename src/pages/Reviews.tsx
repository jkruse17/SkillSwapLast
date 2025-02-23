import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Star, AlertCircle, Loader2 } from 'lucide-react';
import type { Completion, Review } from '../types';

interface CompletionWithDetails extends Completion {
  opportunity: {
    title: string;
    organization: string;
  } | null;
  volunteer: {
    name: string;
    avatar_url: string | null;
  } | null;
  organizer: {
    name: string;
    avatar_url: string | null;
  } | null;
  reviews: Review[];
}

export function Reviews() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const completionId = searchParams.get('completion');
  
  const [completions, setCompletions] = useState<CompletionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    loadCompletions();
  }, [user, navigate]);

  const loadCompletions = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: completionsData, error: completionsError } = await supabase
        .from('completions')
        .select(`
          *,
          opportunity:opportunity_id (
            title,
            organization
          ),
          volunteer:volunteer_id (
            name,
            avatar_url
          ),
          organizer:organizer_id (
            name,
            avatar_url
          ),
          reviews (*)
        `)
        .or(`volunteer_id.eq.${user?.id},organizer_id.eq.${user?.id}`)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (completionsError) throw completionsError;

      setCompletions(completionsData || []);
    } catch (err) {
      console.error('Error loading completions:', err);
      setError('Failed to load completions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (completion: CompletionWithDetails) => {
    if (!user || !feedback.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      const revieweeId = user.id === completion.volunteer_id 
        ? completion.organizer_id 
        : completion.volunteer_id;

      const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
          completion_id: completion.id,
          reviewer_id: user.id,
          reviewee_id: revieweeId,
          rating,
          feedback: feedback.trim()
        });

      if (reviewError) throw reviewError;

      setFeedback('');
      setRating(5);
      await loadCompletions();
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const hasUserReviewed = (completion: CompletionWithDetails) => {
    return completion.reviews.some(review => review.reviewer_id === user?.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-8">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Reviews</h1>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {completions.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <p className="text-gray-500">No completed opportunities to review yet.</p>
            </div>
          ) : (
            completions.map(completion => (
              <div 
                key={completion.id} 
                className={`bg-white shadow rounded-lg overflow-hidden ${
                  completionId === completion.id ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {completion.opportunity?.title || 'Untitled Opportunity'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Completed on {new Date(completion.completion_date!).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Completed
                      </span>
                      {completion.review_status === 'completed' && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          All Reviews In
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    {completion.volunteer && (
                      <div className="flex items-center gap-2">
                        <img
                          src={completion.volunteer.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(completion.volunteer.name)}`}
                          alt={completion.volunteer.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {completion.volunteer.name}
                          </p>
                          <p className="text-xs text-gray-500">Volunteer</p>
                        </div>
                      </div>
                    )}
                    {completion.organizer && (
                      <div className="flex items-center gap-2">
                        <img
                          src={completion.organizer.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(completion.organizer.name)}`}
                          alt={completion.organizer.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {completion.organizer.name}
                          </p>
                          <p className="text-xs text-gray-500">Organizer</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {completion.reviews.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-4">Reviews</h4>
                      <div className="space-y-4">
                        {completion.reviews.map(review => (
                          <div key={review.id} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <img
                                  src={
                                    review.reviewer_id === completion.volunteer_id && completion.volunteer
                                      ? completion.volunteer.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(completion.volunteer.name)}`
                                      : completion.organizer?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(completion.organizer?.name || 'Unknown')}`
                                  }
                                  alt="Reviewer"
                                  className="w-6 h-6 rounded-full"
                                />
                                <span className="text-sm font-medium text-gray-900">
                                  {review.reviewer_id === completion.volunteer_id
                                    ? completion.volunteer?.name || 'Unknown Volunteer'
                                    : completion.organizer?.name || 'Unknown Organizer'
                                  }
                                </span>
                              </div>
                              <div className="flex items-center">
                                {[...Array(review.rating)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className="w-4 h-4 text-yellow-400 fill-current"
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-gray-700">{review.feedback}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!hasUserReviewed(completion) && (
                    <div className="border-t pt-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-4">Leave a Review</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rating
                          </label>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((value) => (
                              <button
                                key={value}
                                onClick={() => setRating(value)}
                                className="focus:outline-none"
                              >
                                <Star
                                  className={`w-6 h-6 ${
                                    value <= rating
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Feedback
                          </label>
                          <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Share your experience..."
                          />
                        </div>
                        <button
                          onClick={() => handleSubmitReview(completion)}
                          disabled={submitting || !feedback.trim()}
                          className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Submitting...</span>
                            </>
                          ) : (
                            'Submit Review'
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
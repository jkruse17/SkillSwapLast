import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  UserCircle,
  Mail,
  MapPin,
  Star,
  Clock,
  Award,
  Briefcase,
  GraduationCap,
  Globe,
  UserPlus,
  Check,
  X,
  MessageSquare,
  Loader2,
  AlertCircle
} from 'lucide-react';
import type { Profile, Connection, Review } from '../types';

export function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (!id || id === user?.id) {
      navigate('/profile');
      return;
    }

    loadProfile();
  }, [id, user, navigate]);

  const loadProfile = async () => {
    if (!id || !user) return;

    try {
      setLoading(true);
      setError(null);

      // Get profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (profileError) throw profileError;
      if (!profileData) throw new Error('Profile not found');

      setProfile(profileData);

      // Get connection status
      const { data: connectionData } = await supabase
        .from('connections')
        .select('*')
        .or(`and(requester_id.eq.${user.id},recipient_id.eq.${id}),and(requester_id.eq.${id},recipient_id.eq.${user.id})`)
        .single();

      setConnection(connectionData);

      // Get reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .eq('reviewee_id', id)
        .order('created_at', { ascending: false });

      setReviews(reviewsData || []);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!user || !profile) return;

    try {
      setConnecting(true);

      const { error } = await supabase
        .from('connections')
        .insert({
          requester_id: user.id,
          recipient_id: profile.id,
          status: 'pending'
        });

      if (error) throw error;

      await loadProfile();
    } catch (err) {
      console.error('Error connecting:', err);
      setError('Failed to send connection request');
    } finally {
      setConnecting(false);
    }
  };

  const startChat = async () => {
    if (!user || !profile) return;

    try {
      // Create chat room
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          type: 'direct',
          name: `${user.email} & ${profile.name}`
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add participants
      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert([
          { chat_room_id: room.id, user_id: user.id },
          { chat_room_id: room.id, user_id: profile.id }
        ]);

      if (participantsError) throw participantsError;

      // Navigate to messages
      navigate('/messages');
    } catch (err) {
      console.error('Error starting chat:', err);
      setError('Failed to start chat');
    }
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

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-8">
            <div className="flex flex-col items-center justify-center h-64">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <div className="text-red-600 mb-4">{error || 'Profile not found'}</div>
              <button
                onClick={() => navigate('/')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Profile Header */}
          <div className="relative h-32 bg-gradient-to-r from-emerald-500 to-emerald-600">
            <div className="absolute -bottom-12 left-8">
              <img
                src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}`}
                alt={profile.name}
                className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
              />
            </div>
          </div>

          <div className="pt-16 pb-8 px-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
                <div className="flex items-center gap-2 text-gray-500 mt-1">
                  <Mail className="w-4 h-4" />
                  <span>{profile.email}</span>
                </div>
                {profile.location && (
                  <div className="flex items-center gap-2 text-gray-500 mt-1">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!connection ? (
                  <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {connecting ? (
                      <Clock className="w-5 h-5 animate-spin" />
                    ) : (
                      <UserPlus className="w-5 h-5" />
                    )}
                    <span>Connect</span>
                  </button>
                ) : connection.status === 'pending' ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
                    <Clock className="w-5 h-5" />
                    <span>Pending</span>
                  </div>
                ) : connection.status === 'accepted' ? (
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg">
                      <Check className="w-5 h-5" />
                      <span>Connected</span>
                    </div>
                    <button
                      onClick={startChat}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <MessageSquare className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-lg">
                    <X className="w-5 h-5" />
                    <span>Declined</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-2">About</h3>
              <p className="text-gray-600">{profile.bio || 'No bio added yet'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.length > 0 ? (
                    profile.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No skills added yet</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.length > 0 ? (
                    profile.interests.map((interest) => (
                      <span
                        key={interest}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {interest}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No interests added yet</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">
                  {profile.completed_opportunities}
                </div>
                <div className="text-sm text-gray-600">Completed Opportunities</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {profile.total_hours}
                </div>
                <div className="text-sm text-gray-600">Total Hours</div>
              </div>
            </div>

            {/* Reviews Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Reviews</h3>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[...Array(review.rating)].map((_, i) => (
                            <Star
                              key={i}
                              className="w-4 h-4 text-yellow-400 fill-current"
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{review.feedback}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No reviews yet</p>
              )}
            </div>

            {/* Resume Section */}
            {(profile.resume_summary || profile.education.length > 0 || profile.experience.length > 0) && (
              <div className="mt-8 pt-8 border-t">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Professional Background</h3>

                {profile.resume_summary && (
                  <div className="mb-8">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Summary</h4>
                    <p className="text-gray-600">{profile.resume_summary}</p>
                  </div>
                )}

                {profile.experience.length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Experience
                    </h4>
                    <div className="space-y-4">
                      {profile.experience.map((exp, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <h5 className="font-medium text-gray-900">{exp.position}</h5>
                          <p className="text-gray-600">{exp.company}</p>
                          <p className="text-sm text-gray-500">
                            {exp.startDate} - {exp.endDate || 'Present'}
                          </p>
                          <p className="text-gray-600 mt-2">{exp.description}</p>
                          {exp.skills.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {exp.skills.map((skill, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {profile.education.length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      Education
                    </h4>
                    <div className="space-y-4">
                      {profile.education.map((edu, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <h5 className="font-medium text-gray-900">{edu.school}</h5>
                          <p className="text-gray-600">{edu.degree} in {edu.field}</p>
                          <p className="text-sm text-gray-500">
                            {edu.startDate} - {edu.endDate || 'Present'}
                          </p>
                          <p className="text-gray-600 mt-2">{edu.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {profile.certifications.length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Certifications
                    </h4>
                    <div className="space-y-4">
                      {profile.certifications.map((cert, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <h5 className="font-medium text-gray-900">{cert.name}</h5>
                          <p className="text-gray-600">Issued by {cert.issuer}</p>
                          <p className="text-sm text-gray-500">
                            Issued: {cert.issueDate}
                            {cert.expiryDate && ` • Expires: ${cert.expiryDate}`}
                          </p>
                          <p className="text-gray-600 mt-2">{cert.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {profile.languages.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Languages
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.languages.map((language, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                        >
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, UserPlus, Check, Clock, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Profile, Connection } from '../types';

interface SearchResult extends Profile {
  connection?: Connection | null;
}

export function UserSearch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout>();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setResults([]);
      return;
    }

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(async () => {
      setLoading(true);
      try {
        if (!user?.id) {
          setResults([]);
          return;
        }

        // First get users matching the search term
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id)
          .ilike('name', `%${searchTerm}%`)
          .limit(5);

        if (usersError) throw usersError;
        if (!users) {
          setResults([]);
          return;
        }

        // Then get any existing connections for these users
        const { data: connections, error: connectionsError } = await supabase
          .from('connections')
          .select('*')
          .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .in('requester_id', [user.id, ...users.map(u => u.id)])
          .in('recipient_id', [user.id, ...users.map(u => u.id)]);

        if (connectionsError) throw connectionsError;

        // Map connections to users
        const resultsWithConnections = users.map(userResult => ({
          ...userResult,
          connection: connections?.find(c => 
            (c.requester_id === user.id && c.recipient_id === userResult.id) ||
            (c.recipient_id === user.id && c.requester_id === userResult.id)
          ) || null // Explicitly set to null if no connection found
        }));

        setResults(resultsWithConnections);
      } catch (error) {
        console.error('Error searching users:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchTerm, user?.id]);

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setResults([]);
        setSearchTerm('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear search when location changes
  useEffect(() => {
    setResults([]);
    setSearchTerm('');
  }, [location.pathname]);

  const handleConnect = async (recipientId: string) => {
    if (!user?.id) return;

    try {
      setConnecting(recipientId);

      const { error } = await supabase
        .from('connections')
        .insert({
          requester_id: user.id,
          recipient_id: recipientId,
          status: 'pending'
        });

      if (error) throw error;

      setResults(prev => prev.map(result => 
        result.id === recipientId
          ? {
              ...result,
              connection: {
                id: crypto.randomUUID(),
                requester_id: user.id,
                recipient_id: recipientId,
                status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            }
          : result
      ));
    } catch (error) {
      console.error('Error connecting:', error);
    } finally {
      setConnecting(null);
    }
  };

  const handleProfileClick = (profileId: string) => {
    setSearchTerm('');
    setResults([]);
    navigate(`/profile/${profileId}`);
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search users..."
          className="w-full px-4 py-2 pl-10 pr-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      </div>

      {(loading || results.length > 0) && (
        <div className="absolute z-[100] w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              Searching...
            </div>
          ) : (
            <div className="divide-y">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="group relative hover:bg-emerald-50 transition-all duration-200"
                >
                  <div className="p-4 flex items-center justify-between">
                    <div 
                      onClick={() => handleProfileClick(result.id)}
                      className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                    >
                      <img
                        src={result.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(result.name)}`}
                        alt={result.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="min-w-0 text-left">
                        <p className="font-medium text-gray-900 group-hover:text-emerald-700 transition-colors">
                          {result.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {result.bio || 'No bio yet'}
                        </p>
                      </div>
                    </div>

                    <div className="ml-4">
                      {!result.connection ? (
                        <button
                          onClick={() => handleConnect(result.id)}
                          disabled={connecting === result.id}
                          className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-full transition-colors disabled:opacity-50 relative z-10"
                          title="Connect"
                        >
                          {connecting === result.id ? (
                            <Clock className="w-5 h-5 animate-spin" />
                          ) : (
                            <UserPlus className="w-5 h-5" />
                          )}
                        </button>
                      ) : result.connection.status === 'pending' ? (
                        <div className="p-2 text-yellow-600" title="Request Pending">
                          <Clock className="w-5 h-5" />
                        </div>
                      ) : result.connection.status === 'accepted' ? (
                        <div className="p-2 text-emerald-600" title="Connected">
                          <Check className="w-5 h-5" />
                        </div>
                      ) : result.connection.status === 'rejected' ? (
                        <div className="p-2 text-red-600" title="Declined">
                          <X className="w-5 h-5" />
                        </div>
                      ) : (
                        <button
                          onClick={() => handleConnect(result.id)}
                          disabled={connecting === result.id}
                          className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-full transition-colors disabled:opacity-50 relative z-10"
                          title="Connect"
                        >
                          {connecting === result.id ? (
                            <Clock className="w-5 h-5 animate-spin" />
                          ) : (
                            <UserPlus className="w-5 h-5" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Hover indicator */}
                    <div className="absolute inset-y-0 left-0 w-1 bg-emerald-500 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-200" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
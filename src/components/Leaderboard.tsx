import React, { useEffect, useState } from 'react';
import { X, Trophy, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LeaderboardEntry {
  name: string;
  avatar_url: string;
  completed_opportunities: number;
  total_hours: number;
}

interface LeaderboardProps {
  onClose: () => void;
}

export function Leaderboard({ onClose }: LeaderboardProps) {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, avatar_url, completed_opportunities, total_hours')
        .order('completed_opportunities', { ascending: false })
        .limit(10);

      if (error) throw error;
      if (data) {
        setLeaders(data);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h2 className="text-lg font-semibold">Volunteer Leaderboard</h2>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="animate-pulse flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="mt-2 h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y">
            {leaders.map((leader, index) => (
              <div key={index} className="p-4 flex items-center gap-4">
                <div className="relative">
                  <img
                    src={leader.avatar_url || `https://ui-avatars.com/api/?name=${leader.name}`}
                    alt={leader.name}
                    className="w-10 h-10 rounded-full"
                  />
                  {index < 3 && (
                    <Award
                      className={`absolute -top-1 -right-1 w-4 h-4 ${
                        index === 0
                          ? 'text-yellow-500'
                          : index === 1
                          ? 'text-gray-400'
                          : 'text-amber-600'
                      }`}
                    />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{leader.name}</p>
                  <p className="text-sm text-gray-500">
                    {leader.completed_opportunities} opportunities • {leader.total_hours} hours
                  </p>
                </div>
                <div className="text-2xl font-bold text-gray-900">#{index + 1}</div>
              </div>
            ))}
            {leaders.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                No volunteers yet
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
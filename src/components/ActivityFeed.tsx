import React from 'react';
import { Activity } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface ActivityFeedProps {
  activities: Activity[];
  loading?: boolean;
}

export function ActivityFeed({ activities, loading = false }: ActivityFeedProps) {
  if (loading) {
    return (
      <div className="divide-y">
        {[1, 2, 3].map((n) => (
          <div key={n} className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="divide-y">
      {activities.map((activity) => (
        <div key={activity.id} className="p-4">
          <div className="flex items-start gap-4">
            <img
              src={activity.user_avatar || `https://ui-avatars.com/api/?name=${activity.user_name}`}
              alt={activity.user_name}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="text-sm text-gray-900">
                <span className="font-medium">{activity.user_name}</span>{' '}
                {activity.action}{' '}
                <span className="font-medium">{activity.target}</span>
              </p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        </div>
      ))}
      {activities.length === 0 && (
        <div className="p-4 text-center text-gray-500">
          No recent activity
        </div>
      )}
    </div>
  );
}
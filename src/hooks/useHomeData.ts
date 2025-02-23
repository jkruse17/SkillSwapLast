import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Opportunity, Activity } from '../types';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function fetchWithRetry(fetcher: () => Promise<any>, retries = MAX_RETRIES): Promise<any> {
  try {
    return await fetcher();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(fetcher, retries - 1);
    }
    throw error;
  }
}

export function useHomeData() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  async function fetchData() {
    try {
      setLoading(true);
      setError(null);

      // Get opportunities that haven't been completed
      const [opportunitiesResult, completionsResult, activitiesResult] = await Promise.all([
        fetchWithRetry(() => 
          supabase
            .from('opportunities')
            .select('*')
            .order('created_at', { ascending: false })
        ),
        fetchWithRetry(() =>
          supabase
            .from('completions')
            .select('opportunity_id')
            .eq('status', 'completed')
        ),
        fetchWithRetry(() => 
          supabase
            .from('activities')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10)
        )
      ]);

      if (opportunitiesResult.error) throw opportunitiesResult.error;
      if (completionsResult.error) throw completionsResult.error;
      if (activitiesResult.error) throw activitiesResult.error;

      // Filter out completed opportunities
      const completedIds = new Set((completionsResult.data || []).map(c => c.opportunity_id));
      const activeOpportunities = (opportunitiesResult.data || [])
        .filter(opp => !completedIds.has(opp.id))
        .map(opp => ({
          ...opp,
          requiredSkills: opp.required_skills,
          imageUrl: opp.image_url,
        }));

      setOpportunities(activeOpportunities);
      setActivities(activitiesResult.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    // Initial fetch
    fetchData();

    // Subscribe to changes
    const subscription = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'opportunities'
        },
        (payload) => {
          if (!mounted) return;

          // Handle different types of changes
          if (payload.eventType === 'INSERT') {
            setOpportunities(prev => [payload.new as Opportunity, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setOpportunities(prev => prev.filter(opp => opp.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setOpportunities(prev => 
              prev.map(opp => opp.id === payload.new.id ? payload.new as Opportunity : opp)
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'completions'
        },
        (payload) => {
          if (!mounted) return;

          if (payload.eventType === 'INSERT' && payload.new.status === 'completed') {
            // Remove completed opportunity from the list
            setOpportunities(prev => 
              prev.filter(opp => opp.id !== payload.new.opportunity_id)
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities'
        },
        async (payload) => {
          if (!mounted) return;

          if (payload.eventType === 'INSERT') {
            setActivities(prev => {
              const newActivities = [payload.new as Activity, ...prev];
              return newActivities.slice(0, 10); // Keep only the latest 10 activities
            });
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    opportunities,
    activities,
    loading,
    error,
    refetch: fetchData
  };
}
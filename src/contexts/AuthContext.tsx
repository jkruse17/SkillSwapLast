import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            await ensureProfile(session.user);
          }
          setLoading(false);
          setInitialized(true);
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (!mounted) return;
          
          if (session?.user) {
            setUser(session.user);
            await ensureProfile(session.user);
          } else {
            setUser(null);
          }
          setLoading(false);
        });

        return () => {
          mounted = false;
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    }

    initialize();
  }, []);

  const ensureProfile = async (user: User) => {
    try {
      // Use upsert to handle race conditions
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: user.user_metadata.name || user.email?.split('@')[0] || 'Anonymous',
          email: user.email || '',
          skills: [],
          interests: [],
          bio: '',
          avatar_url: '',
          completed_opportunities: 0,
          total_hours: 0
        }, {
          onConflict: 'id',
          ignoreDuplicates: true
        });

      if (upsertError && upsertError.code !== '23505') { // Ignore unique constraint violations
        console.error('Error ensuring profile:', upsertError);
      }
    } catch (error) {
      console.error('Error in ensureProfile:', error);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name
        }
      }
    });

    if (signUpError) throw signUpError;
    if (!authData.user) throw new Error('Signup failed');

    // Profile will be created by the auth state change handler
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, initialized }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      opportunities: {
        Row: {
          id: string
          title: string
          organization: string
          description: string
          required_skills: string[]
          location: string
          date: string
          image_url: string
          spots: number
          created_at: string
          organization_id: string
          category: string
          type: string
          estimated_duration: string
          urgency: string
        }
        Insert: {
          id?: string
          title: string
          organization: string
          description: string
          required_skills: string[]
          location: string
          date: string
          image_url: string
          spots: number
          created_at?: string
          organization_id: string
          category: string
          type: string
          estimated_duration: string
          urgency: string
        }
        Update: {
          id?: string
          title?: string
          organization?: string
          description?: string
          required_skills?: string[]
          location?: string
          date?: string
          image_url?: string
          spots?: number
          created_at?: string
          organization_id?: string
          category?: string
          type?: string
          estimated_duration?: string
          urgency?: string
        }
      }
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          skills: string[]
          interests: string[]
          bio: string
          avatar_url: string
        }
        Insert: {
          id: string
          name: string
          email: string
          skills?: string[]
          interests?: string[]
          bio?: string
          avatar_url?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          skills?: string[]
          interests?: string[]
          bio?: string
          avatar_url?: string
        }
      }
      applications: {
        Row: {
          id: string
          opportunity_id: string
          user_id: string
          status: 'pending' | 'accepted' | 'rejected'
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          opportunity_id: string
          user_id: string
          status?: 'pending' | 'accepted' | 'rejected'
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          opportunity_id?: string
          user_id?: string
          status?: 'pending' | 'accepted' | 'rejected'
          message?: string
          created_at?: string
        }
      }
    }
  }
}
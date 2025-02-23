import { Database } from './lib/database.types';

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  description: string;
  requiredSkills: string[];
  location: string;
  date: string;
  imageUrl: string;
  spots: number;
  created_at: string;
  category: string;
  type: string;
  estimated_duration: string;
  urgency: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  skills: string[];
  interests: string[];
  bio: string;
  avatar_url: string;
  completed_opportunities?: number;
  total_hours?: number;
}

export interface Application {
  id: string;
  opportunity_id: string;
  user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  message: string;
  created_at: string;
  user: {
    name: string;
    email: string;
  };
}

export interface Activity {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  action: string;
  target: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  read: boolean;
  created_at: string;
  type: string;
  reference_id: string | null;
}

export interface Completion {
  id: string;
  opportunity_id: string;
  volunteer_id: string;
  organizer_id: string;
  status: 'pending' | 'completed' | 'cancelled';
  review_status: 'pending' | 'completed';
  hours_spent: number;
  completion_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  completion_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  feedback: string;
  created_at: string;
}

export interface Education {
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string | null;
  description: string;
}

export interface Experience {
  company: string;
  position: string;
  startDate: string;
  endDate: string | null;
  description: string;
  skills: string[];
}

export interface Certification {
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate: string | null;
  description: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  skills: string[];
  interests: string[];
  bio: string;
  avatar_url: string;
  completed_opportunities: number;
  total_hours: number;
  location: string;
  latitude: number | null;
  longitude: number | null;
  resume_summary: string;
  education: Education[];
  experience: Experience[];
  certifications: Certification[];
  languages: string[];
}

export interface Connection {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  requester?: Profile;
  recipient?: Profile;
}
# SkillSwap_

**Community Volunteer Skill Exchange**
SkillSwap is a community-driven skill exchange platform that allows people to connect and share their expertise with others. 

**Instructions to get the App to run locally**:
-Clone Git to VScode
-In terminal run "npm install" to install all the stuffs
-Then run "npm run dev" 
-It should popup a localhost website using Vite and React, just pop that in your web browser.

**Tech Stack**-
Frontend:

React 18 with TypeScript for type safety
Vite as the build tool and development server
React Router v6 for client-side routing
Tailwind CSS for styling
Lucide React for icons and illustrations
Backend/Database:

Supabase (PostgreSQL-based backend-as-a-service) providing:
Database
Authentication
Row Level Security (RLS)
Real-time subscriptions
Storage
Key Libraries:

@supabase/supabase-js: Supabase client library
date-fns: Modern JavaScript date utility library
react-router-dom: For routing and navigation
lucide-react: Icon library
Development Tools:

TypeScript for static typing
ESLint for code linting
PostCSS with Autoprefixer for CSS processing
Tailwind CSS for utility-first styling
The application follows a modern, JAMstack architecture where:

Frontend is a single-page application (SPA)
Backend services are handled by Supabase
Authentication is managed through Supabase Auth
Real-time features use Supabase's real-time subscriptions
Database operations are secured with Row Level Security policies


**Functionality:**

**Authentication & User Management**
Email and password-based authentication
User profile creation and management
Profile customization with skills, interests, bio, and avatar
Location-based features with geolocation support
**Opportunity Management**
Create and manage volunteer opportunities
Detailed opportunity listings with:
Title and description
Required skills
Location
Date and duration
Number of spots available
Urgency levels
Categories (e.g., home maintenance, technology, education)
Search and filter opportunities
Application system for volunteers
**Messaging System**
Real-time chat functionality
Direct messaging between users
Group chat support
Message history and management
Chat participant management
Message deletion capabilities
**Reviews & Ratings**
Two-way review system after completion
5-star rating system
Written feedback
Review history tracking
Review notifications
**Activity Tracking**
Recent activity feed
Completion tracking
Volunteer hours logging
User statistics (completed opportunities, total hours)
Real-time activity updates
**Notifications System**
Application notifications
Message notifications
Review notifications
Completion notifications
Real-time notification delivery
**Leaderboard & Gamification**
Volunteer leaderboard
Achievement tracking
Hours and completions statistics
Community recognition
**AI Assistant**
Built-in AI helper for platform guidance
Contextual help and suggestions
Common questions handling
Platform usage assistance
**Safety & Security Features**
Row Level Security (RLS) for data protection
Safe meeting guidelines
Communication best practices
User verification system
**Dashboard & Management**
Manage posted opportunities
Track applications
Monitor completions
View and manage reviews
Personal statistics tracking
**Search & Discovery**
Skill-based search
Category filtering
Location-based discovery
Advanced search capabilities
**Responsive Design**
Mobile-friendly interface
Clean, modern UI
Accessibility features
Cross-browser compatibility
**Friend System**
People search

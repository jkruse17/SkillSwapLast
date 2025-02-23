import React, { useState, useEffect } from 'react';
import { 
  Filter, 
  Trophy, 
  Bell, 
  Activity, 
  ArrowDown, 
  RefreshCw,
  Users,
  Sparkles,
  BookOpen,
  Wrench,
  Palette,
  Code,
  Music,
  Camera,
  ChefHat,
  Briefcase,
  MessageSquare,
  Clock,
  Star,
  CheckCircle,
  MapPin,
  Search,
  UserPlus
} from 'lucide-react';
import { OpportunityCard } from '../components/OpportunityCard';
import { ActivityFeed } from '../components/ActivityFeed';
import { Leaderboard } from '../components/Leaderboard';
import { Notifications } from '../components/Notifications';
import { AIAssistant } from '../components/AIAssistant';
import { useAuth } from '../contexts/AuthContext';
import { useHomeData } from '../hooks/useHomeData';

const skillCategories = [
  { name: 'Technology', icon: Code, color: 'bg-blue-500' },
  { name: 'Arts & Design', icon: Palette, color: 'bg-purple-500' },
  { name: 'Music', icon: Music, color: 'bg-pink-500' },
  { name: 'Photography', icon: Camera, color: 'bg-indigo-500' },
  { name: 'Cooking', icon: ChefHat, color: 'bg-yellow-500' },
  { name: 'Business', icon: Briefcase, color: 'bg-gray-500' },
  { name: 'DIY & Crafts', icon: Wrench, color: 'bg-red-500' },
  { name: 'Education', icon: BookOpen, color: 'bg-green-500' }
];

export function Home() {
  const { user } = useAuth();
  const { opportunities, activities, loading, error } = useHomeData();
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > window.innerHeight * 0.5);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const skills = [
    'Gardening',
    'Cleaning',
    'Teaching',
    'Construction',
    'Cooking',
    'Transportation',
    'Pet Care',
    'Elder Care',
    'Tech Support',
    'Event Planning'
  ];

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSkill = !selectedSkill || opp.requiredSkills.includes(selectedSkill);
    return matchesSkill;
  });

  const scrollToContent = () => {
    const contentSection = document.querySelector('.content-section');
    if (contentSection) {
      contentSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const howItWorksSteps = [
    {
      icon: UserPlus,
      title: "1. Create Your Account",
      description: "Sign up and create your profile. Add your skills, interests, and a brief bio to help others understand what you can offer.",
      details: [
        "Use email to sign up",
        "Add a profile photo",
        "List your skills and expertise",
        "Share your interests and availability"
      ]
    },
    {
      icon: Search,
      title: "2. Explore Opportunities",
      description: "Browse through available opportunities or create your own to offer help.",
      details: [
        "Use filters to find relevant opportunities",
        "Search by skills or categories",
        "View detailed descriptions and requirements",
        "Check location and time commitments"
      ]
    },
    {
      icon: MessageSquare,
      title: "3. Connect & Communicate",
      description: "Reach out to others and coordinate your skill exchange.",
      details: [
        "Send messages through the platform",
        "Discuss details and expectations",
        "Schedule meetings or sessions",
        "Coordinate logistics safely"
      ]
    },
    {
      icon: CheckCircle,
      title: "4. Exchange Skills",
      description: "Meet up and share your knowledge or help others with their needs.",
      details: [
        "Follow agreed-upon schedules",
        "Provide or receive help as planned",
        "Track your volunteer hours",
        "Document your experience"
      ]
    },
    {
      icon: Star,
      title: "5. Build Reputation",
      description: "Complete exchanges and build your community reputation.",
      details: [
        "Receive endorsements for your skills",
        "Earn completion badges",
        "Get featured on the leaderboard",
        "Build your volunteer portfolio"
      ]
    }
  ];

  const safetyTips = [
    {
      icon: MapPin,
      title: "Safe Meeting Locations",
      tips: [
        "Meet in public places for initial meetings",
        "Share your location with trusted contacts",
        "Use community centers or libraries when possible",
        "Avoid sharing personal addresses initially"
      ]
    },
    {
      icon: Clock,
      title: "Time Management",
      tips: [
        "Set clear boundaries for time commitment",
        "Communicate schedule changes promptly",
        "Respect others' time and availability",
        "Keep track of volunteer hours"
      ]
    },
    {
      icon: MessageSquare,
      title: "Communication Guidelines",
      tips: [
        "Keep all communication on the platform",
        "Be clear about expectations",
        "Document agreements and plans",
        "Report any concerning behavior"
      ]
    }
  ];

  return (
    <div className="snap-container">
      {/* Landing Section */}
      <section className="snap-section relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-30"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/60 to-gray-900/90"></div>
        </div>
        
        {/* Header Actions */}
        <div className="relative z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-end items-center h-16 gap-4">
              {user && (
                <>
                  <button
                    onClick={() => setShowAIAssistant(!showAIAssistant)}
                    className="p-2 text-white/80 hover:text-white transition-colors duration-200"
                  >
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-6 h-6" />
                      <span className="text-sm font-medium">AI Helper</span>
                    </span>
                  </button>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 text-white/80 hover:text-white relative transition-colors duration-200"
                  >
                    <Bell className="w-6 h-6" />
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-orange-500"></span>
                  </button>
                </>
              )}
              <button
                onClick={() => setShowLeaderboard(!showLeaderboard)}
                className="p-2 text-white/80 hover:text-white transition-colors duration-200"
              >
                <Trophy className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="text-center transform transition-transform duration-700 ease-out">
            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <RefreshCw className="w-24 h-24 text-white animate-spin-slow" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">S</span>
                </div>
              </div>
            </div>
            <h1 className="text-6xl font-bold text-white mb-6 transition-all duration-700">
              SkillSwap
            </h1>
            <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto px-4 transition-all duration-700">
              Exchange skills, build community, and make a difference. Your expertise is someone's need, and their knowledge is your next learning opportunity.
            </p>
            <button
              onClick={scrollToContent}
              className="animate-bounce bg-white/10 hover:bg-white/20 text-white rounded-full p-4 transition-all duration-300 hover:transform hover:scale-110"
            >
              <ArrowDown className="w-6 h-6" />
            </button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="snap-section bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">How SkillSwap Works</h2>
          
          {/* Main Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {howItWorksSteps.map((step, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-lg transform transition-all duration-300 hover:scale-105">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <step.icon className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 text-center mb-4">{step.title}</h3>
                <p className="text-gray-600 text-center mb-6">{step.description}</p>
                <ul className="space-y-2">
                  {step.details.map((detail, i) => (
                    <li key={i} className="flex items-center text-gray-700">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Safety Tips Section */}
          <div className="mt-20">
            <h3 className="text-3xl font-bold text-center mb-12">Safety & Best Practices</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {safetyTips.map((tip, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <tip.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-center mb-4">{tip.title}</h4>
                  <ul className="space-y-2">
                    {tip.tips.map((item, i) => (
                      <li key={i} className="flex items-start text-gray-700 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Skill Categories Section */}
      <section className="snap-section bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">Explore Skills</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {skillCategories.map(({ name, icon: Icon, color }) => (
              <div key={name} className="bg-white rounded-lg shadow-md p-6 transform transition-transform hover:scale-105">
                <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold">{name}</h3>
                <p className="text-sm text-gray-500 mt-2">Discover opportunities</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="snap-section content-section bg-gray-50">
        {/* Notifications Panel */}
        {showNotifications && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] transition-opacity duration-300">
            <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl transform transition-transform duration-300">
              <Notifications onClose={() => setShowNotifications(false)} />
            </div>
          </div>
        )}

        {/* Leaderboard Panel */}
        {showLeaderboard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] transition-opacity duration-300">
            <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl transform transition-transform duration-300">
              <Leaderboard onClose={() => setShowLeaderboard(false)} />
            </div>
          </div>
        )}

        {/* AI Assistant Panel */}
        {showAIAssistant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] transition-opacity duration-300">
            <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl transform transition-transform duration-300">
              <AIAssistant onClose={() => setShowAIAssistant(false)} />
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Skills Filter */}
              <div className="mb-6">
                <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  <Filter className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <button
                    onClick={() => setSelectedSkill('')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex-shrink-0 transform hover:scale-105 ${
                      !selectedSkill 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  {skills.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => setSelectedSkill(skill)}
                      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 flex-shrink-0 transform hover:scale-105 ${
                        selectedSkill === skill
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Opportunities */}
              <div className="space-y-6">
                {error ? (
                  <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                    {error}
                  </div>
                ) : loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
                        <div className="h-48 bg-gray-200 rounded mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : filteredOpportunities.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredOpportunities.map((opportunity) => (
                      <OpportunityCard key={opportunity.id} opportunity={opportunity} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No opportunities found matching your criteria.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Activity Feed Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow sticky top-28 transition-all duration-300">
                <div className="p-4 border-b">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-500" />
                    <h2 className="text-lg font-semibold">Recent Activity</h2>
                  </div>
                </div>
                <ActivityFeed activities={activities} loading={loading} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
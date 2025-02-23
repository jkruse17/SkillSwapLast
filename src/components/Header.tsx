import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  RefreshCw, 
  Search, 
  UserCircle, 
  LogOut, 
  PlusCircle, 
  ListChecks, 
  MessageSquare,
  Home,
  Star
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserSearch } from './UserSearch';

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showSearch, setShowSearch] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center space-x-2">
            <div className="relative">
              <RefreshCw className="w-8 h-8 text-emerald-600" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-emerald-600">S</span>
              </div>
            </div>
            <span className="text-xl font-bold text-gray-900">SkillSwap</span>
          </Link>

          <Link
            to="/"
            className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
              isActive('/') 
                ? 'text-emerald-600 bg-emerald-50' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">Home</span>
          </Link>
        </div>
        
        <div className="flex-1 max-w-2xl mx-8 relative">
          <UserSearch />
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Link
                to="/create-opportunity"
                className="text-gray-600 hover:text-gray-900 transition-colors"
                title="Create Opportunity"
              >
                <PlusCircle className="w-6 h-6" />
              </Link>
              <Link
                to="/manage-posts"
                className={`text-gray-600 hover:text-gray-900 transition-colors ${
                  isActive('/manage-posts') && 'text-emerald-600'
                }`}
                title="Manage Posts"
              >
                <ListChecks className="w-6 h-6" />
              </Link>
              <Link
                to="/messages"
                className={`text-gray-600 hover:text-gray-900 transition-colors ${
                  isActive('/messages') && 'text-emerald-600'
                }`}
                title="Messages"
              >
                <MessageSquare className="w-6 h-6" />
              </Link>
              <Link
                to="/reviews"
                className={`text-gray-600 hover:text-gray-900 transition-colors ${
                  isActive('/reviews') && 'text-emerald-600'
                }`}
                title="Reviews"
              >
                <Star className="w-6 h-6" />
              </Link>
              <Link
                to="/profile"
                className={`text-gray-600 hover:text-gray-900 transition-colors ${
                  isActive('/profile') && 'text-emerald-600'
                }`}
              >
                <UserCircle className="w-6 h-6" />
              </Link>
              <button
                onClick={handleSignOut}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-6 h-6" />
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
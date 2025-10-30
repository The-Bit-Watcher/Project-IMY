import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';
import api from '../services/api';
import './Header.css';

const Header = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  console.log('🔍 Header - User prop:', user);
  console.log('👑 Header - User isAdmin:', user?.isAdmin);
  console.log('🔍 Header - All user keys:', user ? Object.keys(user) : 'No user');

  const handleLogout = async () => {
    try {
      await api.post('/logout');
      if (onLogout) {
        onLogout();
      }
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Still call onLogout even if API call fails
      if (onLogout) {
        onLogout();
      }
      navigate('/');
    }
  };

  return (
    <header className={`header ${isDark ? 'dark-theme' : 'light-theme'}`}>
      <div className="header-container">
        <div className="header-left">
          <Link to="/home" className="logo">
            VersionControl
          </Link>
          <nav className="nav-links">
            <Link to="/home">Home</Link>
            <Link to={`/profile/${user?.id || user?._id}`}>My Profile</Link>
            <Link to="/projects/create">Create Project</Link>
            <Link to="/search">Search</Link>
            <Link to="/friend-requests">Friend Requests</Link>
          </nav>
        </div>
        
        <div className="header-right">
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {user && (
            <>
              <span className="welcome-text">
                Welcome, {user.name || user.username}
              </span>
              
              {user.isAdmin && (
                <Link to="/admin" className="admin-link">
                  👑 Admin
                </Link>
              )}
              
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
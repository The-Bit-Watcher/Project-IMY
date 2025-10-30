import React, { useState, useEffect } from 'react';
import LoginForm from '../components/LoginForm';
import SignUpForm from '../components/SignUpForm';
import './SplashPage.css';
import { useNavigate } from 'react-router-dom';

const SplashPage = ({ onLogin }) => {  
  const [activeTab, setActiveTab] = useState('login');
  const [scrollPosition, setScrollPosition] = useState(0);
  const [checkingAuth, setCheckingAuth] = useState(true); // loading state
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is already logged in
    const checkExistingUser = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          console.log('✅ Found existing user in localStorage:', userData);
          
          // Validate the user data is complete
          if (userData && userData.id) {
            console.log('🔄 Valid user found, navigating to home...');
            
            // Call onLogin first to update App.js state
            if (onLogin) {
              onLogin(userData);
            }
            
            //  after a brief delay to ensure state is updated
            setTimeout(() => {
              navigate('/home');
            }, 100);
          } else {
            console.log('❌ Invalid user data in localStorage');
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('❌ Error checking existing user:', error);
        localStorage.removeItem('user');
      } finally {
        setCheckingAuth(false); // Always set checking to false
      }
    };

    checkExistingUser();

    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [navigate, onLogin]);

  const handleAuthSuccess = (userData) => {
    console.log('✅ Auth success, user data:', userData);
    console.log('👑 User admin status:', userData.isAdmin);
    
    // Store complete user info in localStorage
    const userToStore = {
      id: userData.id || userData._id,
      name: userData.name,
      email: userData.email,
      profilePic: userData.profilePic,
      isAdmin: userData.isAdmin || false
    };
    
    localStorage.setItem('user', JSON.stringify(userToStore));
    
    // Call onLogin to update App.js state
    if (onLogin) {
      onLogin(userToStore);
    }
    
    // Navigate to home
    navigate('/home');
  }

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="splash-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="splash-page">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">CodeCollab</h1>
          <p className="hero-subtitle">Collaborate on code projects with version control made simple</p>
          <div className="hero-features">
            <div className="feature">
              <i className="feature-icon">🔄</i>
              <h3>Version Control</h3>
              <p>Track changes and collaborate seamlessly</p>
            </div>
            <div className="feature">
              <i className="feature-icon">👥</i>
              <h3>Team Collaboration</h3>
              <p>Work together with your team members</p>
            </div>
            <div className="feature">
              <i className="feature-icon">🚀</i>
              <h3>Fast & Reliable</h3>
              <p>Lightning-fast performance for your projects</p>
            </div>
          </div>
        </div>
      </section>

      <section className="auth-section">
        <div className="auth-container">
          <div className="auth-tabs">
            <button 
              className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              Login
            </button>
            <button 
              className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`}
              onClick={() => setActiveTab('signup')}
            >
              Sign Up
            </button>
          </div>
          <div className="auth-forms">
            {activeTab === 'login' ? 
              <LoginForm onLogin={handleAuthSuccess}/> : 
              <SignUpForm onSignup={handleAuthSuccess}/>
            }
          </div>
        </div>
      </section>

      <section className="features-section">
        <h2>Why Choose CodeCollab?</h2>
        <div className="features-grid">
          <div className="feature-card" style={{ transform: `translateY(${scrollPosition * 0.1}px)` }}>
            <div className="feature-card-icon">📁</div>
            <h3>Project Management</h3>
            <p>Organize your code projects with ease. Keep track of versions and collaborate with your team.</p>
          </div>
          <div className="feature-card" style={{ transform: `translateY(${scrollPosition * 0.08}px)` }}>
            <div className="feature-card-icon">🔍</div>
            <h3>Smart Search</h3>
            <p>Find projects, users, and code quickly with our advanced search functionality.</p>
          </div>
          <div className="feature-card" style={{ transform: `translateY(${scrollPosition * 0.12}px)` }}>
            <div className="feature-card-icon">📊</div>
            <h3>Activity Tracking</h3>
            <p>Monitor project activity and see who's working on what in real-time.</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to Start Collaborating?</h2>
        <p>Join thousands of developers already using CodeCollab</p>
        <button className="cta-button" onClick={() => setActiveTab('signup')}>
          Get Started Free
        </button>
      </section>
    </div>
  );
};

export default SplashPage;
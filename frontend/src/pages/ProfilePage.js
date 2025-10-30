import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Profile from '../components/Profile';
import ProfileProjects from '../components/ProfileProjects';
import FriendsList from '../components/FriendsList';
import TagCloud from '../components/TagCloud';
import { userAPI, authAPI } from '../services/api';
import './ProfilePage.css';
import ProfileBreadcrumbs from '../components/ProfileBreadcrumbs';

const DirectAPITest = () => {
  const [testResult, setTestResult] = useState('');

  const testDirectAPI = async () => {
    try {
      let result = '🧪 DIRECT API TEST\n\n';
      
      // Get user
      const userData = localStorage.getItem('user');
      const user = JSON.parse(userData);
      const userId = user.id;
      result += `👤 User ID: ${userId}\n\n`;
      
      // Test 1: Direct fetch to /api/projects
      result += '📡 TEST 1: Direct fetch to /api/projects\n';
      const response = await fetch('http://localhost:5000/api/projects');
      result += `Status: ${response.status}\n`;
      result += `OK: ${response.ok}\n`;
      
      const data = await response.json();
      result += `Success: ${data.success}\n`;
      result += `Projects count: ${data.projects?.length || 0}\n\n`;
      
      if (data.projects) {
        result += 'PROJECTS:\n';
        data.projects.forEach(project => {
          const isOwner = String(project.owner) === String(userId);
          result += `- ${project.name} (Owner: ${project.owner}) ${isOwner ? '✅ YOUR PROJECT' : ''}\n`;
        });
      }
      
      setTestResult(result);
      console.log(result);
    } catch (error) {
      setTestResult(`❌ TEST ERROR: ${error.message}`);
    }
  };

  return (
    <div style={{background: '#e8f5e8', padding: '15px', margin: '10px 0'}}>
      <button 
        onClick={testDirectAPI}
        style={{padding: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px'}}
      >
        🧪 Test Direct API
      </button>
      <pre style={{background: 'white', padding: '10px', marginTop: '10px', fontSize: '12px'}}>
        {testResult}
      </pre>
    </div>
  );
};

const ProfilePage = () => {
  const { userId } = useParams();
  const { user: currentUser, setUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get user from localStorage
  const getStoredUser = () => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing stored user:', error);
      return null;
    }
  };

  // Determine if this is the current user's own profile
  const storedUser = getStoredUser();
  const isOwnProfile = !userId || userId === "1" || (storedUser && userId === storedUser.id);

  // Reset state when userId changes
  useEffect(() => {
    setProfileUser(null);
    setLoading(true);
    setError(null);
    setIsEditing(false);
  }, [userId]);

  // Fetch profile data - this should run when userId changes
  useEffect(() => {
    console.log('🔄 ProfilePage useEffect triggered, userId:', userId);
    fetchProfileData();
  }, [userId, currentUser]); // Add userId to dependencies

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🎯 Fetching profile data for userId:', userId);
      console.log('🎯 isOwnProfile:', isOwnProfile);
      
      if (isOwnProfile) {
        // Use stored user data for own profile
        const storedUser = getStoredUser();
        if (storedUser) {
          console.log('👤 Using stored user for own profile:', storedUser);
          setProfileUser(storedUser);
          
          // Refresh data from API in background
          try {
            const result = await authAPI.getMe();
            if (result && result.data.success) {
              console.log('🔄 Refreshed user data from API:', result.data.user);
              setProfileUser(result.data.user);
              setUser(result.data.user);
              localStorage.setItem('user', JSON.stringify(result.data.user));
            }
          } catch (apiError) {
            console.log('⚠️ Using cached user data, API unavailable');
          }
        } else {
          setError("Please log in to view your profile");
          navigate('/login');
        }
      } else {
        // For other users, always fetch from API
        console.log('👥 Fetching other user profile:', userId);
        if (/^[0-9a-fA-F]{24}$/.test(userId)) {
          const result = await userAPI.getProfile(userId);
          if (result && result.data.success) {
            console.log('✅ Loaded other user profile:', result.data.user);
            setProfileUser(result.data.user);
          } else {
            setError("User not found");
          }
        } else {
          setError("Invalid user ID format");
        }
      }
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      setError("Error loading profile");
    } finally {
      setLoading(false);
    }
  };

const handleProfileUpdate = (updatedUser) => {
  console.log('🔄 Profile update callback called with:', updatedUser);
  setProfileUser(updatedUser);
  setIsEditing(false);
  
  // Update localStorage
  localStorage.setItem('user', JSON.stringify(updatedUser));
  
  // Only use setUser if it's available and we're on own profile
  if (isOwnProfile && setUser) {
    try {
      setUser(updatedUser);
    } catch (error) {
      console.warn('⚠️ setUser failed, but profile was updated:', error);
    }
  }
};

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (error && !profileUser) {
    return (
      <div className="error-page">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  if (!profileUser) {
    return <div>Profile not found</div>;
  }

  console.log('🎨 Rendering ProfilePage for user:', profileUser.name);

  return (
    <div className="profile-page">
       <ProfileBreadcrumbs />
      <Profile 
        userId={profileUser.id}
        isEditing={isEditing} 
        setIsEditing={setIsEditing} 
        isOwnProfile={isOwnProfile}
        onProfileUpdate={handleProfileUpdate}
        user={profileUser}
      />

      <DirectAPITest />
      
      <div className="profile-content">
        <div className="profile-main">      
          <section className="tag-cloud-section">
            <h2>Programming Languages</h2>
            <TagCloud />
          </section>

          <ProfileProjects />
        </div>
        
        <aside className="profile-sidebar">
          <FriendsList userId={profileUser.id} isOwnProfile={isOwnProfile} />
        </aside>
      </div>
    </div>
  );
};

export default ProfilePage;
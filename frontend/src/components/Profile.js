import React, { useState, useEffect } from 'react';
import { userAPI, usersAPI } from '../services/api';
import './Profile.css';
import { friendsAPI } from '../services/api'; 

const Profile = ({ userId, isEditing, setIsEditing, isOwnProfile, onProfileUpdate, user: initialUser }) => {
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(!initialUser);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    website: '',
    skills: ''
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [addingFriend, setAddingFriend] = useState(false);

  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
      setFormData({
        name: initialUser.name,
        bio: initialUser.bio || '',
        location: initialUser.location || '',
        website: initialUser.website || '',
        skills: Array.isArray(initialUser.skills) ? initialUser.skills.join(', ') : ''
      });
      setLoading(false);
      
      // Check if this user is a friend when viewing someone else's profile
      if (!isOwnProfile) {
        checkFriendStatus();
      }
    } else if (userId) {
      fetchUser();
    }
  }, [initialUser, userId, isOwnProfile]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      let result;
      
      if (isOwnProfile) {
        result = await userAPI.getCurrentUser();
      } else {
        result = await userAPI.getProfile(userId);
      }
      
      if (result.data.success) {
        setUser(result.data.user);
        setFormData({
          name: result.data.user.name,
          bio: result.data.user.bio || '',
          location: result.data.user.location || '',
          website: result.data.user.website || '',
          skills: Array.isArray(result.data.user.skills) ? result.data.user.skills.join(', ') : ''
        });
        
        // Check if this user is a friend when viewing someone else's profile
        if (!isOwnProfile) {
          checkFriendStatus(result.data.user.id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFriendStatus = async (profileUserId = null) => {
  try {
    const targetUserId = profileUserId || user.id;
    const currentUser = await userAPI.getCurrentUser();
    
    if (currentUser.data.success) {
      const currentUserData = currentUser.data.user;
      
      // Check if the profile user is in current user's friends list
      const isUserFriend = currentUserData.friends && 
        currentUserData.friends.some(friendId => friendId === targetUserId);
      
      // Check if friend request was already sent
      const isRequestSent = currentUserData.sentFriendRequests && 
        currentUserData.sentFriendRequests.some(requestId => requestId === targetUserId);
      
      // Check if we received a request from this user
      const isRequestReceived = currentUserData.friendRequests && 
        currentUserData.friendRequests.some(requestId => requestId === targetUserId);
      
      setIsFriend(isUserFriend);
      setFriendRequestSent(isRequestSent);
      
      //set the friend status for more detailed handling
      if (isUserFriend) {
        // Already friends
      } else if (isRequestSent) {
        // Request sent
      } else if (isRequestReceived) {
        // Request received from this user
      }
      // else: not friends, no requests
    }
  } catch (error) {
    console.error('Error checking friend status:', error);
  }
};

  const handleAddFriend = async () => {
  setAddingFriend(true); 
  try {
    const result = await friendsAPI.sendRequest(user.id);
    if (result.data.success) {
      setFriendRequestSent(true);
      alert('Friend request sent successfully!');
    } else {
      console.error('Failed to send friend request:', result.data.message);
      alert('Failed to send friend request: ' + result.data.message);
    }
  } catch (error) {
    console.error('Error sending friend request:', error);
    alert('Error sending friend request: ' + (error.response?.data?.message || error.message));
  } finally {
    setAddingFriend(false); 
  }
};

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
  try {
    setSaveLoading(true);
    
    const updateData = {
      name: formData.name.trim(),
      bio: formData.bio.trim(),
      location: formData.location.trim(),
      website: formData.website.trim(),
      skills: formData.skills
    };

    console.log('🔄 Using /api/users/me endpoint...');
    const response = await userAPI.updateCurrentUser(updateData);
    
    if (response.data.success) {
      const updatedUser = response.data.user;
      
      // Update local component state
      setUser(updatedUser);
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      if (onProfileUpdate && typeof onProfileUpdate === 'function') {
        console.log('📞 Calling onProfileUpdate callback');
        onProfileUpdate(updatedUser);
      }
      
      setIsEditing(false);
      alert('Profile updated successfully!');
      
    } else {
      alert('Failed to update profile: ' + response.data.message);
    }
  } catch (error) {
    console.error('💥 Update failed:', error);
    
    if (error.response) {
      console.error('Error response:', error.response.data);
      alert(`Failed to update profile: ${error.response.data?.message || 'Server error'}`);
    } else if (error.request) {
      console.error('No response received');
      alert('Failed to update profile: No response from server');
    } else {
      console.error('Error message:', error.message);
      alert('Failed to update profile: ' + error.message);
    }
  } finally {
    setSaveLoading(false);
  }
};

const handleRemoveFriend = async () => {
  if (!window.confirm(`Remove ${user.name} from your friends?`)) return;
  
  setAddingFriend(true);
  try {
    const result = await friendsAPI.removeFriend(user.id);
    console.log('🗑️ Remove friend result:', result.data);
    
    if (result.data.success) {
      setIsFriend(false);
      setFriendRequestSent(false);
      alert('Friend removed successfully!');
      
      // Force refresh the friend status
      await checkFriendStatus();
    } else {
      alert('Failed to remove friend: ' + result.data.message);
    }
  } catch (error) {
    console.error('Error removing friend:', error);
    alert('Error removing friend: ' + (error.response?.data?.message || error.message));
  } finally {
    setAddingFriend(false);
  }
};

  const handleCancel = () => {
    setFormData({
      name: user.name,
      bio: user.bio || '',
      location: user.location || '',
      website: user.website || '',
      skills: Array.isArray(user.skills) ? user.skills.join(', ') : ''
    });
    setIsEditing(false);
  };

  if (loading) return <div className="loading">Loading profile...</div>;
  if (!user) return <div>User not found</div>;

  return (
    <section className="profile">
      <div className="profile-header">
        <h1>{user.name}</h1>
        
        {/* Show Add Friend button when viewing someone else's profile who is not a friend */}
        {!isOwnProfile && !isFriend && !friendRequestSent && (
          <button 
            className="add-friend-btn"
            onClick={handleAddFriend}
            disabled={addingFriend}
          >
            {addingFriend ? 'Adding...' : 'Add Friend'}
          </button>
        )}
        
        {/* Show status if already friends */}
        {!isOwnProfile && isFriend && (
          <span className="friend-status">Already Friends</span>
        )}
        
        {/* Show status if friend request sent */}
        {!isOwnProfile && friendRequestSent && (
          <span className="friend-status">Friend Request Sent</span>
        )}

        {/* Show status if already friends */}
        {!isOwnProfile && isFriend && (
          <div className="friend-actions">
          <span className="friend-status">Friends</span>
        <button 
          className="remove-friend-btn"
          onClick={handleRemoveFriend}
          disabled={addingFriend}>
        {addingFriend ? 'Removing...' : 'Remove Friend'}
        </button>
        </div>
        )}
        
        {/* Show Edit button for own profile */}
        {isOwnProfile && !isEditing && (
          <button 
            className="edit-btn"
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </button>
        )}
      </div>

      <div className="profile-card">
        <div className="profile-avatar">
          {user.profilePic ? (
            <img src={user.profilePic} alt={user.name} />
          ) : (
            <div className="avatar-placeholder">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="profile-info">
          {isEditing ? (
            <div className="edit-form">
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Bio:</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="form-group">
                <label>Location:</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="City, Country"
                />
              </div>

              <div className="form-group">
                <label>Website:</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                />
              </div>

              <div className="form-group">
                <label>Skills (comma separated):</label>
                <input
                  type="text"
                  name="skills"
                  value={formData.skills}
                  onChange={handleInputChange}
                  placeholder="JavaScript, React, Node.js"
                />
                <small>Separate multiple skills with commas</small>
              </div>

              <div className="form-actions">
                <button 
                  className="save-btn" 
                  onClick={handleSave}
                  disabled={saveLoading}
                >
                  {saveLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  className="cancel-btn" 
                  onClick={handleCancel}
                  disabled={saveLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="view-mode">
              <p className="profile-email">{user.email}</p>
              
              {user.bio && <p className="profile-bio">{user.bio}</p>}
              
              <div className="profile-details">
                {user.location && (
                  <div className="detail-item">
                    <strong>Location:</strong> {user.location}
                  </div>
                )}
                
                {user.website && (
                  <div className="detail-item">
                    <strong>Website:</strong> 
                    <a href={user.website} target="_blank" rel="noopener noreferrer">
                      {user.website}
                    </a>
                  </div>
                )}
                
                {user.skills && user.skills.length > 0 && (
                  <div className="detail-item">
                    <strong>Skills:</strong>
                    <div className="skills-list">
                      {user.skills.map((skill, index) => (
                        <span key={index} className="skill-tag">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="detail-item">
                  <strong>Member since:</strong> {new Date(user.createdAt).toLocaleDateString()}
                </div>
                
                {user.updatedAt && user.updatedAt !== user.createdAt && (
                  <div className="detail-item">
                    <strong>Last updated:</strong> {new Date(user.updatedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Profile;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersAPI } from '../services/api';

const UserSearchResult = ({ user }) => {
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAddFriend = async () => {
    setLoading(true);
    try {
      const result = await usersAPI.sendFriendRequest(user._id);
      if (result.data && result.data.success) {
        setAdded(true);
      } else {
        console.error('Failed to add friend:', result.data?.message);
        alert(result.data?.message || 'Failed to add friend');
      }
    } catch (error) {
      console.error('Failed to add friend:', error);
      alert('Failed to add friend');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = () => {
    navigate(`/profile/${user._id}`);
  };

  return (
    <div className="user-search-result">
      <div className="user-info">
        <div className="user-avatar">
          {user.profilePic ? (
            <img src={user.profilePic} alt={user.name} />
          ) : (
            <div className="avatar-placeholder">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
        </div>
        <div className="user-details">
          <h4 className="user-name" onClick={handleViewProfile}>
            {user.name}
          </h4>
          <p className="user-email">{user.email}</p>
          {user.bio && <p className="user-bio">{user.bio}</p>}
          {user.skills && user.skills.length > 0 && (
            <div className="user-skills">
              {user.skills.slice(0, 3).map((skill, index) => (
                <span key={index} className="skill-tag">{skill}</span>
              ))}
              {user.skills.length > 3 && (
                <span className="skill-more">+{user.skills.length - 3} more</span>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="user-actions">
        <button 
          onClick={handleAddFriend} 
          disabled={added || loading}
          className={`add-friend-btn ${added ? 'added' : ''}`}
        >
          {added ? '✓ Friend' : loading ? 'Adding...' : '+ Add Friend'}
        </button>
        <button 
          onClick={handleViewProfile}
          className="view-profile-btn"
        >
          View Profile
        </button>
      </div>
    </div>
  );
};

export default UserSearchResult;
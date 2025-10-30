import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { friendsAPI, usersAPI } from '../services/api'; 

const ProfilePreview = ({ user, showAddFriend = true, isAlreadyFriend = false }) => {
  const [friendStatus, setFriendStatus] = useState('unknown'); // 'unknown', 'friends', 'request_sent', 'request_received', 'not_friends'
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkFriendStatus();
    // Get current user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, [user]);

  const checkFriendStatus = async () => {
    try {
      const currentUserData = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!currentUserData.id) {
        setFriendStatus('not_friends');
        return;
      }
      
      // If it's the same user, don't show friend buttons
      if (currentUserData.id === user.id) {
        setFriendStatus('self');
        return;
      }

      // Get current user's full profile to check friend requests
      const userRes = await usersAPI.getProfile(currentUserData.id);
      if (userRes.data.success) {
        const currentUserProfile = userRes.data.user;
        
        // Check if already friends
        if (currentUserProfile.friends && currentUserProfile.friends.some(f => f === user.id)) {
          setFriendStatus('friends');
        } 
        // Check if request sent
        else if (currentUserProfile.sentFriendRequests && currentUserProfile.sentFriendRequests.some(f => f === user.id)) {
          setFriendStatus('request_sent');
        }
        // Check if request received
        else if (currentUserProfile.friendRequests && currentUserProfile.friendRequests.some(f => f === user.id)) {
          setFriendStatus('request_received');
        }
        else {
          setFriendStatus('not_friends');
        }
      }
    } catch (error) {
      console.error('Error checking friend status:', error);
      setFriendStatus('not_friends');
    }
  };

  const handleSendRequest = async () => {
    setLoading(true);
    try {
      await friendsAPI.sendRequest(user.id);
      setFriendStatus('request_sent');
      alert('Friend request sent!');
    } catch (error) {
      alert('Error sending friend request: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    setLoading(true);
    try {
      await friendsAPI.acceptRequest(user.id);
      setFriendStatus('friends');
      alert(`You are now friends with ${user.name}!`);
    } catch (error) {
      alert('Error accepting friend request: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!window.confirm(`Remove ${user.name} from your friends?`)) return;
    
    setLoading(true);
    try {
      await friendsAPI.removeFriend(user.id);
      setFriendStatus('not_friends');
      alert('Friend removed successfully');
    } catch (error) {
      alert('Error removing friend: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!window.confirm(`Cancel friend request to ${user.name}?`)) return;
    
    setLoading(true);
    try {
      await friendsAPI.cancelRequest(user.id);
      setFriendStatus('not_friends');
      alert('Friend request cancelled');
    } catch (error) {
      alert('Error cancelling friend request: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = () => {
    console.log('🎯 Navigating to profile:', user.id, user.name);
    navigate(`/profile/${user.id}`);
  };

  const renderFriendButton = () => {
    if (!showAddFriend || friendStatus === 'self') return null;

    switch (friendStatus) {
      case 'friends':
        return (
          <div className="friend-actions">
            <span className="friend-badge">Friends</span>
            <button 
              className="remove-friend-btn"
              onClick={handleRemoveFriend}
              disabled={loading}
            >
              {loading ? 'Removing...' : 'Remove Friend'}
            </button>
          </div>
        );
      
      case 'request_sent':
        return (
          <div className="friend-actions">
            <span className="request-sent-badge">Request Sent</span>
            <button 
              className="cancel-request-btn"
              onClick={handleCancelRequest}
              disabled={loading}
            >
              {loading ? 'Cancelling...' : 'Cancel Request'}
            </button>
          </div>
        );
      
      case 'request_received':
        return (
          <div className="friend-actions">
            <span className="request-received-badge">Request Received</span>
            <button 
              className="accept-request-btn"
              onClick={handleAcceptRequest}
              disabled={loading}
            >
              {loading ? 'Accepting...' : 'Accept Request'}
            </button>
          </div>
        );
      
      case 'not_friends':
        return (
          <button 
            className="add-friend-btn"
            onClick={handleSendRequest}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Add Friend'}
          </button>
        );
      
      default:
        return (
          <button 
            className="add-friend-btn"
            onClick={handleSendRequest}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Add Friend'}
          </button>
        );
    }
  };

  return (
    <article className="profile-preview">
      <h3>{user.name}</h3>
      <p>{user.bio || 'No bio available'}</p>
      <div className="profile-stats">
        <span>Email: {user.email}</span>
        <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
      </div>
      <div className="profile-actions">
        <button 
          onClick={handleViewProfile}
          className="view-profile-btn"
        >
          View Profile
        </button>
        
        {renderFriendButton()}
      </div>
    </article>
  );
};

export default ProfilePreview;
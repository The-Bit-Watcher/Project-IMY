import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersAPI } from '../services/api';
import ProfilePreview from './ProfilePreview';
import './FriendsList.css';

const FriendsList = ({ userId, isOwnProfile }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingFriend, setRemovingFriend] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFriends();
  }, [userId]);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching friends for user ID:', userId);
      
      // Get the user's profile to access their friends array
      const userResult = await usersAPI.getProfile(userId);
      if (userResult.data.success) {
        const user = userResult.data.user;
        console.log('📋 User friends array:', user.friends);
        console.log('👤 Current user data:', user);
        
        if (user.friends && user.friends.length > 0) {
          // Fetch each friend's profile data
          const friendProfiles = await Promise.all(
            user.friends.map(async (friendId) => {
              try {
                console.log(`🔄 Fetching friend profile: ${friendId}`);
                const friendResult = await usersAPI.getProfile(friendId);
                if (friendResult.data.success) {
                  console.log(`✅ Loaded friend:`, friendResult.data.user);
                  return friendResult.data.user;
                }
              } catch (error) {
                console.error(`❌ Error fetching friend ${friendId}:`, error);
                return null;
              }
            })
          );
          
          // Filter out any failed requests
          const validFriends = friendProfiles.filter(friend => friend !== null);
          console.log('🎯 Final friends list:', validFriends);
          setFriends(validFriends);
        } else {
          console.log('ℹ️ No friends found for user');
          setFriends([]);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching friends:', error);
      setError('Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async (friendId, friendName) => {
    if (!window.confirm(`Are you sure you want to remove ${friendName} from your friends?`)) {
      return;
    }

    try {
      setRemovingFriend(friendId);
      
      // Get current user from localStorage
      const localUser = JSON.parse(localStorage.getItem('user') || '{}');
      const currentUserId = localUser.id;
      
      if (!currentUserId) {
        alert('No user found in localStorage. Please log in again.');
        return;
      }

      console.log('🗑️ Removing friend:', { currentUserId, friendId });

      // Use the simple endpoint with userId from localStorage
      const response = await usersAPI.removeFriend(currentUserId, friendId);
      
      if (response.data.success) {
        console.log('✅ Friend removed successfully');
        
        // Remove friend from local state
        setFriends(prevFriends => prevFriends.filter(friend => friend.id !== friendId));
        
        alert('Friend removed successfully');
      } else {
        alert('Failed to remove friend: ' + response.data.message);
      }
    } catch (error) {
      console.error('❌ Error removing friend:', error);
      
      if (error.response) {
        alert(`Failed to remove friend: ${error.response.data?.message || 'Server error'}`);
      } else if (error.request) {
        alert('Failed to remove friend: No response from server');
      } else {
        alert('Failed to remove friend: ' + error.message);
      }
    } finally {
      setRemovingFriend(null);
    }
  };

  if (loading) {
    return (
      <section className="friends-list">
        <h2>Friends</h2>
        <div className="loading">Loading friends...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="friends-list">
        <h2>Friends</h2>
        <div className="error">{error}</div>
      </section>
    );
  }

  return (
    <section className="friends-list">
      <h2>Friends ({friends.length})</h2>
      {friends.length === 0 ? (
        <p className="no-friends">No friends yet</p>
      ) : (
       <div className="friends-grid">
  {friends.map(friend => (
    <div key={friend.id} className="friend-item">
      {/* Pass props to hide Add Friend button and show they're already friends */}
      <ProfilePreview 
        user={friend} 
        showAddFriend={false} 
        isAlreadyFriend={true}
      />
      
      {/* Only show Remove Friend button if it's the user's own profile */}
      {isOwnProfile && (
        <div className="friend-actions">
          <button
            className="remove-friend-btn"
            onClick={() => handleRemoveFriend(friend.id, friend.name)}
            disabled={removingFriend === friend.id}
          >
            {removingFriend === friend.id ? 'Removing...' : 'Remove Friend'}
          </button>
        </div>
      )}
    </div>
  ))}
</div>
      )}
    </section>
  );
};

export default FriendsList;
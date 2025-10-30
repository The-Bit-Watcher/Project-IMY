import React, { useState, useEffect } from 'react';
import { friendsAPI } from '../services/api';
import Header from './Header'; 
import './FriendRequests.css';

const FriendRequests = () => {
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('incoming');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const [incomingRes, sentRes] = await Promise.all([
        friendsAPI.getRequests(),
        friendsAPI.getSentRequests()
      ]);
      
      if (incomingRes.data.success) setIncomingRequests(incomingRes.data.requests);
      if (sentRes.data.success) setSentRequests(sentRes.data.sentRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requesterId, requesterName) => {
    try {
      await friendsAPI.acceptRequest(requesterId);
      alert(`You are now friends with ${requesterName}!`);
      fetchRequests(); // Refresh the list
    } catch (error) {
      alert('Error accepting friend request: ' + error.message);
    }
  };

  const handleDecline = async (requesterId, requesterName) => {
    if (!window.confirm(`Decline friend request from ${requesterName}?`)) return;
    
    try {
      await friendsAPI.declineRequest(requesterId);
      fetchRequests(); // Refresh the list
    } catch (error) {
      alert('Error declining friend request: ' + error.message);
    }
  };

  const handleCancel = async (friendId, friendName) => {
    if (!window.confirm(`Cancel friend request to ${friendName}?`)) return;
    
    try {
      await friendsAPI.cancelRequest(friendId);
      fetchRequests(); // Refresh the list
    } catch (error) {
      alert('Error cancelling friend request: ' + error.message);
    }
  };

  if (loading) return (
    <div>
      <Header />
      <div className="loading">Loading requests...</div>
    </div>
  );

  return (
    <div>
      <Header />
      <div className="friend-requests">
        <h2>Friend Requests</h2>
        
        <div className="requests-tabs">
          <button 
            className={`tab ${activeTab === 'incoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('incoming')}
          >
            Incoming ({incomingRequests.length})
          </button>
          <button 
            className={`tab ${activeTab === 'sent' ? 'active' : ''}`}
            onClick={() => setActiveTab('sent')}
          >
            Sent ({sentRequests.length})
          </button>
        </div>

        {activeTab === 'incoming' && (
          <div className="incoming-requests">
            {incomingRequests.length === 0 ? (
              <p className="no-requests">No incoming friend requests</p>
            ) : (
              incomingRequests.map(request => (
                <div key={request.id} className="request-item">
                  <div className="request-info">
                    <h4>{request.name}</h4>
                    <p>{request.email}</p>
                    {request.bio && <p className="bio">{request.bio}</p>}
                  </div>
                  <div className="request-actions">
                    <button 
                      className="accept-btn"
                      onClick={() => handleAccept(request.id, request.name)}
                    >
                      Accept
                    </button>
                    <button 
                      className="decline-btn"
                      onClick={() => handleDecline(request.id, request.name)}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'sent' && (
          <div className="sent-requests">
            {sentRequests.length === 0 ? (
              <p className="no-requests">No sent friend requests</p>
            ) : (
              sentRequests.map(request => (
                <div key={request.id} className="request-item">
                  <div className="request-info">
                    <h4>{request.name}</h4>
                    <p>{request.email}</p>
                    {request.bio && <p className="bio">{request.bio}</p>}
                  </div>
                  <div className="request-actions">
                    <button 
                      className="cancel-btn"
                      onClick={() => handleCancel(request.id, request.name)}
                    >
                      Cancel Request
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendRequests;
import React from 'react';
import { useNavigate } from 'react-router-dom';

const ActivitySearchResult = ({ activity }) => {
  const navigate = useNavigate();

  const handleProjectClick = () => {
    if (activity.projectId) {
      navigate(`/project/${activity.projectId}`);
    }
  };

  const handleUserClick = () => {
    if (activity.userId) {
      navigate(`/profile/${activity.userId}`);
    }
  };

  // Get user display name
  const getUserName = () => {
    if (activity.user && activity.user.name) {
      return activity.user.name;
    }
    return 'Unknown User';
  };

  // Get user avatar or initial
  const getUserAvatar = () => {
    if (activity.user && activity.user.avatar) {
      return activity.user.avatar;
    }
    if (activity.user && activity.user.profilePic) {
      return activity.user.profilePic;
    }
    return null;
  };

  // Get user initial for avatar placeholder
  const getUserInitial = () => {
    return getUserName().charAt(0).toUpperCase();
  };

  // Get project name
  const getProjectName = () => {
    if (activity.project && activity.project.name) {
      return activity.project.name;
    }
    return null;
  };

  // Highlight search terms in message
  const highlightText = (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  return (
    <div className="activity-search-result">
      <div 
        className="activity-avatar clickable"
        onClick={handleUserClick}
      >
        {getUserAvatar() ? (
          <img src={getUserAvatar()} alt={getUserName()} className="avatar-img" />
        ) : (
          <div className="avatar-placeholder">
            {getUserInitial()}
          </div>
        )}
      </div>
      
      <div className="activity-content">
        <div className="activity-header">
          <span 
            className="user-name clickable"
            onClick={handleUserClick}
          >
            {getUserName()}
          </span>
          <span className="activity-action">{activity.action}</span>
          <span className="activity-time">
            {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Unknown date'}
          </span>
        </div>
        
        <div 
          className="activity-message"
          dangerouslySetInnerHTML={{ 
            __html: activity.message || 'No message' 
          }}
        />
        
        {/* Show project reference if available */}
        {getProjectName() && (
          <div className="activity-project">
            in 
            <span 
              className="project-name clickable"
              onClick={handleProjectClick}
            >
              {getProjectName()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivitySearchResult;
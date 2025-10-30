import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { activityAPI, projectsAPI } from '../services/api';
import './ActivityItem.css';

const ActivityItem = ({ activity }) => {
  const navigate = useNavigate();
  const [likes, setLikes] = useState(activity.likes || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Initialize like state based on current user
  useEffect(() => {
    // Check if current user has liked this activity
    setHasLiked(false);
  }, [activity._id]);

  const handleProjectClick = (projectId) => {
    if (projectId) {
      navigate(`/project/${projectId}`);
    }
  };

  // Get user ID - handle both local and global feed formats
  const getUserId = () => {
    // Local feed format
    if (activity.userId && activity.userId._id) {
      return activity.userId._id;
    }
    if (activity.user && activity.user._id) {
      return activity.user._id;
    }
    if (activity.userId && activity.userId.id) {
      return activity.userId.id;
    }
    
    // Global feed format
    if (activity.ownerId) {
      return activity.ownerId;
    }
    
    return null;
  };

  const handleUserClick = (userId) => {
    // Don't navigate if it's a placeholder ID or null
    if (userId && userId !== 'file-owner' && userId !== 'Unknown User') {
      navigate(`/profile/${userId}`);
    } else {
      console.log('No valid user ID for navigation');
    }
  };

  // Get user display name
  const getUserName = () => {
    if (activity.userId && activity.userId.name) {
      return activity.userId.name;
    }
    if (activity.user && activity.user.name) {
      return activity.user.name;
    }
    if (activity.ownerName) {
      return activity.ownerName;
    }
    return 'Unknown User';
  };

  // Get user avatar or initial
  const getUserAvatar = () => {
    if (activity.userId && activity.userId.profilePic) {
      return activity.userId.profilePic;
    }
    if (activity.user && activity.user.profilePic) {
      return activity.user.profilePic;
    }
    if (activity.userId && activity.userId.avatar) {
      return activity.userId.avatar;
    }
    if (activity.ownerAvatar) {
      return activity.ownerAvatar;
    }
    return null;
  };

  // Get user initial for avatar placeholder
  const getUserInitial = () => {
    return getUserName().charAt(0).toUpperCase();
  };

  // Get project name
  const getProjectName = () => {
    if (activity.projectId && activity.projectId.name) {
      return activity.projectId.name;
    }
    if (activity.project && activity.project.name) {
      return activity.project.name;
    }
    if (activity.projectName) {
      return activity.projectName;
    }
    return null;
  };

  // Get project ID
  const getProjectId = () => {
    if (activity.projectId && activity.projectId._id) {
      return activity.projectId._id;
    }
    if (activity.project && activity.project._id) {
      return activity.project._id;
    }
    if (activity.projectId && activity.projectId.id) {
      return activity.projectId.id;
    }
    if (activity.projectId) {
      return activity.projectId;
    }
    return null;
  };

  // Check if this activity has downloadable files
  const hasDownloadableFiles = () => {
    // For global feed files
    if (activity.fileName && activity.projectId) {
      return true;
    }
    // For activities with files array
    if (activity.files && activity.files.length > 0) {
      return true;
    }
    return false;
  };

  const handleLike = async () => {
    if (typeof activityAPI.like !== 'function') {
      console.error('❌ activityAPI.like is not a function. Please check your api.js exports.');
      alert('Like functionality is currently unavailable. Please try again later.');
      return;
    }

    // Check if activity has an ID
    if (!activity._id) {
      console.error('❌ Activity ID is missing');
      alert('Cannot like this activity - missing ID');
      return;
    }

    try {
      // Store current state for potential revert
      const previousLikes = likes;
      const previousHasLiked = hasLiked;

      if (previousHasLiked) {
        setLikes(previousLikes - 1);
        setHasLiked(false);
      } else {
        setLikes(previousLikes + 1);
        setHasLiked(true);
      }

      console.log('🔄 Attempting to like activity:', activity._id);
      
      // Call the like API
      const response = await activityAPI.like(activity._id);
      
      if (response.data && response.data.success) {
        // Update with actual count from server
        setLikes(response.data.likes);
        console.log('✅ Like successful, new count:', response.data.likes);
      } else {
        // Revert if failed
        setLikes(previousLikes);
        setHasLiked(previousHasLiked);
        console.error('❌ Failed to like activity:', response.data?.message);
        alert('Failed to like activity: ' + (response.data?.message || 'Unknown error'));
      }
    } catch (error) {
      // Revert on error
      setLikes(likes); // Use current state
      setHasLiked(hasLiked);
      console.error('❌ Error liking activity:', error);
      
      // More specific error messages
      if (error.response) {
        console.error('Error response:', error.response.data);
        alert('Error liking activity: ' + (error.response.data?.message || 'Server error'));
      } else if (error.request) {
        alert('Network error - please check your connection');
      } else {
        alert('Error liking activity: ' + error.message);
      }
    }
  };

  // Handle download functionality
  const handleDownload = async () => {
    if (!hasDownloadableFiles()) {
      alert('No files available for download');
      return;
    }

    setIsDownloading(true);
    try {
      const projectId = getProjectId();
      
      if (!projectId) {
        alert('Cannot download: Project information missing');
        return;
      }

      // For global feed files (single file per activity)
      if (activity.fileName && activity.projectId) {
        console.log('📥 Downloading file from global feed:', activity.fileName);
        
        // Get the project to find the file index
        const projectResponse = await projectsAPI.getById(projectId);
        if (projectResponse.data && projectResponse.data.success) {
          const project = projectResponse.data.project;
          const fileIndex = project.files?.findIndex(file => file.name === activity.fileName);
          
          if (fileIndex !== -1 && fileIndex !== undefined) {
            // Download the specific file
            const fileResponse = await projectsAPI.getFile(projectId, fileIndex);
            
            if (fileResponse.data && fileResponse.data.success) {
              const file = fileResponse.data.file;
              
              // Create download link
              const link = document.createElement('a');
              link.href = `data:${file.type};base64,${file.content}`;
              link.download = file.name;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              
              console.log('✅ File downloaded successfully:', file.name);
            } else {
              alert('Failed to download file');
            }
          } else {
            alert('File not found in project');
          }
        } else {
          alert('Project not found');
        }
      } 
      // For activities with multiple files
      else if (activity.files && activity.files.length > 0) {
        console.log('📥 Downloading files from activity:', activity.files.length, 'files');
        
        // Download each file in the activity
        for (let i = 0; i < activity.files.length; i++) {
          const fileResponse = await projectsAPI.getFile(projectId, i);
          
          if (fileResponse.data && fileResponse.data.success) {
            const file = fileResponse.data.file;
            
            // Create download link
            const link = document.createElement('a');
            link.href = `data:${file.type};base64,${file.content}`;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log('✅ File downloaded:', file.name);
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Error downloading file:', error);
      alert('Failed to download file: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsDownloading(false);
    }
  };

  // Get file info for display
  const getFileInfo = () => {
    if (activity.fileName) {
      return {
        name: activity.fileName,
        type: activity.fileType,
        size: activity.fileSize
      };
    }
    if (activity.files && activity.files.length > 0) {
      return {
        name: activity.files[0].name,
        type: 'multiple',
        count: activity.files.length
      };
    }
    return null;
  };

  const fileInfo = getFileInfo();

  return (
    <div className="activity-item">
      <div 
        className="activity-avatar clickable"
        onClick={() => handleUserClick(getUserId())}
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
            onClick={() => handleUserClick(getUserId())}
          >
            {getUserName()}
          </span>
          <span className="activity-time">
            {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Unknown date'}
          </span>
        </div>
        
        <div className="activity-message">
          {activity.message || 'No message'}
        </div>
        
        {/* Show file info if available */}
        {fileInfo && (
          <div className="activity-file-info">
            <div className="file-icon">📎</div>
            <div className="file-details">
              <span className="file-name">{fileInfo.name}</span>
              {fileInfo.type === 'multiple' ? (
                <span className="file-meta">{fileInfo.count} files</span>
              ) : (
                <span className="file-meta">
                  {fileInfo.type} • {fileInfo.size ? `${(fileInfo.size / 1024).toFixed(1)}KB` : 'Unknown size'}
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Show project reference if available */}
        {getProjectName() && (
          <div className="activity-project">
            <span 
              className="project-name clickable"
              onClick={() => handleProjectClick(getProjectId())}
            >
              {getProjectName()}
            </span>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="activity-actions">
          <button 
            className={`like-btn ${hasLiked ? 'liked' : ''}`}
            onClick={handleLike}
            disabled={!activity._id} // Disable if no activity ID
          >
            ❤️ {likes}
          </button>
          
          {hasDownloadableFiles() && (
            <button 
              className="download-btn"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? '⏳ Downloading...' : '📥 Download'}
            </button>
          )}
        </div>
        
        {/* Show action type */}
        <div className="activity-action">
          <span className="action-badge">{activity.action || 'activity'}</span>
        </div>
      </div>
    </div>
  );
};

export default ActivityItem;
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './FileItem.css';

const FileItem = ({ file }) => {
  const navigate = useNavigate();

  const handleFileClick = () => {
    if (file.projectId) {
      navigate(`/project/${file.projectId}`, { 
        state: { 
          highlightFile: file.fileName
        }
      });
    }
  };

  const handleProjectClick = (e) => {
    e.stopPropagation(); // Prevent file click
    if (file.projectId) {
      navigate(`/project/${file.projectId}`);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return '📄';
    
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('pdf')) return '📕';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('zip') || fileType.includes('archive')) return '📦';
    if (fileType.includes('code') || fileType.includes('text')) return '📄';
    
    return '📄';
  };

  return (
    <div className="file-item" onClick={handleFileClick}>
      <div className="file-icon">
        {getFileIcon(file.fileType)}
      </div>
      
      <div className="file-details">
        <div className="file-name">{file.fileName}</div>
        
        <div className="file-meta">
          <span className="file-size">{formatFileSize(file.fileSize)}</span>
          <span className="file-type">{file.fileType || 'File'}</span>
          <span className="file-date">
            {file.uploadDate ? new Date(file.uploadDate).toLocaleDateString() : 'Unknown date'}
          </span>
        </div>
        
        <div className="project-info">
          <span 
            className="project-name clickable"
            onClick={handleProjectClick}
          >
            {file.projectName || 'Unknown Project'}
          </span>
          {file.projectDescription && (
            <span className="project-description">
              {file.projectDescription}
            </span>
          )}
        </div>
        
        <div className="owner-info">
          <span className="owner-name">
            By {file.ownerName || 'Unknown User'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FileItem;
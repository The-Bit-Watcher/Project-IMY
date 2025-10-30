import React, { useState, useEffect, useRef } from 'react';
import { projectsAPI, activityAPI } from '../services/api';
import ProjectActions from './ProjectActions'; 
import FileBrowserComponent from './FileBrowserComponent'; 
import './Project.css';

const Project = ({ projectId, highlightedFile, onClearHighlight, user }) => {
  const [project, setProject] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(false);
  const [showEnhancedFiles, setShowEnhancedFiles] = useState(false); // Toggle for enhanced view
  
  const fileListRef = useRef(null);

  // Effect to scroll to and highlight specific file
  useEffect(() => {
    if (highlightedFile && project && project.files) {
      // Find the file element and highlight it
      const fileElement = fileListRef.current?.children[highlightedFile.index];
      if (fileElement) {
        fileElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        fileElement.classList.add('file-highlighted');
        
        // Remove highlight after 3 seconds
        const timer = setTimeout(() => {
          fileElement.classList.remove('file-highlighted');
          if (onClearHighlight) onClearHighlight();
        }, 3000);

        return () => clearTimeout(timer);
      }
    }
  }, [highlightedFile, project, onClearHighlight]);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const result = await projectsAPI.getById(projectId);
        console.log('Project API response:', result);
        
        if (result.data && result.data.success) {
          setProject(result.data.project);
          fetchProjectActivity(projectId);
        } else {
          console.error('Failed to fetch project:', result.data?.message);
        }
      } catch (error) {
        console.error('Failed to fetch project:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchProjectActivity = async (id) => {
      try {
        setActivityLoading(true);
        const result = await activityAPI.getProjectActivity(id);
        if (result.data && result.data.success) {
          setActivity(result.data.activity || []);
        }
      } catch (error) {
        console.error('Failed to fetch project activity:', error);
      } finally {
        setActivityLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    } else {
      setLoading(false);
    }
  }, [projectId]);

  const handleDownloadFile = async (fileIndex, fileName) => {
    try {
      const response = await projectsAPI.getFile(projectId, fileIndex);
      
      // Create a blob from the response data
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `file-${fileIndex}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
      alert('Failed to download file');
    }
  };

  const handleDownloadAllFiles = async () => {
    if (!project.files || project.files.length === 0) {
      alert('No files to download');
      return;
    }

    try {
      // Download each file individually
      for (let i = 0; i < project.files.length; i++) {
        await handleDownloadFile(i, project.files[i].name || `file-${i}`);
      }
    } catch (error) {
      console.error('Failed to download files:', error);
    }
  };

  const toggleFileView = () => {
    setShowEnhancedFiles(!showEnhancedFiles);
  };

  if (loading) return <div className="loading">Loading project...</div>;
  if (!project) return <div className="error">Project not found</div>;

  return (
    <section className="project">
      {/* Project Header */}
      <div className="project-header">
        {project.image && (
          <img 
            src={project.image} 
            alt={project.name}
            className="project-image"
          />
        )}
        <div className="project-info">
          <h1>{project.name}</h1>
          <p className="project-description">{project.description}</p>
          <div className="project-type">
            <strong>Type:</strong> {project.type || 'Not specified'}
          </div>
        </div>
      </div>

      <ProjectActions 
        projectId={projectId} 
        user={user} 
        project={project}  // Pass the project data
      />

      {/* Project Details */}
      <div className="project-details">
        <div className="detail-item">
          <strong>Version:</strong> {project.version}
        </div>
        <div className="detail-item">
          <strong>Created:</strong> {new Date(project.createdAt).toLocaleDateString()}
        </div>
        <div className="detail-item">
          <strong>Last updated:</strong> {new Date(project.updatedAt).toLocaleDateString()}
        </div>
        <div className="detail-item">
          <strong>Status:</strong> 
          <span className={`status ${project.isCheckedOut ? 'checked-out' : 'available'}`}>
            {project.isCheckedOut ? 'Checked Out' : 'Available'}
          </span>
        </div>
        
        {/* Hashtags */}
        {project.hashtags && project.hashtags.length > 0 && (
          <div className="project-tags">
            <strong>Tags:</strong>
            {project.hashtags.map((tag, index) => (
              <span key={index} className="tag">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Files Section - Enhanced with toggle */}
      {project.files && project.files.length > 0 && (
        <div className="project-files">
          <div className="section-header">
            <h3>Project Files ({project.files.length})</h3>
            <div className="file-view-controls">
              <button 
                onClick={toggleFileView}
                className={`view-toggle-btn ${showEnhancedFiles ? 'active' : ''}`}
              >
                {showEnhancedFiles ? 'Simple View' : 'Enhanced View'}
              </button>
              <button 
                onClick={handleDownloadAllFiles}
                className="download-all-btn"
              >
                Download All
              </button>
            </div>
          </div>

          {/* Enhanced File Browser */}
          {showEnhancedFiles ? (
            <FileBrowserComponent 
              projectId={projectId}
              projectName={project.name}
            />
          ) : (
            /* Original Files List (fallback) */
            <div className="files-list" ref={fileListRef}>
              {project.files.map((file, index) => (
                <div 
                  key={index} 
                  className={`file-item ${highlightedFile?.index === index ? 'file-highlighted' : ''}`}
                >
                  <span className="file-name">
                    {file.name || `File ${index + 1}`}
                  </span>
                  <button 
                    onClick={() => handleDownloadFile(index, file.name)}
                    className="download-btn"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Activity Section */}
      <div className="project-activity">
        <h3>Project Activity</h3>
        {activityLoading ? (
          <div className="loading">Loading activity...</div>
        ) : activity.length > 0 ? (
          <div className="activity-list">
            {activity.map((item, index) => (
              <div key={index} className="activity-item">
                <div className="activity-message">{item.message}</div>
                <div className="activity-meta">
                  <span className="activity-user">{item.userId}</span>
                  <span className="activity-date">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-activity">No activity recorded for this project</div>
        )}
      </div>
    </section>
  );
};

export default Project;
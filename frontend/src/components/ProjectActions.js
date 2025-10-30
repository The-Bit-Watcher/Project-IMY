import React, { useState, useEffect } from 'react';
import { projectsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import './ProjectActions.css';

const ProjectActions = ({ projectId, user, project }) => {
  const [isCheckedOut, setIsCheckedOut] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState('');
  const [checkInFiles, setCheckInFiles] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectMembers, setProjectMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch project members when component mounts or project changes
  useEffect(() => {
    if (projectId) {
      fetchProjectMembers();
    }
  }, [projectId, project]);

  const fetchProjectMembers = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProjectMembers(data.members);
        }
      }
    } catch (error) {
      console.error('Error fetching project members:', error);
    }
  };

  // Check if current user can edit/delete this project
  const canEdit = user && (
    user.role === 'admin' || 
    (project && project.owner === user.id) ||
    (project && project.owner && project.owner._id === user.id) ||
    (project && project.members && project.members.includes(user.id))
  );

  const canDelete = user && (
    user.role === 'admin' || 
    (project && project.owner === user.id) ||
    (project && project.owner && project.owner._id === user.id)
  );

  const handleCheckOut = async () => {
    try {
      // Call API to check out project
      setIsCheckedOut(true);
      console.log('Project checked out');
    } catch (error) {
      console.error('Failed to check out project:', error);
    }
  };

  const handleCheckIn = async () => {
    if (!checkInMessage) {
      alert('Please provide a check-in message');
      return;
    }
    
    try {
      setIsCheckedOut(false);
      setCheckInMessage('');
      setCheckInFiles([]);
      console.log('Project checked in with message:', checkInMessage);
    } catch (error) {
      console.error('Failed to check in project:', error);
    }
  };

  const handleDeleteProject = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setLoading(true);
    try {
      const result = await projectsAPI.delete(projectId);
      if (result.data && result.data.success) {
        alert('Project deleted successfully');
        navigate('/home'); // Redirect to home page
      } else {
        alert('Failed to delete project: ' + (result.data?.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleEditProject = () => {
    navigate(`/projects/edit/${projectId}`);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setCheckInFiles(files);
  };

  const handleDownloadProject = async () => {
    try {
      console.log('Downloading entire project...');
    } catch (error) {
      console.error('Failed to download project:', error);
    }
  };

  if (isCheckedOut) {
    return (
      <div className="project-actions checked-out">
        <h3>Project Checked Out</h3>
        <div className="check-in-form">
          <div className="form-group">
            <label htmlFor="checkInMessage">Check-in Message *</label>
            <textarea
              id="checkInMessage"
              value={checkInMessage}
              onChange={(e) => setCheckInMessage(e.target.value)}
              placeholder="Describe the changes you made..."
              rows="3"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="checkInFiles">Upload Updated Files</label>
            <input
              type="file"
              id="checkInFiles"
              multiple
              onChange={handleFileUpload}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="versionUpdate">Update Version</label>
            <input
              type="text"
              id="versionUpdate"
              placeholder="1.0.1"
            />
          </div>
          
          <button onClick={handleCheckIn} className="submit-btn">
            Check In Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="project-actions">
      {/* MAIN ACTION BUTTONS */}
      <div className="main-actions">
        <button onClick={handleCheckOut} className="action-btn primary">
          Check Out Project
        </button>
        <button onClick={handleDownloadProject} className="action-btn secondary">
          Download Project
        </button>
      </div>

      {/* Project Members Section */}
      {projectMembers.length > 0 && (
        <div className="project-members-section">
          <h4>Project Members ({projectMembers.length})</h4>
          <div className="members-list">
            {projectMembers.map(member => (
              <div key={member._id} className="member-item">
                <div className="member-info">
                  <div className="member-avatar">
                    {member.profilePic ? (
                      <img src={member.profilePic} alt={member.name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {member.name?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="member-details">
                    <span className="member-name">{member.name}</span>
                    <span className="member-email">{member.email}</span>
                    {member._id === project.owner?._id && (
                      <span className="member-role owner">Owner</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Project Administration Section - Only for users with permissions */}
      {canEdit && (
        <div className="admin-actions">
          <h4>Project Administration</h4>
          
          {canEdit && (
            <button onClick={handleEditProject} className="action-btn warning">
              Edit Project Details
            </button>
          )}
          
          {canDelete && (
            <div className="delete-section">
              <button 
                onClick={handleDeleteProject} 
                disabled={loading}
                className={`action-btn danger ${showDeleteConfirm ? 'confirm' : ''}`}
              >
                {loading ? 'Deleting...' : showDeleteConfirm ? 'Confirm Delete?' : 'Delete Project'}
              </button>
              
              {showDeleteConfirm && (
                <div className="delete-confirmation">
                  <p>Are you sure you want to delete this project? This action cannot be undone.</p>
                  <div className="confirmation-buttons">
                    <button 
                      onClick={() => setShowDeleteConfirm(false)}
                      className="action-btn secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Project Info for Admins */}
          {project && (
            <div className="project-admin-info">
              <h5>Project Information</h5>
              <div className="info-item">
                <strong>Owner:</strong> {project.owner?.name || 'You'}
              </div>
              <div className="info-item">
                <strong>Created:</strong> {new Date(project.createdAt).toLocaleDateString()}
              </div>
              <div className="info-item">
                <strong>Last Updated:</strong> {new Date(project.updatedAt).toLocaleDateString()}
              </div>
              <div className="info-item">
                <strong>Files:</strong> {project.files?.length || 0}
              </div>
              <div className="info-item">
                <strong>Members:</strong> {projectMembers.length}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectActions;
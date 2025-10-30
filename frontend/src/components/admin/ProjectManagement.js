import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import './ProjectManagement.css';

const ProjectManagement = () => {
  const [projects, setProjects] = useState([]);
  const [projectTypes, setProjectTypes] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchProjectTypes(); 
    fetchProjects();
  }, [searchTerm, typeFilter]);

  // Fetch available project types from database
  const fetchProjectTypes = async () => {
    try {
      const response = await adminAPI.getProjectTypes();
      if (response.data.success) {
        setProjectTypes(response.data.types);
      }
    } catch (error) {
      console.error('Error fetching project types:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (typeFilter !== 'all') params.type = typeFilter;
      
      const response = await adminAPI.getProjects(params);
      if (response.data.success) {
        setProjects(response.data.projects);
      }
    } catch (error) {
      setError('Failed to load projects');
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId, projectName) => {
    if (window.confirm(`Are you sure you want to delete project "${projectName}"? This will also delete all associated activities.`)) {
      try {
        await adminAPI.deleteProject(projectId);
        setProjects(projects.filter(project => project._id !== projectId));
        alert('Project deleted successfully');
      } catch (error) {
        alert('Failed to delete project');
        console.error('Error deleting project:', error);
      }
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleTypeFilterChange = (e) => {
    setTypeFilter(e.target.value);
  };

  // Format type name for display
  const formatTypeName = (typeName) => {
    return typeName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="project-management">
      <div className="admin-header">
        <h1>Project Management</h1>
        <p>Manage all projects in the system</p>
      </div>

      {/* Updated search bar with dynamic type filter */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search projects by name or description..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
        <select 
          value={typeFilter} 
          onChange={handleTypeFilterChange}
          className="filter-select"
        >
          <option value="all">All Types</option>
          {projectTypes.map(type => (
            <option key={type.name} value={type.name}>
              {formatTypeName(type.name)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading projects...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => (
            <div key={project._id} className="project-card">
              <div className="project-header">
                <h3 className="project-name">{project.name}</h3>
                <div className="project-meta">
                  <span className="owner">By: {project.ownerName}</span>
                  <span className="date">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <p className="project-description">
                {project.description}
              </p>

              {/* Add project type display */}
              {project.type && (
                <div className="project-type">
                  <strong>Type:</strong> {formatTypeName(project.type)}
                </div>
              )}

              <div className="project-stats">
                <div className="stat">
                  <span className="stat-label">Files:</span>
                  <span className="stat-value">{project.files?.length || 0}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Members:</span>
                  <span className="stat-value">{project.members?.length || 1}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Hashtags:</span>
                  <span className="stat-value">{project.hashtags?.length || 0}</span>
                </div>
              </div>

              <div className="project-actions">
                <button
                  onClick={() => handleDeleteProject(project._id, project.name)}
                  className="btn btn-danger"
                >
                  Delete Project
                </button>
              </div>
            </div>
          ))}

          {projects.length === 0 && (
            <div className="no-results">No projects found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;
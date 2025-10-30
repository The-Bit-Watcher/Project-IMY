import React, { useState, useEffect } from 'react';
import { projectsAPI } from '../services/api';
import { useParams, useNavigate } from 'react-router-dom';
import './EditProject.css';

const EditProject = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [projectTypes, setProjectTypes] = useState([]); // New state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    version: '',
    type: '', // New field
    hashtags: []
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch project types
  useEffect(() => {
    const fetchProjectTypes = async () => {
      try {
        const response = await fetch('/api/project-types');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setProjectTypes(data.types);
          }
        }
      } catch (error) {
        console.error('Error fetching project types:', error);
        setProjectTypes([
          'web-application',
          'mobile-application', 
          'desktop-application',
          'framework',
          'library',
          'plugin',
          'tool',
          'game'
        ]);
      }
    };

    fetchProjectTypes();
  }, []);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const result = await projectsAPI.getById(projectId);
        if (result.data && result.data.success) {
          const projectData = result.data.project;
          setProject(projectData);
          setFormData({
            name: projectData.name || '',
            description: projectData.description || '',
            version: projectData.version || '1.0.0',
            type: projectData.type || '', // New field
            hashtags: projectData.hashtags || []
          });
        } else {
          setError('Failed to load project');
        }
      } catch (error) {
        setError('Error loading project: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleHashtagsChange = (e) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({
      ...prev,
      hashtags: tags
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const result = await projectsAPI.update(projectId, formData);
      if (result.data && result.data.success) {
        alert('Project updated successfully!');
        navigate(`/project/${projectId}`);
      } else {
        setError(result.data?.message || 'Failed to update project');
      }
    } catch (error) {
      setError('Error updating project: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading project...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!project) return <div className="error">Project not found</div>;

  return (
    <div className="edit-project-page">
      <div className="edit-project-header">
        <h1>Edit Project</h1>
        <button 
          onClick={() => navigate(`/project/${projectId}`)}
          className="back-btn"
        >
          ← Back to Project
        </button>
      </div>

      <form onSubmit={handleSubmit} className="edit-project-form">
        <div className="form-section">
          <h3>Project Details</h3>
          
          <div className="form-group">
            <label htmlFor="name">Project Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter project name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Describe your project..."
            />
          </div>

          {/*Project Type Dropdown */}
          <div className="form-group">
            <label htmlFor="type">Project Type *</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="">Select a project type</option>
              {projectTypes.map(type => (
                <option key={type} value={type}>
                  {type.split('-').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="version">Version</label>
            <input
              type="text"
              id="version"
              name="version"
              value={formData.version}
              onChange={handleChange}
              placeholder="1.0.0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="hashtags">Hashtags (comma-separated)</label>
            <input
              type="text"
              id="hashtags"
              name="hashtags"
              value={formData.hashtags.join(', ')}
              onChange={handleHashtagsChange}
              placeholder="react, nodejs, mongodb"
            />
            <small>Separate tags with commas</small>
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            onClick={() => navigate(`/project/${projectId}`)}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProject;
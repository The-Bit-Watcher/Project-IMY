import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import './ProjectTypeManagement.css';

const ProjectTypeManagement = () => {
  const [types, setTypes] = useState([]);
  const [typeStats, setTypeStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingType, setEditingType] = useState(null);
  const [newType, setNewType] = useState({ name: '', description: '', category: 'development' });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchProjectTypes();
  }, []);

  // Fetch project types
  const fetchProjectTypes = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getProjectTypes();
      console.log('📊 Project types response:', response.data);
      
      if (response.data.success) {
        setTypes(response.data.types);
        fetchTypeStats();
      }
    } catch (error) {
      console.error('❌ Error fetching project types:', error);
      setError('Failed to load project types: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch type statistics
  const fetchTypeStats = async () => {
    try {
      setStatsLoading(true);
      const response = await adminAPI.getProjectTypeStats();
      if (response.data.success) {
        setTypeStats(response.data.types);
      }
    } catch (error) {
      console.error('Error fetching type stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleAddType = async () => {
    if (!newType.name.trim()) {
      alert('Type name is required');
      return;
    }

    try {
      setActionLoading(true);
      const response = await adminAPI.createProjectType(newType);
      if (response.data.success) {
        await fetchProjectTypes();
        setNewType({ name: '', description: '', category: 'development' });
        alert('Project type added successfully');
      }
    } catch (error) {
      console.error('❌ Error adding project type:', error);
      alert(error.response?.data?.message || 'Failed to add project type');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditType = (type) => {
    console.log('✏️ Starting edit for type:', type);
    setEditingType(type);
    setNewType({ 
      name: type.name, 
      description: type.description || '', 
      category: type.category || 'development' 
    });
  };

  const handleUpdateType = async () => {
    if (!editingType || !newType.name.trim()) {
      alert('Type name is required');
      return;
    }

    try {
      setActionLoading(true);
      console.log('🔄 Updating type:', editingType._id, 'with data:', newType);
      
      const response = await adminAPI.updateProjectType(editingType._id, newType);
      console.log('📊 Update response:', response.data);
      
      if (response.data.success) {
        await fetchProjectTypes();
        setEditingType(null);
        setNewType({ name: '', description: '', category: 'development' });
        alert('Project type updated successfully');
      }
    } catch (error) {
      console.error('❌ Error updating project type:', error);
      console.error('❌ Error response:', error.response?.data);
      alert(error.response?.data?.message || 'Failed to update project type');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteType = async (typeId, typeName) => {
    if (window.confirm(`Are you sure you want to delete project type "${typeName}"?`)) {
      try {
        setActionLoading(true);
        const response = await adminAPI.deleteProjectType(typeId);
        if (response.data.success) {
          await fetchProjectTypes();
          alert('Project type deleted successfully');
        }
      } catch (error) {
        console.error('❌ Error deleting project type:', error);
        alert(error.response?.data?.message || 'Failed to delete project type');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const cancelEdit = () => {
    setEditingType(null);
    setNewType({ name: '', description: '', category: 'development' });
  };

  // Format type name for display
  const formatTypeName = (typeName) => {
    return typeName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="project-type-management">
      <div className="admin-header">
        <h1>Project Type Management</h1>
        <p>Manage and customize project types for better organization</p>
      </div>

      {/* Add/Edit Form */}
      <div className="type-form-section">
        <h3>{editingType ? `Edit Project Type: ${editingType.name}` : 'Add New Project Type'}</h3>
        <div className="form-row">
          <input
            type="text"
            placeholder="Type name (e.g., web-application)"
            value={newType.name}
            onChange={(e) => setNewType({ ...newType, name: e.target.value })}
            className="form-input"
            disabled={actionLoading}
          />
          <select
            value={newType.category}
            onChange={(e) => setNewType({ ...newType, category: e.target.value })}
            className="form-select"
            disabled={actionLoading}
          >
            <option value="development">Development</option>
            <option value="design">Design</option>
            <option value="research">Research</option>
            <option value="entertainment">Entertainment</option>
            <option value="education">Education</option>
            <option value="other">Other</option>
          </select>
        </div>
        <textarea
          placeholder="Type description..."
          value={newType.description}
          onChange={(e) => setNewType({ ...newType, description: e.target.value })}
          className="form-textarea"
          rows="3"
          disabled={actionLoading}
        />
        <div className="form-actions">
          {editingType ? (
            <>
              <button 
                onClick={handleUpdateType} 
                className="btn btn-primary"
                disabled={actionLoading}
              >
                {actionLoading ? 'Updating...' : 'Update Type'}
              </button>
              <button 
                onClick={cancelEdit}
                className="btn btn-secondary"
                disabled={actionLoading}
              >
                Cancel
              </button>
            </>
          ) : (
            <button 
              onClick={handleAddType} 
              className="btn btn-primary"
              disabled={actionLoading}
            >
              {actionLoading ? 'Adding...' : 'Add Type'}
            </button>
          )}
        </div>
      </div>

      {/* Type Statistics */}
      <div className="type-stats">
        <h3>Type Statistics</h3>
        {statsLoading ? (
          <div className="loading">Loading statistics...</div>
        ) : (
          <div className="stats-grid">
            {typeStats.map((type, index) => (
              <div key={index} className="stat-card">
                <div className="stat-header">
                  <span className="type-name">{formatTypeName(type.name)}</span>
                  <span className="type-category">{type.category}</span>
                </div>
                <p className="type-description">{type.description}</p>
                <div className="type-count">
                  <strong>{type.projectCount || 0}</strong> projects
                </div>
                {type.isDefault && (
                  <div className="default-badge">Default</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Type Management Table */}
      <div className="types-table">
        <h3>Manage Project Types</h3>
        {loading ? (
          <div className="loading">Loading project types...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <div className="table-container">
            <div className="table-header">
              <div className="col-name">Type Name</div>
              <div className="col-description">Description</div>
              <div className="col-category">Category</div>
              <div className="col-actions">Actions</div>
            </div>

            {types.map((type, index) => (
              <div key={type._id || index} className="table-row">
                <div className="col-name">
                  <code>{type.name}</code>
                  {type.isDefault && (
                    <span className="default-tag">Default</span>
                  )}
                </div>
                <div className="col-description">{type.description}</div>
                <div className="col-category">
                  <span className={`category-badge ${type.category}`}>
                    {type.category}
                  </span>
                </div>
                <div className="col-actions">
                  {!type.isDefault && (
                    <>
                      <button
                        onClick={() => handleEditType(type)}
                        className="btn btn-warning btn-sm"
                        disabled={actionLoading}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteType(type._id, type.name)}
                        className="btn btn-danger btn-sm"
                        disabled={actionLoading}
                      >
                        Delete
                      </button>
                    </>
                  )}
                  {type.isDefault && (
                    <span className="read-only">Default Type</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectTypeManagement;
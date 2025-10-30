import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import './ActivityManagement.css';

const ActivityManagement = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchActivities();
  }, [typeFilter]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = typeFilter !== 'all' ? { type: typeFilter } : {};
      const response = await adminAPI.getActivities(params);
      if (response.data.success) {
        setActivities(response.data.activities);
      }
    } catch (error) {
      setError('Failed to load activities');
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      try {
        await adminAPI.deleteActivity(activityId);
        setActivities(activities.filter(activity => activity._id !== activityId));
        alert('Activity deleted successfully');
      } catch (error) {
        alert('Failed to delete activity');
        console.error('Error deleting activity:', error);
      }
    }
  };

  const getActionIcon = (action) => {
    const icons = {
      'checked in': '🔓',
      'checked out': '🔒',
      'updated': '✏️',
      'commented': '💬',
      'deleted': '🗑️',
      'created': '🆕'
    };
    return icons[action] || '📝';
  };

  return (
    <div className="activity-management">
      <div className="admin-header">
        <h1>Activity Management</h1>
        <p>Manage all platform activities</p>
      </div>

      <div className="filters">
        <select 
          value={typeFilter} 
          onChange={(e) => setTypeFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Activities</option>
          <option value="checked in">Checked In</option>
          <option value="checked out">Checked Out</option>
          <option value="updated">Updated</option>
          <option value="commented">Comments</option>
          <option value="created">Created</option>
          <option value="deleted">Deleted</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading activities...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <div className="activities-list">
          {activities.map(activity => (
            <div key={activity._id} className="activity-item">
              <div className="activity-icon">
                {getActionIcon(activity.action)}
              </div>
              
              <div className="activity-content">
                <div className="activity-header">
                  <span className="user-name">
                    {activity.userId?.name || 'Unknown User'}
                  </span>
                  <span className="action">{activity.action}</span>
                  {activity.projectId && (
                    <span className="project-name">
                      in {activity.projectId.name}
                    </span>
                  )}
                </div>
                
                <p className="activity-message">{activity.message}</p>
                
                <div className="activity-meta">
                  <span className="timestamp">
                    {new Date(activity.timestamp).toLocaleString()}
                  </span>
                  <div className="activity-stats">
                    {activity.likes > 0 && (
                      <span className="likes">❤️ {activity.likes}</span>
                    )}
                    {activity.downloads > 0 && (
                      <span className="downloads">📥 {activity.downloads}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="activity-actions">
                <button
                  onClick={() => handleDeleteActivity(activity._id)}
                  className="btn btn-danger btn-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {activities.length === 0 && (
            <div className="no-results">No activities found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivityManagement;
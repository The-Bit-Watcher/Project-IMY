import React from 'react';
import { Link } from 'react-router-dom';
import './SearchResults.css';

const SearchResults = ({ results, filters, user }) => {
  if (!results) {
    return (
      <div className="search-results-empty">
        <div className="empty-state">
          <h3>Start Searching</h3>
          <p>Enter a search term to find projects, users, and content</p>
        </div>
      </div>
    );
  }

  const { projects = [], users = [], activities = [] } = results;
  const hasResults = projects.length > 0 || users.length > 0 || activities.length > 0;

  if (!hasResults) {
    return (
      <div className="search-results-empty">
        <div className="empty-state">
          <h3>No Results Found</h3>
          <p>Try different search terms or filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="search-results">
      {/* Users Results */}
      {users.length > 0 && (
        <section className="results-section">
          <h3 className="results-section-title">
            Users ({users.length})
          </h3>
          <div className="results-grid">
            {users.map(user => (
              <UserResultCard key={user._id} user={user} />
            ))}
          </div>
        </section>
      )}

      {/* Projects Results */}
      {projects.length > 0 && (
        <section className="results-section">
          <h3 className="results-section-title">
            Projects ({projects.length})
          </h3>
          <div className="results-grid">
            {projects.map(project => (
              <ProjectResultCard key={project._id} project={project} />
            ))}
          </div>
        </section>
      )}

      {/* Activities Results */}
      {activities.length > 0 && (
        <section className="results-section">
          <h3 className="results-section-title">
            Activities ({activities.length})
          </h3>
          <div className="results-list">
            {activities.map(activity => (
              <ActivityResultCard key={activity._id} activity={activity} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// User Result Card Component
const UserResultCard = ({ user }) => {
  return (
    <div className="result-card user-card">
      <Link to={`/profile/${user._id}`} className="card-link">
        <div className="user-avatar">
          {user.profilePic ? (
            <img src={user.profilePic} alt={user.name} />
          ) : (
            <div className="avatar-placeholder">
              {user.name?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="user-info">
          <h4 className="user-name">{user.name}</h4>
          <p className="user-email">{user.email}</p>
          {user.friends && (
            <span className="user-friends">
              {user.friends.length} friends
            </span>
          )}
        </div>
      </Link>
    </div>
  );
};

// Project Result Card Component
const ProjectResultCard = ({ project }) => {
  return (
    <div className="result-card project-card">
      <Link to={`/project/${project._id}`} className="card-link">
        <div className="card-header">
          <h4 className="project-name">{project.name}</h4>
          {project.version && (
            <span className="project-version">v{project.version}</span>
          )}
        </div>
        
        {project.description && (
          <p className="project-description">{project.description}</p>
        )}
        
        {project.hashtags && project.hashtags.length > 0 && (
          <div className="project-tags">
            {project.hashtags.map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        )}
        
        <div className="project-meta">
          <span className="meta-item">
            👤 {project.owner?.name || 'Unknown User'}
          </span>
          {project.files && (
            <span className="meta-item">
              📁 {project.files.length} files
            </span>
          )}
        </div>
      </Link>
    </div>
  );
};

// Activity Result Card Component
const ActivityResultCard = ({ activity }) => {
  return (
    <div className="result-card activity-card">
      <div className="activity-content">
        <p className="activity-text">{activity.message}</p>
        <div className="activity-meta">
          <span className="activity-type">{activity.type}</span>
          <span className="activity-date">
            {new Date(activity.timestamp).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
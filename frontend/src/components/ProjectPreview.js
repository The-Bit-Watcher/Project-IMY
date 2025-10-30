import React from 'react';
import { Link } from 'react-router-dom';

const ProjectPreview = ({ project }) => {
  return (
    <article className="project-preview">
      {project.image && (
        <img 
          src={project.image} 
          alt={project.name}
          className="project-preview-image"
        />
      )}
      <div className="project-preview-content">
        <h3>{project.name}</h3>
        <p className="project-preview-description">
          {project.description}
        </p>
        <div className="project-meta">
          <span>Version: {project.version}</span>
          <span>Type: {project.type || 'General'}</span>
          <span>Last updated: {new Date(project.updatedAt).toLocaleDateString()}</span>
          <span>Files: {project.files?.length || 0}</span>
        </div>
        {project.hashtags && project.hashtags.length > 0 && (
          <div className="project-preview-tags">
            {project.hashtags.slice(0, 3).map((tag, index) => (
              <span key={index} className="tag small">#{tag}</span>
            ))}
            {project.hashtags.length > 3 && (
              <span className="tag-more">+{project.hashtags.length - 3} more</span>
            )}
          </div>
        )}
        <Link to={`/project/${project._id}`} className="view-project-btn">
          View Project Details
        </Link>
      </div>
    </article>
  );
};

export default ProjectPreview;
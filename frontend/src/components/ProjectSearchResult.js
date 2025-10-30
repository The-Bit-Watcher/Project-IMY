import React from 'react';
import { useNavigate } from 'react-router-dom';

const ProjectSearchResult = ({ project }) => {
  const navigate = useNavigate();

  const handleViewProject = () => {
    navigate(`/project/${project._id}`);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="project-search-result" onClick={handleViewProject}>
      <div className="project-header">
        {project.image && (
          <img src={project.image} alt={project.name} className="project-image" />
        )}
        <div className="project-info">
          <h4 className="project-name">{project.name}</h4>
          <p className="project-description">{project.description}</p>
          <div className="project-meta">
            <span className="project-version">Version: {project.version || '1.0.0'}</span>
            <span className="project-updated">
              Updated: {formatDate(project.updatedAt || project.createdAt)}
            </span>
            <span className="project-files">
              Files: {project.files?.length || 0}
            </span>
          </div>
          {project.hashtags && project.hashtags.length > 0 && (
            <div className="project-tags">
              {project.hashtags.map((tag, index) => (
                <span key={index} className="tag">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectSearchResult;
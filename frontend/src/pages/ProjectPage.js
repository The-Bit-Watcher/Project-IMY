import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Project from '../components/Project';
import ProjectActions from '../components/ProjectActions';
import './ProjectPage.css';

const ProjectPage = ({ user }) => {
  const { projectId } = useParams();
  const location = useLocation();
  const [highlightedFile, setHighlightedFile] = useState(null);

  useEffect(() => {
    // Check if we have file highlighting data from navigation
    if (location.state?.highlightFile !== undefined) {
      setHighlightedFile({
        index: location.state.highlightFile,
        name: location.state.fileName
      });
      
      // Clear the location state after using it
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const clearHighlightedFile = () => {
    setHighlightedFile(null);
  };

  return (
    <div className="project-page">
      <div className="project-container">
        <Project 
          projectId={projectId} 
          highlightedFile={highlightedFile}
          onClearHighlight={clearHighlightedFile}
          user={user}
        />
      </div>
      <div className="project-sidebar">
        <ProjectActions projectId={projectId} user={user} />
      </div>
    </div>
  );
};

export default ProjectPage;
import React, { useState, useEffect } from 'react';
import { projectsAPI } from '../services/api';
import './ProfileProjects.css';

const ProfileProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProjects = async () => {
      try {
        console.log('🚀 STARTING ProfileProjects...');
        
        // Get current user
        const userData = localStorage.getItem('user');
        if (!userData) {
          console.log('❌ No user in localStorage');
          setLoading(false);
          return;
        }

        const user = JSON.parse(userData);
        const userId = user.id || user._id;
        console.log('👤 Current user ID:', userId);

        // Get all projects
        console.log('📡 Calling projectsAPI.getAll()...');
        const response = await projectsAPI.getAll();
        console.log('📦 API Response:', response);

        if (response.data && response.data.success) {
          const allProjects = response.data.projects;
          console.log('📊 Total projects from API:', allProjects.length);
          
          // Filter user's projects
          const userProjects = allProjects.filter(project => {
            const isOwner = String(project.owner) === String(userId);
            if (isOwner) {
              console.log('✅ Found user project:', project.name);
            }
            return isOwner;
          });

          console.log('🎯 User projects found:', userProjects.length);
          setProjects(userProjects);
        } else {
          console.log('❌ API response format unexpected:', response);
        }
      } catch (error) {
        console.error('💥 Error fetching projects:', error);
        console.error('Error details:', error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProjects();
  }, []);

  if (loading) return <div className="loading">Loading projects...</div>;

  return (
    <section className="profile-projects">
      <h2>My Projects ({projects.length})</h2>
      
      {projects.length === 0 ? (
        <div className="no-projects">
          <p>You haven't created any projects yet.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{marginTop: '10px', padding: '5px 10px'}}
          >
            Refresh Page
          </button>
        </div>
      ) : (
        <div className="projects-list">
          {projects.map(project => (
            <div key={project._id} className="project-item">
              <h3>{project.name}</h3>
              <p>{project.description}</p>
              <div className="project-meta">
                <span>Version: {project.version}</span>
                <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                {project.hashtags && project.hashtags.length > 0 && (
                  <div className="project-tags">
                    Tags: {project.hashtags.map(tag => `#${tag}`).join(', ')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ProfileProjects;
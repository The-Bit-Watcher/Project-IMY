import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI, usersAPI } from '../services/api';

const TestNavigation = () => {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsResult] = await Promise.all([
          projectsAPI.getAll()
        ]);
        
        if (projectsResult.success) {
          setProjects(projectsResult.projects.slice(0, 2)); // Show first 2 projects
        }
      } catch (error) {
        console.error('Failed to fetch navigation data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading navigation...</div>;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: '#2c3e50',
      padding: '10px',
      zIndex: 1000,
      textAlign: 'center'
    }}>
      <Link to="/" style={{ color: 'white', textDecoration: 'none', margin: '0 10px', padding: '5px 10px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }}>
        Splash
      </Link>
      <Link to="/home" style={{ color: 'white', textDecoration: 'none', margin: '0 10px', padding: '5px 10px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }}>
        Home
      </Link>
      
      {/* Dynamic project links */}
      {projects.map(project => (
        <Link 
          key={project._id}
          to={`/project/${project._id}`} 
          style={{ color: 'white', textDecoration: 'none', margin: '0 10px', padding: '5px 10px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }}
        >
          {project.name}
        </Link>
      ))}
      
      {/* You could also add user profile links if you have sample users */}
      <Link to="/profile/68dce25ab04d85e9dd9be89e" style={{ color: 'white', textDecoration: 'none', margin: '0 10px', padding: '5px 10px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }}>
        My Profile
      </Link>
    </div>
  );
};

export default TestNavigation;
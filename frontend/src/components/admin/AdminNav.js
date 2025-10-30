import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './AdminNav.css';

const AdminNav = () => {
  const location = useLocation();

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/users', label: 'Users', icon: '👥' },
    { path: '/admin/projects', label: 'Projects', icon: '📁' },
    { path: '/admin/project-types', label: 'Project Types', icon: '🏷️' }, 
    { path: '/admin/activities', label: 'Activities', icon: '📝' }
  ];

  return (
    <nav className="admin-nav">
      <div className="admin-nav-header">
        <h3>Admin Panel</h3>
      </div>
      
      <ul className="admin-nav-list">
        {navItems.map(item => (
          <li key={item.path} className="admin-nav-item">
            <Link
              to={item.path}
              className={`admin-nav-link ${
                location.pathname === item.path ? 'active' : ''
              }`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default AdminNav;
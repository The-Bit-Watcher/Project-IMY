import React from 'react';
import AdminNav from './AdminNav';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <AdminNav />
      </div>
      
      <div className="admin-content">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
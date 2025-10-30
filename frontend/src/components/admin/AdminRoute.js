import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ user, children }) => {
  console.log('🔐 AdminRoute - User:', user);
  console.log('🔐 AdminRoute - User isAdmin:', user?.isAdmin);

  if (!user) {
    console.log('❌ AdminRoute - No user, redirecting to login');
    return <Navigate to="/home" replace />;
  }

  if (!user.isAdmin) {
    console.log('❌ AdminRoute - Not admin, redirecting to home');
    return <Navigate to="/home" replace />;
  }

  console.log('✅ AdminRoute - Access granted to admin');
  return children;
};

export default AdminRoute;
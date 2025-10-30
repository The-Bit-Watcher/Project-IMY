import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ProfileBreadcrumbs.css';

const ProfileBreadcrumbs = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();

  // If we're viewing someone else's profile, show breadcrumbs
  if (!userId || userId === currentUser?.id) {
    return null;
  }

  return (
    <nav className="profile-breadcrumbs">
      <Link to="/profile">
        <span>My Profile</span>
      </Link>
      <span>→</span>
      <span>Viewing Profile</span>
    </nav>
  );
};

export default ProfileBreadcrumbs;
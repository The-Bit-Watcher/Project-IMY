import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 20,
        search: searchTerm
      };
      const response = await adminAPI.getUsers(params);
      if (response.data.success) {
        setUsers(response.data.users);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      setError('Failed to load users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      try {
        await adminAPI.deleteUser(userId);
        setUsers(users.filter(user => user._id !== userId));
        alert('User deleted successfully');
      } catch (error) {
        alert('Failed to delete user');
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleMakeAdmin = async (userId, userName) => {
    if (window.confirm(`Grant admin privileges to "${userName}"?`)) {
      try {
        await adminAPI.makeAdmin(userId);
        fetchUsers(); // Refresh the list
        alert('Admin privileges granted successfully');
      } catch (error) {
        alert('Failed to grant admin privileges');
        console.error('Error making user admin:', error);
      }
    }
  };

  const handleRemoveAdmin = async (userId, userName) => {
    if (window.confirm(`Remove admin privileges from "${userName}"?`)) {
      try {
        await adminAPI.removeAdmin(userId);
        fetchUsers(); // Refresh the list
        alert('Admin privileges removed successfully');
      } catch (error) {
        alert('Failed to remove admin privileges');
        console.error('Error removing admin:', error);
      }
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="user-management">
      <div className="admin-header">
        <h1>User Management</h1>
        <p>Manage all users in the system</p>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      {loading ? (
        <div className="loading">Loading users...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <>
          <div className="users-table">
            <div className="table-header">
              <div className="col-name">Name</div>
              <div className="col-email">Email</div>
              <div className="col-joined">Joined</div>
              <div className="col-status">Status</div>
              <div className="col-actions">Actions</div>
            </div>

            {users.map(user => (
              <div key={user._id} className="table-row">
                <div className="col-name">
                  <div className="user-avatar">
                    {user.profilePic ? (
                      <img src={user.profilePic} alt={user.name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span>{user.name}</span>
                </div>
                <div className="col-email">{user.email}</div>
                <div className="col-joined">
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
                <div className="col-status">
                  <span className={`status-badge ${user.isAdmin ? 'admin' : 'user'}`}>
                    {user.isAdmin ? 'Admin' : 'User'}
                  </span>
                </div>
                <div className="col-actions">
                  {user.isAdmin ? (
                    <button
                      onClick={() => handleRemoveAdmin(user._id, user.name)}
                      className="btn btn-warning"
                    >
                      Remove Admin
                    </button>
                  ) : (
                    <button
                      onClick={() => handleMakeAdmin(user._id, user.name)}
                      className="btn btn-success"
                    >
                      Make Admin
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteUser(user._id, user.name)}
                    className="btn btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {users.length === 0 && (
            <div className="no-results">No users found</div>
          )}

          <div className="pagination">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              Previous
            </button>
            <span className="page-info">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UserManagement;
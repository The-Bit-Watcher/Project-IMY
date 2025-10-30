import React from 'react';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import SplashPage from './pages/SplashPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import ProjectPage from './pages/ProjectPage';
import LoginForm from './components/LoginForm';
import Header from './components/Header';
import SearchPage from './pages/SearchPage';
import CreateProject from "./components/CreateProject";
import {userAPI, authAPI} from './services/api';
import EditProject from './components/EditProject';
import './styles.css';
import FriendRequests from './components/FriendRequests';

//Admin Components
import AdminRoute from './components/admin/AdminRoute';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import UserManagement from './components/admin/UserManagement';
import ProjectManagement from './components/admin/ProjectManagement';
import ActivityManagement from './components/admin/ActivityManagement';
import ProjectTypeManagement from './components/admin/ProjectTypeManagement';

function App() {
  const [user, setUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);

    useEffect(() => {
    const checkUser = async () => {
      try {
        console.log('🔍 App.js - Checking user authentication via /users/me...');
        
        // ONLY use users/me endpoint
        const response = await userAPI.getCurrentUser();
        
        if (response.data.success) {
          console.log('✅ App.js - User authenticated:', response.data.user);
          console.log('👑 App.js - User isAdmin:', response.data.user.isAdmin);
          setUser(response.data.user);
        } else {
          console.log('❌ App.js - User not authenticated');
          setUser(null);
        }
      } catch (error) {
        console.log('❌ App.js - Authentication check failed:', error.message);
        setUser(null);
      } finally {
        setCheckingUser(false); 
      }
    };
    checkUser();
  }, []);


  const handleLogin = (userData) => {
    console.log('🔍 App.js - handleLogin called with:', userData);
    console.log('👑 App.js - handleLogin isAdmin:', userData.isAdmin);
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user'); // Clear localStorage on logout
  };

  if (checkingUser) {
    return <div>Loading...</div>;
  }

  return (
    <ThemeProvider> {/* Wrap everything with ThemeProvider */}
      <Router>
        <div className="App">
          <Routes>
            {/* Pass onLogin to SplashPage */}
            <Route path="/" element={<SplashPage onLogin={handleLogin} />} />
            <Route path="/login" element={<LoginForm onLogin={handleLogin} />} />
            
            {/* Protected routes */}
            <Route
              path="/*"
              element={user ? <MainLayout user={user} onLogout={handleLogout} /> : <Navigate to="/" />}
            />
            <Route path="/friend-requests" element={<FriendRequests />} />
            <Route path="/admin/project-types" element={<AdminRoute user={user}><AdminLayout><ProjectTypeManagement/></AdminLayout></AdminRoute>}/>
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

function MainLayout({ user, onLogout }) {
  return (
    <>
      <Header user={user} onLogout={onLogout} />
      <Routes>
        <Route path="/home" element={<HomePage user={user} />} />
        <Route path="/project/:projectId" element={<ProjectPage user={user} />} />
        <Route path="/search" element={<SearchPage user={user} />} />
        <Route path="/profile" element={<ProfilePage user={user} />} />
        <Route path="/profile/:userId" element={<ProfilePage user={user} />} />
        <Route path="/projects/create" element={<CreateProject user={user} />} />
        <Route path="/projects/edit/:projectId" element={<EditProject />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <AdminRoute user={user}>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/users" element={
          <AdminRoute user={user}>
            <AdminLayout>
              <UserManagement />
            </AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/projects" element={
          <AdminRoute user={user}>
            <AdminLayout>
              <ProjectManagement />
            </AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/activities" element={
          <AdminRoute user={user}>
            <AdminLayout>
              <ActivityManagement />
            </AdminLayout>
          </AdminRoute>
        } />
        
        {/* Redirect to home for any unmatched routes */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </>
  );
}

export default App;
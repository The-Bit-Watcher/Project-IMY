import React, { useState } from 'react';
import { authAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import './LoginForm.css'; 

const LoginForm = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false); 
  const navigate = useNavigate(); 

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setErrors({});
  
  console.log('🔐 FORM DATA:', formData); // Debug: Check full form data
  console.log('🔐 Password length:', formData.password ? formData.password.length : 'none'); // Debug password
  
  if (!validateForm()) {
    console.log('❌ Form validation failed');
    return;
  }

  setIsLoading(true);

  try {
    console.log('🔐 Attempting login with:', { 
      email: formData.email, 
      password: formData.password,
      passwordLength: formData.password.length 
    });
    
    const result = await authAPI.login({ 
      email: formData.email, 
      password: formData.password 
    });

    console.log('🔍 FULL API RESPONSE:', result);
    
    // Check if response has the expected structure
    if (result.data && result.data.success) {
      console.log('✅ Login successful - User object:', result.data.user);
      console.log('👑 User isAdmin:', result.data.user?.isAdmin);
      
      if (onLogin) {
        onLogin(result.data.user);
      }
      navigate('/home');
    } else {
      // Handle different response structures
      const errorMessage = result.data?.message || 'Login failed. Please check your credentials.';
      setErrors({ submit: errorMessage });
      console.error('❌ Login failed:', result.data);
    }      
  } catch(error) {
    console.error('❌ Login error:', error);
    console.error('❌ Error details:', error.response); // Additional debug
    
    let errorMessage = 'Login failed. Please try again.';
    
    if (error.message.includes('JSON')) {
      errorMessage = 'Server error - invalid response. Please try again.';
    } else if (error.message.includes('401')) {
      errorMessage = 'Invalid email or password.';
    } else if (error.message.includes('Network')) {
      errorMessage = 'Network error. Please check if the server is running.';
    }
    
    setErrors({ submit: errorMessage });
  } finally {
    setIsLoading(false);
  }
};
  return (
    <div className="form-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={errors.email ? 'error' : ''}
            disabled={isLoading}
            required
            autoComplete="email"
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={errors.password ? 'error' : ''}
            disabled={isLoading}
            required
            autoComplete="current-password"
          />
          {errors.password && <span className="error-text">{errors.password}</span>}
        </div>
        
        {errors.submit && <div className="error-text submit-error">{errors.submit}</div>}
        
        <button 
          type="submit" 
          className="submit-btn" 
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
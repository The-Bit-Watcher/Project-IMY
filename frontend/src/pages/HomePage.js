import React, { useEffect, useState } from 'react';
import Feed from '../components/Feed';
import './HomePage.css'

const HomePage = () => {
  const [activeFeed, setActiveFeed] = useState('local');
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  return (
    <div className="home-page">
      <div className="home-header">
        <h1>Activity Feed</h1>
      </div>

      <div className="feed-tabs">
        <button 
          className={`tab ${activeFeed === 'local' ? 'active' : ''}`}
          onClick={() => setActiveFeed('local')}>
          Local Activity
        </button>
        <button 
          className={`tab ${activeFeed === 'global' ? 'active' : ''}`}
          onClick={() => setActiveFeed('global')}>
          Global Activity
        </button>
      </div>

      <Feed type={activeFeed} />
    </div>
  );
};

export default HomePage;
import React, { useState } from 'react';
import Feed from './Feed';
import './FeedContainer.css';

const FeedContainer = () => {
  const [activeFeed, setActiveFeed] = useState('local');
  const [sortBy, setSortBy] = useState('recent');

  return (
    <div className="feed-container">
      <div className="feed-header">
        <h2>Activity Feed</h2>
        
        {/* Feed Type Tabs */}
        <div className="feed-tabs">
          <button 
            className={`tab ${activeFeed === 'local' ? 'active' : ''}`}
            onClick={() => setActiveFeed('local')}
          >
            Local Activity
          </button>
          <button 
            className={`tab ${activeFeed === 'global' ? 'active' : ''}`}
            onClick={() => setActiveFeed('global')}
          >
            Global Activity
          </button>
        </div>

        {/* Sort Options */}
        <div className="sort-options">
          <label>Sort by:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Feed Content */}
      <div className="feed-content">
        <Feed type={activeFeed} />
      </div>
    </div>
  );
};

export default FeedContainer;
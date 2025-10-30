import React, { useEffect, useState } from 'react';
import { activityAPI } from '../services/api';
import ActivityItem from './ActivityItem';
import './Feed.css';

const Feed = ({ type }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchActivities = async () => {
  try {
    setLoading(true);
    setError('');
    
    let result;
    if (type === 'global') {
      result = await activityAPI.getGlobalFeed();
    } else if (type === 'local') {
      result = await activityAPI.getLocalFeed();
    } else {
      result = await api.get(`/activity/${type}`);
    }
    
    console.log('📊 Feed response:', result.data);
    
    if (result.data && result.data.success) {
      // Handle different response formats
      if (result.data.activities) {
        // Local feed returns activities
        console.log('✅ Using activities from local feed:', result.data.activities.length);
        setActivities(result.data.activities);
      } else if (result.data.files) {
        // Global feed returns files - convert to activity format
        console.log('✅ Converting files to activities from global feed:', result.data.files.length);
        const fileActivities = result.data.files.map(file => ({
          _id: file._id,
          message: `Uploaded file: ${file.fileName}`,
          action: 'uploaded',
          timestamp: file.uploadDate,
          userId: {
            _id: file.ownerId || 'unknown',
            name: file.ownerName || 'Unknown User',
            profilePic: file.ownerAvatar
          },
          projectId: {
            _id: file.projectId,
            name: file.projectName,
            image: file.projectImage
          }
        }));
        setActivities(fileActivities);
      } else {
        console.log('❌ No activities or files found in response');
        setActivities([]);
      }
    } else {
      setError(result.data?.message || 'Failed to load activities');
      setActivities([]);
    }
  } catch (error) {
    console.error('❌ Error fetching activities:', error);
    if (error.response?.status === 401) {
      console.log('👤 No authentication for local feed - showing empty');
      setActivities([]);
    } else {
      setError('Error fetching activities: ' + error.message);
    }
    setActivities([]);
  } finally {
    setLoading(false);
  }
};
    fetchActivities();
  }, [type]);

  //Log what we're about to render
  console.log('🎯 Activities to render:', activities);

  if (loading) return <div className="feed-loading">Loading activities...</div>;
  if (error && activities.length === 0) return <div className="feed-error">Error: {error}</div>;
  
  if (activities.length === 0) {
    return (
      <div className="feed-empty">
        {type === 'local' ? (
          <>
            <h3>No Local Activities</h3>
            <p>Your local feed shows activities from your projects and your friends' projects.</p>
            <p>Try the Global feed to see all activities, or create some projects and add friends!</p>
          </>
        ) : (
          <p>No activities found.</p>
        )}
      </div>
    );
  }

  return (
    <div className="feed">
      {activities.map((activity, index) => (
        <ActivityItem 
          key={activity._id || `activity-${index}`} 
          activity={activity} 
        />
      ))}
    </div>
  );
};

export default Feed;
import React, { useState, useEffect } from 'react';
import { activityAPI } from '../services/api';

const Messages = ({ projectId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const result = await activityAPI.getGlobal();
        if (result.success) {
          setActivities(result.activities);
        }
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  if (loading) return <div>Loading activities...</div>;

  return (
    <section className="messages">
      <h2>Recent Activity</h2>
      <ul>
        {activities.map(activity => (
          <li key={activity._id}>
            <span>{activity.user} {activity.message}</span>
            <span className="timestamp">
              {new Date(activity.timestamp).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default Messages;
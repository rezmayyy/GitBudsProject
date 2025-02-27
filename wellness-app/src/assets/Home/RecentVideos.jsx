// RecentVideos.jsx
import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../Firebase';
import { Link } from 'react-router-dom';
import '../../styles/Videos.css';

const RecentVideos = () => {
  const [videos, setVideos] = useState([]);
  const [visibleVideos, setVisibleVideos] = useState(4);

  useEffect(() => {
    const fetchRecentVideos = async () => {
      try {
        // Create a query to get approved video posts ordered by timestamp descending.
        const videosRef = collection(db, 'content-posts');
        const q = query(
          videosRef,
          where('status', '==', 'approved'),
          where('type', '==', 'video'),
          orderBy('timestamp', 'desc'),
          limit(10)
        );
        const querySnapshot = await getDocs(q);
        const fetchedVideos = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            url: data.fileURL,
            thumbnail: data.thumbnailURL, // Assumes a thumbnailURL field exists
            likes: Array.isArray(data.likes) ? data.likes.length : 0,
            views: typeof data.views === 'number' ? data.views : 0,
            author: data.author // The displayName of the author
          };
        });
        setVideos(fetchedVideos);
      } catch (error) {
        console.error("Error fetching recent videos: ", error);
      }
    };

    fetchRecentVideos();
  }, []);

  return (
    <div className="video-container">
      <h2 className="section-title">Recent Videos</h2>
      <div className="video-grid">
        {videos.length > 0 ? (
          videos.slice(0, visibleVideos).map(video => (
            <div key={video.id} className="video-card">
              {/* Title as a hyperlink to the content post */}
              <a href={`/content/${video.id}`} className="video-title">
                {video.title}
              </a>
              {/* Thumbnail or a placeholder */}
              {video.thumbnail ? (
                <img src={video.thumbnail} alt={video.title} className="video-thumbnail" />
              ) : (
                <div className="no-thumbnail">No Thumbnail</div>
              )}
              {/* Stats: Likes and Views */}
              <div className="video-stats">
                <span>{video.likes} Likes</span>
                <span>{video.views} Views</span>
              </div>
              {/* Author as a link to their profile */}
              <div className="video-author">
                <Link to={`/profile/${video.author}`}>{video.author}</Link>
              </div>
            </div>
          ))
        ) : (
          <p>No recent videos available.</p>
        )}
      </div>
      {visibleVideos < videos.length && (
        <button className="load-btn" onClick={() => setVisibleVideos(visibleVideos + 4)}>
          Load More
        </button>
      )}
    </div>
  );
};

export default RecentVideos;

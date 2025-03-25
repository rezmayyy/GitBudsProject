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
            thumbnail: data.thumbnailURL,
            likes: Array.isArray(data.likes) ? data.likes.length : 0,
            views: typeof data.views === 'number' ? data.views : 0,
            author: data.author
          };
        });
        setVideos(fetchedVideos);
      } catch (error) {
        console.error("Error fetching recent videos: ", error);
      }
    };

    fetchRecentVideos();
  }, []);

  const handleLoadMore = () => {
    setVisibleVideos(prev => prev + 4);
  };

  return (
    <div className="video-container">
      <h2 className="section-title">Recent Videos</h2>
      <div className="video-grid">
        {videos.length > 0 ? (
          videos.slice(0, visibleVideos).map(video => (
            <div key={video.id} className="video-card">
              <a href={`/content/${video.id}`} className="video-title">
                {video.title}
              </a>
              {video.thumbnail ? (
                <img src={video.thumbnail} alt={video.title} className="video-thumbnail" />
              ) : (
                <div className="no-thumbnail">No Thumbnail</div>
              )}
              <div className="video-stats">
                <span>{video.likes} Likes</span>
                <span>{video.views} Views</span>
              </div>
              <div className="video-author">
                <Link to={`/profile/${video.author}`}>{video.author}</Link>
              </div>
            </div>
          ))
        ) : (
          <p>No recent videos available.</p>
        )}
      </div>
      {/* Only show the Load More button if there are more videos to load */}
      {visibleVideos < videos.length && (
        <div className="load-more-container">
          <button className="load-more-btn" onClick={handleLoadMore}>
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentVideos;
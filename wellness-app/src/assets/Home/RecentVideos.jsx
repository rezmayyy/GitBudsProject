import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../Firebase';
import { Link } from 'react-router-dom';
import '../../styles/Videos.css';
import { getUserById } from '../../Utils/firebaseUtils';
import dummyPic from '../dummyPic.jpeg';

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

        const enrichedVideos = await Promise.all(
          querySnapshot.docs.map(async docSnap => {
            const data = docSnap.data();
            const authorId = data.userId;
            const user = await getUserById(authorId);

            // Fetch likes subcollection
            const likesSnap = await getDocs(collection(db, 'content-posts', docSnap.id, 'likes'));
            const likeCount = likesSnap.size;

            return {
              id: docSnap.id,
              title: data.title,
              url: data.fileURL,
              thumbnail: data.thumbnailURL,
              likes: likeCount,
              views: typeof data.views === 'number' ? data.views : 0,
              authorName: user?.displayName || 'Unknown User',
              authorPic: user?.profilePicUrl || dummyPic,
            };
          })
        );

        setVideos(enrichedVideos);
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
      <div className="video-grid">
        {videos.length > 0 ? (
          videos.slice(0, visibleVideos).map(video => (
            <div key={video.id} className="video-card">
              <a href={`/content/${video.id}`} className="video-title">{video.title}</a>
              {video.thumbnail ? (
                <img src={video.thumbnail} alt={video.title} className="video-thumbnail" />
              ) : (
                <div className="no-thumbnail">No Thumbnail</div>
              )}
              <div className="video-stats">
                <span>{video.likes} Likes</span>
                <span>{video.views} Views</span>
              </div>
              <div className="video-author" style={{ display: 'flex', alignItems: 'center' }}>
                <img
                  src={video.authorPic}
                  alt={video.authorName}
                  style={{ width: '25px', height: '25px', borderRadius: '50%', marginRight: '8px' }}
                  onError={(e) => { e.target.src = dummyPic; }}
                />
                <Link to={`/profile/${video.authorName}`}>{video.authorName}</Link>
              </div>
            </div>
          ))
        ) : (
          <p>No recent videos available.</p>
        )}
      </div>

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

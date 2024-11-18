import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../Firebase';
import '../../styles/Audio.css';

function UserAudio() {
    const [UserAudio, setUserAudio] = useState([]);
    const { username } = useParams(); // Get the dynamic username from the URL

    useEffect(() => {
        const fetchUserAudio = async () => {
            const q = query(
                collection(db, 'content-posts'),
                where('type', '==', 'audio'), 
                where('author', '==', username),
                orderBy('timestamp', 'desc'),
            );

            const querySnapshot = await getDocs(q);
            const audio = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    title: data.title,
                    url: data.fileURL
                };
            });
            setUserAudio(audio);
        };

        fetchUserAudio();
    }, []);

    return (
        <div className="userAudio">
            <div className="audio-list">
                {UserAudio.length > 0 ? (
                    UserAudio.map(audio => (
                        <div key={audio.id} className="audio-item">
                            <h3>{audio.title}</h3>
                            <audio width="320" height="240" controls>
                                <source src={audio.url} type="audio/mp3" />
                                Your browser does not support the audio tag.
                                <p>Audio is not available. Please check the URL.</p>
                            </audio>
                        </div>
                    ))
                ) : (
                    <p>No audio available.</p>
                )}
            </div>
        </div>
    );
}

export default UserAudio;

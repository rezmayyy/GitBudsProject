import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logo from '../TribeWellLogo.png';
import { getUserIdByDisplayName } from '../../Utils/firebaseUtils';

function ContentSection({ id, title, content }) {
    const [userIds, setUserIds] = useState({});

    useEffect(() => {
        const fetchUserIds = async () => {
            const newUserIds = {};
            for (let item of content) {
                newUserIds[item.author] = await getUserIdByDisplayName(item.author);
            }
            setUserIds(newUserIds); // Update state
        };

        fetchUserIds();
    }, [content]);

    return (
        <div className="content-section" id={id}>
            <h2>{title}</h2>
            <div className="content-list">
                {content.map(item => {
                    const uid = userIds[item.author];
                    return (
                        <div key={item.id} className="content-item">
                            <Link to={`/content/${item.id}`}>
                                <img src={item.thumbnailURL || logo} alt={item.title} />
                                <h3>{item.title}</h3>
                                <div><Link to={`/profile/${item.author}`}>{item.author}</Link></div>
                            </Link>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default ContentSection;

import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../Logo.png';

function ContentSection({ id, title, content }) {
    return (
        <div className="content-section" id={id}>
            <h2>{title}</h2>
            <div className="content-list">
                {content.map(item => (
                    <div key={item.id} className="content-item">
                        <Link to={`/content/${item.id}`}>
                            <img src={item.thumbnailURL || logo} alt={item.title} />
                            <h3>{item.title}</h3>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ContentSection;

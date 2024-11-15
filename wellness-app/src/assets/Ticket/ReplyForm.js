import React, { useState } from 'react';
import styles from '../../styles/TicketList.module.css';

function ReplyForm({ onAddReply }) {
    const [replyText, setReplyText] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onAddReply(replyText);
        setReplyText('');
    };

    return (
        <form onSubmit={handleSubmit} className={styles.replyForm}>
            <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Add a reply..."
                required
            />
            <button type="submit">Reply</button>
        </form>
    );
}

export default ReplyForm;

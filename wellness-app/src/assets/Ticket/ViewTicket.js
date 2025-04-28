import React, { useEffect, useState, useContext } from 'react';
import { db } from '../Firebase';
import UserContext from '../UserContext';
import { collection, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import styles from './TicketList.module.css';

function ViewTicket({ ticketId, onBack }) {
    const [replies, setReplies] = useState([]);
    const [replyText, setReplyText] = useState('');
    const [ticket, setTicket] = useState(null);
    const { user } = useContext(UserContext);

    // Fetch ticket info and replies
    const fetchTicketData = async () => {
        try {
            // Load ticket document
            const ticketRef = doc(db, 'tickets', ticketId);
            const ticketDoc = await getDoc(ticketRef);
            if (!ticketDoc.exists()) {
                console.error('Ticket not found');
                return;
            }
            // Prepare ticket data
            const data = { id: ticketDoc.id, ...ticketDoc.data() };
            data.createdAt = data.createdAt.toDate().toLocaleString();

            // Fetch author display name
            try {
                const userSnap = await getDoc(doc(db, 'users', data.userId));
                data.displayName = userSnap.exists()
                    ? userSnap.data().displayName || 'Unknown'
                    : 'Unknown';
            } catch (err) {
                console.error('Error fetching ticket author:', err);
                data.displayName = 'Unknown';
            }

            setTicket(data);

            // Load and sort replies by timestamp descending
            const repliesSnap = await getDocs(collection(db, `tickets/${ticketId}/ticketReplies`));
            const raw = repliesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            raw.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
            const formatted = raw.map(r => ({
                ...r,
                createdAt: r.createdAt.toDate().toLocaleString(),
            }));
            setReplies(formatted);
        } catch (error) {
            console.error('Error fetching ticket data:', error);
        }
    };

    useEffect(() => {
        fetchTicketData();
    }, [ticketId]);

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!user) return;
        try {
            const replyData = {
                userId: user.uid,
                displayName: user.displayName || 'Unknown',
                replyText: replyText.trim(),
                createdAt: new Date(),
            };
            await addDoc(
                collection(db, `tickets/${ticketId}/ticketReplies`),
                replyData
            );
            setReplyText('');
            fetchTicketData();
        } catch (error) {
            console.error('Error adding reply:', error);
        }
    };

    return (
        <div className={styles.ticketViewContainer}>
            {ticket && (
                <>
                    <button className={styles.backButton} onClick={onBack}>Back</button>

                    <div className={styles.ticketInfo}>
                        <p><strong>Submitted By:</strong> {ticket.displayName}</p>
                        {(user?.role === 'admin' || user?.role === 'moderator') && (
                            <>
                                <p><strong>User ID:</strong> {ticket.userId}</p>
                                <p>
                                    <strong>User Profile:</strong>{' '}
                                    <a
                                        href={`/profile/${ticket.userId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        View Profile
                                    </a>
                                </p>
                            </>
                        )}
                        <p><strong>Assigned Staff:</strong> {ticket.staffName || 'Unassigned'}</p>
                        <p className={styles.ticketSubmittedDate}>
                            <strong>Submitted On:</strong> {ticket.createdAt}
                        </p>
                    </div>

                    <div className={styles.ticketContentBox}>
                        <div className={styles.ticketTitle}>
                            <strong>Title</strong>
                            <p>{ticket.title}</p>
                        </div>
                        <hr className={styles.divider} />
                        <div className={styles.ticketDescription}>
                            <strong>Description</strong>
                            <p>{ticket.description}</p>
                        </div>
                    </div>
                </>
            )}

            <div className={styles.replyList}>
                <h4 style={{ marginBottom: '10px' }}>Replies</h4>
                {replies.length > 0 ? (
                    replies.map(reply => (
                        <div className={styles.replyItem} key={reply.id}>
                            <p><strong>{reply.displayName}</strong></p>
                            <p>{reply.replyText}</p>
                            <p className={styles.ticketSubmittedDate}>{reply.createdAt}</p>
                        </div>
                    ))
                ) : (
                    <p>No replies yet.</p>
                )}
            </div>

            <form onSubmit={handleReplySubmit} className={styles.replyForm}>
                <textarea
                    className={styles.replyTextArea}
                    placeholder="Add a reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    required
                />
                <button type="submit" className={styles.button}>Reply</button>
            </form>
        </div>
    );
}

export default ViewTicket;

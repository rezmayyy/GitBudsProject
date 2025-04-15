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

    // Fetch replies and ticket information for the specific ticket
    const fetchTicketData = async () => {
        try {
            const ticketRef = doc(db, 'tickets', ticketId);
            const ticketDoc = await getDoc(ticketRef);

            if (ticketDoc.exists()) {
                const ticketData = { id: ticketDoc.id, ...ticketDoc.data() };
                // Ensure createdAt is a Date object for formatting
                ticketData.createdAt = ticketData.createdAt.toDate().toLocaleString();
                setTicket(ticketData);
            } else {
                console.error("Ticket not found");
            }

            const repliesSnapshot = await getDocs(collection(db, `tickets/${ticketId}/ticketReplies`));
            const repliesData = repliesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt.toDate().toLocaleString(),
            }));
            setReplies(repliesData);
        } catch (error) {
            console.error("Error fetching ticket data:", error);
        }
    };

    useEffect(() => {
        fetchTicketData().catch(console.error);
    }, [ticketId]);

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        try {
            const replyData = {
                userId: user.uid,
                displayName: user.displayName,
                replyText: replyText.trim(),
                createdAt: new Date(), // Use JavaScript's Date object
            };
            await addDoc(collection(db, `tickets/${ticketId}/ticketReplies`), replyData);
            setReplyText(''); // Reset reply text
            fetchTicketData(); // Refresh replies after adding a new one
        } catch (error) {
            console.error("Error adding reply:", error);
        }
    };

    return (
        <div className={styles.ticketViewContainer}>
            {ticket && (
                <>
                    <button className={styles.backButton} onClick={onBack}>Back</button>

                    {/* Ticket Meta Info */}
                    <div className={styles.ticketInfo}>
                        <p><strong>Submitted By:</strong> {ticket.displayName}</p>
                        {(user?.role === 'admin' || user?.role === 'moderator') && (
                            <>
                                <p><strong>User ID:</strong> {ticket.userId}</p>
                                <p>
                                    <strong>User Profile:</strong>{' '}
                                    <a href={`/profile/${ticket.userId}`} target="_blank" rel="noopener noreferrer">
                                        View Profile
                                    </a>
                                </p>
                            </>
                        )}
                        <p><strong>Assigned Staff:</strong> {ticket.staffName || "Unassigned"}</p>
                        <p className={styles.ticketSubmittedDate}><strong>Submitted On:</strong> {ticket.createdAt}</p>
                    </div>

                    {/* Ticket Title and Description */}
                    <div className={styles.ticketContentBox}>
                        <div className={styles.ticketTitle}><strong>Title</strong><p>{ticket.title}</p></div>
                        <hr className={styles.divider} />
                        <div className={styles.ticketDescription}><strong>Description</strong><p>{ticket.description}</p></div>
                    </div>
                </>
            )}

            {/* Replies Section */}
            <div className={styles.replyList}>
                <h4 style={{ marginBottom: "10px" }}>Replies</h4>
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

            {/* Reply Form */}
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

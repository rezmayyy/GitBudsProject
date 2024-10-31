import React, { useEffect, useState, useContext } from 'react';
import { db } from '../Firebase';
import UserContext from '../UserContext';
import { collection, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import styles from '../../styles/TicketList.module.css';

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
        fetchTicketData(); // Fetch ticket and replies when the component mounts
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
                <div className={styles.ticketViewContainer}>
                <button className={styles.backButton} onClick={onBack}>Back</button>
                <div className={styles.ticketInfo}>
                    <p>Submitted By: {ticket.displayName}</p>
                    <p>Assigned Staff: {ticket.staffName}</p>                  
                </div>
                <div className={styles.ticketInfo}>
                    <h3 className={styles.ticketViewTitle}>{ticket.title}</h3>                    
                </div>
                <div className={styles.ticketDescription}>
                    {ticket.description}
                    <p className={styles.ticketSubmittedDate}>Submitted On: {ticket.createdAt}</p>
                </div>
                
            </div>
            )}
            <div className={styles.replyList}>
                {replies.length > 0 ? (
                    replies.map(reply => (
                        <div className={styles.replyItem} key={reply.id}>
                            <p><strong>{reply.displayName}</strong>: {reply.replyText}</p>
                            <p className={styles.ticketSubmittedDate}>{reply.createdAt}</p>
                        </div>
                    ))
                ) : (
                    <p>No replies yet.</p>
                )}
            </div>
            <form onSubmit={handleReplySubmit}>
                <textarea className={styles.replyTextArea}
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

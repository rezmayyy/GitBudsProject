import React, { useState, useContext } from 'react';
import { db } from '../Firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import UserContext from '../UserContext'; // Import UserContext
import styles from '../../styles/CreateTicket.module.css';

function CreateTicket() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const { user } = useContext(UserContext); // Get the user context

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const ticketData = {
            title,
            description,
            createdAt: Timestamp.now(), // Use Firestore's Timestamp
            status: 'pending', // Set status to pending on creation
            userId: user.uid, // Attach the user ID
            displayName: user.displayName, // Attach the user display name
            category: user.role === 'VIP' ? 'VIP' : user.role === 'Premium' ? 'Premium' : 'normal'
        };
        await addDoc(collection(db, 'tickets'), ticketData);
        // Handle success (reset form or show message)
        setTitle(''); // Reset title
        setDescription(''); // Reset description
    } catch (error) {
        console.error('Error creating ticket:', error);
  }
};

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Ticket Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required // Ensure title is required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required // Ensure description is required
        />
        <button type="submit">Create Ticket</button>
      </form>
    </div>
  );
}

export default CreateTicket;

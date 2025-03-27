import React, { useState, useContext } from 'react';
import { functions } from '../Firebase';
import { httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import UserContext from '../UserContext'; // Import UserContext
import styles from './CreateTicket.module.css';

function CreateTicket({ onCancel, onSubmitted }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const { user } = useContext(UserContext); // Get the user context

  if (process.env.REACT_APP_USE_EMULATOR === "true") {
    connectFunctionsEmulator(functions, "localhost", 5001);
  }

  const createTicket = httpsCallable(functions, 'createTicket');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await createTicket({ title, description });
      // Reset the form and notify the user on success.
      setTitle('');
      setDescription('');
      if (onSubmitted) onSubmitted();
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
  };

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelButton}
          >
            Cancel
          </button>
        )}
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

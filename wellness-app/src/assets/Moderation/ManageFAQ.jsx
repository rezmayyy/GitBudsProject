import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../Firebase';
import styles from '../../styles/ModDashboard.module.css';

const ManageFAQ = () => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Fetch FAQ data from Firestore on component mount
  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const faqDocRef = doc(db, "adminSettings", "FAQ");
        const faqDocSnap = await getDoc(faqDocRef);
        if (faqDocSnap.exists()) {
          const data = faqDocSnap.data();
          const qs = data.Questions || [];
          const ans = data.Answers || [];
          setQuestions(qs);
          setAnswers(ans);
        } else {
          console.error("No FAQ document found in adminSettings.");
        }
      } catch (error) {
        console.error("Error fetching FAQs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  // Handler to update a question at a given index
  const handleQuestionChange = (index, value) => {
    const newQs = [...questions];
    newQs[index] = value;
    setQuestions(newQs);
  };

  // Handler to update an answer at a given index
  const handleAnswerChange = (index, value) => {
    const newAns = [...answers];
    newAns[index] = value;
    setAnswers(newAns);
  };

  // Add a new FAQ pair (both question and answer empty)
  const addFAQPair = () => {
    setQuestions(prev => [...prev, ""]);
    setAnswers(prev => [...prev, ""]);
  };

  // Remove a FAQ pair at a given index
  const removeFAQPair = (index) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
    setAnswers(prev => prev.filter((_, i) => i !== index));
  };

  // Move a FAQ pair up by swapping with the previous pair
  const movePairUp = (index) => {
    if (index === 0) return;
    const newQs = [...questions];
    const newAns = [...answers];
    [newQs[index - 1], newQs[index]] = [newQs[index], newQs[index - 1]];
    [newAns[index - 1], newAns[index]] = [newAns[index], newAns[index - 1]];
    setQuestions(newQs);
    setAnswers(newAns);
  };

  // Move a FAQ pair down by swapping with the next pair
  const movePairDown = (index) => {
    if (index === questions.length - 1) return;
    const newQs = [...questions];
    const newAns = [...answers];
    [newQs[index], newQs[index + 1]] = [newQs[index + 1], newQs[index]];
    [newAns[index], newAns[index + 1]] = [newAns[index + 1], newAns[index]];
    setQuestions(newQs);
    setAnswers(newAns);
  };

  // Save changes to Firestore
  const saveChanges = async () => {
    try {
      const faqDocRef = doc(db, "adminSettings", "FAQ");
      await setDoc(faqDocRef, { Questions: questions, Answers: answers }, { merge: true });
      setMessage("FAQ updated successfully!");
    } catch (error) {
      console.error("Error saving FAQ:", error);
      setMessage("Failed to update FAQ.");
    }
  };

  if (loading) {
    return <div>Loading FAQs...</div>;
  }

  return (
    <div className={styles.manageModuleContainer}>
      <h2>FAQ Manager</h2>
      {message && <p className={styles.message}>{message}</p>}
      <div className={styles.faqListContainer}>
        {questions.map((q, index) => (
          <div key={index} className={styles.faqItem}>
            <input
              type="text"
              value={q}
              onChange={(e) => handleQuestionChange(index, e.target.value)}
              placeholder="Enter question"
              className={styles.textField}
            />
            <textarea
              value={answers[index]}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
              placeholder="Enter answer"
              rows={3}
              className={styles.textField}
            />
            <div className={styles.faqButtonGroup}>
              <button onClick={() => movePairUp(index)} className={styles.editButton}>
                Up
              </button>
              <button onClick={() => movePairDown(index)} className={styles.editButton}>
                Down
              </button>
              <button onClick={() => removeFAQPair(index)} className={styles.rejectButton}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className={styles.faqButtonContainer}>
        <button onClick={addFAQPair} className={styles.profileButton}>
          Add FAQ Pair
        </button>
        <button onClick={saveChanges} className={styles.approveButton}>
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default ManageFAQ;

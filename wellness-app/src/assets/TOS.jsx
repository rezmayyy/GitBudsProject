import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc } from 'firebase/firestore';
import { db } from './Firebase'; // Adjust import path as needed
import styles from '../styles/Legal.module.css'; // Updated path to your Legal styles

function TOS() {
  // State to hold the Intro and the numbered sections
  const [intro, setIntro] = useState(null);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    const fetchTOSContent = async () => {
      try {
        // Reference to the TOS document and its subcollection "Sections"
        const tosDocRef = doc(db, 'adminSettings', 'TOS');
        const sectionsRef = collection(tosDocRef, 'Sections');

        // Fetch all documents in the subcollection
        const querySnapshot = await getDocs(sectionsRef);
        const fetched = querySnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }));

        // Separate out the Intro document (if it exists)
        const introDoc = fetched.find((item) => item.id === 'Intro');
        // Filter out the intro and keep numbered sections
        const numberedSections = fetched.filter((item) => item.id !== 'Intro');

        // Sort the numbered sections numerically:
        // Split each doc ID on the decimal. If a subsection isn't present, treat it as 0.
        numberedSections.sort((a, b) => {
          const [aMain, aSub] = a.id.split('.').map(Number);
          const [bMain, bSub] = b.id.split('.').map(Number);
          if (aMain !== bMain) return aMain - bMain;
          return (aSub || 0) - (bSub || 0);
        });

        setIntro(introDoc);
        setSections(numberedSections);
      } catch (error) {
        console.error('Error fetching TOS content:', error);
      }
    };

    fetchTOSContent();
  }, []);

  return (
    <div className={styles.legalContainer}>
      {/* Terms of Service Header */}
      <h1 className={styles.legalTitle}>Terms of Service</h1>
      
      {/* Display the Intro section if it exists */}
      {intro && (
        <>
          <p className={styles.effectiveDate}>
            <strong>Effective Date:</strong> {intro.effectiveDate}
          </p>
          <div
            className={styles.introduction}
            dangerouslySetInnerHTML={{ __html: intro.body }}
          />
        </>
      )}

      {/* Render each numbered section */}
      {sections.map((sec) => (
        <div key={sec.id} style={{ marginBottom: '2rem' }}>
          <h2 className={styles.sectionTitle}>
            {sec.id} {sec.title}
          </h2>
          <div
            className={styles.sectionContent}
            dangerouslySetInnerHTML={{ __html: sec.body }}
          />
        </div>
      ))}
    </div>
  );
}

export default TOS;

import React, { useState, useEffect } from 'react';
import {
  doc,
  collection,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../Firebase'; // Adjust import path as needed
import ReactQuill from 'react-quill'; // Rich text editor
import 'react-quill/dist/quill.snow.css'; // Default Quill styling
import styles from '../../styles/ModDashboard.module.css';

const ManageTOS = () => {
  // Intro states
  const [introEffectiveDate, setIntroEffectiveDate] = useState('');
  const [introBody, setIntroBody] = useState('');

  // Numbered sections states
  const [sections, setSections] = useState([]);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionBody, setNewSectionBody] = useState('');
  const [selectedMainSection, setSelectedMainSection] = useState('');
  const [newSubSectionTitle, setNewSubSectionTitle] = useState('');
  const [newSubSectionBody, setNewSubSectionBody] = useState('');
  const [message, setMessage] = useState('');

  // Firestore references
  const tosDocRef = doc(db, 'adminSettings', 'TOS');
  const sectionsRef = collection(tosDocRef, 'Sections'); // Subcollection: TOS -> Sections

  // On mount, ensure TOS doc exists, then fetch intro + sections
  useEffect(() => {
    const initializeTOS = async () => {
      try {
        // Ensure the parent TOS document exists
        await setDoc(doc(db, 'adminSettings', 'TOS'), { created: true }, { merge: true });
        // Now fetch everything
        fetchIntro();
        fetchSections();
      } catch (error) {
        console.error('Error ensuring TOS doc exists:', error);
      }
    };

    initializeTOS();
  }, []);

  // Fetch the "Intro" doc
  const fetchIntro = async () => {
    try {
      const introDocRef = doc(sectionsRef, 'Intro');
      const introSnap = await getDoc(introDocRef);
      if (introSnap.exists()) {
        const introData = introSnap.data();
        setIntroEffectiveDate(introData.effectiveDate || '');
        setIntroBody(introData.body || '');
      }
    } catch (error) {
      console.error('Error fetching Intro doc:', error);
    }
  };

  // Save or update the "Intro" doc
  const saveIntro = async () => {
    try {
      const introDocRef = doc(sectionsRef, 'Intro');
      // We store the entire "introBody" as HTML
      await setDoc(
        introDocRef,
        {
          effectiveDate: introEffectiveDate,
          body: introBody
        },
        { merge: true }
      );

      setMessage('Introduction updated successfully.');
    } catch (error) {
      console.error('Error saving Intro doc:', error);
      alert('Failed to save introduction.');
    }
  };

  // Fetch all numbered sections
  const fetchSections = async () => {
    try {
      const querySnap = await getDocs(sectionsRef);
      const fetched = querySnap.docs.map((docSnap) => {
        return { id: docSnap.id, ...docSnap.data() };
      });

      // Filter out the "Intro" doc from the main numbered sections
      const numberedSections = fetched.filter((sec) => sec.id !== 'Intro');

      // Sort by main sectionNumber, then by sub
      // e.g., 1.0 < 1.1 < 2.0 < 2.1 < 3.0 ...
      numberedSections.sort((a, b) => {
        const [aMain, aSub] = a.id.split('.').map(Number);
        const [bMain, bSub] = b.id.split('.').map(Number);
        if (aMain !== bMain) return aMain - bMain;
        return (aSub || 0) - (bSub || 0);
      });

      setSections(numberedSections);
    } catch (error) {
      console.error('Error fetching TOS sections:', error);
    }
  };

  // Add a top-level section (e.g. "4.0")
  const addSection = async () => {
    if (!newSectionTitle.trim() || !newSectionBody.trim()) {
      alert('Please enter a title and body for the new section.');
      return;
    }

    try {
      // Find the highest main section number
      let maxMain = 0;
      sections.forEach((sec) => {
        const main = parseInt(sec.sectionNumber, 10);
        if (main > maxMain) {
          maxMain = main;
        }
      });
      const newMain = maxMain + 1; // e.g. 3 -> 4
      const docId = `${newMain}.0`; // e.g. "4.0"

      const newSecData = {
        sectionNumber: newMain,
        title: newSectionTitle.trim(),
        // Store newSectionBody as HTML
        body: newSectionBody.trim()
      };

      await setDoc(doc(sectionsRef, docId), newSecData);

      setNewSectionTitle('');
      setNewSectionBody('');
      setMessage(`Added new section: ${docId}`);

      fetchSections();
    } catch (error) {
      console.error('Error adding section:', error);
      alert('Failed to add section.');
    }
  };

  // Add a sub-section (e.g. "1.1", "1.2", etc.)
  const addSubSection = async () => {
    if (!selectedMainSection) {
      alert('Please select the main section for this sub-section.');
      return;
    }
    if (!newSubSectionTitle.trim() || !newSubSectionBody.trim()) {
      alert('Please enter a title and body for the new sub-section.');
      return;
    }

    try {
      const mainInt = parseInt(selectedMainSection, 10);
      // Filter the sections that match that main number
      const relevantSections = sections.filter(
        (sec) => parseInt(sec.sectionNumber, 10) === mainInt
      );

      // Find the highest sub decimal among them
      let maxSub = 0;
      relevantSections.forEach((sec) => {
        const [, sub] = sec.id.split('.');
        const subInt = parseInt(sub, 10) || 0;
        if (subInt > maxSub) maxSub = subInt;
      });

      const newSub = maxSub + 1;
      const docId = `${mainInt}.${newSub}`; // e.g. "1.3"

      const newSecData = {
        sectionNumber: mainInt,
        title: newSubSectionTitle.trim(),
        body: newSubSectionBody.trim()
      };

      await setDoc(doc(sectionsRef, docId), newSecData);

      setNewSubSectionTitle('');
      setNewSubSectionBody('');
      setSelectedMainSection('');
      setMessage(`Added new sub-section: ${docId}`);

      fetchSections();
    } catch (error) {
      console.error('Error adding sub-section:', error);
      alert('Failed to add sub-section.');
    }
  };

  // Update an existing section's title/body
  const updateSection = async (docId, newTitle, newBody) => {
    try {
      await updateDoc(doc(sectionsRef, docId), {
        title: newTitle,
        body: newBody
      });
      setMessage(`Section ${docId} updated.`);
      fetchSections();
    } catch (error) {
      console.error('Error updating section:', error);
      alert('Failed to update section.');
    }
  };

  // Delete a section
  const deleteSection = async (docId) => {
    if (!window.confirm(`Are you sure you want to delete section ${docId}?`)) {
      return;
    }
    try {
      await deleteDoc(doc(sectionsRef, docId));
      setMessage(`Section ${docId} deleted.`);
      fetchSections();
    } catch (error) {
      console.error('Error deleting section:', error);
      alert('Failed to delete section.');
    }
  };

  // Quill Editor Modules (e.g. toolbar with formatting)
  const quillModules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'clean']
    ]
  };

  return (
    <div className={styles.manageModuleContainer}>
      <h2>Manage TOS</h2>
      {message && <p>{message}</p>}

      {/* Intro Editor */}
      <div style={{ marginBottom: '2rem' }}>
        <h3>Introduction</h3>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          Effective Date:
        </label>
        <input
          type="text"
          value={introEffectiveDate}
          onChange={(e) => setIntroEffectiveDate(e.target.value)}
          className={styles.textField}
          style={{ marginBottom: '1rem' }}
        />

        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          Introduction Body (HTML):
        </label>
        {/* ReactQuill for the introBody */}
        <ReactQuill
          theme="snow"
          value={introBody}
          onChange={setIntroBody}
          modules={quillModules}
          style={{ backgroundColor: '#fff', marginBottom: '1rem' }}
        />

        <button onClick={saveIntro} className={styles.approveButton}>
          Save Intro
        </button>
      </div>

      {/* Add a new top-level section */}
      <div style={{ marginBottom: '1rem' }}>
        <h4>Add a New Top-Level Section</h4>
        <input
          type="text"
          placeholder="Section Title"
          value={newSectionTitle}
          onChange={(e) => setNewSectionTitle(e.target.value)}
          className={styles.textField}
          style={{ marginBottom: '0.5rem' }}
        />
        <label>Section Body (HTML):</label>
        <ReactQuill
          theme="snow"
          value={newSectionBody}
          onChange={setNewSectionBody}
          modules={quillModules}
          style={{ backgroundColor: '#fff', marginBottom: '0.5rem' }}
        />
        <button onClick={addSection} className={styles.approveButton}>
          Add Section
        </button>
      </div>

      {/* Add a new sub-section */}
      <div style={{ marginBottom: '2rem' }}>
        <h4>Add a New Sub-Section</h4>
        {/* Choose the main section to attach to */}
        <select
          value={selectedMainSection}
          onChange={(e) => setSelectedMainSection(e.target.value)}
          className={styles.textField}
          style={{ marginBottom: '0.5rem' }}
        >
          <option value="">Select Main Section</option>
          {Array.from(new Set(sections.map((s) => s.sectionNumber))).map(
            (main) => (
              <option key={main} value={main}>
                {main}.0
              </option>
            )
          )}
        </select>

        <input
          type="text"
          placeholder="Sub-Section Title"
          value={newSubSectionTitle}
          onChange={(e) => setNewSubSectionTitle(e.target.value)}
          className={styles.textField}
          style={{ marginBottom: '0.5rem' }}
        />

        <label>Sub-Section Body (HTML):</label>
        <ReactQuill
          theme="snow"
          value={newSubSectionBody}
          onChange={setNewSubSectionBody}
          modules={quillModules}
          style={{ backgroundColor: '#fff', marginBottom: '0.5rem' }}
        />

        <button onClick={addSubSection} className={styles.approveButton}>
          Add Sub-Section
        </button>
      </div>

      {/* Display existing numbered sections */}
      <div className={styles.faqListContainer}>
        {sections.length === 0 ? (
          <p>No TOS sections found.</p>
        ) : (
          sections.map((sec) => (
            <TOSSectionItem
              key={sec.id}
              section={sec}
              onUpdate={updateSection}
              onDelete={deleteSection}
              quillModules={quillModules}
            />
          ))
        )}
      </div>

      {/* Preview the entire TOS at the bottom */}
      <TOSPreview
        introEffectiveDate={introEffectiveDate}
        introBody={introBody}
        sections={sections}
      />
    </div>
  );
};

/**
 * A single TOS section (numbered) with inline Quill editing.
 */
const TOSSectionItem = ({ section, onUpdate, onDelete, quillModules }) => {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(section.title);
  const [body, setBody] = useState(section.body);

  const handleSave = () => {
    onUpdate(section.id, title, body);
    setEditing(false);
  };

  return (
    <div style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h3>
        Section {section.id}:{' '}
        {editing ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '80%', marginBottom: '0.5rem' }}
          />
        ) : (
          title
        )}
      </h3>

      {editing ? (
        <ReactQuill
          theme="snow"
          value={body}
          onChange={setBody}
          modules={quillModules}
          style={{ backgroundColor: '#fff' }}
        />
      ) : (
        // Show the HTML
        <div dangerouslySetInnerHTML={{ __html: section.body }} />
      )}

      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
        {editing ? (
          <button
            onClick={handleSave}
            style={{
              backgroundColor: '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 1rem'
            }}
          >
            Save
          </button>
        ) : (
          <button
            onClick={() => setEditing(true)}
            style={{
              backgroundColor: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 1rem'
            }}
          >
            Edit
          </button>
        )}

        <button
          onClick={() => onDelete(section.id)}
          style={{
            backgroundColor: '#dc3545',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '0.5rem 1rem'
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

/**
 * Displays the full TOS (intro + sections) in a read-only preview.
 */
const TOSPreview = ({ introEffectiveDate, introBody, sections }) => {
  if (!introEffectiveDate && !introBody && sections.length === 0) {
    return null; // Nothing to show yet
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2>Full TOS Preview</h2>
      {introEffectiveDate && (
        <p><strong>Effective Date:</strong> {introEffectiveDate}</p>
      )}
      {/* Intro body as HTML */}
      {introBody && (
        <div dangerouslySetInnerHTML={{ __html: introBody }} style={{ marginBottom: '1rem' }} />
      )}

      {sections.map((sec) => (
        <div key={sec.id} style={{ marginBottom: '1rem' }}>
          <h3>
            Section {sec.id}: {sec.title}
          </h3>
          {/* Render section.body as HTML */}
          <div dangerouslySetInnerHTML={{ __html: sec.body }} />
        </div>
      ))}
    </div>
  );
};

export default ManageTOS;

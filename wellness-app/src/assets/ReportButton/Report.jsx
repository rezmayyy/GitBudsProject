import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../Firebase';
import styles from './Report.module.css'; // Ensure this file is named Report.module.css with a capital R

// ReportButton now accepts an extra prop "userId" (the ID of the reported user)
const ReportButton = ({ contentUrl, profileUrl, iconOnly, userId }) => {
  const [showModal, setShowModal] = useState(false);
  const [description, setDescription] = useState('');
  const [ruleViolation, setRuleViolation] = useState('Spam'); // Default violation type
  const [submitting, setSubmitting] = useState(false);

  const handleReportClick = () => {
    setShowModal(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    const reportUser = httpsCallable(functions, 'reportUser');
    try {
      const result = await reportUser({
        ruleViolation,
        description,
        contentUrl,
        userId, // The reported user's id
      });
      console.log('Report submitted:', result.data);
    } catch (error) {
      console.error('Error reporting user:', error);
    }
    setSubmitting(false);
    setShowModal(false);
    setDescription('');
    setRuleViolation('Spam'); // Reset to default
  };

  const modalContent = (
    <div className={styles.reportModalOverlay}>
      <div className={styles.reportModalContent}>
        <h2>Report Content</h2>
        <form onSubmit={handleSubmit}>
          {/* Dropdown for preset rule violation */}
          <label htmlFor="violation">Violation Type:</label>
          <select
            id="violation"
            value={ruleViolation}
            onChange={(e) => setRuleViolation(e.target.value)}
            style={{ marginBottom: '1rem', padding: '0.5rem', borderRadius: '4px' }}
          >
            <option value="Spam">Spam</option>
            <option value="Harassment">Harassment</option>
            <option value="Inappropriate Content">Inappropriate Content</option>
            <option value="Other">Other</option>
          </select>

          <label htmlFor="description">Description of the problem:</label>
          <textarea
            id="description"
            className={styles.reportDescriptionTextarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows="4"
          />
          <div style={{ marginBottom: '1rem' }}>
            <div className={styles.offendingLinkLabel}>Offending Content:</div>
            <a
              href={contentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.offendingLink}
            >
              {contentUrl}
            </a>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <div className={styles.offendingLinkLabel}>Offending Profile:</div>
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.offendingLink}
            >
              {profileUrl}
            </a>
          </div>
          <div className={styles.reportButtons}>
            <button
              type="submit"
              disabled={submitting}
              className={styles.reportButtonSubmit}
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className={styles.reportButtonCancel}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {iconOnly ? (
        <span onClick={handleReportClick} className={styles.smallReportIcon} title="Report">
          🚩
        </span>
      ) : (
        <button onClick={handleReportClick} className={styles.reportTriggerButton}>
          Report
        </button>
      )}
      {showModal && ReactDOM.createPortal(modalContent, document.body)}
    </>
  );
};

export default ReportButton;

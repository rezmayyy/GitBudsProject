import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import styles from './Report.module.css'; // Ensure this matches your file name exactly

const ReportButton = ({ contentUrl, profileUrl, iconOnly }) => {
  const [showModal, setShowModal] = useState(false);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReportClick = () => {
    setShowModal(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    // ... your logic to send the report ...
    // Simulate a delay for demo purposes:
    setTimeout(() => {
      setSubmitting(false);
      setShowModal(false);
      setDescription('');
    }, 1000);
  };

  // Define modal content separately
  const modalContent = (
    <div className={styles.reportModalOverlay}>
      <div className={styles.reportModalContent}>
        <h2>Report Content</h2>
        <form onSubmit={handleSubmit}>
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

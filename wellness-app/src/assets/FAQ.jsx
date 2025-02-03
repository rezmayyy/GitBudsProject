import { useState } from "react";
import styles from "../styles/FAQ.module.css"; // Import styles

const faqs = [
  { question: "How do I create an account?", answer: "To create an account, click on the 'Sign Up' button on the homepage and follow the instructions." },
  { question: "How can I reset my password?", answer: "Go to the login page, click 'Forgot Password,' and follow the instructions to reset your password." },
  { question: "Is TribeWell free to use?", answer: "Yes! TribeWell has a free tier, but some premium content may require a subscription." },
  { question: "How do I contact support?", answer: "You can reach us at support@tribewell.com or create a support ticket from this page." },
];



export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div id="faq-section" className={styles.faqContainer}>
      <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>
      <div className={styles.faqList}>
        {faqs.map((faq, index) => (
          <div key={index} className={`${styles.faqItem} ${openIndex === index ? styles.open : ""}`}>
            <button className={styles.faqQuestion} onClick={() => toggleFAQ(index)}>
              {faq.question}
              <span>{openIndex === index ? "▲" : "▼"}</span>
            </button>
            <p className={styles.faqAnswer} style={{ display: openIndex === index ? "block" : "none" }}>
              {faq.answer}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

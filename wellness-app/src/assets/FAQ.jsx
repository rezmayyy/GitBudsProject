import { useState } from "react";
import styles from "../styles/FAQ.module.css"; // Import styles

const faqs = [
  { category: "Account", question: "How do I create an account?", answer: "To create an account, click on the 'Sign Up' button on the homepage and follow the instructions." },
  { category: "Billing", question: "How can I reset my password?", answer: "Go to the login page, click 'Forgot Password,' and follow the instructions to reset your password." },
  { category: "General", question: "Is TribeWell free to use?", answer: "Yes! TribeWell has a free tier, but some premium content may require a subscription." },
  { category: "Support", question: "How do I contact support?", answer: "You can reach us at support@tribewell.com or create a support ticket from this page." },
];

export default function FAQ() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const filteredFaqs = faqs.filter(faq =>
    (selectedCategory === "All" || faq.category === selectedCategory) &&
    faq.question.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div id="faq-section" className={styles.faqContainer}>
      <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search FAQs..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={styles.faqSearch}
      />

      {/* Category Filter */}
      <select onChange={(e) => setSelectedCategory(e.target.value)} className={styles.faqFilter}>
        <option value="All">All Categories</option>
        <option value="Account">Account</option>
        <option value="Billing">Billing</option>
        <option value="General">General</option>
        <option value="Support">Support</option>
      </select>

      {/* FAQ List */}
      <div className={styles.faqList}>
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq, index) => (
            <div key={index} className={`${styles.faqItem} ${openIndex === index ? styles.open : ""}`}>
              <button className={styles.faqQuestion} onClick={() => toggleFAQ(index)}>
                {faq.question}
                <span>{openIndex === index ? "▲" : "▼"}</span>
              </button>
              <p className={styles.faqAnswer} style={{ display: openIndex === index ? "block" : "none" }}>
                {faq.answer}
              </p>
            </div>
          ))
        ) : (
          <p className={styles.noResults}>No matching FAQs found.</p>
        )}
      </div>
    </div>
  );
}

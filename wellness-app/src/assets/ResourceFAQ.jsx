import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./Firebase"; // adjust path as needed
import styles from "../styles/FAQ.module.css";

export default function FAQ() {
    const [faqs, setFaqs] = useState([]);
    const [search, setSearch] = useState("");
    const [openIndex, setOpenIndex] = useState(null);

    // Fetch FAQ data from Firestore on mount
    useEffect(() => {
        const fetchFaqs = async () => {
            try {
                // Get the FAQ document from adminSettings collection
                const faqDocRef = doc(db, "adminSettings", "ResourceFAQ");
                const faqDocSnap = await getDoc(faqDocRef);
                if (faqDocSnap.exists()) {
                    const data = faqDocSnap.data();
                    // Assuming the document has two fields: Questions and Answers (both arrays)
                    const questions = data.Questions || [];
                    const answers = data.Answers || [];
                    // Zip the questions and answers together (use the length of the shorter array)
                    const faqsData = questions.map((q, i) => ({
                        question: q,
                        answer: answers[i] || ""
                    }));
                    setFaqs(faqsData);
                } else {
                    console.error("No FAQ document found in adminSettings.");
                }
            } catch (error) {
                console.error("Error fetching FAQs:", error);
            }
        };

        fetchFaqs();
    }, []);

    // Toggle a FAQ item's open/closed state
    const toggleFAQ = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    // Filter FAQs by the search term
    const filteredFaqs = faqs.filter(faq =>
        faq.question.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div id="faq-section" className={styles.faqContainer}>
            <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>
            <input
                type="text"
                placeholder="Search FAQs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.faqSearch}
            />

            <div className={styles.faqList}>
                {filteredFaqs.length > 0 ? (
                    filteredFaqs.map((faq, index) => (
                        <div
                            key={index}
                            className={`${styles.faqItem} ${openIndex === index ? styles.open : ""}`}
                        >
                            <button
                                className={styles.faqQuestion}
                                onClick={() => toggleFAQ(index)}
                            >
                                {faq.question}
                                <span>{openIndex === index ? "▲" : "▼"}</span>
                            </button>
                            <p
                                className={styles.faqAnswer}
                                style={{ display: openIndex === index ? "block" : "none" }}
                            >
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

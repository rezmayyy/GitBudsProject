import React from 'react';
import { Link } from 'react-router-dom';
function Support(){
    return (
        <div className="support-page">
            <h1>Support</h1>
            <p>Welcome to the support page! Here you can find assistance with your queries.</p>
            <div className="support-options">
                <h2>How can we help you?</h2>
                <ul>
                    <li>
                        <h3>Frequently Asked Questions (FAQ)</h3>
                        <p>If you have common questions, check out our <Link to="/faq">FAQ</Link> section for quick answers.</p>
                    </li>
                    <li>
                        <h3>Create a Support Ticket</h3>
                        <p>If you need further assistance, please create a support ticket by clicking <Link to="/ticket">here</Link>.</p>
                    </li>
                </ul>
            </div>
            <div className="contact-info">
                <h2>Contact Us</h2>
                <p>If you still need help, feel free to contact our support team directly at <a href="mailto:support@tribewell.com">support@tribewell.com</a>.</p>
            </div>
        </div>
    );
}

export default Support;
import UserContext from "./UserContext";
import { useContext } from "react";

function TOS(){
    const {user} = useContext(UserContext)
    return(
        <div>
        <h1>Terms of Service</h1>
        <p><strong>Effective Date:</strong> [Insert Date]</p>

        <p>Welcome to [Your Website/Platform Name]! These Terms of Service ("Terms") govern your use of [Your Website/Platform Name] (the "Platform") provided by [Your Company Name], a company operating under the laws of the State of California, United States ("Company," "we," "us," or "our").</p>

        <p>By accessing or using our Platform, you agree to comply with and be bound by these Terms. If you do not agree to these Terms, please do not use the Platform.</p>

        <h2>1. Eligibility</h2>
        <p>You must be at least 18 years of age or the age of majority in your jurisdiction to use the Platform. By using the Platform, you represent and warrant that you meet these eligibility requirements.</p>

        <h2>2. User Accounts</h2>
        <p>To access certain features, such as posting or browsing content, you may need to create an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.</p>

        <h2>3. Content Restrictions</h2>
        <p>You may upload audio and video files to the Platform, subject to the following restrictions. <strong>You may not upload, post, or distribute</strong> any content that:</p>
        <ul>
            <li>Contains illegal or harmful material;</li>
            <li>Contains adult or pornographic material;</li>
            <li>Infringes on any third party's copyrights, trademarks, or other intellectual property rights without their consent;</li>
            <li>Violates any applicable law or regulation, including California and U.S. federal law.</li>
        </ul>
        <p><strong>We reserve the right to remove any content</strong> that violates these Terms or is deemed inappropriate at our sole discretion.</p>

        <h2>4. User-Generated Content and Intellectual Property</h2>
        <p><strong>User Content:</strong> By uploading content, you grant the Company a worldwide, non-exclusive, royalty-free, and transferable license to use, display, distribute, and promote your content on the Platform. You retain all ownership rights to your content.</p>
        <p><strong>Intellectual Property Rights:</strong> The Company retains all rights to the Platform, including its design, layout, code, and any materials created or provided by the Company. You do not acquire any ownership in these materials.</p>

        <h2>5. Payments and Refund Policy</h2>
        <p><strong>Platform Access:</strong> The Platform is free to use for general access, including browsing content.</p>
        <p><strong>Tipping and Subscriptions:</strong> Users may tip or pay to subscribe to content creators. These payments are <strong>non-refundable</strong> and are subject to our Payment Processor’s Terms.</p>
        <p><strong>No Refunds:</strong> All payments made on the Platform, including tips and subscriptions, are non-refundable. By making a payment, you agree that the transaction is final and no refunds will be issued, regardless of the content accessed.</p>

        <h2>6. Acceptable Use Policy</h2>
        <p>You agree not to:</p>
        <ul>
            <li>Harass, threaten, or defame others;</li>
            <li>Engage in unauthorized data mining or scraping activities;</li>
            <li>Attempt to interfere with the security or functionality of the Platform.</li>
        </ul>

        <h2>7. Termination of Service</h2>
        <p>We reserve the right to terminate or suspend your account if you violate these Terms or engage in any behavior harmful to the Platform or other users.</p>
        <p>You may also choose to terminate your account at any time by following the instructions in your account settings.</p>

        <h2>8. Disclaimers and Limitation of Liability</h2>
        <p><strong>As-Is Basis:</strong> The Platform is provided on an “as-is” and “as-available” basis. We make no warranties or representations regarding the accuracy, reliability, or availability of the Platform.</p>
        <p><strong>Limitation of Liability:</strong> Under no circumstances shall the Company be liable for any damages arising from your use of the Platform, including loss of data, revenue, or reputation.</p>

        <h2>9. Dispute Resolution</h2>
        <p><strong>Governing Law:</strong> These Terms and your use of the Platform are governed by the laws of the State of California, without regard to its conflict of law principles.</p>
        <p><strong>Arbitration:</strong> Any disputes arising out of or related to these Terms or your use of the Platform will be resolved through binding arbitration, conducted in [City, California].</p>

        <h2>10. Changes to These Terms</h2>
        <p>We reserve the right to modify these Terms at any time. Any updates will be posted here, and continued use of the Platform after any changes constitute your acceptance of the revised Terms.</p>

        <h2>11. Contact Information</h2>
        <p>If you have questions about these Terms, please contact us at [Contact Email Address or Contact Form Link].</p>

        </div>
    );
}

export default TOS;
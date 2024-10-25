import { useLocation } from "react-router-dom";

function Footer(){

    return (
    <footer>
      <div className="footer-section">
        <h4>Links</h4>
        <a href="/">Home</a>
        <a href="#">About</a>
        <a href="#">Contact</a>
      </div>
      <div className="footer-section">
        <h4>Help</h4>
        <a href="#">Payment Options</a>
        <a href="#">Privacy Policies</a>
      </div>
      <div className="footer-section">
        <h4>Other</h4>
        <a href="#">Other Link </a>
        <a href="#">Other Link </a>
      </div>
      <p>© 2024 TribeWell. All rights reserved.</p>
    </footer>
  );
};

export default Footer

import { Link, useNavigate } from 'react-router-dom';
import React from 'react';
import styles from '../styles/footer.css'

function Footer(){

    return (
    <footer>
      <ul className="nav-links">
        <li><Link to="/about">About</Link></li>
        <li><Link to="/contact">Contact Us</Link></li>
        <li><Link to="/support">Support</Link></li>
        <li><Link to="/payment">Payment Options</Link></li>
        <li><Link to="/privacy">Privacy Policy</Link></li>
        <li><Link to="/tos">Terms Of Service</Link></li>
      </ul>
      <p style={{color: "white"}}>© {new Date().getUTCFullYear()} TribeWell. All rights reserved.</p>
    </footer>
  );
};

export default Footer

import { Link, useNavigate } from 'react-router-dom';
import React from 'react';
import styles from '../styles/footer.css'

function Footer() {

  return (
    <footer>
      <ul className="nav-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/directory">Directory</Link></li>
        <li><Link to="/blogs">Blogs</Link></li>
        <li><Link to="/profile">Profile</Link></li>
        <li><Link to="/discussion">Discussion</Link></li>
        <li><Link to="/create-post">Create</Link></li>
        <li><Link to="/membership">Membership</Link></li>
        <li><Link to="/contact">Contact</Link></li>
        <li><Link to="/privacy">Privacy Policy</Link></li>
        <li><Link to="/tos">Terms Of Service</Link></li>
      </ul>
      <p style={{ color: "black" }}>© {new Date().getUTCFullYear()} TribeWell. All rights reserved.</p>
    </footer>
  );
};

export default Footer

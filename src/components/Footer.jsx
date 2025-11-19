import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/components/Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div>© 2025 All Rights Reserved.</div>
      <div><Link to="/contact-support" className="footer-link">Contact support</Link></div>
      <div><a href="/privacy" className="footer-link">Privacy & Terms</a></div>
    </footer>
  );
}

export default Footer;

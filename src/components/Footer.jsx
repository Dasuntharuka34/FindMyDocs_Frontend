import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/components/Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div><Link to="/contact-support" className="footer-link">Contact support</Link></div>
      <div>University of Jaffna, Sri Lanka</div>
      <div><a href="/privacy" className="footer-link">Privacy & Terms</a></div>
    </footer>
  );
}

export default Footer;

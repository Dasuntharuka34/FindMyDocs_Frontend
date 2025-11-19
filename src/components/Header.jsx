import React, { useContext } from 'react';
import '../styles/components/Header.css';
import universityLogo from '../assets/uoj.png';
import { AuthContext } from '../context/AuthContext'; // AuthContext import කරන්න
import ThemeSwitch from './ThemeSwitch';

function Header({ user }) {
  const { logout } = useContext(AuthContext); 

  const handleLogout = () => {
    logout(); 
  };

  // Add a guard to ensure user object is not null
  if (!user) {
    return null; // Or a loading spinner, or a minimal header
  }

  return (
    <header className="header">
      <div className="header-left">
        {universityLogo && <img src={universityLogo} alt="University Logo" className="logo" />}
        <h1 className="university-name">School of Alchemist</h1>
      </div>
      <div className="header-right">
        <ThemeSwitch />
        <div className="user-info">
          <span className="user-name">{user.name}</span> | <span className="user-role">{user.role}</span>
        </div>
        <button onClick={handleLogout} className="logout-btn" title="Logout">Logout</button>
      </div>
    </header>
  );
}

export default Header;

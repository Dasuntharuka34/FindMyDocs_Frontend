import React from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { AuthContext } from '../context/AuthContext';
import '../styles/layouts/UserLayout.css'; // Assuming you'll create this CSS file

const UserLayout = ({ children }) => {
  const { user } = React.useContext(AuthContext);

  return (
    <div className="user-page-container">
      <Header user={user} />
      <div className="user-content-wrapper">
        <Sidebar />
        <main className="user-main-content">{children}</main>
      </div>
      <Footer />
    </div>
  );
};

export default UserLayout;

import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import '../styles/components/Sidebar.css';
import { AuthContext } from '../context/AuthContext';

function Sidebar() {
  const { user } = useContext(AuthContext);

  const getDashboardPath = () => {
    if (user && user.role?.toLowerCase() === 'admin') {
      return '/admin-dashboard';
    } else {
      return '/dashboard';
    }
  };

  return (
    <nav className="sidebar">
      <ul>
        <li className="sidebar-item">
          <Link to={getDashboardPath()} className="sidebar-link">Dashboard</Link>
        </li>
        {user && user.role?.toLowerCase() !== 'vc' && (
          <li className="sidebar-item">
            <Link to="/my-letters" className="sidebar-link">My Letters</Link>
          </li>
        )}
        {user && (() => {
          const role = user.role?.toLowerCase();
          return ['lecturer', 'hod', 'dean', 'vc', 'staff'].includes(role);
        })() && (
            <li className="sidebar-item">
              <Link to="/pending-approvals" className="sidebar-link">Pending Approvals</Link>
            </li>
          )}
        <li className="sidebar-item">
          <Link to="/notifications" className="sidebar-link">Notifications</Link>
        </li>
        <li className="sidebar-item">
          <Link to="/profile" className="sidebar-link">Profile</Link>
        </li>
      </ul>
    </nav>
  );
}

export default Sidebar;

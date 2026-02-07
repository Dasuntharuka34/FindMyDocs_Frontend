import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/components/AdminSidebar.css';

function AdminSidebar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="admin-sidebar">
      <ul>
        <li className={`admin-sidebar-item ${isActive('/admin-dashboard') ? 'active' : ''}`}>
          <Link to="/admin-dashboard" className="admin-sidebar-link">Dashboard</Link>
        </li>
        <li className={`admin-sidebar-item ${isActive('/admin/registration-approvals') ? 'active' : ''}`}>
          <Link to="/admin/registration-approvals" className="admin-sidebar-link">Registration Approvals</Link>
        </li>
        <li className={`admin-sidebar-item ${isActive('/admin/user-management') ? 'active' : ''}`}>
          <Link to="/admin/user-management" className="admin-sidebar-link">User Management</Link>
        </li>
        <li className={`admin-sidebar-item ${isActive('/admin/all-requests') ? 'active' : ''}`}>
          <Link to="/admin/all-requests" className="admin-sidebar-link">All Requests</Link>
        </li>
        <li className={`admin-sidebar-item ${isActive('/admin/approved-requests') ? 'active' : ''}`}>
          <Link to="/admin/approved-requests" className="admin-sidebar-link">Approved Requests</Link>
        </li>
        <li className={`admin-sidebar-item ${isActive('/admin/reports') ? 'active' : ''}`}>
          <Link to="/admin/reports" className="admin-sidebar-link">Report Generation</Link>
        </li>
        <li className={`admin-sidebar-item ${isActive('/admin/forms') ? 'active' : ''}`}>
          <Link to="/admin/forms" className="admin-sidebar-link">Manage Forms</Link>
        </li>
        {/* <li className={`admin-sidebar-item ${isActive('/admin/templates') ? 'active' : ''}`}>
          <Link to="/admin/templates" className="admin-sidebar-link">Manage Templates</Link>
        </li> */}
        {/* <li className={`admin-sidebar-item ${isActive('/admin/auto-approval-rules') ? 'active' : ''}`}>
          <Link to="/admin/auto-approval-rules" className="admin-sidebar-link">Auto-Approval Rules</Link>
        </li> */}
        <li className={`admin-sidebar-item ${isActive('/admin/database') ? 'active' : ''}`}>
          <Link to="/admin/database" className="admin-sidebar-link">Database</Link>
        </li>
        <li className={`admin-sidebar-item ${isActive('/admin/departments') ? 'active' : ''}`}>
          <Link to="/admin/departments" className="admin-sidebar-link">Departments</Link>
        </li>
        <li className={`admin-sidebar-item ${isActive('/admin/roles') ? 'active' : ''}`}>
          <Link to="/admin/roles" className="admin-sidebar-link">Roles & Permissions</Link>
        </li>
        <li className={`admin-sidebar-item ${isActive('/admin/workflows') ? 'active' : ''}`}>
          <Link to="/admin/workflows" className="admin-sidebar-link">Workflows</Link>
        </li>
        <li className={`admin-sidebar-item ${isActive('/admin/system-config') ? 'active' : ''}`}>
          <Link to="/admin/system-config" className="admin-sidebar-link">System Settings</Link>
        </li>
        <li className={`admin-sidebar-item ${isActive('/admin/security') ? 'active' : ''}`}>
          <Link to="/admin/security" className="admin-sidebar-link">Security & Compliance</Link>
        </li>
        <li className={`admin-sidebar-item ${isActive('/admin/developer/error-logs') ? 'active' : ''}`}>
          <Link to="/admin/developer/error-logs" className="admin-sidebar-link">Error Logs</Link>
        </li>
        {/* <li className={`admin-sidebar-item ${isActive('/admin/developer/query') ? 'active' : ''}`}>
          <Link to="/admin/developer/query" className="admin-sidebar-link">Database Query</Link>
        </li> */}
        <li className={`admin-sidebar-item ${isActive('/admin/developer/docs') ? 'active' : ''}`}>
          <Link to="/admin/developer/docs" className="admin-sidebar-link">Developer Dashboard</Link>
        </li>

        <li className={`admin-sidebar-item ${isActive('/admin/forms/analytics') ? 'active' : ''}`}>
          <Link to="/admin/forms/analytics" className="admin-sidebar-link">Form Analytics</Link>
        </li>
        <li className={`admin-sidebar-item ${isActive('/admin/cleanup') ? 'active' : ''}`}>
          <Link to="/admin/cleanup" className="admin-sidebar-link">Data Cleanup</Link>
        </li>
        <li className={`admin-sidebar-item ${isActive('/admin/email-templates') ? 'active' : ''}`}>
          <Link to="/admin/email-templates" className="admin-sidebar-link">Email Templates</Link>
        </li>
        <li className={`admin-sidebar-item ${isActive('/admin/bulk-email') ? 'active' : ''}`}>
          <Link to="/admin/bulk-email" className="admin-sidebar-link">Bulk Email Sender</Link>
        </li>
        <li className={`admin-sidebar-item ${isActive('/admin/email-logs') ? 'active' : ''}`}>
          <Link to="/admin/email-logs" className="admin-sidebar-link">Email Logs</Link>
        </li>
        <li className={`admin-sidebar-item ${isActive('/admin/notification-settings') ? 'active' : ''}`}>
          <Link to="/admin/notification-settings" className="admin-sidebar-link">Notification Settings</Link>
        </li>
        <li className={`admin-sidebar-item ${isActive('/profile') ? 'active' : ''}`}>
          <Link to="/profile" className="admin-sidebar-link">Profile</Link>
        </li>
      </ul>
    </nav>
  );
}

export default AdminSidebar;

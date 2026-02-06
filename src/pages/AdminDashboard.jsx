import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import StatisticCard from '../components/StatisticCard';
import '../styles/pages/AdminDashboard.css';

import api from '../utils/api'; // Assuming you have an api.js file for API calls

export default function AdminDashboard() {
  const { user } = useContext(AuthContext);

  const [totalUsers, setTotalUsers] = useState(null);
  const [pendingRequests, setPendingRequests] = useState(null);
  const [approvedRequests, setApprovedRequests] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch total users
        const usersResponse = await api.get('/users');
        setTotalUsers(usersResponse.data.length);

        // Fetch pending registration requests
        const pendingRegResponse = await api.get('/users/registrations/pending');
        const pendingRegCount = pendingRegResponse.data.length;

        // Fetch all pending requests (leave, excuse, letter)
        const allPendingResponse = await api.get('/users/pendingRequests');
        const pendingLeaveCount = allPendingResponse.data.filter(r => r.type === 'leave').length;
        const pendingExcuseCount = allPendingResponse.data.filter(r => r.type === 'excuse').length;

        // Fetch leave requests for approved count
        const leaveResponse = await api.get('/leaverequests');
        const approvedLeaveCount = leaveResponse.data.filter(r => r.status === 'approved').length;

        // Fetch excuse requests for approved count
        const excuseResponse = await api.get('/excuserequests');
        const approvedExcuseCount = excuseResponse.data.filter(r => r.status === 'approved').length;

        // Calculate pending and approved requests
        setPendingRequests(pendingRegCount + pendingLeaveCount + pendingExcuseCount);
        setApprovedRequests(approvedLeaveCount + approvedExcuseCount);

        setLoading(false);
      } catch (err) {
        setError('Failed to load statistics');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Access control is handled by PrivateRoute in App.js, but an extra check is good practice.
  if (!user || user.role !== 'Admin') {
    return <p style={{ textAlign: 'center', marginTop: '50px', fontSize: '1.5rem', color: 'red' }}>
      Access Denied! You do not have administrator privileges.
    </p>;
  }

  if (loading) {
    return <p>Loading dashboard statistics...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div className="admin-dashboard">
      <h2>Welcome, {user?.name || 'Admin'}!</h2>

      <div className="admin-dashboard-overview">
        <div className="statistics-grid">
          <StatisticCard label="Total Users" value={totalUsers} />
          <StatisticCard label="Pending Requests" value={pendingRequests} />
          <StatisticCard label="Approved Requests" value={approvedRequests} />
        </div>
      </div>
    </div>
  );
}

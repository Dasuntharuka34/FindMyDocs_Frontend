import React, { useEffect, useState, useContext } from 'react';

import api from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import '../../styles/pages/AllRequestsPage.css'; // Assuming you'll create this CSS file
import { Link } from 'react-router-dom';
import { useRequestFilters } from '../../hooks/useRequestFilters';

const AllRequestsPage = () => {
  const { user } = useContext(AuthContext);
  const [excuseRequests, setExcuseRequests] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [letters, setLetters] = useState([]);
  const [formSubmissions, setFormSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    searchTerm,
    setSearchTerm,
    sortField,
    setSortField,
    sortOrder,
    setSortOrder,
    applyFiltersAndSorting,
  } = useRequestFilters('submittedDate', 'desc');


  useEffect(() => {
    const fetchAllRequests = async () => {
      if (!user || user.role !== 'Admin') {
        setError('Unauthorized access.');
        setLoading(false);
        return;
      }

      try {
        const [excuseRes, leaveRes, letterRes, formRes] = await Promise.all([
          api.get(`/excuserequests`),
          api.get(`/leaverequests`),
          api.get(`/letters`),
          api.get(`/form-submissions`),
        ]);
        setExcuseRequests(excuseRes.data);
        setLeaveRequests(leaveRes.data);
        setLetters(letterRes.data);
        setFormSubmissions(formRes.data);
      } catch (err) {
        console.error('Error fetching all requests:', err);
        setError('Failed to fetch requests. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllRequests();
  }, [user]);

  if (loading) {
    return <div className="all-requests-container">Loading all requests...</div>;
  }

  if (error) {
    return <div className="all-requests-container error-message">{error}</div>;
  }

  return (
    <div className="all-requests-container">
      <h1>All Requests</h1>

      <div className="requests-controls">
        <input
          type="text"
          placeholder="Search requests..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={`${sortField}-${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split('-');
            setSortField(field);
            setSortOrder(order);
          }}
          className="sort-select"
        >
          <option value="submittedDate-desc">Date (Newest First)</option>
          <option value="submittedDate-asc">Date (Oldest First)</option>
          <option value="studentName-asc">Student Name (A-Z)</option>
          <option value="studentName-desc">Student Name (Z-A)</option>
          <option value="status-asc">Status (A-Z)</option>
          <option value="status-desc">Status (Z-A)</option>
        </select>
      </div>

      <section className="request-section">
        <h2>Excuse Requests</h2>
        {applyFiltersAndSorting(excuseRequests).length === 0 ? (
          <p>No excuse requests found.</p>
        ) : (
          <div className="table-responsive">
            <table className="requests-table">
              <thead>
                <tr>
                  {/* <th>ID</th> */}
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Submitted Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applyFiltersAndSorting(excuseRequests).map((request) => (
                  <tr key={request._id}>
                    {/* <td>{request._id}</td> */}
                    <td>{request.studentName}</td>
                    <td>{request.email}</td>
                    <td>{request.reason}</td>
                    <td><span className={`status-badge ${request.status ? request.status.toLowerCase().replace(/\s/g, '-') : ''}`}>
                      {request.status}
                    </span></td>

                    <td>{new Date(request.submittedDate).toLocaleDateString()}</td>
                    <td><Link to={`/excuse-request/${request._id}`} className="view-details-btn">View Details</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="request-section">
        <h2>Leave Requests</h2>
        {applyFiltersAndSorting(leaveRequests).length === 0 ? (
          <p>No leave requests found.</p>
        ) : (
          <div className="table-responsive">
            <table className="requests-table">
              <thead>
                <tr>
                  {/* <th>ID</th> */}
                  <th>User Name</th>
                  {/* <th>NIC Number</th> */}
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Submitted Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applyFiltersAndSorting(leaveRequests).map((request) => (
                  <tr key={request._id}>
                    {/* <td>{request._id}</td> */}
                    <td>{request.studentName}</td>
                    {/* <td>{request.nicNumber}</td> */}
                    <td>{request.reason}</td>
                    <td><span className={`status-badge ${request.status ? request.status.toLowerCase().replace(/\s/g, '-') : ''}`}>
                      {request.status}
                    </span></td>
                    <td>{new Date(request.submittedDate).toLocaleDateString()}</td>
                    <td><Link to={`/leave-request/${request._id}`} className="view-details-btn">View Details</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="request-section">
        <h2>Other Letters</h2>
        {applyFiltersAndSorting(letters).length === 0 ? (
          <p>No other letters found.</p>
        ) : (
          <div className="table-responsive">
            <table className="requests-table">
              <thead>
                <tr>
                  {/* <th>ID</th> */}
                  <th>Student Name</th>
                  {/* <th>NIC Number</th> */}
                  <th>Type</th>
                  <th>Status</th>
                  <th>Submitted Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applyFiltersAndSorting(letters).map((letter) => (
                  <tr key={letter._id}>
                    {/* <td>{letter._id}</td> */}
                    <td>{letter.student}</td>
                    {/* <td>{letter.nicNumber}</td> */}
                    <td>{letter.type}</td>
                    <td><span className={`status-badge ${letter.status ? letter.status.toLowerCase().replace(/\s/g, '-') : ''}`}>
                      {letter.status}
                    </span></td>
                    <td>{new Date(letter.submittedDate).toLocaleDateString()}</td>
                    <td>
                      <Link to={`/documents/${letter._id}`} className="view-details-btn">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="request-section">
        <h2>Dynamic Form Submissions</h2>
        {applyFiltersAndSorting(formSubmissions).length === 0 ? (
          <p>No form submissions found.</p>
        ) : (
          <div className="table-responsive">
            <table className="requests-table">
              <thead>
                <tr>
                  <th>Form Name</th>
                  <th>Student Name</th>
                  <th>Status</th>
                  <th>Submitted Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applyFiltersAndSorting(formSubmissions).map((submission) => (
                  <tr key={submission._id}>
                    <td>{submission.form?.name || 'Unknown Form'}</td>
                    <td>{submission.submittedBy?.name || 'N/A'}</td>
                    <td><span className={`status-badge ${submission.status ? submission.status.toLowerCase().replace(/\s/g, '-') : ''}`}>
                      {submission.status}
                    </span></td>
                    <td>{new Date(submission.submittedAt).toLocaleDateString()}</td>
                    <td>
                      <Link to={`/form-submission/${submission._id}`} className="view-details-btn">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AllRequestsPage;

import React, { useState, useEffect, useContext } from 'react';
import Header from '../../components/Header';
import AdminSidebar from '../../components/AdminSidebar';
import Footer from '../../components/Footer';
import { AuthContext } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import MessageModal from '../../components/MessageModal'; // Assuming a shared MessageModal component
import '../../styles/pages/ApprovedRequestsPage.css'; // New CSS file

// --- APPROVAL STAGE DEFINITIONS (Copied from PendingApprovals.jsx for consistency) ---
const approvalStages = [
  { name: "Submitted", approverRole: null },
  { name: "Pending Lecturer Approval", approverRole: "Lecturer" },
  { name: "Pending HOD Approval", approverRole: "HOD" },
  { name: "Pending Dean Approval", approverRole: "Dean" },
  { name: "Pending VC Approval", approverRole: "VC" },
  { name: "Approved", approverRole: null }
];

// Maps student role to initial stage index
const submitterRoleToInitialStageIndex = {
  "Student": 1,
  "Lecturer": 2,   // Lecturer submits, skips Staff, starts at "Pending Lecturer Approval"
  "HOD": 3,        // HOD submits, skips Staff, Lecturer, starts at "Pending HOD Approval"
  "Dean": 4,
};
// --- END APPROVAL STAGE DEFINITIONS ---

const ApprovedRequestsPage = () => {
  const { user, token } = useContext(AuthContext);

  const [approvedExcuseRequests, setApprovedExcuseRequests] = useState([]);
  const [approvedLeaveRequests, setApprovedLeaveRequests] = useState([]);
  const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });

  const closeMessageModal = () => {
    setMessageModal({ show: false, title: '', message: '' });
  };

  const fetchApprovedExcuseRequests = async () => {
    if (!user || !token) return;
    try {
      // Assuming 'Approved' is the final status name for approved requests
      const approvedStatusName = approvalStages[approvalStages.length - 1].name;
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/excuserequests/pendingApprovals/${approvedStatusName}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setApprovedExcuseRequests(data);
    } catch (error) {
      console.error("Error fetching approved excuse requests:", error);
      setMessageModal({ show: true, title: 'Error', message: `Failed to load approved excuse requests: ${error.message}` });
    }
  };

  const fetchApprovedLeaveRequests = async () => {
    if (!user || !token) return;
    try {
      // Assuming 'Approved' is the final status name for approved requests
      const approvedStatusName = approvalStages[approvalStages.length - 1].name;
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/leaverequests/pendingApprovals/${approvedStatusName}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setApprovedLeaveRequests(data);
    } catch (error) {
      console.error("Error fetching approved leave requests:", error);
      setMessageModal({ show: true, title: 'Error', message: `Failed to load approved leave requests: ${error.message}` });
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchApprovedExcuseRequests();
      fetchApprovedLeaveRequests();
    }
  }, [user, token]);

  if (!user) {
    return <p>Loading user data...</p>;
  }

  // Only Admin should access this page
  if (user.role !== "Admin") {
    return (
      <div className="approved-requests-container">
        <Header user={user} />
        <div className="approved-requests-layout">
          <AdminSidebar />
          <div className="approved-requests-content">
            <p style={{ textAlign: 'center', marginTop: '50px', fontSize: '1.5rem', color: 'red' }}>Access Denied! You do not have permission to view approved requests.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="approved-requests-container">
      <div className="approved-requests-layout">
        <div className="approved-requests-content">
          <h2>Approved Requests</h2>

          {/* --- Approved Excuse Requests Table --- */}
          <div className="requests-section">
            <h3>Approved Excuse Requests</h3>
            {approvedExcuseRequests.length === 0 ? (
              <p>No approved excuse requests.</p>
            ) : (
              <table className="requests-table">
                <thead>
                  <tr>
                    <th>Requester</th>
                    <th>Submitted On</th>
                    <th>Approved On</th>
                    <th>Status</th>
                    <th>View Details</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedExcuseRequests.map(request => (
                    <tr key={request._id}>
                      <td>{request.studentName}</td>
                      <td>{request.submittedDate ? new Date(request.submittedDate).toLocaleDateString() : 'N/A'}</td>
                      <td>{request.approvedDate ? new Date(request.approvedDate).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${request.status ? request.status.toLowerCase().replace(/\s/g, '-') : ''}`}>
                        {request.status}
                      </span>
                    </td>
                    <td>
                      <Link to={`/excuse-request/${request._id}`} className="view-details-btn">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <br />

        {/* --- Approved Leave Requests Table --- */}
        <div className="requests-section">
          <h3>Approved Leave Requests</h3>
          {approvedLeaveRequests.length === 0 ? (
            <p>No approved leave requests.</p>
            ) : (
              <table className="requests-table">
                <thead>
                  <tr>
                    <th>Requester</th>
                    <th>Submitted On</th>
                    <th>Approved On</th>
                    <th>Status</th>
                    <th>View Details</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedLeaveRequests.map(request => (
                    <tr key={request._id}>
                      <td>{request.studentName}</td>
                      <td>{request.submittedDate ? new Date(request.submittedDate).toLocaleDateString() : 'N/A'}</td>
                      <td>{request.approvedDate ? new Date(request.approvedDate).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${request.status ? request.status.toLowerCase().replace(/\s/g, '-') : ''}`}>
                        {request.status}
                      </span>
                    </td>
                    <td>
                      <Link to={`/leave-request/${request._id}`} className="view-details-btn">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      </div>

      <Footer />

      <MessageModal
        show={messageModal.show}
        title={messageModal.title}
        message={messageModal.message}
        onConfirm={closeMessageModal}
      />
    </div>
  );
};

export default ApprovedRequestsPage;
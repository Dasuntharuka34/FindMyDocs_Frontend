import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import MessageModal from '../components/MessageModal';
import RequestAnalytics from '../components/admin/RequestAnalytics';
import { AuthContext } from '../context/AuthContext';
import Footer from '../components/Footer';
import '../styles/pages/PendingApprovals.css';

function PendingApprovals() {
  const { user, token } = useContext(AuthContext);

  const [excuseRequests, setExcuseRequests] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [otherLetterRequests, setOtherLetterRequests] = useState([]);
  const [formSubmissions, setFormSubmissions] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Bulk Selection State
  const [selectedExcuseRequests, setSelectedExcuseRequests] = useState([]);
  const [selectedLeaveRequests, setSelectedLeaveRequests] = useState([]);
  const [selectedOtherLetterRequests, setSelectedOtherLetterRequests] = useState([]);
  const [selectedFormSubmissions, setSelectedFormSubmissions] = useState([]);
  const [bulkAction, setBulkAction] = useState({ type: null, action: null }); // { type: 'ExcuseRequest', action: 'approve' }

  const closeMessageModal = () => {
    setMessageModal({ show: false, title: '', message: '' });
  };

  const fetchPendingExcuseRequests = React.useCallback(async () => {
    if (!user || !user.role) return;
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/excuserequests/pendingApprovals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setExcuseRequests(data);
    } catch (error) {
      console.error("Error fetching pending excuse requests:", error);
      setMessageModal({ show: true, title: 'Error', message: `Failed to load excuse requests: ${error.message}`, onConfirm: closeMessageModal });
    }
  }, [user, token]);

  const fetchPendingLeaveRequests = React.useCallback(async () => {
    if (!user || !user.role) return;
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/leaverequests/pendingApprovals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setLeaveRequests(data);
    } catch (error) {
      console.error("Error fetching pending leave requests:", error);
      setMessageModal({ show: true, title: 'Error', message: `Failed to load leave requests: ${error.message}`, onConfirm: closeMessageModal });
    }
  }, [user, token]);

  const fetchPendingOtherLetterRequests = React.useCallback(async () => {
    if (!user || !user.role) return;
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/letters/pendingApprovals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setOtherLetterRequests(data);
    } catch (error) {
      console.error("Error fetching pending other letter requests:", error);
      setMessageModal({ show: true, title: 'Error', message: `Failed to load other letter requests: ${error.message}`, onConfirm: closeMessageModal });
    }
  }, [user, token]);

  const fetchPendingFormSubmissions = React.useCallback(async () => {
    if (!user || !user.role) return;
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/form-submissions/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setFormSubmissions(data);
    } catch (error) {
      console.error("Error fetching pending form submissions:", error);
      setMessageModal({ show: true, title: 'Error', message: `Failed to load form submissions: ${error.message}`, onConfirm: closeMessageModal });
    }
  }, [user, token]);

  useEffect(() => {
    if (user && user.role) {
      fetchPendingExcuseRequests();
      fetchPendingLeaveRequests();
      fetchPendingOtherLetterRequests();
      fetchPendingFormSubmissions();
    }
  }, [user, fetchPendingExcuseRequests, fetchPendingLeaveRequests, fetchPendingOtherLetterRequests, fetchPendingFormSubmissions]);

  const handleApproval = async (request, action, reason = '') => {
    if (!user || !user.name || !user.role || !user._id) {
      setMessageModal({ show: true, title: 'Error', message: 'User not authenticated. Please log in again.', onConfirm: closeMessageModal });
      return;
    }

    try {
      const isLeaveRequest = request.type === "LeaveRequest";
      const isOtherLetterRequest = request.type === "Letter";

      // --- FIX START: Include approverId in request body ---
      let apiEndpoint;
      let requestBody;

      if (isLeaveRequest) {
        if (action === 'approve') {
          apiEndpoint = `${process.env.REACT_APP_BACKEND_URL}/api/leaverequests/${request._id}/approve`;
          requestBody = {
            approverRole: user.role,
            approverId: user._id // Added approverId
          };
        } else if (action === 'reject') {
          if (reason.trim() === '') {
            setMessageModal({ show: true, title: 'Input Required', message: 'Please provide a reason for rejection.', onConfirm: closeMessageModal });
            return;
          }
          apiEndpoint = `${process.env.REACT_APP_BACKEND_URL}/api/leaverequests/${request._id}/reject`;
          requestBody = {
            approverRole: user.role,
            approverId: user._id, // Added approverId
            rejectionReason: reason
          };
        }
      } else if (isOtherLetterRequest) { // Handle other letter requests
        if (action === 'approve') {
          apiEndpoint = `${process.env.REACT_APP_BACKEND_URL}/api/letters/${request._id}/status`;
          requestBody = {
            status: 'approved',
            approverRole: user.role,
            approverId: user._id
          };
        } else if (action === 'reject') {
          if (reason.trim() === '') {
            setMessageModal({ show: true, title: 'Input Required', message: 'Please provide a reason for rejection.', onConfirm: closeMessageModal });
            return;
          }
          apiEndpoint = `${process.env.REACT_APP_BACKEND_URL}/api/letters/${request._id}/status`;
          requestBody = {
            status: 'rejected',
            approverRole: user.role,
            approverId: user._id,
            comment: reason
          };
        }
      } else if (request.type === "FormSubmission") {
        if (action === 'approve') {
          apiEndpoint = `${process.env.REACT_APP_BACKEND_URL}/api/form-submissions/${request._id}/status`;
          requestBody = {
            status: 'Approved',
            approverId: user._id
          };
        } else if (action === 'reject') {
          if (reason.trim() === '') {
            setMessageModal({ show: true, title: 'Input Required', message: 'Please provide a reason for rejection.', onConfirm: closeMessageModal });
            return;
          }
          apiEndpoint = `${process.env.REACT_APP_BACKEND_URL}/api/form-submissions/${request._id}/status`;
          requestBody = {
            status: 'Rejected',
            rejectionReason: reason,
            approverId: user._id
          };
        }
      }
      else {
        // For excuse requests
        if (action === 'approve') {
          apiEndpoint = `${process.env.REACT_APP_BACKEND_URL}/api/excuserequests/${request._id}/approve`;
          requestBody = {
            approverRole: user.role,
            approverId: user._id // Added approverId
          };
        } else if (action === 'reject') {
          if (reason.trim() === '') {
            setMessageModal({ show: true, title: 'Input Required', message: 'Please provide a reason for rejection.', onConfirm: closeMessageModal });
            return;
          }
          apiEndpoint = `${process.env.REACT_APP_BACKEND_URL}/api/excuserequests/${request._id}/reject`;
          requestBody = {
            approverRole: user.role,
            approverId: user._id, // Added approverId
            comment: reason
          };
        }
      }
      // --- FIX END ---

      const response = await fetch(apiEndpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update status! status: ${response.status}`);
      }

      if (request.type === "FormSubmission") {
        fetchPendingFormSubmissions();
      } else if (isLeaveRequest) {
        fetchPendingLeaveRequests();
      } else if (isOtherLetterRequest) {
        fetchPendingOtherLetterRequests();
      }
      else {
        fetchPendingExcuseRequests();
      }

      // Show success message and reset state
      setMessageModal({
        show: true,
        title: 'Success',
        message: `Request for ${isLeaveRequest ? request.studentName : (request.type === "FormSubmission" ? (request.submittedBy?.name || 'Student') : request.studentName)} has been ${action}d successfully.`,
        onConfirm: closeMessageModal
      });

      setSelectedRequest(null);
      setConfirmAction(null);
      setRejectionReason('');

    } catch (error) {
      console.error(`Error handling approval action (${action}):`, error);
      setMessageModal({ show: true, title: 'Error', message: `Failed to ${action} request: ${error.message}`, onConfirm: closeMessageModal });
    }
  };

  const confirmAndHandle = (req, action) => {
    setSelectedRequest(req);
    setConfirmAction(action);
  };

  // --- BULK ACTION HANDLERS ---
  const handleSelectAll = (type, requests) => {
    const ids = requests.map(r => r._id);
    if (type === 'ExcuseRequest') {
      setSelectedExcuseRequests(prev => prev.length === ids.length ? [] : ids);
    } else if (type === 'LeaveRequest') {
      setSelectedLeaveRequests(prev => prev.length === ids.length ? [] : ids);
    } else if (type === 'Letter') {
      setSelectedOtherLetterRequests(prev => prev.length === ids.length ? [] : ids);
    } else if (type === 'FormSubmission') {
      setSelectedFormSubmissions(prev => prev.length === ids.length ? [] : ids);
    }
  };

  const handleSelectOne = (type, id) => {
    if (type === 'ExcuseRequest') {
      setSelectedExcuseRequests(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    } else if (type === 'LeaveRequest') {
      setSelectedLeaveRequests(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    } else if (type === 'Letter') {
      setSelectedOtherLetterRequests(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    } else if (type === 'FormSubmission') {
      setSelectedFormSubmissions(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }
  };

  const initiateBulkAction = (type, action) => {
    let count = 0;
    if (type === 'ExcuseRequest') count = selectedExcuseRequests.length;
    if (type === 'LeaveRequest') count = selectedLeaveRequests.length;
    if (type === 'Letter') count = selectedOtherLetterRequests.length;
    if (type === 'FormSubmission') count = selectedFormSubmissions.length;

    if (count === 0) return;

    setBulkAction({ type, action });
  };

  const executeBulkAction = async () => {
    const { type, action } = bulkAction;
    let requestIds = [];
    let endpoint = '';
    let successCallback = null;
    let clearSelection = null;

    if (type === 'ExcuseRequest') {
      requestIds = selectedExcuseRequests;
      endpoint = `${process.env.REACT_APP_BACKEND_URL}/api/excuserequests/bulk-${action}`;
      successCallback = fetchPendingExcuseRequests;
      clearSelection = () => setSelectedExcuseRequests([]);
    } else if (type === 'LeaveRequest') {
      requestIds = selectedLeaveRequests;
      endpoint = `${process.env.REACT_APP_BACKEND_URL}/api/leaverequests/bulk-${action}`;
      successCallback = fetchPendingLeaveRequests;
      clearSelection = () => setSelectedLeaveRequests([]);
    } else if (type === 'Letter') {
      requestIds = selectedOtherLetterRequests;
      endpoint = `${process.env.REACT_APP_BACKEND_URL}/api/letters/bulk-${action}`;
      successCallback = fetchPendingOtherLetterRequests;
      clearSelection = () => setSelectedOtherLetterRequests([]);
    } else if (type === 'FormSubmission') {
      requestIds = selectedFormSubmissions;
      endpoint = `${process.env.REACT_APP_BACKEND_URL}/api/form-submissions/bulk-${action}`;
      successCallback = fetchPendingFormSubmissions;
      clearSelection = () => setSelectedFormSubmissions([]);
    }

    try {
      const body = {
        requestIds,
        approverId: user._id,
        comment: action === 'reject' ? rejectionReason : undefined
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error('Bulk action failed');

      const data = await response.json();
      await successCallback();
      clearSelection();

      setMessageModal({
        show: true,
        title: 'Bulk Action Complete',
        message: data.message,
        onConfirm: closeMessageModal
      });

      setBulkAction({ type: null, action: null });
      setRejectionReason('');

    } catch (error) {
      console.error("Bulk action error:", error);
      setMessageModal({ show: true, title: 'Error', message: error.message, onConfirm: closeMessageModal });
    }
  };

  if (!user) {
    return <p>Loading user data...</p>;
  }

  const approverRoles = ['Lecturer', 'HOD', 'Dean', 'VC', 'Admin'];
  const userRoleLower = user.role?.toLowerCase();
  const isApproverRole = approverRoles.some(role => role.toLowerCase() === userRoleLower);
  if (!isApproverRole) {
    return <p style={{ textAlign: 'center', marginTop: '50px', fontSize: '1.5rem', color: 'red' }}>Access Denied! You do not have permission to view pending approvals.</p>;
  }



  return (
    <div className="pending-approvals-container">
      <div className="admin-content">
        <div className="pending-approvals-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Pending Approvals</h2>
            {user.role?.toLowerCase() === 'admin' && (
              <button
                onClick={() => setShowAnalytics(true)}
                className="bulk-action-btn"
                style={{ backgroundColor: '#2196f3' }}
              >
                View Analytics
              </button>
            )}
          </div>

          <RequestAnalytics open={showAnalytics} onClose={() => setShowAnalytics(false)} />

          <section>
            {/* --- Excuse Requests Table --- */}
            <div className="approvals-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Excuse Requests</h3>
                {selectedExcuseRequests.length > 0 && (
                  <div className="bulk-actions">
                    <button onClick={() => initiateBulkAction('ExcuseRequest', 'approve')} className="approve-btn">Approve Selected ({selectedExcuseRequests.length})</button>
                    <button onClick={() => initiateBulkAction('ExcuseRequest', 'reject')} className="reject-btn">Reject Selected ({selectedExcuseRequests.length})</button>
                  </div>
                )}
              </div>
              {excuseRequests.length === 0 ? (
                <p>No pending excuse requests.</p>
              ) : (
                <table className="approvals-table">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={excuseRequests.length > 0 && selectedExcuseRequests.length === excuseRequests.length}
                          onChange={() => handleSelectAll('ExcuseRequest', excuseRequests)}
                        />
                      </th>
                      <th>Requester</th>
                      <th>Submitted On</th>
                      <th>Status</th>
                      <th>View Details</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {excuseRequests.map(request => (
                      <tr key={request._id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedExcuseRequests.includes(request._id)}
                            onChange={() => handleSelectOne('ExcuseRequest', request._id)}
                          />
                        </td>
                        <td>{request.studentName}</td>
                        <td>{request.submittedDate ? new Date(request.submittedDate).toLocaleDateString() : 'N/A'}</td>
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
                        <td>
                          <button onClick={() => confirmAndHandle(request, 'approve')} className="approve-btn">Approve</button>
                          <button onClick={() => confirmAndHandle(request, 'reject')} className="reject-btn">Reject</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <br />
          <section>
            {/* --- Leave Requests Table --- */}
            <div className="approvals-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Leave Requests</h3>
                {selectedLeaveRequests.length > 0 && (
                  <div className="bulk-actions">
                    <button onClick={() => initiateBulkAction('LeaveRequest', 'approve')} className="approve-btn">Approve Selected ({selectedLeaveRequests.length})</button>
                    <button onClick={() => initiateBulkAction('LeaveRequest', 'reject')} className="reject-btn">Reject Selected ({selectedLeaveRequests.length})</button>
                  </div>
                )}
              </div>
              {leaveRequests.length === 0 ? (
                <p>No pending leave requests.</p>
              ) : (
                <table className="approvals-table">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={leaveRequests.length > 0 && selectedLeaveRequests.length === leaveRequests.length}
                          onChange={() => handleSelectAll('LeaveRequest', leaveRequests)}
                        />
                      </th>
                      <th>Requester</th>
                      <th>Submitted On</th>
                      <th>Status</th>
                      <th>View Details</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveRequests.map(request => (
                      <tr key={request._id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedLeaveRequests.includes(request._id)}
                            onChange={() => handleSelectOne('LeaveRequest', request._id)}
                          />
                        </td>
                        <td>{request.studentName}</td>
                        <td>{request.submittedDate ? new Date(request.submittedDate).toLocaleDateString() : 'N/A'}</td>
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
                        <td>
                          <button onClick={() => confirmAndHandle({ ...request, type: "LeaveRequest" }, 'approve')} className="approve-btn">Approve</button>
                          <button onClick={() => confirmAndHandle({ ...request, type: "LeaveRequest" }, 'reject')} className="reject-btn">Reject</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <br />
          <section>
            {/* --- Other Letters Table --- */}
            <div className="approvals-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Other Letters</h3>
                {selectedOtherLetterRequests.length > 0 && (
                  <div className="bulk-actions">
                    <button onClick={() => initiateBulkAction('Letter', 'approve')} className="approve-btn">Approve Selected ({selectedOtherLetterRequests.length})</button>
                    <button onClick={() => initiateBulkAction('Letter', 'reject')} className="reject-btn">Reject Selected ({selectedOtherLetterRequests.length})</button>
                  </div>
                )}
              </div>
              {otherLetterRequests.length === 0 ? (
                <p>No pending other letter requests.</p>
              ) : (
                <table className="approvals-table">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={otherLetterRequests.length > 0 && selectedOtherLetterRequests.length === otherLetterRequests.length}
                          onChange={() => handleSelectAll('Letter', otherLetterRequests)}
                        />
                      </th>
                      <th>Requester</th>
                      <th>Submitted On</th>
                      <th>Status</th>
                      <th>View Details</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {otherLetterRequests.map(request => (
                      <tr key={request._id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedOtherLetterRequests.includes(request._id)}
                            onChange={() => handleSelectOne('Letter', request._id)}
                          />
                        </td>
                        <td>{request.student}</td>
                        <td>{request.submittedDate ? new Date(request.submittedDate).toLocaleDateString() : 'N/A'}</td>
                        <td>
                          <span className={`status-badge ${request.status ? request.status.toLowerCase().replace(/\s/g, '-') : ''}`}>
                            {request.status}
                          </span>
                        </td>
                        <td>
                          <Link to={`/documents/${request._id}`} className="view-details-btn">
                            View Details
                          </Link>
                        </td>
                        <td>
                          <button onClick={() => confirmAndHandle({ ...request, type: "Letter" }, 'approve')} className="approve-btn">Approve</button>
                          <button onClick={() => confirmAndHandle({ ...request, type: "Letter" }, 'reject')} className="reject-btn">Reject</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <br />
          <section>
            {/* --- Form Submissions Table --- */}
            <div className="approvals-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Dynamic Form Submissions</h3>
                {selectedFormSubmissions.length > 0 && (
                  <div className="bulk-actions">
                    <button onClick={() => initiateBulkAction('FormSubmission', 'approve')} className="approve-btn">Approve Selected ({selectedFormSubmissions.length})</button>
                    <button onClick={() => initiateBulkAction('FormSubmission', 'reject')} className="reject-btn">Reject Selected ({selectedFormSubmissions.length})</button>
                  </div>
                )}
              </div>
              {formSubmissions.length === 0 ? (
                <p>No pending form submissions.</p>
              ) : (
                <table className="approvals-table">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={formSubmissions.length > 0 && selectedFormSubmissions.length === formSubmissions.length}
                          onChange={() => handleSelectAll('FormSubmission', formSubmissions)}
                        />
                      </th>
                      <th>Form Name</th>
                      <th>Requester</th>
                      <th>Submitted On</th>
                      <th>Status</th>
                      <th>View Details</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formSubmissions.map(request => (
                      <tr key={request._id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedFormSubmissions.includes(request._id)}
                            onChange={() => handleSelectOne('FormSubmission', request._id)}
                          />
                        </td>
                        <td>{request.form?.name || 'Unknown Form'}</td>
                        <td>{request.submittedBy?.name || 'N/A'}</td>
                        <td>{request.submittedAt ? new Date(request.submittedAt).toLocaleDateString() : 'N/A'}</td>
                        <td>
                          <span className={`status-badge ${request.status ? request.status.toLowerCase().replace(/\s/g, '-') : ''}`}>
                            {request.status}
                          </span>
                        </td>
                        <td>
                          <Link to={`/form-submission/${request._id}`} className="view-details-btn">
                            View Details
                          </Link>
                        </td>
                        <td>
                          <button onClick={() => confirmAndHandle({ ...request, type: "FormSubmission", studentName: request.submittedBy?.name }, 'approve')} className="approve-btn">Approve</button>
                          <button onClick={() => confirmAndHandle({ ...request, type: "FormSubmission", studentName: request.submittedBy?.name }, 'reject')} className="reject-btn">Reject</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </div>

      <Footer />

      {selectedRequest && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Confirm {confirmAction === 'approve' ? 'Approval' : 'Rejection'}</h3>
            <p>
              Are you sure you want to <strong>{confirmAction}</strong> the request for{' '}
              <strong>{selectedRequest.type || 'Excuse Request'}</strong> submitted by <strong>{selectedRequest.studentName}</strong>?
            </p>
            {confirmAction === 'reject' && (
              <div>
                <label htmlFor="reason">Reason for Rejection:</label>
                <textarea
                  id="reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  style={{ width: '100%', marginTop: '8px' }}
                />
              </div>
            )}
            <div className="modal-buttons">
              <button
                onClick={() => {
                  if (confirmAction === 'reject' && rejectionReason.trim() === '') {
                    setMessageModal({ show: true, title: 'Input Required', message: 'Please provide a reason for rejection.', onConfirm: closeMessageModal });
                    return;
                  }
                  handleApproval(selectedRequest, confirmAction, rejectionReason);
                }}
                className="confirm-yes-btn"
              >
                Yes
              </button>
              <button onClick={() => {
                setSelectedRequest(null);
                setConfirmAction(null);
                setRejectionReason('');
              }} className="no-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Confirmation Modal */}
      {bulkAction.type && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Confirm Bulk {bulkAction.action === 'approve' ? 'Approval' : 'Rejection'}</h3>
            <p>
              Are you sure you want to <strong>{bulkAction.action}</strong> the selected <strong>{bulkAction.type}s</strong>?
            </p>
            {bulkAction.action === 'reject' && (
              <div>
                <label htmlFor="bulk-reason">Reason for Rejection:</label>
                <textarea
                  id="bulk-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  style={{ width: '100%', marginTop: '8px' }}
                />
              </div>
            )}
            <div className="modal-buttons">
              <button
                onClick={() => {
                  if (bulkAction.action === 'reject' && rejectionReason.trim() === '') {
                    setMessageModal({ show: true, title: 'Input Required', message: 'Please provide a reason for bulk rejection.', onConfirm: closeMessageModal });
                    return;
                  }
                  executeBulkAction();
                }}
                className="confirm-yes-btn"
              >
                Yes
              </button>
              <button onClick={() => {
                setBulkAction({ type: null, action: null });
                setRejectionReason('');
              }} className="no-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <MessageModal
        show={messageModal.show}
        title={messageModal.title}
        message={messageModal.message}
        onConfirm={messageModal.onConfirm}
        onCancel={messageModal.onCancel}
      />
    </div>
  );
}

export default PendingApprovals;
import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import ProgressTracker from '../components/ProgressTracker';
import { AuthContext } from '../context/AuthContext';
import '../styles/pages/ExcuseRequestView.css';

const LeaveRequestView = () => {
  const { id } = useParams();
  const { user, token } = useContext(AuthContext);

  const [leaveRequest, setLeaveRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workflowStages, setWorkflowStages] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  useEffect(() => {
    const fetchLeaveRequestDetails = async () => {
      if (!id) {
        setError("Leave Request ID is missing from the URL.");
        setLoading(false);
        return;
      }
      if (!user || !user._id || !user.role) {
        setError("User not authenticated or role missing. Please log in.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setLeaveRequest(null);

      try {
        // Fetch workflow first
        const workflowResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/workflows/Leave`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        let stages = [];
        if (workflowResponse.ok) {
          const workflowData = await workflowResponse.json();
          stages = workflowData.steps || [];
        } else {
          // Fallback
          stages = [
            { name: "Submitted", approverRole: null },
            { name: "Pending Lecturer Approval", approverRole: "Lecturer" },
            { name: "Pending HOD Approval", approverRole: "HOD" },
            { name: "Pending Dean Approval", approverRole: "Dean" },
            { name: "Approved", approverRole: null }
          ];
        }
        setWorkflowStages(stages);

        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/leaverequests/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Leave request not found with this ID.");
          }
          throw new Error(`Failed to fetch leave request: HTTP status ${response.status}`);
        }

        const fetchedRequest = await response.json();

        // Authorization check
        const userRoleLower = user.role?.toLowerCase();
        const isApprover = stages.some(stage => stage.approverRole?.toLowerCase() === userRoleLower);
        const isAdmin = userRoleLower === 'admin';
        const isOwner = fetchedRequest.studentId === user._id;

        if (!isOwner && !isAdmin && !isApprover) {
          setError("You are not authorized to view this leave request.");
          setLoading(false);
          return;
        }

        setLeaveRequest(fetchedRequest);
        setLoading(false);

      } catch (err) {
        console.error("Error fetching leave request:", err);
        setError(`Error loading leave request: ${err.message}`);
        setLoading(false);
      }
    };

    fetchLeaveRequestDetails();
  }, [id, user, token]);

  const handleStatusUpdate = async (status) => {
    if (status === 'Rejected' && !showRejectInput) {
      setShowRejectInput(true);
      return;
    }

    if (status === 'Rejected' && !rejectionReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }

    setActionLoading(true);
    try {
      const endpoint = status === 'Approved' ? 'approve' : 'reject';
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/leaverequests/${id}/${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          comment: status === 'Rejected' ? rejectionReason : undefined
        })
      });

      if (response.ok) {
        alert(`Request ${status.toLowerCase()} successfully.`);
        setShowRejectInput(false);
        setRejectionReason('');
        window.location.reload();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error updating status.');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <p style={{ textAlign: 'center', marginTop: '50px', fontSize: '1.5rem' }}>Loading leave request details...</p>
    );
  }

  if (error) {
    return (
      <div className="error-message" style={{ textAlign: 'center', marginTop: '50px', fontSize: '1.5rem', color: 'red' }}>{error}</div>
    );
  }

  if (!leaveRequest) {
    return (
      <div className="error-message" style={{ textAlign: 'center', marginTop: '50px', fontSize: '1.5rem', color: 'red' }}>Leave request not found.</div>
    );
  }

  // Map approvals to history, including pending
  const history = leaveRequest?.approvals
    .map(approval => {
      let status, comments;
      switch (approval.status) {
        case 'approved':
          status = 'Approved';
          comments = `Approved by ${approval.approverRole}`;
          break;
        case 'rejected':
          status = 'Rejected';
          comments = `Rejected by ${approval.approverRole}`;
          break;
        default:
          status = 'Pending';
          comments = `Pending approval from ${approval.approverRole}`;
      }
      return {
        stage: workflowStages.findIndex(stage => stage.approverRole === approval.approverRole),
        status: status,
        timestamp: approval.approvedAt || new Date(),
        updatedBy: approval.approverName || approval.approverRole || 'System',
        comments: approval.comment || comments
      };
    }) || [];

  // Add initial submission to history
  if (leaveRequest) {
    history.unshift({
      stage: 0,
      status: 'Submitted',
      timestamp: leaveRequest.submittedDate,
      updatedBy: leaveRequest.studentName,
      comments: 'Initial submission'
    });
  }

  return (
    <div className="document-container">
      <div className="document-header-row">
        <h1>Leave Request Details</h1>
      </div>

      <div className="document-info">
        <p><strong>Request ID:</strong> {leaveRequest._id}</p>
        <p><strong>Current Status:</strong> {leaveRequest.status}</p>
        <p><strong>Submitted By:</strong> {leaveRequest.studentName}</p>
        <p><strong>Submitted Date:</strong> {new Date(leaveRequest.submittedDate).toLocaleString()}</p>
        <p><strong>Reason for Leave:</strong> {leaveRequest.reason}</p>
        <p><strong>Reason Details:</strong> {leaveRequest.reasonDetails}</p>
        <p><strong>Leave Period:</strong> {new Date(leaveRequest.startDate).toLocaleDateString()} to {new Date(leaveRequest.endDate).toLocaleDateString()}</p>
        <p><strong>Contact during Leave:</strong> {leaveRequest.contactDuringLeave}</p>
        <p><strong>Remarks:</strong> {leaveRequest.remarks || 'N/A'}</p>

        {leaveRequest.attachments && (
          <p>
            <strong>Attachments:</strong> {' '}
            <a href={`${leaveRequest.attachments}`} target="_blank" rel="noopener noreferrer">
              View Attachment
            </a>
          </p>
        )}

        {/* Approval Actions */}
        {user && leaveRequest.status !== 'Approved' && leaveRequest.status !== 'Rejected' &&
          (user.role === 'Admin' || (workflowStages[leaveRequest.currentStageIndex]?.approverRole === user.role)) && (
            <div className="approval-actions-card">
              <h3>Approval Actions</h3>
              <p>You are authorized to review this request.</p>

              {showRejectInput && (
                <textarea
                  className="rejection-textarea"
                  placeholder="Explain why this request is being rejected..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                />
              )}

              <div className="action-buttons-group">
                <button
                  className="approve-btn"
                  onClick={() => handleStatusUpdate('Approved')}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Processing...' : 'Approve'}
                </button>
                <button
                  className="reject-btn"
                  onClick={() => handleStatusUpdate('Rejected')}
                  disabled={actionLoading}
                >
                  {showRejectInput ? 'Confirm Reject' : 'Reject'}
                </button>
                {showRejectInput && (
                  <button className="cancel-btn" onClick={() => setShowRejectInput(false)}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}
      </div>

      <div className="progress-section">
        <h3>Approval Progress</h3>
        <ProgressTracker
          stages={["Submitted", ...workflowStages.map(s => s.name), "Approved"]}
          currentStage={
            leaveRequest.status === "Approved"
              ? workflowStages.length + 1
              : leaveRequest.status === "Submitted"
                ? 0
                : leaveRequest.currentStageIndex + 1
          }
          isRejected={leaveRequest.status === "Rejected"}
        />
      </div>

      <div className="history-section">
        <h3>Approval History</h3>
        {history.length <= 1 ? (
          <p>No detailed history available for this leave request.</p>
        ) : (
          <div className="history-table">
            <div className="history-header">
              <div>Stage</div>
              <div>Status</div>
              <div>Date & Time</div>
              <div>Updated By</div>
              <div>Comments</div>
            </div>
            {history.map((item, index) => (
              <div key={index} className="history-row">
                <div>
                  {item.status === 'Submitted'
                    ? 'Submitted'
                    : item.status === 'Approved' && item.stage > workflowStages.length
                      ? 'Final Approval'
                      : workflowStages[item.stage - 1]?.name || `Stage ${item.stage}`}
                </div>
                <div>{item.status}</div>
                <div>{new Date(item.timestamp).toLocaleString()}</div>
                <div>{item.updatedBy}</div>
                <div>{item.comments}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveRequestView;
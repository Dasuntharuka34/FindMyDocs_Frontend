import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import ProgressTracker from '../components/ProgressTracker';
import { AuthContext } from '../context/AuthContext';
import '../styles/pages/ExcuseRequestView.css';
const ExcuseRequestView = () => {
  const { id } = useParams();
  const { user, token } = useContext(AuthContext);

  const [excuseRequest, setExcuseRequest] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workflowStages, setWorkflowStages] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  useEffect(() => {
    const fetchExcuseRequestDetails = async () => {
      if (!id) {
        setError("Excuse Request ID is missing from the URL.");
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
      setExcuseRequest(null);

      try {
        // Fetch workflow first to get the correct stages
        const workflowResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/workflows/Excuse`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        let stages = [];
        if (workflowResponse.ok) {
          const workflowData = await workflowResponse.json();
          stages = workflowData.steps || [];
        } else {
          // Fallback if workflow fetch fails
          stages = [
            { name: "Submitted", approverRole: null },
            { name: "Pending Lecturer Approval", approverRole: "Lecturer" },
            { name: "Pending HOD Approval", approverRole: "HOD" },
            { name: "Pending Dean Approval", approverRole: "Dean" },
            { name: "Approved", approverRole: null }
          ];
        }
        setWorkflowStages(stages);

        // Fetch the excuse request
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/excuserequests/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Excuse request not found with this ID.");
          }
          throw new Error(`Failed to fetch excuse request: HTTP status ${response.status}`);
        }
        const fetchedRequest = await response.json();

        if (!fetchedRequest) {
          throw new Error("Excuse request not found.");
        }

        // Authorization check
        const userRoleLower = user.role?.toLowerCase();
        const isApprover = stages.some(stage => stage.approverRole?.toLowerCase() === userRoleLower);
        const isAdmin = userRoleLower === 'admin';
        const isOwner = fetchedRequest.studentId === user._id;

        if (!isOwner && !isAdmin && !isApprover) {
          setError("You are not authorized to view this excuse request.");
          setLoading(false);
          return;
        }

        setExcuseRequest(fetchedRequest);

        // Generate history from approvals array
        const generatedHistory = [];

        // Add initial submission
        generatedHistory.push({
          stage: 0,
          status: "Submitted",
          timestamp: fetchedRequest.submittedDate,
          updatedBy: fetchedRequest.studentName,
          comments: 'Initial submission'
        });

        // Add approval stages
        if (fetchedRequest.approvals && fetchedRequest.approvals.length > 0) {
          fetchedRequest.approvals.forEach((approval, index) => {
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

            generatedHistory.push({
              stage: index + 1,
              status: status,
              timestamp: approval.approvedAt || new Date(),
              updatedBy: approval.approverName || approval.approverRole || 'System',
              comments: approval.comment || comments
            });
          });
        }

        // Add current status if not already in history
        if (fetchedRequest.status !== "Submitted" &&
          !generatedHistory.some(item => item.status === fetchedRequest.status)) {
          generatedHistory.push({
            stage: fetchedRequest.currentStageIndex,
            status: fetchedRequest.status,
            timestamp: new Date(),
            updatedBy: 'System',
            comments: `Current status: ${fetchedRequest.status}`
          });
        }

        setHistory(generatedHistory.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
        setLoading(false);

      } catch (err) {
        console.error("Error fetching excuse request:", err);
        setError(`Error loading excuse request: ${err.message}`);
        setLoading(false);
      }
    };

    fetchExcuseRequestDetails();
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
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/excuserequests/${id}/${endpoint}`, {
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
        // Re-fetch details - simpler to reload the page or re-call fetch
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
      <p style={{ textAlign: 'center', marginTop: '50px', fontSize: '1.5rem' }}>Loading excuse request details...</p>
    );
  }

  if (error) {
    return (
      <div className="error-message" style={{ textAlign: 'center', marginTop: '50px', fontSize: '1.5rem', color: 'red' }}>{error}</div>
    );
  }

  if (!excuseRequest) {
    return (
      <div className="error-message" style={{ textAlign: 'center', marginTop: '50px', fontSize: '1.5rem', color: 'red' }}>Excuse request not found.</div>
    );
  }

  return (
    <div className="excuse-request-container">
      <div className="excuse-request-header-row">
        <h1>Excuse Request Details</h1>
      </div>

      <div className="excuse-request-info">
        <h3>Basic Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <strong>Request ID:</strong> {excuseRequest._id}
          </div>
          <div className="info-item">
            <strong>Current Status:</strong> {excuseRequest.status}
          </div>
          <div className="info-item">
            <strong>Student Name:</strong> {excuseRequest.studentName}
          </div>
          <div className="info-item">
            <strong>Registration No:</strong> {excuseRequest.regNo}
          </div>
          <div className="info-item">
            <strong>Email:</strong> {excuseRequest.email}
          </div>
          <div className="info-item">
            <strong>Mobile:</strong> {excuseRequest.mobile}
          </div>
          <div className="info-item">
            <strong>Address:</strong> {excuseRequest.address}
          </div>
          <div className="info-item">
            <strong>Level of Study:</strong> {excuseRequest.levelOfStudy}
          </div>
          <div className="info-item">
            <strong>Subject Combination:</strong> {excuseRequest.subjectCombo}
          </div>
          <div className="info-item">
            <strong>Submitted Date:</strong> {new Date(excuseRequest.submittedDate).toLocaleString()}
          </div>
        </div>

        <h3>Absence Details</h3>
        <div className="info-grid">
          <div className="info-item full-width">
            <strong>Reason for Absence:</strong> {excuseRequest.reason}
          </div>
          <div className="info-item full-width">
            <strong>Reason Details:</strong> {excuseRequest.reasonDetails}
          </div>
          <div className="info-item full-width">
            <strong>Lectures Missed:</strong> {excuseRequest.lectureAbsents}
          </div>
        </div>

        {excuseRequest.absences && excuseRequest.absences.length > 0 && (
          <>
            <h3>Periods of Absence</h3>
            <div className="absences-table">
              <div className="absences-header">
                <div>Course Code</div>
                <div>Date</div>
              </div>
              {excuseRequest.absences.map((absence, idx) => (
                <div key={idx} className="absences-row">
                  <div>{absence.courseCode}</div>
                  <div>{absence.date}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {excuseRequest.attachments && (
          <div className="info-item full-width">
            <strong>Medical Form:</strong>{' '}
            <a
              href={`${excuseRequest.attachments}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Medical Form
            </a>
          </div>
        )}

        {/* Approval Actions */}
        {user && excuseRequest.status !== 'Approved' && excuseRequest.status !== 'Rejected' &&
          (user.role === 'Admin' || (workflowStages[excuseRequest.currentStageIndex]?.approverRole === user.role)) && (
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
            excuseRequest.status === "Approved"
              ? workflowStages.length + 1
              : excuseRequest.status === "Submitted"
                ? 0
                : excuseRequest.currentStageIndex + 1
          }
          isRejected={excuseRequest.status === "Rejected"}
        />
      </div>

      <div className="history-section">
        <h3>Approval History</h3>
        {history.length === 0 ? (
          <p>No approval history available for this excuse request.</p>
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

export default ExcuseRequestView;
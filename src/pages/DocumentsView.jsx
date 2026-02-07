import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import ProgressTracker from '../components/ProgressTracker';
import { AuthContext } from '../context/AuthContext';

const DocumentsView = () => {
  const { id } = useParams();
  const { user, token } = useContext(AuthContext);

  const [document, setDocument] = useState(null); // This will hold the Letter object
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workflowStages, setWorkflowStages] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  useEffect(() => {
    const fetchDocumentDetails = async () => {
      if (!id) {
        setError("Document ID is missing from the URL.");
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
      setDocument(null);

      try {
        // Fetch workflow first
        const workflowResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/workflows/Letter`, {
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
            { name: "Pending VC Approval", approverRole: "VC" },
            { name: "Approved", approverRole: null }
          ];
        }
        setWorkflowStages(stages);

        const letterResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/letters/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!letterResponse.ok) {
          if (letterResponse.status === 404) {
            throw new Error("Document not found with this ID.");
          }
          throw new Error(`Failed to fetch document: HTTP status ${letterResponse.status}`);
        }
        const fetchedLetter = await letterResponse.json();

        if (!fetchedLetter) {
          throw new Error("Document not found.");
        }

        // Authorization check
        const userRoleLower = user.role?.toLowerCase();
        const isApprover = stages.some(stage => stage.approverRole?.toLowerCase() === userRoleLower);
        const isAdmin = userRoleLower === 'admin';
        const isOwner = fetchedLetter.studentId === user._id;

        if (!isOwner && !isAdmin && !isApprover) {
          setError("You are not authorized to view this document.");
          setLoading(false);
          return;
        }

        setDocument(fetchedLetter);

        // Generate history from approvals array
        const generatedHistory = [];

        // Add initial submission
        generatedHistory.push({
          stage: 0,
          status: "Submitted",
          timestamp: fetchedLetter.submittedDate,
          updatedBy: fetchedLetter.student,
          comments: 'Initial submission'
        });

        // Add approval stages
        if (fetchedLetter.approvals && fetchedLetter.approvals.length > 0) {
          fetchedLetter.approvals.forEach((approval, index) => {
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
        setHistory(generatedHistory.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
        setLoading(false);

      } catch (err) {
        console.error("Error fetching document:", err);
        setError(`Error loading document: ${err.message}`);
        setLoading(false);
      }
    };

    fetchDocumentDetails();
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
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/letters/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status,
          rejectionReason: status === 'Rejected' ? rejectionReason : undefined
        })
      });

      if (response.ok) {
        alert(`Document ${status.toLowerCase()} successfully.`);
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
      <p style={{ textAlign: 'center', marginTop: '50px', fontSize: '1.5rem' }}>Loading document details...</p>
    );
  }

  if (error) {
    return (
      <div className="error-message" style={{ textAlign: 'center', marginTop: '50px', fontSize: '1.5rem', color: 'red' }}>{error}</div>
    );
  }

  if (!document) {
    return (
      <div className="error-message" style={{ textAlign: 'center', marginTop: '50px', fontSize: '1.5rem', color: 'red' }}>Document not found.</div>
    );
  }

  // Determine if it's a Medical Certificate
  const isMedicalCertificate = document.type === "Medical Certificate";
  const excuseRequestData = document.excuseRequestId || document;

  return (
    <div className="document-container">
      <div className="document-header-row">
        <h1>Document Details ({isMedicalCertificate ? 'Medical Certificate (Excuse Request)' : 'Letter'})</h1>
      </div>

      <div className="document-info">
        <p><strong>Document ID:</strong> {document._id}</p>
        <p><strong>Type:</strong> {document.type}</p>
        <p><strong>Current Status:</strong> {document.status}</p>
        <p><strong>Submitted By:</strong> {document.student}</p>
        <p><strong>Submitted Date:</strong> {new Date(document.submittedDate).toLocaleDateString()}</p>

        {isMedicalCertificate ? (
          <>
            <h3>Excuse Request Details:</h3>
            <p><strong>Student Name:</strong> {excuseRequestData.name || document.student}</p>
            <p><strong>Registration No:</strong> {excuseRequestData.regNo}</p>
            <p><strong>Email:</strong> {excuseRequestData.email}</p>
            <p><strong>Mobile:</strong> {excuseRequestData.mobile}</p>
            <p><strong>Address:</strong> {excuseRequestData.address}</p>
            <p><strong>Level of Study:</strong> {excuseRequestData.levelOfStudy}</p>
            <p><strong>Subject Combination:</strong> {excuseRequestData.subjectCombo}</p>
            <p><strong>Reason for Absence:</strong> {excuseRequestData.reason}</p>
            <p><strong>Reason Details:</strong> {excuseRequestData.reasonDetails}</p>
            <p><strong>Lectures Missed:</strong> {excuseRequestData.lectureAbsents}</p>
            <p><strong>Application Date (Absence):</strong> {new Date(excuseRequestData.date).toLocaleDateString()}</p>
            {excuseRequestData.absences && excuseRequestData.absences.length > 0 && (
              <div>
                <strong>Periods of Absence:</strong>
                <ul>
                  {excuseRequestData.absences.map((abs, idx) => (
                    <li key={idx}>Course Code: {abs.courseCode}, Date(s): {abs.date}</li>
                  ))}
                </ul>
              </div>
            )}
            {document.attachments && (
              <p>
                <strong>Medical Form:</strong> {' '}
                <a href={`${process.env.REACT_APP_BACKEND_URL}/${document.attachments}`} target="_blank" rel="noopener noreferrer">
                  View Medical Form
                </a>
              </p>
            )}
          </>
        ) : (
          <>
            <p><strong>Reason for Request:</strong> {document.reason}</p>
            <p><strong>Date of Absence/Request:</strong> {new Date(document.date).toLocaleDateString()}</p>
            {document.attachments && (
              <p>
                <strong>Attachments:</strong> {' '}
                <a href={`${document.attachments}`} target="_blank" rel="noopener noreferrer">
                  View Attachment
                </a>
              </p>
            )}
            {document.status === "Rejected" && (
              <p><strong>Rejection Reason:</strong> {document.rejectionReason || 'No reason specified'}</p>
            )}
          </>
        )}

        {/* Approval Actions */}
        {user && document.status !== 'Approved' && document.status !== 'Rejected' &&
          (user.role === 'Admin' || (workflowStages[document.currentStageIndex]?.approverRole === user.role)) && (
            <div className="approval-actions-card">
              <h3>Approval Actions</h3>
              <p>You are authorized to review this document.</p>

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
            document.status === "Approved"
              ? workflowStages.length + 1
              : document.status === "Submitted"
                ? 0
                : document.currentStageIndex + 1
          }
          isRejected={document.status === "Rejected"}
        />
      </div>

      <div className="history-section">
        <h3>Approval History</h3>
        {history.length === 0 ? (
          <p>No detailed history available for this document.</p>
        ) : (
          <div className="history-table">
            <div className="history-header">
              <div>Stage</div>
              <div>Status</div>
              <div>Date</div>
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

export default DocumentsView;

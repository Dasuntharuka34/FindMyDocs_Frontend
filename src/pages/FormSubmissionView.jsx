import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import ProgressTracker from '../components/ProgressTracker';
import { AuthContext } from '../context/AuthContext';
import '../styles/pages/FormSubmissionView.css';

const FormSubmissionView = () => {
    const { id } = useParams();
    const { user, token } = useContext(AuthContext);

    const [submission, setSubmission] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [workflowStages, setWorkflowStages] = useState([]);
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectInput, setShowRejectInput] = useState(false);

    const fetchSubmissionDetails = async () => {
        if (!id) {
            setError("Submission ID is missing from the URL.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            // Fetch the submission
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/form-submissions/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error("Form submission not found.");
            }

            const fetchedSubmission = await response.json();
            setSubmission(fetchedSubmission);

            // Fetch workflow stages
            const workflowResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/workflows/${fetchedSubmission.form.name}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (workflowResponse.ok) {
                const workflowData = await workflowResponse.json();
                setWorkflowStages(workflowData.steps || []);
            }

            // Generate history
            const generatedHistory = [];
            generatedHistory.push({
                stage: 0,
                status: "Submitted",
                timestamp: fetchedSubmission.submittedAt,
                updatedBy: fetchedSubmission.submittedBy?.name || 'User',
                comments: 'Initial submission'
            });

            if (fetchedSubmission.approvals && fetchedSubmission.approvals.length > 0) {
                fetchedSubmission.approvals.forEach((approval, index) => {
                    generatedHistory.push({
                        stage: index + 1,
                        status: approval.status.charAt(0).toUpperCase() + approval.status.slice(1),
                        timestamp: approval.approvedAt || new Date(),
                        updatedBy: approval.approverName || approval.approverRole || 'System',
                        comments: approval.comment || `Processed by ${approval.approverRole}`
                    });
                });
            }

            setHistory(generatedHistory.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
            setLoading(false);
        } catch (err) {
            console.error("Error fetching submission:", err);
            setError(err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchSubmissionDetails();
        }
    }, [id, token]);

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
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/form-submissions/${id}/status`, {
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
                alert(`Submission ${status.toLowerCase()} successfully.`);
                setShowRejectInput(false);
                setRejectionReason('');
                fetchSubmissionDetails();
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

    if (loading) return <p className="loading-text">Loading submission details...</p>;
    if (error) return <div className="error-message">{error}</div>;
    if (!submission) return <div className="error-message">Submission not found.</div>;

    const canApprove = user && submission.status !== 'Approved' && submission.status !== 'Rejected' &&
        (user.role === 'Admin' || (workflowStages[submission.currentStageIndex]?.approverRole === user.role));

    return (
        <div className="excuse-request-container">
            <div className="excuse-request-header-row">
                <h1>{submission.form?.name || 'Form Submission'} Details</h1>
            </div>

            <div className="excuse-request-info">
                <h3>Submission Information</h3>
                <div className="info-grid">
                    <div className="info-item">
                        <strong>Submission ID:</strong> {submission._id}
                    </div>
                    <div className="info-item">
                        <strong>Current Status:</strong> {submission.status}
                    </div>
                    <div className="info-item">
                        <strong>Submitted By:</strong> {submission.submittedBy?.name}
                    </div>
                    <div className="info-item">
                        <strong>Submitted Date:</strong> {new Date(submission.submittedAt).toLocaleString()}
                    </div>
                </div>

                <h3>Form Data</h3>
                <div className="info-grid">
                    {Object.entries(submission.data).map(([key, value]) => {
                        const isFile = typeof value === 'string' && value.startsWith('https://') && (value.includes('public.blob.vercel-storage.com') || value.includes('vercel-storage.com'));
                        return (
                            <div key={key} className="info-item full-width">
                                <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong>{' '}
                                {isFile ? (
                                    <a href={value} target="_blank" rel="noopener noreferrer" className="attachment-link">
                                        View Attachment
                                    </a>
                                ) : (
                                    Array.isArray(value) ? value.join(', ') : String(value)
                                )}
                            </div>
                        );
                    })}
                </div>

                {submission.status === 'Rejected' && (
                    <div className="rejection-box">
                        <strong>Reason for Rejection:</strong> {submission.rejectionReason || 'No reason provided.'}
                    </div>
                )}

                {canApprove && (
                    <div className="approval-actions-card">
                        <h3>Approval Actions</h3>
                        <p>You are authorized to review this submission.</p>

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
                        submission.status === "Approved"
                            ? workflowStages.length + 1
                            : submission.status === "Submitted"
                                ? 0
                                : submission.currentStageIndex + 1
                    }
                    isRejected={submission.status === "Rejected"}
                />
            </div>

            <div className="history-section">
                <h3>Approval History</h3>
                {history.length === 0 ? (
                    <p>No approval history available.</p>
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

export default FormSubmissionView;

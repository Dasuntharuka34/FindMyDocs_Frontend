import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/components/RecentRequests.css';

// --- APPROVAL STAGE DEFINITIONS ---
const approvalStages = [
    { name: "Submitted", approverRole: null },
    { name: "Pending Staff Approval", approverRole: "Staff" },
    { name: "Pending Lecturer Approval", approverRole: "Lecturer" },
    { name: "Pending HOD Approval", approverRole: "HOD" },
    { name: "Pending Dean Approval", approverRole: "Dean" },
    { name: "Pending VC Approval", approverRole: "VC" },
    { name: "Approved", approverRole: null },
    { name: "Rejected", approverRole: null }
];

const statusColors = {
    [approvalStages[0].name]: '#808080', // Submitted (Grey)
    [approvalStages[1].name]: '#5bc0de', // Pending Staff Approval (Info Blue)
    [approvalStages[2].name]: '#5bc0de', // Pending Lecturer Approval (Info Blue)
    [approvalStages[3].name]: '#5bc0de', // Pending HOD Approval (Info Blue)
    [approvalStages[4].name]: '#5bc0de', // Pending Dean Approval (Info Blue)
    [approvalStages[5].name]: '#5bc0de', // Pending VC Approval (Info Blue)
    [approvalStages[6].name]: '#5cb85c', // Approved (Success Green)
    [approvalStages[7].name]: '#d9534f'  // Rejected (Danger Red)
};

function RecentRequests({ requests }) {
    return (
        <div className="recent-requests">
            <h2>Recent Requests</h2>
            {requests.length === 0 ? (
                <p>No recent requests to display.</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Reason/Purpose</th>
                            <th>Submitted Date</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map((request) => {
                            const { _id, requestType, type, reason, purpose, submittedDate, status } = request;

                            // Determine the display values based on request type
                            const displayReason = reason || purpose || 'N/A';
                            const formattedSubmittedDate = submittedDate ? new Date(submittedDate).toLocaleDateString() : 'N/A';

                            // Determine the view link based on request type
                            let viewLink = '#';
                            if (requestType === 'Letter') {
                                viewLink = `/documents/${_id}`;
                            } else if (requestType === 'Excuse') {
                                viewLink = `/excuse-request/${_id}`;
                            } else if (requestType === 'Leave') {
                                viewLink = `/leave-request/${_id}`;
                            }

                            return (
                                <tr key={_id}>
                                    <td data-label="Type">
                                        <span className="request-type-badge" data-type={requestType.toLowerCase()}>
                                            {requestType}
                                        </span>
                                    </td>
                                    <td data-label="Reason/Purpose">{displayReason}</td>
                                    <td data-label="Submitted Date">{formattedSubmittedDate}</td>
                                    <td data-label="Status">
                                        <span
                                            className="status-badge"
                                            style={{ backgroundColor: statusColors[status] || '#777' }}
                                        >
                                            {status}
                                        </span>
                                    </td>
                                    <td data-label="Action">
                                        <Link
                                            to={viewLink}
                                            className="view-details-btn"
                                        >
                                            View Details
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default RecentRequests;

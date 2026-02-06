import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import { useRequestFilters } from '../../hooks/useRequestFilters';
import {
  IconButton,
  Tooltip,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField
} from '@mui/material';
import {
  Visibility as ViewIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon
} from '@mui/icons-material';

const MessageModal = ({ show, title, message, onConfirm, onCancel }) => {
  return (
    <Dialog open={show} onClose={onCancel}>
      <DialogTitle sx={{ fontWeight: 'bold' }}>{title}</DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        {onCancel && <Button onClick={onCancel} color="inherit">Cancel</Button>}
        <Button onClick={onConfirm || onCancel} variant="contained" color="primary">
          {onConfirm ? 'Confirm' : 'Okay'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default function RegistrationApprovalPage() {
  const { user } = useContext(AuthContext);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [viewingRegistration, setViewingRegistration] = useState(null);
  const [confirmationRequest, setConfirmationRequest] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });

  const {
    searchTerm,
    setSearchTerm,
    sortField,
    setSortField,
    sortOrder,
    setSortOrder,
    applyFiltersAndSorting,
  } = useRequestFilters(
    'submittedAt',
    'desc',
    ['name', 'email', 'role', 'nic', 'indexNumber', 'department']
  );


  const closeMessageModal = () => {
    setMessageModal({ show: false, title: '', message: '' });
  };

  const fetchPendingRegistrations = React.useCallback(async () => {
    try {
      const response = await api.get('/users/registrations/pending');
      setPendingRegistrations(response.data);
    } catch (error) {
      console.error("Error fetching pending registrations:", error);
      setMessageModal({ show: true, title: 'Error', message: `Failed to load pending registrations: ${error.message}`, onConfirm: closeMessageModal });
    }
  }, []);

  useEffect(() => {
    if (user && user.role === 'Admin') {
      fetchPendingRegistrations();
    }
  }, [user, fetchPendingRegistrations]);

  const handleRegistrationAction = async (registrationId, action, reason = '') => {
    try {
      let response;
      if (action === 'approve') {
        response = await api.post(`/users/registrations/${registrationId}/approve`);
      } else if (action === 'reject') {
        if (reason.trim() === '') {
          setMessageModal({ show: true, title: 'Input Required', message: 'Please provide a reason for rejection.', onConfirm: closeMessageModal });
          return;
        }
        response = await api.delete(`/users/registrations/${registrationId}/reject`);
      } else {
        return;
      }

      setMessageModal({ show: true, title: 'Success', message: response.data.message, onConfirm: closeMessageModal });
      fetchPendingRegistrations();

      setConfirmationRequest(null);
      setConfirmAction(null);
      setRejectionReason('');

    } catch (error) {
      console.error(`Error handling registration ${action}:`, error);
      setMessageModal({ show: true, title: 'Error', message: error.response?.data?.message || `Network error during ${action} registration.`, onConfirm: closeMessageModal });
    }
  };

  const openViewingModal = (reg) => {
    setViewingRegistration(reg);
  };

  const openConfirmationModal = (req, action) => {
    setConfirmationRequest(req);
    setConfirmAction(action);
    setViewingRegistration(null);
  };

  if (!user || user.role !== 'Admin') {
    return <p style={{ textAlign: 'center', marginTop: '50px', fontSize: '1.5rem', color: 'red' }}>Access Denied! You do not have administrator privileges.</p>;
  }

  return (
    <div className="admin-dashboard">

      <section className="admin-section">
        <h3>📥 Pending Registrations ({pendingRegistrations.length})</h3>
        <div className="requests-controls">
          <input
            type="text"
            placeholder="Search registrations..."
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
            <option value="submittedAt-desc">Date (Newest First)</option>
            <option value="submittedAt-asc">Date (Oldest First)</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="email-asc">Email (A-Z)</option>
            <option value="email-desc">Email (Z-A)</option>
          </select>
        </div>
        {applyFiltersAndSorting(pendingRegistrations).length === 0 ? (
          <p>No new registration requests pending approval.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Submitted At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {applyFiltersAndSorting(pendingRegistrations).map(reg => (
                <tr key={reg._id}>
                  <td>{reg.name}</td>
                  <td>{reg.email}</td>
                  <td>{reg.role}</td>
                  <td>{new Date(reg.submittedAt).toLocaleDateString()}</td>
                  <td>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => openViewingModal(reg)} color="primary">
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Approve">
                        <IconButton size="small" onClick={() => openConfirmationModal(reg, 'approve')} color="success">
                          <ApproveIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reject">
                        <IconButton size="small" onClick={() => openConfirmationModal(reg, 'reject')} color="error">
                          <RejectIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {viewingRegistration && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Registration Request Details</h3>
            <p><strong>Name:</strong> {viewingRegistration.name}</p>
            <p><strong>Email:</strong> {viewingRegistration.email}</p>
            <p><strong>NIC:</strong> {viewingRegistration.nic}</p>
            <p><strong>Role:</strong> {viewingRegistration.role}</p>
            <p><strong>Index Number:</strong> {viewingRegistration.indexNumber || 'N/A'}</p>
            <p><strong>Department:</strong> {viewingRegistration.department || 'N/A'}</p>
            <p><strong>Submitted At:</strong> {new Date(viewingRegistration.submittedAt).toLocaleString()}</p>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
              <Button variant="contained" color="success" onClick={() => openConfirmationModal(viewingRegistration, 'approve')}>
                Approve
              </Button>
              <Button variant="contained" color="error" onClick={() => openConfirmationModal(viewingRegistration, 'reject')}>
                Reject
              </Button>
              <Button variant="outlined" color="inherit" onClick={() => setViewingRegistration(null)}>
                Close
              </Button>
            </Box>
          </div>
        </div>
      )}

      {confirmationRequest && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Confirm {confirmAction === 'approve' ? 'Approval' : 'Rejection'}</h3>
            <p>
              Are you sure you want to <strong>{confirmAction}</strong> the registration request for <strong>{confirmationRequest.name}</strong> ({confirmationRequest.email})?
            </p>
            {confirmAction === 'reject' && (
              <Box sx={{ mt: 2 }}>
                <TextField
                  label="Reason for Rejection (optional)"
                  multiline
                  rows={3}
                  fullWidth
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  variant="outlined"
                />
              </Box>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
              <Button
                variant="contained"
                color={confirmAction === 'approve' ? 'success' : 'error'}
                onClick={() => handleRegistrationAction(confirmationRequest._id, confirmAction, rejectionReason)}
              >
                Confirm
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => {
                  setConfirmationRequest(null);
                  setConfirmAction(null);
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
            </Box>
          </div>
        </div>
      )}

      <MessageModal
        show={messageModal.show}
        title={messageModal.title}
        message={messageModal.message}
        onConfirm={messageModal.onConfirm}
      />
    </div>
  );
}

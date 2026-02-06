import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  CircularProgress,
  IconButton,
  Typography,
  Box
} from '@mui/material';
import { Close as CloseIcon, Edit as EditIcon, Delete as DeleteIcon, LockReset as ResetIcon } from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import { useRequestFilters } from '../../hooks/useRequestFilters';

// Custom Dialog for notifications/confirmations
const StatusDialog = ({ open, title, message, onConfirm, onCancel, type = 'info' }) => (
  <Dialog open={open} onClose={onCancel}>
    <DialogTitle sx={{ fontWeight: 'bold' }}>{title}</DialogTitle>
    <DialogContent>
      <Typography>{message}</Typography>
    </DialogContent>
    <DialogActions sx={{ p: 2 }}>
      {onCancel && <Button onClick={onCancel} color="inherit">Cancel</Button>}
      <Button onClick={onConfirm || onCancel} variant="contained" color={type === 'error' ? 'error' : 'primary'}>
        {onConfirm ? 'Confirm' : 'Okay'}
      </Button>
    </DialogActions>
  </Dialog>
);

const EditUserModal = ({ open, user, onClose, onSave, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    mobile: '',
    department: '',
    indexNumber: '',
    nic: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || '',
        mobile: user.mobile || '',
        department: user.department || '',
        indexNumber: user.indexNumber || '',
        nic: user.nic || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold', background: '#f5f5f5' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          Edit User Profile
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="name"
                label="Full Name"
                fullWidth
                variant="outlined"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="email"
                label="Email Address"
                fullWidth
                variant="outlined"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="nic"
                label="NIC Number"
                fullWidth
                variant="outlined"
                value={formData.nic}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="mobile"
                label="Mobile Number"
                fullWidth
                variant="outlined"
                value={formData.mobile}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="role"
                label="User Role"
                select
                fullWidth
                variant="outlined"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <MenuItem value="Student">Student</MenuItem>
                <MenuItem value="Lecturer">Lecturer</MenuItem>
                <MenuItem value="HOD">HOD</MenuItem>
                <MenuItem value="Dean">Dean</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="department"
                label="Department"
                fullWidth
                variant="outlined"
                value={formData.department}
                onChange={handleChange}
              />
            </Grid>
            {formData.role === 'Student' && (
              <Grid item xs={12}>
                <TextField
                  name="indexNumber"
                  label="Index/Registration Number"
                  fullWidth
                  variant="outlined"
                  value={formData.indexNumber}
                  onChange={handleChange}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, background: '#f5f5f5' }}>
          <Button onClick={onClose} color="inherit">Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{ px: 4 }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default function UserManagementPage() {
  const { user: currentUser, token } = useContext(AuthContext);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, user: null });
  const [statusDialog, setStatusDialog] = useState({ open: false, title: '', message: '', type: 'info', onConfirm: null });

  const {
    searchTerm,
    setSearchTerm,
    sortField,
    setSortField,
    sortOrder,
    setSortOrder,
    applyFiltersAndSorting,
  } = useRequestFilters('name', 'asc', ['name', 'email', 'role', 'nic']);

  const showStatus = useCallback((title, message, type = 'info', onConfirm = null) => {
    setStatusDialog({
      open: true,
      title,
      message,
      type,
      onConfirm: onConfirm ? async () => { await onConfirm(); closeStatus(); } : null
    });
  }, []);

  const fetchApprovedUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setApprovedUsers(data);
    } catch (error) {
      console.error("Error fetching approved users:", error);
      showStatus('Error', `Failed to load approved users: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [token, showStatus]);

  useEffect(() => {
    if (token) fetchApprovedUsers();
  }, [token, fetchApprovedUsers]);

  const closeStatus = () => {
    setStatusDialog(prev => ({ ...prev, open: false }));
  };

  const handleEditClick = (userToEdit) => {
    setEditModal({ open: true, user: userToEdit });
  };

  const handleSaveUser = async (updatedData) => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users/${editModal.user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }

      await fetchApprovedUsers();
      setEditModal({ open: false, user: null });
      showStatus('Success', 'User profile updated successfully.');
    } catch (error) {
      console.error("Error editing user:", error);
      showStatus('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (userIdToDelete, userName) => {
    showStatus(
      'Confirm Deletion',
      `Are you sure you want to delete user ${userName}? This action cannot be undone.`,
      'error',
      async () => {
        try {
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users/${userIdToDelete}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete user');
          }
          await fetchApprovedUsers();
          showStatus('Success', `User ${userName} deleted successfully.`);
        } catch (error) {
          showStatus('Error', error.message, 'error');
        }
      }
    );
  };

  const handleResetPassword = (userId, userName) => {
    showStatus(
      'Confirm Reset',
      `Reset password for ${userName} to the default value ('password123')?`,
      'info',
      async () => {
        try {
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users/${userId}/reset-password`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`
            },
          });
          const data = await response.json();
          showStatus(response.ok ? 'Success' : 'Error', data.message);
        } catch (error) {
          showStatus('Error', 'Network error during password reset', 'error');
        }
      }
    );
  };

  if (!currentUser || currentUser.role !== 'Admin') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <Typography color="error" variant="h5">Access Denied! Administrator privileges required.</Typography>
      </Box>
    );
  }

  const filteredUsers = applyFiltersAndSorting(approvedUsers);

  return (
    <div className="admin-dashboard">
      <section className="admin-section">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: "var(--text-h2)" }}>
            👥 Approved Users ({approvedUsers.length})
          </Typography>
        </Box>

        <div className="requests-controls">
          <input
            type="text"
            placeholder="Search users by name, email, or NIC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            style={{ flex: 1 }}
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
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="email-asc">Email (A-Z)</option>
            <option value="email-desc">Email (Z-A)</option>
            <option value="role-asc">Role (A-Z)</option>
            <option value="role-desc">Role (Z-A)</option>
          </select>
        </div>

        {filteredUsers.length === 0 ? (
          <Box p={4} textAlign="center">
            <Typography variant="body1" color="textSecondary">No approved users found matching your criteria.</Typography>
          </Box>
        ) : (
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>NIC</th>
                  <th>Role</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u._id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.nic}</td>
                    <td>{u.role}</td>
                    <td>
                      <Box display="flex" gap={1}>
                        <IconButton onClick={() => handleEditClick(u)} color="primary" title="Edit User" size="small">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton onClick={() => handleResetPassword(u._id, u.name)} color="secondary" title="Reset Password" size="small">
                          <ResetIcon fontSize="small" />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteUser(u._id, u.name)} color="error" title="Delete User" size="small">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modern Edit User Modal */}
      <EditUserModal
        open={editModal.open}
        user={editModal.user}
        onClose={() => setEditModal({ open: false, user: null })}
        onSave={handleSaveUser}
        loading={loading}
      />

      {/* Global Status/Confirm Dialog */}
      <StatusDialog
        open={statusDialog.open}
        title={statusDialog.title}
        message={statusDialog.message}
        type={statusDialog.type}
        onConfirm={statusDialog.onConfirm}
        onCancel={closeStatus}
      />
    </div>
  );
}

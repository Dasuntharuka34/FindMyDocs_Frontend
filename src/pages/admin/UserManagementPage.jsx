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
  Box,
  Checkbox,
  Tooltip,
  Paper,
  Stack,
  Divider,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LockReset as ResetIcon,
  UploadFile as UploadIcon,
  History as HistoryIcon,
  GroupAdd as GroupAddIcon,
  Block as BlockIcon,
  CheckCircle as ActiveIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import { useRequestFilters } from '../../hooks/useRequestFilters';
import BulkUserImport from '../../components/admin/BulkUserImport';
import UserActivityHistory from '../../components/admin/UserActivityHistory';

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

const EditUserModal = ({ open, user, departments, roles, onClose, onSave, loading }) => {
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
                {roles.map(role => (
                  <MenuItem key={role._id} value={role.name}>{role.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Department</InputLabel>
                <Select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  label="Department"
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {departments.map(dept => (
                    <MenuItem key={dept._id} value={dept.name}>{dept.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {formData.role?.toLowerCase() === 'student' && (
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
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [editModal, setEditModal] = useState({ open: false, user: null });
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [historyModal, setHistoryModal] = useState({ open: false, user: null });
  const [statusDialog, setStatusDialog] = useState({ open: false, title: '', message: '', type: 'info', onConfirm: null });
  const [bulkRoleModal, setBulkRoleModal] = useState({ open: false, role: '' });

  // Bulk Selection State
  const [selectedUsers, setSelectedUsers] = useState([]);

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

  const fetchRoles = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/roles`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  }, [token]);

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
    if (token) {
      fetchApprovedUsers();
      fetchRoles();
    }
  }, [token, fetchApprovedUsers, fetchRoles]);

  const closeStatus = () => {
    setStatusDialog(prev => ({ ...prev, open: false }));
  };

  const handleEditClick = (userToEdit) => {
    setEditModal({ open: true, user: userToEdit });
  };

  const handleHistoryClick = (userToView) => {
    setHistoryModal({ open: true, user: userToView });
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
      `Reset password for ${userName} to the system default password?`,
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

  // Bulk Actions Logic
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(filteredUsers.map(u => u._id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (id) => {
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter(uId => uId !== id));
    } else {
      setSelectedUsers([...selectedUsers, id]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedUsers.length === 0) return;

    showStatus(
      'Confirm Bulk Deletion',
      `Are you sure you want to delete ${selectedUsers.length} users? This action cannot be undone.`,
      'error',
      async () => {
        try {
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users/bulk-delete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ userIds: selectedUsers })
          });

          if (!response.ok) throw new Error('Bulk delete failed');

          await fetchApprovedUsers();
          setSelectedUsers([]);
          showStatus('Success', 'Selected users deleted successfully.');
        } catch (error) {
          showStatus('Error', error.message, 'error');
        }
      }
    );
  };

  const handleBulkResetPassword = () => {
    if (selectedUsers.length === 0) return;

    showStatus(
      'Confirm Bulk Reset',
      `Reset passwords for ${selectedUsers.length} users to the system default password?`,
      'warning',
      async () => {
        try {
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users/bulk-reset-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ userIds: selectedUsers })
          });

          if (!response.ok) throw new Error('Bulk reset failed');

          await fetchApprovedUsers();
          setSelectedUsers([]);
          showStatus('Success', 'Passwords reset successfully to the default password.');
        } catch (error) {
          showStatus('Error', error.message, 'error');
        }
      }
    );
  };

  const handleBulkRoleUpdate = async () => {
    if (selectedUsers.length === 0 || !bulkRoleModal.role) return;

    // Close modal first
    setBulkRoleModal(prev => ({ ...prev, open: false }));

    showStatus(
      'Confirm Bulk Role Update',
      `Update role to ${bulkRoleModal.role} for ${selectedUsers.length} users?`,
      'warning',
      async () => {
        try {
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users/bulk-update-roles`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ userIds: selectedUsers, role: bulkRoleModal.role })
          });

          if (!response.ok) throw new Error('Bulk role update failed');

          await fetchApprovedUsers();
          setSelectedUsers([]);
          setBulkRoleModal({ open: false, role: '' });
          showStatus('Success', 'Roles updated successfully.');
        } catch (error) {
          showStatus('Error', error.message, 'error');
        }
      }
    );
  };

  const handleToggleStatus = (userId, userName, currentStatus) => {
    const action = currentStatus ? 'Suspend' : 'Activate';
    showStatus(
      `Confirm ${action}`,
      `Are you sure you want to ${action.toLowerCase()} account for ${userName}?`,
      currentStatus ? 'warning' : 'info',
      async () => {
        try {
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users/${userId}/toggle-status`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (!response.ok) throw new Error(`Failed to ${action.toLowerCase()} user`);

          await fetchApprovedUsers();
          showStatus('Success', `User ${userName} has been ${action.toLowerCase()}d.`);
        } catch (error) {
          showStatus('Error', error.message, 'error');
        }
      }
    );
  };

  const handleImportSuccess = () => {
    setImportModalOpen(false);
    fetchApprovedUsers();
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
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setImportModalOpen(true)}
          >
            Import Users
          </Button>
        </Box>

        {/* Bulk Action Toolbar */}
        {selectedUsers.length > 0 && (
          <Paper sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#e3f2fd' }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {selectedUsers.length} selected
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<GroupAddIcon />}
              onClick={() => setBulkRoleModal({ open: true, role: '' })}
            >
              Update Role
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<DeleteIcon />}
              onClick={handleBulkDelete}
            >
              Delete Selected
            </Button>
            <Button
              variant="outlined"
              color="warning"
              size="small"
              startIcon={<ResetIcon />}
              onClick={handleBulkResetPassword}
            >
              Reset Passwords
            </Button>
          </Paper>
        )}

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
                  <th style={{ width: 50 }}>
                    <Checkbox
                      checked={filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                      indeterminate={selectedUsers.length > 0 && selectedUsers.length < filteredUsers.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>NIC</th>
                  <th>Role</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u._id} className={selectedUsers.includes(u._id) ? 'selected-row' : ''}>
                    <td>
                      <Checkbox
                        checked={selectedUsers.includes(u._id)}
                        onChange={() => handleSelectUser(u._id)}
                      />
                    </td>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.nic}</td>
                    <td>
                      <span className={`role-badge ${u.role.toLowerCase()}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Activity History">
                          <IconButton onClick={() => handleHistoryClick(u)} size="small" color="info">
                            <HistoryIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={u.isActive !== false ? "Suspend User" : "Activate User"}>
                          <IconButton
                            onClick={() => handleToggleStatus(u._id, u.name, u.isActive !== false)}
                            color={u.isActive !== false ? "success" : "default"}
                            size="small"
                          >
                            {u.isActive !== false ? <ActiveIcon fontSize="small" /> : <BlockIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit User">
                          <IconButton onClick={() => handleEditClick(u)} color="primary" size="small">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reset Password">
                          <IconButton onClick={() => handleResetPassword(u._id, u.name)} color="warning" size="small">
                            <ResetIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete User">
                          <IconButton onClick={() => handleDeleteUser(u._id, u.name)} color="error" size="small">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
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
        departments={departments}
        roles={roles}
        onClose={() => setEditModal({ open: false, user: null })}
        onSave={handleSaveUser}
        loading={loading}
      />

      {/* Bulk Import Modal */}
      <BulkUserImport
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />

      {/* Bulk Role Update Modal */}
      <Dialog open={bulkRoleModal.open} onClose={() => setBulkRoleModal({ open: false, role: '' })} maxWidth="xs" fullWidth>
        <DialogTitle>Update Roles</DialogTitle>
        <DialogContent dividers>
          <TextField
            select
            label="New Role"
            fullWidth
            value={bulkRoleModal.role}
            onChange={(e) => setBulkRoleModal({ ...bulkRoleModal, role: e.target.value })}
          >
            {roles.map(role => (
              <MenuItem key={role._id} value={role.name}>{role.name}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkRoleModal({ open: false, role: '' })}>Cancel</Button>
          <Button onClick={handleBulkRoleUpdate} variant="contained" disabled={!bulkRoleModal.role}>Update</Button>
        </DialogActions>
      </Dialog>

      {/* Activity History Modal */}
      <UserActivityHistory
        open={historyModal.open}
        user={historyModal.user}
        onClose={() => setHistoryModal({ open: false, user: null })}
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

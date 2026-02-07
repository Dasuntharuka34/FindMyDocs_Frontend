import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Grid,
    CircularProgress,
    FormControlLabel,
    Checkbox,
    Chip,
    Divider,
    Card,
    CardContent
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Security as SecurityIcon,
    VpnKey as PermissionIcon,
    Restore as RestoreIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import MessageModal from '../../components/MessageModal';
import Footer from '../../components/Footer';

const PERMISSIONS = [
    'VIEW_ANALYTICS',
    'MANAGE_USERS',
    'MANAGE_SYSTEM_CONFIG',
    'MANAGE_DEPARTMENTS',
    'MANAGE_EMAIL_TEMPLATES',
    'SEND_BULK_EMAILS',
    'VIEW_EMAIL_LOGS',
    'MANAGE_DATABASE',
    'CLEANUP_DATA',
    'MANAGE_AUTO_APPROVAL',
    'MANAGE_FORMS',
    'VIEW_AUDIT_LOGS',
    'APPROVE_REGISTRATIONS'
];

const RoleManagementPage = () => {
    const { token } = useContext(AuthContext);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [currentRole, setCurrentRole] = useState(null);
    const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        permissions: []
    });

    const fetchRoles = useCallback(async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/roles`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch roles');
            const data = await response.json();
            setRoles(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchRoles();
        }
    }, [token, fetchRoles]);

    const handleOpenDialog = (role = null) => {
        if (role) {
            setCurrentRole(role);
            setFormData({
                name: role.name,
                description: role.description || '',
                permissions: role.permissions || []
            });
        } else {
            setCurrentRole(null);
            setFormData({
                name: '',
                description: '',
                permissions: []
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setCurrentRole(null);
    };

    const handlePermissionChange = (perm) => {
        const newPermissions = formData.permissions.includes(perm)
            ? formData.permissions.filter(p => p !== perm)
            : [...formData.permissions, perm];
        setFormData({ ...formData, permissions: newPermissions });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const url = currentRole
                ? `${process.env.REACT_APP_BACKEND_URL}/api/roles/${currentRole._id}`
                : `${process.env.REACT_APP_BACKEND_URL}/api/roles`;

            const method = currentRole ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Error saving role');

            setOpenDialog(false);
            setMessageModal({
                show: true,
                title: 'Success',
                message: `Role ${currentRole ? 'updated' : 'created'} successfully!`,
                onConfirm: () => { setMessageModal({ show: false }); fetchRoles(); }
            });
        } catch (error) {
            setMessageModal({ show: true, title: 'Error', message: error.message, onConfirm: () => setMessageModal({ show: false }) });
        } finally {
            setLoading(false);
        }
    };

    const handleInitialize = async () => {
        if (!window.confirm('This will reset system roles and permissions to defaults. Continue?')) return;
        setLoading(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/roles/initialize`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                fetchRoles();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this role?')) return;
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/roles/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete role');
            }
            fetchRoles();
        } catch (error) {
            setMessageModal({ show: true, title: 'Error', message: error.message, onConfirm: () => setMessageModal({ show: false }) });
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Box sx={{ flex: 1, p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <SecurityIcon color="primary" fontSize="large" />
                        <Typography variant="h4" fontWeight="bold">Role & Permission Management</Typography>
                    </Box>
                    <Box gap={1} display="flex">
                        <Button variant="outlined" startIcon={<RestoreIcon />} onClick={handleInitialize}>Reset Roles</Button>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>Add New Role</Button>
                    </Box>
                </Box>

                <Grid container spacing={3}>
                    {roles.map((role) => (
                        <Grid item xs={12} md={6} lg={4} key={role._id}>
                            <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                        <Typography variant="h6" fontWeight="bold" color="primary">
                                            {role.name}
                                            {role.isSystemRole && <Chip label="System" size="small" variant="outlined" sx={{ ml: 1, fontSize: '0.6rem' }} />}
                                        </Typography>
                                        <Box>
                                            <IconButton size="small" onClick={() => handleOpenDialog(role)} color="primary"><EditIcon /></IconButton>
                                            {!role.isSystemRole && <IconButton size="small" onClick={() => handleDelete(role._id)} color="error"><DeleteIcon /></IconButton>}
                                        </Box>
                                    </Box>
                                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                        {role.description || "No description provided."}
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                    <Typography variant="caption" fontWeight="bold" display="block" mb={1}>Permissions ({role.permissions.length}):</Typography>
                                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                                        {role.permissions.length === 0 ? (
                                            <Typography variant="caption" color="textSecondary">No special permissions.</Typography>
                                        ) : (
                                            role.permissions.map(p => (
                                                <Chip key={p} label={p} size="small" color="secondary" variant="outlined" />
                                            ))
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            {/* Add/Edit Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>{currentRole ? 'Edit Role' : 'Add New Role'}</DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent dividers>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    name="name"
                                    label="Role Name"
                                    fullWidth
                                    required
                                    disabled={currentRole?.isSystemRole}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    name="description"
                                    label="Description"
                                    fullWidth
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" gutterBottom fontWeight="bold" display="flex" alignItems="center" gap={1}>
                                    <PermissionIcon fontSize="small" /> Assign Permissions
                                </Typography>
                                <Paper variant="outlined" sx={{ p: 2, maxHeight: '400px', overflowY: 'auto' }}>
                                    <Grid container>
                                        {PERMISSIONS.map((perm) => (
                                            <Grid item xs={12} sm={6} md={4} key={perm}>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={formData.permissions.includes(perm)}
                                                            onChange={() => handlePermissionChange(perm)}
                                                        />
                                                    }
                                                    label={<Typography variant="caption">{perm.replace(/_/g, ' ')}</Typography>}
                                                />
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Paper>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={loading}>
                            {loading ? <CircularProgress size={24} /> : 'Save Role'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            <MessageModal
                show={messageModal.show}
                title={messageModal.title}
                message={messageModal.message}
                onConfirm={messageModal.onConfirm}
            />
            <Footer />
        </Box>
    );
};

export default RoleManagementPage;

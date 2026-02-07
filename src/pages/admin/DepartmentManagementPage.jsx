import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Grid,
    CircularProgress,
    Tooltip,
    Switch,
    FormControlLabel,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Chip
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Business as BusinessIcon,
    Person as PersonIcon,
    CheckCircle as ActiveIcon,
    Cancel as InactiveIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import MessageModal from '../../components/MessageModal';
import Footer from '../../components/Footer';

const DepartmentManagementPage = () => {
    const { token } = useContext(AuthContext);
    const [departments, setDepartments] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [currentDept, setCurrentDept] = useState(null);
    const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        hod: '',
        isActive: true
    });

    const fetchDepartments = useCallback(async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/departments/admin`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch departments');
            const data = await response.json();
            setDepartments(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    const fetchUsers = useCallback(async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            console.error(error);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchDepartments();
            fetchUsers();
        }
    }, [token, fetchDepartments, fetchUsers]);

    const handleOpenDialog = (dept = null) => {
        if (dept) {
            setCurrentDept(dept);
            setFormData({
                name: dept.name,
                code: dept.code,
                description: dept.description || '',
                hod: dept.hod?._id || '',
                isActive: dept.isActive
            });
        } else {
            setCurrentDept(null);
            setFormData({
                name: '',
                code: '',
                description: '',
                hod: '',
                isActive: true
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setCurrentDept(null);
    };

    const handleChange = (e) => {
        const { name, value, checked, type } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const url = currentDept
                ? `${process.env.REACT_APP_BACKEND_URL}/api/departments/${currentDept._id}`
                : `${process.env.REACT_APP_BACKEND_URL}/api/departments`;

            const method = currentDept ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Error saving department');

            setOpenDialog(false);
            setMessageModal({
                show: true,
                title: 'Success',
                message: `Department ${currentDept ? 'updated' : 'created'} successfully!`,
                onConfirm: () => { setMessageModal({ show: false }); fetchDepartments(); }
            });
        } catch (error) {
            setMessageModal({ show: true, title: 'Error', message: error.message, onConfirm: () => setMessageModal({ show: false }) });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this department?')) return;
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/departments/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to delete department');
            fetchDepartments();
        } catch (error) {
            setMessageModal({ show: true, title: 'Error', message: error.message, onConfirm: () => setMessageModal({ show: false }) });
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Box sx={{ flex: 1, p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <BusinessIcon color="primary" fontSize="large" />
                        <Typography variant="h4" fontWeight="bold">Department Management</Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                    >
                        Add Department
                    </Button>
                </Box>

                <TableContainer component={Paper} elevation={2}>
                    <Table>
                        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell><strong>Code</strong></TableCell>
                                <TableCell><strong>Department Name</strong></TableCell>
                                <TableCell><strong>HOD</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell align="right"><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} align="center"><CircularProgress size={30} /></TableCell></TableRow>
                            ) : departments.length === 0 ? (
                                <TableRow><TableCell colSpan={5} align="center">No departments found.</TableCell></TableRow>
                            ) : (
                                departments.map((dept) => (
                                    <TableRow key={dept._id} hover>
                                        <TableCell><Chip label={dept.code} color="primary" variant="outlined" size="small" /></TableCell>
                                        <TableCell>{dept.name}</TableCell>
                                        <TableCell>
                                            {dept.hod ? (
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <PersonIcon fontSize="small" color="action" />
                                                    {dept.hod.name}
                                                </Box>
                                            ) : 'Not Assigned'}
                                        </TableCell>
                                        <TableCell>
                                            {dept.isActive ? (
                                                <Chip icon={<ActiveIcon />} label="Active" color="success" size="small" />
                                            ) : (
                                                <Chip icon={<InactiveIcon />} label="Inactive" color="default" size="small" />
                                            )}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Edit">
                                                <IconButton onClick={() => handleOpenDialog(dept)} color="primary">
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton onClick={() => handleDelete(dept._id)} color="error">
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* Add/Edit Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{currentDept ? 'Edit Department' : 'Add New Department'}</DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent dividers>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    name="code"
                                    label="Dept Code"
                                    fullWidth
                                    required
                                    value={formData.code}
                                    onChange={handleChange}
                                    placeholder="e.g. CS"
                                />
                            </Grid>
                            <Grid item xs={12} sm={8}>
                                <TextField
                                    name="name"
                                    label="Department Name"
                                    fullWidth
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Computer Science"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    name="description"
                                    label="Description"
                                    fullWidth
                                    multiline
                                    rows={2}
                                    value={formData.description}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel>Head of Department (HOD)</InputLabel>
                                    <Select
                                        name="hod"
                                        value={formData.hod}
                                        label="Head of Department (HOD)"
                                        onChange={handleChange}
                                    >
                                        <MenuItem value=""><em>None</em></MenuItem>
                                        {users.filter(u => ['HOD', 'Lecturer', 'Dean', 'Admin'].includes(u.role)).map(user => (
                                            <MenuItem key={user._id} value={user._id}>{user.name} ({user.role})</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={<Switch checked={formData.isActive} onChange={handleChange} name="isActive" />}
                                    label="Department Active"
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={loading}>
                            {loading ? <CircularProgress size={24} /> : 'Save Department'}
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

export default DepartmentManagementPage;

import React, { useState, useEffect, useContext } from 'react';
import {
    Box,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    FormControlLabel,
    Chip,
    Tabs,
    Tab
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Description as DescriptionIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import MessageModal from '../../components/MessageModal';
import Footer from '../../components/Footer';

const TemplateManagementPage = () => {
    const { token } = useContext(AuthContext);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('All'); // All, Excuse, Leave, Letter

    // Modal State
    const [openModal, setOpenModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState({
        name: '',
        type: 'Excuse',
        subject: '',
        body: '',
        placeholders: '', // Comma separated string for input
        isActive: true
    });

    const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });

    useEffect(() => {
        fetchTemplates();
    }, [filterType]);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            let url = `${process.env.REACT_APP_BACKEND_URL}/api/request-templates`;
            if (filterType !== 'All') {
                url += `?type=${filterType}`;
            }

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch templates');
            const data = await response.json();
            setTemplates(data);
        } catch (error) {
            console.error(error);
            // setMessageModal({ show: true, title: 'Error', message: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (template = null) => {
        if (template) {
            setIsEditing(true);
            setCurrentTemplate({
                ...template,
                placeholders: template.placeholders.join(', ')
            });
        } else {
            setIsEditing(false);
            setCurrentTemplate({
                name: '',
                type: 'Excuse',
                subject: '',
                body: '',
                placeholders: '',
                isActive: true
            });
        }
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
    };

    const handleSaveTemplate = async () => {
        try {
            const placeholdersArray = currentTemplate.placeholders
                .split(',')
                .map(p => p.trim())
                .filter(p => p !== '');

            const payload = {
                ...currentTemplate,
                placeholders: placeholdersArray
            };

            const url = isEditing
                ? `${process.env.REACT_APP_BACKEND_URL}/api/request-templates/${currentTemplate._id}`
                : `${process.env.REACT_APP_BACKEND_URL}/api/request-templates`;

            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to save template');

            fetchTemplates();
            handleCloseModal();
            setMessageModal({ show: true, title: 'Success', message: `Template ${isEditing ? 'updated' : 'created'} successfully`, onConfirm: () => setMessageModal({ show: false }) });

        } catch (error) {
            setMessageModal({ show: true, title: 'Error', message: error.message, onConfirm: () => setMessageModal({ show: false }) });
        }
    };

    const handleDeleteTemplate = async (id) => {
        if (!window.confirm('Are you sure you want to delete this template?')) return;

        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/request-templates/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to delete template');

            fetchTemplates();
        } catch (error) {
            console.error(error);
            setMessageModal({ show: true, title: 'Error', message: error.message, onConfirm: () => setMessageModal({ show: false }) });
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/request-templates/${id}/toggle-status`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to update status');
            fetchTemplates();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Box sx={{ flex: 1, p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <DescriptionIcon color="primary" fontSize="large" />
                        <Typography variant="h4" fontWeight="bold">Template Management</Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenModal()}
                        sx={{ backgroundColor: '#1a237e' }}
                    >
                        Create Template
                    </Button>
                </Box>

                <Paper elevation={0} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={filterType}
                        onChange={(e, val) => setFilterType(val)}
                        indicatorColor="primary"
                        textColor="primary"
                    >
                        <Tab label="All" value="All" />
                        <Tab label="Excuse" value="Excuse" />
                        <Tab label="Leave" value="Leave" />
                        <Tab label="Letter" value="Letter" />
                    </Tabs>
                </Paper>

                <TableContainer component={Paper} elevation={2}>
                    <Table>
                        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell><strong>Name</strong></TableCell>
                                <TableCell><strong>Type</strong></TableCell>
                                <TableCell><strong>Subject</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell align="right"><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} align="center">Loading...</TableCell></TableRow>
                            ) : templates.length === 0 ? (
                                <TableRow><TableCell colSpan={5} align="center">No templates found.</TableCell></TableRow>
                            ) : (
                                templates.map((template) => (
                                    <TableRow key={template._id} hover>
                                        <TableCell>{template.name}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={template.type}
                                                size="small"
                                                color={template.type === 'Excuse' ? 'warning' : template.type === 'Leave' ? 'info' : 'secondary'}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>{template.subject || '-'}</TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={template.isActive}
                                                onChange={() => handleToggleStatus(template._id)}
                                                color="primary"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton onClick={() => handleOpenModal(template)} color="primary"><EditIcon /></IconButton>
                                            <IconButton onClick={() => handleDeleteTemplate(template._id)} color="error"><DeleteIcon /></IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* Create/Edit Modal */}
            <Dialog open={openModal} onClose={handleCloseModal} maxWidth="md" fullWidth>
                <DialogTitle>{isEditing ? 'Edit Template' : 'Create New Template'}</DialogTitle>
                <DialogContent dividers>
                    <Box display="grid" gap={2}>
                        <TextField
                            label="Template Name"
                            fullWidth
                            value={currentTemplate.name}
                            onChange={(e) => setCurrentTemplate({ ...currentTemplate, name: e.target.value })}
                            required
                        />

                        <FormControl fullWidth>
                            <InputLabel>Type</InputLabel>
                            <Select
                                value={currentTemplate.type}
                                label="Type"
                                onChange={(e) => setCurrentTemplate({ ...currentTemplate, type: e.target.value })}
                            >
                                <MenuItem value="Excuse">Excuse</MenuItem>
                                <MenuItem value="Leave">Leave</MenuItem>
                                <MenuItem value="Letter">Letter</MenuItem>
                            </Select>
                        </FormControl>

                        {currentTemplate.type === 'Letter' && (
                            <TextField
                                label="Subject (For Letters)"
                                fullWidth
                                value={currentTemplate.subject}
                                onChange={(e) => setCurrentTemplate({ ...currentTemplate, subject: e.target.value })}
                            />
                        )}

                        <TextField
                            label="Template Content"
                            fullWidth
                            multiline
                            rows={8}
                            value={currentTemplate.body}
                            onChange={(e) => setCurrentTemplate({ ...currentTemplate, body: e.target.value })}
                            helperText="You can use placeholders like {{studentName}}, {{date}}."
                            required
                        />

                        <TextField
                            label="Placeholders (comma separated)"
                            fullWidth
                            value={currentTemplate.placeholders}
                            onChange={(e) => setCurrentTemplate({ ...currentTemplate, placeholders: e.target.value })}
                            placeholder="e.g. {{studentName}}, {{department}}"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={currentTemplate.isActive}
                                    onChange={(e) => setCurrentTemplate({ ...currentTemplate, isActive: e.target.checked })}
                                />
                            }
                            label="Active"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseModal}>Cancel</Button>
                    <Button onClick={handleSaveTemplate} variant="contained" color="primary">
                        {isEditing ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
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

export default TemplateManagementPage;

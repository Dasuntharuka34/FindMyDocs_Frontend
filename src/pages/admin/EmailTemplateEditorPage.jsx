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
    Grid
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Email as EmailIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import MessageModal from '../../components/MessageModal';
import Footer from '../../components/Footer';

const EmailTemplateEditorPage = () => {
    const { token } = useContext(AuthContext);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [openModal, setOpenModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState({
        name: '',
        subject: '',
        htmlContent: '',
        textContent: '',
        category: 'CUSTOM',
        isActive: true,
        variables: []
    });

    // Helper for variables input (comma separate string)
    const [variablesInput, setVariablesInput] = useState('');

    const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/email-management/templates`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch templates');
            const data = await response.json();
            setTemplates(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (template = null) => {
        if (template) {
            setIsEditing(true);
            setCurrentTemplate(template);
            // Flatten variables array to string for input
            const varString = template.variables ? template.variables.map(v => v.name).join(', ') : '';
            setVariablesInput(varString);
        } else {
            setIsEditing(false);
            setCurrentTemplate({
                name: '',
                subject: '',
                htmlContent: '',
                textContent: '',
                category: 'CUSTOM',
                isActive: true,
                variables: []
            });
            setVariablesInput('');
        }
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
    };

    const handleChange = (field, value) => {
        setCurrentTemplate({ ...currentTemplate, [field]: value });
    };

    const handleSave = async () => {
        try {
            // Process variables
            const processedVariables = variablesInput.split(',')
                .map(v => v.trim())
                .filter(v => v !== '')
                .map(v => ({ name: v, description: 'Custom variable' })); // Simple mapping

            const payload = {
                ...currentTemplate,
                variables: processedVariables
            };

            const url = isEditing
                ? `${process.env.REACT_APP_BACKEND_URL}/api/email-management/templates/${currentTemplate._id}`
                : `${process.env.REACT_APP_BACKEND_URL}/api/email-management/templates`;

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

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this template?')) return;

        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/email-management/templates/${id}`, {
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

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Box sx={{ flex: 1, p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <EmailIcon color="primary" fontSize="large" />
                        <Typography variant="h4" fontWeight="bold">Email Templates</Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenModal()}
                        sx={{ backgroundColor: '#1a237e' }}
                    >
                        New Template
                    </Button>
                </Box>

                <TableContainer component={Paper} elevation={2}>
                    <Table>
                        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell><strong>Name</strong></TableCell>
                                <TableCell><strong>Subject</strong></TableCell>
                                <TableCell><strong>Category</strong></TableCell>
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
                                        <TableCell>{template.subject}</TableCell>
                                        <TableCell>
                                            <Chip label={template.category} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell>
                                            <Switch checked={template.isActive} disabled size="small" />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton onClick={() => handleOpenModal(template)} color="primary"><EditIcon /></IconButton>
                                            <IconButton onClick={() => handleDelete(template._id)} color="error"><DeleteIcon /></IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* Editor Modal */}
            <Dialog open={openModal} onClose={handleCloseModal} maxWidth="md" fullWidth>
                <DialogTitle>{isEditing ? 'Edit Template' : 'Create New Template'}</DialogTitle>
                <DialogContent dividers>
                    <Box display="grid" gap={2}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Template Name"
                                    fullWidth
                                    value={currentTemplate.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Category</InputLabel>
                                    <Select
                                        value={currentTemplate.category}
                                        label="Category"
                                        onChange={(e) => handleChange('category', e.target.value)}
                                    >
                                        <MenuItem value="REGISTRATION">Registration</MenuItem>
                                        <MenuItem value="APPROVAL">Approval</MenuItem>
                                        <MenuItem value="REJECTION">Rejection</MenuItem>
                                        <MenuItem value="NOTIFICATION">Notification</MenuItem>
                                        <MenuItem value="ANNOUNCEMENT">Announcement</MenuItem>
                                        <MenuItem value="CUSTOM">Custom</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        <TextField
                            label="Email Subject"
                            fullWidth
                            value={currentTemplate.subject}
                            onChange={(e) => handleChange('subject', e.target.value)}
                            required
                        />

                        <TextField
                            label="HTML Content"
                            fullWidth
                            multiline
                            rows={10}
                            value={currentTemplate.htmlContent}
                            onChange={(e) => handleChange('htmlContent', e.target.value)}
                            helperText="Enter raw HTML content. Use {{variableName}} for placeholders."
                            required
                            sx={{ fontFamily: 'monospace' }}
                        />

                        <TextField
                            label="Available Variables (comma separated)"
                            fullWidth
                            value={variablesInput}
                            onChange={(e) => setVariablesInput(e.target.value)}
                            placeholder="studentName, requestDate, reason..."
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={currentTemplate.isActive}
                                    onChange={(e) => handleChange('isActive', e.target.checked)}
                                />
                            }
                            label="Active"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseModal}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained" color="primary">
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

export default EmailTemplateEditorPage;

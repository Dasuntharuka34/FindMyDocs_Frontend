import React, { useState, useEffect, useContext } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    RadioGroup,
    FormControlLabel,
    Radio,
    Card,
    CardContent,
    CircularProgress,
    Chip,
    Divider,
    Alert,
    Autocomplete
} from '@mui/material';
import {
    Send as SendIcon,
    Group as GroupIcon,
    Email as EmailIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import MessageModal from '../../components/MessageModal';
import Footer from '../../components/Footer';

const BulkEmailSenderPage = () => {
    const { token } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [roles, setRoles] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });

    // Form State
    const [audienceMode, setAudienceMode] = useState('filter'); // 'filter' | 'specific'
    const [filters, setFilters] = useState({
        role: '',
        department: '',
        isActive: true
    });
    const [specificEmails, setSpecificEmails] = useState([]); // Array of strings (emails)
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const [contentMode, setContentMode] = useState('custom'); // 'template' | 'custom'
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [customSubject, setCustomSubject] = useState('');
    const [customMessage, setCustomMessage] = useState('');

    useEffect(() => {
        fetchTemplates();
        fetchRoles();
        fetchDepartments();
        // eslint-disable-next-line
    }, []);

    const fetchDepartments = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/departments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setDepartments(data);
            }
        } catch (error) {
            console.error("Failed to load departments", error);
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/roles`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setRoles(data);
            }
        } catch (error) {
            console.error("Failed to load roles", error);
        }
    };

    const fetchTemplates = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/email-management/templates?isActive=true`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setTemplates(data);
            }
        } catch (error) {
            console.error("Failed to load templates", error);
        }
    };

    const handleSearchUsers = async (query) => {
        if (!query) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ query })
            });
            if (response.ok) {
                const data = await response.json();
                setSearchResults(data);
            }
        } catch (error) {
            console.error("Failed to search users", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters({ ...filters, [field]: value });
    };



    const handleSend = async () => {
        if (!window.confirm('Are you sure you want to send this email to all selected recipients?')) return;

        setLoading(true);
        const payload = {};

        // 1. Audience
        if (audienceMode === 'specific') {
            if (specificEmails.length === 0) {
                setMessageModal({ show: true, title: 'Error', message: 'Please select at least one recipient.', onConfirm: () => setMessageModal({ show: false }) });
                setLoading(false);
                return;
            }
            payload.recipients = specificEmails;
        } else {
            // Filter mode
            const activeFilters = {};
            if (filters.role && filters.role !== 'All') activeFilters.role = filters.role;
            if (filters.department) activeFilters.department = filters.department;
            activeFilters.isActive = filters.isActive;
            payload.filters = activeFilters;
        }

        // 2. Content
        if (contentMode === 'template') {
            if (!selectedTemplate) {
                setMessageModal({ show: true, title: 'Error', message: 'Please select a template.', onConfirm: () => setMessageModal({ show: false }) });
                setLoading(false);
                return;
            }
            payload.templateId = selectedTemplate;
        } else {
            if (!customSubject || !customMessage) {
                setMessageModal({ show: true, title: 'Error', message: 'Subject and Message are required for custom emails.', onConfirm: () => setMessageModal({ show: false }) });
                setLoading(false);
                return;
            }
            payload.subject = customSubject;
            payload.customMessage = customMessage;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/email-management/bulk-send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to send emails');

            setMessageModal({ show: true, title: 'Success', message: data.message, onConfirm: () => setMessageModal({ show: false }) });

            // Reset sensitive fields
            setSpecificEmails([]);
            setCustomSubject('');
            setCustomMessage('');

        } catch (error) {
            setMessageModal({ show: true, title: 'Error', message: error.message, onConfirm: () => setMessageModal({ show: false }) });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Box sx={{ flex: 1, p: 3 }}>
                <Box display="flex" alignItems="center" gap={1} mb={3}>
                    <SendIcon color="primary" fontSize="large" />
                    <Typography variant="h4" fontWeight="bold">Bulk Email Sender</Typography>
                </Box>

                <Grid container spacing={3}>
                    {/* Left Column: Configuration */}
                    <Grid item xs={12} md={8}>
                        {/* 1. Audience Selection */}
                        <Card elevation={2} sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                                    <GroupIcon color="action" /> Audience Selection
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <RadioGroup row value={audienceMode} onChange={(e) => setAudienceMode(e.target.value)}>
                                    <FormControlLabel value="filter" control={<Radio />} label="Filter Users" />
                                    <FormControlLabel value="specific" control={<Radio />} label="Specific Recipients" />
                                </RadioGroup>

                                <Box mt={2}>
                                    {audienceMode === 'filter' ? (
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6}>
                                                <FormControl fullWidth size="small">
                                                    <InputLabel>Role</InputLabel>
                                                    <Select
                                                        value={filters.role}
                                                        label="Role"
                                                        onChange={(e) => handleFilterChange('role', e.target.value)}
                                                    >
                                                        <MenuItem value=""><em>All Roles</em></MenuItem>
                                                        {roles.map(role => (
                                                            <MenuItem key={role._id} value={role.name}>{role.name}</MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <FormControl fullWidth size="small">
                                                    <InputLabel>Department</InputLabel>
                                                    <Select
                                                        value={filters.department}
                                                        label="Department"
                                                        onChange={(e) => handleFilterChange('department', e.target.value)}
                                                    >
                                                        <MenuItem value=""><em>All Departments</em></MenuItem>
                                                        {departments.map(dept => (
                                                            <MenuItem key={dept._id} value={dept.name}>{dept.name}</MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <FormControlLabel
                                                    control={
                                                        <RadioGroup row value={filters.isActive} onChange={(e) => handleFilterChange('isActive', e.target.value === 'true')}>
                                                            <FormControlLabel value={true} control={<Radio size="small" />} label="Active Only" />
                                                            <FormControlLabel value={false} control={<Radio size="small" />} label="All Users" />
                                                        </RadioGroup>
                                                    }
                                                    label=""
                                                />
                                            </Grid>
                                        </Grid>
                                    ) : (
                                        <Autocomplete
                                            multiple
                                            freeSolo
                                            options={searchResults}
                                            getOptionLabel={(option) => {
                                                // If option is a string (manual email), return it
                                                if (typeof option === 'string') return option;
                                                // If option is a user object, return format
                                                return `${option.name} (${option.email})`;
                                            }}
                                            filterOptions={(x) => x} // Disable built-in filtering to use server-side search results
                                            onInputChange={(event, newInputValue) => {
                                                handleSearchUsers(newInputValue);
                                            }}
                                            onChange={(event, newValue) => {
                                                // newValue is an array of selected items (strings or objects)
                                                // We want to store just the emails
                                                const emails = newValue.map(item => {
                                                    if (typeof item === 'string') return item;
                                                    return item.email;
                                                });
                                                setSpecificEmails(emails);
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Search Users or Enter Emails"
                                                    placeholder="Type name, email, or NIC..."
                                                    helperText="Select users from search or type valid email addresses and press Enter."
                                                    InputProps={{
                                                        ...params.InputProps,
                                                        endAdornment: (
                                                            <React.Fragment>
                                                                {isSearching ? <CircularProgress color="inherit" size={20} /> : null}
                                                                {params.InputProps.endAdornment}
                                                            </React.Fragment>
                                                        ),
                                                    }}
                                                />
                                            )}
                                            renderOption={(props, option) => {
                                                const { key, ...optionProps } = props;
                                                return (
                                                    <li key={key} {...optionProps}>
                                                        <Box>
                                                            <Typography variant="body1">{option.name}</Typography>
                                                            <Typography variant="caption" color="textSecondary">
                                                                {option.email} • {option.role} • {option.department}
                                                            </Typography>
                                                        </Box>
                                                    </li>
                                                );
                                            }}
                                        />
                                    )}
                                </Box>
                            </CardContent>
                        </Card>

                        {/* 2. Message Content */}
                        <Card elevation={2}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                                    <EmailIcon color="action" /> Message Content
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <RadioGroup row value={contentMode} onChange={(e) => setContentMode(e.target.value)}>
                                    <FormControlLabel value="custom" control={<Radio />} label="Write Custom Message" />
                                    <FormControlLabel value="template" control={<Radio />} label="Use Template" />
                                </RadioGroup>

                                <Box mt={2}>
                                    {contentMode === 'template' ? (
                                        <FormControl fullWidth>
                                            <InputLabel>Select Template</InputLabel>
                                            <Select
                                                value={selectedTemplate}
                                                label="Select Template"
                                                onChange={(e) => setSelectedTemplate(e.target.value)}
                                            >
                                                {templates.map(t => (
                                                    <MenuItem key={t._id} value={t._id}>{t.name} - {t.subject}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    ) : (
                                        <Box display="grid" gap={2}>
                                            <TextField
                                                label="Subject"
                                                fullWidth
                                                value={customSubject}
                                                onChange={(e) => setCustomSubject(e.target.value)}
                                                required
                                            />
                                            <TextField
                                                label="Message Body (HTML supported)"
                                                fullWidth
                                                multiline
                                                rows={6}
                                                value={customMessage}
                                                onChange={(e) => setCustomMessage(e.target.value)}
                                                required
                                            />
                                        </Box>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Right Column: Summary & Action */}
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, position: 'sticky', top: 20 }}>
                            <Typography variant="h6" gutterBottom>Review & Send</Typography>

                            <Box my={2}>
                                <Typography variant="subtitle2" color="textSecondary">Target Audience:</Typography>
                                {audienceMode === 'filter' ? (
                                    <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                                        <Chip label={`Role: ${filters.role || 'All'}`} size="small" />
                                        {filters.department && <Chip label={`Dept: ${filters.department}`} size="small" />}
                                        <Chip label={`Status: ${filters.isActive ? 'Active Only' : 'All'}`} size="small" />
                                    </Box>
                                ) : (
                                    <Typography variant="body2">{specificEmails.length} Specific Recipients</Typography>
                                )}
                            </Box>

                            <Box my={2}>
                                <Typography variant="subtitle2" color="textSecondary">Content Type:</Typography>
                                <Typography variant="body2">
                                    {contentMode === 'template' ? 'Pre-defined Template' : 'Custom Message'}
                                </Typography>
                            </Box>

                            <Alert severity="warning" sx={{ mb: 2 }}>
                                Please verify all details. Emails are sent immediately and cannot be undone.
                            </Alert>

                            <Button
                                variant="contained"
                                color="primary"
                                fullWidth
                                size="large"
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                                onClick={handleSend}
                                disabled={loading}
                            >
                                {loading ? 'Sending...' : 'Send Emails'}
                            </Button>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>

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

export default BulkEmailSenderPage;

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    Tabs,
    Tab,
} from '@mui/material';
import { Send as SendIcon, Email as EmailIcon } from '@mui/icons-material';
import api from '../../utils/api';

function TabPanel({ children, value, index }) {
    return (
        <div hidden={value !== index}>
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

export default function EmailManagementPage() {
    const [tabValue, setTabValue] = useState(0);
    const [templates, setTemplates] = useState([]);
    const [emailLogs, setEmailLogs] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sendDialog, setSendDialog] = useState(false);
    const [message, setMessage] = useState('');

    const [bulkEmail, setBulkEmail] = useState({
        subject: '',
        message: '',
        filterRole: '',
        filterDepartment: '',
    });

    useEffect(() => {
        fetchData();
    }, [tabValue]);

    const fetchData = async () => {
        try {
            setLoading(true);
            if (tabValue === 0) {
                const response = await api.get('/email-management/templates');
                setTemplates(response.data);
            } else if (tabValue === 1) {
                const response = await api.get('/email-management/logs?limit=100');
                setEmailLogs(response.data.logs);
            }

            // Always fetch roles for the send dialog if not already loaded
            if (roles.length === 0) {
                const rolesResponse = await api.get('/roles');
                setRoles(rolesResponse.data);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const handleSendBulkEmail = async () => {
        try {
            setLoading(true);
            await api.post('/email-management/bulk-send', {
                subject: bulkEmail.subject,
                customMessage: bulkEmail.message,
                filters: {
                    role: bulkEmail.filterRole,
                    department: bulkEmail.filterDepartment,
                },
            });
            setMessage('Bulk email sent successfully!');
            setSendDialog(false);
            setBulkEmail({ subject: '', message: '', filterRole: '', filterDepartment: '' });
            setTimeout(() => setMessage(''), 3000);
            setLoading(false);
        } catch (error) {
            console.error('Error sending bulk email:', error);
            setMessage('Error sending bulk email');
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <EmailIcon sx={{ fontSize: 40, mr: 2 }} />
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        Email Management
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<SendIcon />}
                    onClick={() => setSendDialog(true)}
                >
                    Send Bulk Email
                </Button>
            </Box>

            {message && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    {message}
                </Alert>
            )}

            <Paper>
                <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                    <Tab label="Email Templates" />
                    <Tab label="Email Logs" />
                </Tabs>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        {/* Templates Tab */}
                        <TabPanel value={tabValue} index={0}>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Name</TableCell>
                                            <TableCell>Category</TableCell>
                                            <TableCell>Subject</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Last Updated</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {templates.map((template) => (
                                            <TableRow key={template._id}>
                                                <TableCell>{template.name}</TableCell>
                                                <TableCell>
                                                    <Chip label={template.category} size="small" />
                                                </TableCell>
                                                <TableCell>{template.subject}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={template.isActive ? 'Active' : 'Inactive'}
                                                        color={template.isActive ? 'success' : 'default'}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(template.updatedAt).toLocaleDateString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </TabPanel>

                        {/* Email Logs Tab */}
                        <TabPanel value={tabValue} index={1}>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Timestamp</TableCell>
                                            <TableCell>Recipients</TableCell>
                                            <TableCell>Subject</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Sent By</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {emailLogs.map((log) => (
                                            <TableRow key={log._id}>
                                                <TableCell>
                                                    {new Date(log.createdAt).toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    {log.to.slice(0, 2).join(', ')}
                                                    {log.to.length > 2 && ` +${log.to.length - 2} more`}
                                                </TableCell>
                                                <TableCell>{log.subject}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={log.status}
                                                        color={log.status === 'SENT' ? 'success' : 'error'}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>{log.sentBy?.name || 'System'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </TabPanel>
                    </>
                )}
            </Paper>

            {/* Send Bulk Email Dialog */}
            <Dialog open={sendDialog} onClose={() => setSendDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>Send Bulk Email</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Subject"
                                value={bulkEmail.subject}
                                onChange={(e) => setBulkEmail({ ...bulkEmail, subject: e.target.value })}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Filter by Role</InputLabel>
                                <Select
                                    value={bulkEmail.filterRole}
                                    label="Filter by Role"
                                    onChange={(e) => setBulkEmail({ ...bulkEmail, filterRole: e.target.value })}
                                >
                                    <MenuItem value="">All Roles</MenuItem>
                                    {roles.map(role => (
                                        <MenuItem key={role._id} value={role.name}>{role.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Filter by Department"
                                value={bulkEmail.filterDepartment}
                                onChange={(e) => setBulkEmail({ ...bulkEmail, filterDepartment: e.target.value })}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={6}
                                label="Message"
                                value={bulkEmail.message}
                                onChange={(e) => setBulkEmail({ ...bulkEmail, message: e.target.value })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSendDialog(false)}>Cancel</Button>
                    <Button
                        onClick={handleSendBulkEmail}
                        variant="contained"
                        disabled={!bulkEmail.subject || !bulkEmail.message}
                    >
                        Send Email
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

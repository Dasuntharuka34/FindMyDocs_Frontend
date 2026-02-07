import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Tabs,
    Tab,
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Download as DownloadIcon,
    Security as SecurityIcon,
} from '@mui/icons-material';
import api from '../../utils/api';

function TabPanel({ children, value, index }) {
    return (
        <div hidden={value !== index}>
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

export default function SecurityDashboard() {
    const [tabValue, setTabValue] = useState(0);
    const [sessions, setSessions] = useState([]);
    const [securityLogs, setSecurityLogs] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmDialog, setConfirmDialog] = useState({ open: false, sessionId: null });

    useEffect(() => {
        fetchData();
    }, [tabValue]);

    const fetchData = async () => {
        try {
            setLoading(true);
            if (tabValue === 0) {
                const response = await api.get('/security/sessions');
                setSessions(response.data);
            } else if (tabValue === 1) {
                const response = await api.get('/security/logs?limit=100');
                setSecurityLogs(response.data.logs);
            } else if (tabValue === 2) {
                const response = await api.get('/security/permissions-audit');
                setPermissions(response.data);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching security data:', error);
            setLoading(false);
        }
    };

    const handleTerminateSession = async (sessionId) => {
        try {
            await api.delete(`/security/sessions/${sessionId}`);
            setConfirmDialog({ open: false, sessionId: null });
            fetchData();
        } catch (error) {
            console.error('Error terminating session:', error);
        }
    };

    const handleExportUserData = async (userId) => {
        try {
            const response = await api.get(`/security/export-user-data/${userId}`);
            const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `user-data-${userId}.json`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exporting user data:', error);
        }
    };

    return (
        <Box sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <SecurityIcon sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    Security Dashboard
                </Typography>
            </Box>

            <Paper>
                <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                    <Tab label="Active Sessions" />
                    <Tab label="Security Logs" />
                    <Tab label="Permission Audit" />
                </Tabs>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        {/* Active Sessions Tab */}
                        <TabPanel value={tabValue} index={0}>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>User</TableCell>
                                            <TableCell>Email</TableCell>
                                            <TableCell>Device</TableCell>
                                            <TableCell>IP Address</TableCell>
                                            <TableCell>Last Activity</TableCell>
                                            <TableCell>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {sessions.map((session) => (
                                            <TableRow key={session._id}>
                                                <TableCell>{session.userId?.name}</TableCell>
                                                <TableCell>{session.userId?.email}</TableCell>
                                                <TableCell>
                                                    <Chip label={session.deviceType} size="small" />
                                                </TableCell>
                                                <TableCell>{session.ipAddress}</TableCell>
                                                <TableCell>
                                                    {new Date(session.lastActivity).toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => setConfirmDialog({ open: true, sessionId: session._id })}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </TabPanel>

                        {/* Security Logs Tab */}
                        <TabPanel value={tabValue} index={1}>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Timestamp</TableCell>
                                            <TableCell>Event Type</TableCell>
                                            <TableCell>User</TableCell>
                                            <TableCell>IP Address</TableCell>
                                            <TableCell>Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {securityLogs.map((log) => (
                                            <TableRow key={log._id}>
                                                <TableCell>
                                                    {new Date(log.createdAt).toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={log.eventType.replace(/_/g, ' ')} size="small" />
                                                </TableCell>
                                                <TableCell>{log.userEmail || 'N/A'}</TableCell>
                                                <TableCell>{log.ipAddress}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={log.success ? 'Success' : 'Failed'}
                                                        color={log.success ? 'success' : 'error'}
                                                        size="small"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </TabPanel>

                        {/* Permission Audit Tab */}
                        <TabPanel value={tabValue} index={2}>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>User</TableCell>
                                            <TableCell>Email</TableCell>
                                            <TableCell>Role</TableCell>
                                            <TableCell>Department</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Permissions</TableCell>
                                            <TableCell>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {permissions.map((user) => (
                                            <TableRow key={user.userId}>
                                                <TableCell>{user.name}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>
                                                    <Chip label={user.role} color="primary" size="small" />
                                                </TableCell>
                                                <TableCell>{user.department || 'N/A'}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={user.isActive ? 'Active' : 'Inactive'}
                                                        color={user.isActive ? 'success' : 'default'}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {user.permissions.slice(0, 2).map((perm, idx) => (
                                                        <Chip key={idx} label={perm} size="small" sx={{ mr: 0.5 }} />
                                                    ))}
                                                    {user.permissions.length > 2 && (
                                                        <Chip label={`+${user.permissions.length - 2}`} size="small" />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleExportUserData(user.userId)}
                                                    >
                                                        <DownloadIcon />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </TabPanel>
                    </>
                )}
            </Paper>

            {/* Confirm Dialog */}
            <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, sessionId: null })}>
                <DialogTitle>Terminate Session</DialogTitle>
                <DialogContent>
                    Are you sure you want to terminate this session? The user will be logged out immediately.
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialog({ open: false, sessionId: null })}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => handleTerminateSession(confirmDialog.sessionId)}
                        color="error"
                        variant="contained"
                    >
                        Terminate
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

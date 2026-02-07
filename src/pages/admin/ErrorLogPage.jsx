import React, { useState, useEffect, useContext } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Button,
    Chip,
    TablePagination,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Visibility as VisibilityIcon,
    Error as ErrorIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';

const ErrorLogPage = () => {
    const { token } = useContext(AuthContext);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalLogs, setTotalLogs] = useState(0);
    const [selectedLog, setSelectedLog] = useState(null);
    const [error, setError] = useState(null);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/api/developer/error-logs?page=${page + 1}&limit=${rowsPerPage}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setLogs(response.data.logs);
            setTotalLogs(response.data.pagination.total);
            setError(null);
        } catch (err) {
            setError('Failed to fetch error logs');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, rowsPerPage]);

    const handleClearLogs = async () => {
        if (!window.confirm('Are you sure you want to clear all error logs?')) return;
        try {
            await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/developer/error-logs`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchLogs();
        } catch (err) {
            alert('Failed to clear logs');
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'CRITICAL': return 'error';
            case 'HIGH': return 'warning';
            case 'MEDIUM': return 'info';
            default: return 'default';
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={1}>
                    <ErrorIcon color="error" fontSize="large" />
                    <Typography variant="h4" fontWeight="bold">System Error Logs</Typography>
                </Box>
                <Box gap={2} display="flex">
                    <Button startIcon={<RefreshIcon />} onClick={fetchLogs}>Refresh</Button>
                    <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleClearLogs}>
                        Clear All Logs
                    </Button>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TableContainer component={Paper} elevation={3}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell>Time</TableCell>
                            <TableCell>Severity</TableCell>
                            <TableCell>Method</TableCell>
                            <TableCell>URL</TableCell>
                            <TableCell>Message</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6} align="center"><CircularProgress /></TableCell></TableRow>
                        ) : logs.map((log) => (
                            <TableRow key={log._id} hover>
                                <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                                <TableCell>
                                    <Chip label={log.severity} color={getSeverityColor(log.severity)} size="small" />
                                </TableCell>
                                <TableCell><strong>{log.method}</strong></TableCell>
                                <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.url}</TableCell>
                                <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.message}</TableCell>
                                <TableCell>
                                    <IconButton onClick={() => setSelectedLog(log)} color="primary">
                                        <VisibilityIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[10, 25, 50]}
                    component="div"
                    count={totalLogs}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(e, p) => setPage(p)}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                />
            </TableContainer>

            <Dialog open={!!selectedLog} onClose={() => setSelectedLog(null)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ bgcolor: '#f5f5f5' }}>Error Details</DialogTitle>
                <DialogContent dividers>
                    {selectedLog && (
                        <Box>
                            <Typography variant="subtitle2" color="textSecondary">Message</Typography>
                            <Typography variant="body1" gutterBottom sx={{ color: 'error.main', fontWeight: 'bold' }}>
                                {selectedLog.message}
                            </Typography>

                            <Box sx={{ mt: 2, display: 'flex', gap: 4 }}>
                                <Box>
                                    <Typography variant="subtitle2" color="textSecondary">Endpoint</Typography>
                                    <Typography variant="body2">{selectedLog.method} {selectedLog.url}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="textSecondary">IP Address</Typography>
                                    <Typography variant="body2">{selectedLog.ipAddress}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="textSecondary">User</Typography>
                                    <Typography variant="body2">{selectedLog.user?.name || 'Guest'}</Typography>
                                </Box>
                            </Box>

                            <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 2 }}>Stack Trace</Typography>
                            <Paper sx={{ p: 2, bgcolor: '#1e1e1e', color: '#d4d4d4', overflowX: 'auto', mt: 1 }}>
                                <pre style={{ margin: 0, fontSize: '0.85rem' }}>
                                    {selectedLog.stack || 'No stack trace available'}
                                </pre>
                            </Paper>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedLog(null)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ErrorLogPage;

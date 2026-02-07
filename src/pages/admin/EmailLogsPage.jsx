import React, { useState, useEffect, useContext } from 'react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TablePagination,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Grid,
    Divider
} from '@mui/material';
import {
    History as HistoryIcon,
    Visibility as ViewIcon,
    FilterList as FilterIcon,
    ErrorOutline as ErrorIcon,
    CheckCircleOutline as SuccessIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import Footer from '../../components/Footer';

const EmailLogsPage = () => {
    const { token } = useContext(AuthContext);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(10);

    // Filters
    const [status, setStatus] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // View Modal
    const [viewModal, setViewModal] = useState({ open: false, log: null });

    useEffect(() => {
        fetchLogs();
    }, [page, limit, status, startDate, endDate]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            let url = `${process.env.REACT_APP_BACKEND_URL}/api/email-management/logs?page=${page + 1}&limit=${limit}`;
            if (status) url += `&status=${status}`;
            if (startDate) url += `&startDate=${startDate}`;
            if (endDate) url += `&endDate=${endDate}`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch logs');
            const data = await response.json();
            setLogs(data.logs);
            setTotal(data.pagination.total);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setLimit(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleViewLog = (log) => {
        setViewModal({ open: true, log });
    };

    const handleCloseView = () => {
        setViewModal({ open: false, log: null });
    };

    const getStatusChip = (status) => {
        switch (status) {
            case 'SENT':
                return <Chip icon={<SuccessIcon />} label="Sent" color="success" size="small" variant="outlined" />;
            case 'FAILED':
                return <Chip icon={<ErrorIcon />} label="Failed" color="error" size="small" variant="outlined" />;
            default:
                return <Chip label={status} size="small" variant="outlined" />;
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Box sx={{ flex: 1, p: 3 }}>
                <Box display="flex" alignItems="center" gap={1} mb={3}>
                    <HistoryIcon color="primary" fontSize="large" />
                    <Typography variant="h4" fontWeight="bold">Email Logs</Typography>
                </Box>

                {/* Filters */}
                <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={status}
                                    label="Status"
                                    onChange={(e) => setStatus(e.target.value)}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    <MenuItem value="SENT">Sent</MenuItem>
                                    <MenuItem value="FAILED">Failed</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField
                                type="date"
                                label="Start Date"
                                fullWidth
                                size="small"
                                InputLabelProps={{ shrink: true }}
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField
                                type="date"
                                label="End Date"
                                fullWidth
                                size="small"
                                InputLabelProps={{ shrink: true }}
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <Button
                                variant="outlined"
                                fullWidth
                                startIcon={<FilterIcon />}
                                onClick={() => { setStatus(''); setStartDate(''); setEndDate(''); }}
                            >
                                Reset Filters
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>

                <TableContainer component={Paper} elevation={2}>
                    <Table>
                        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell><strong>Sent At</strong></TableCell>
                                <TableCell><strong>To</strong></TableCell>
                                <TableCell><strong>Subject</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell align="right"><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} align="center">Loading...</TableCell></TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow><TableCell colSpan={5} align="center">No logs found.</TableCell></TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log._id} hover>
                                        <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                                        <TableCell>{log.to.join(', ')}</TableCell>
                                        <TableCell>{log.subject}</TableCell>
                                        <TableCell>{getStatusChip(log.status)}</TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="View Details">
                                                <IconButton onClick={() => handleViewLog(log)} color="primary">
                                                    <ViewIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    <TablePagination
                        rowsPerPageOptions={[10, 25, 50]}
                        component="div"
                        count={total}
                        rowsPerPage={limit}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </TableContainer>
            </Box>

            {/* View Log Modal */}
            <Dialog open={viewModal.open} onClose={handleCloseView} maxWidth="md" fullWidth>
                <DialogTitle>Email Log Details</DialogTitle>
                <DialogContent dividers>
                    {viewModal.log && (
                        <Box display="grid" gap={2}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="textSecondary">Recipient(s)</Typography>
                                    <Typography variant="body1">{viewModal.log.to.join(', ')}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="textSecondary">Sent At</Typography>
                                    <Typography variant="body1">{new Date(viewModal.log.createdAt).toLocaleString()}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="textSecondary">Sent By</Typography>
                                    <Typography variant="body1">{viewModal.log.sentBy?.name || 'System'}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="textSecondary">Status</Typography>
                                    <Box>{getStatusChip(viewModal.log.status)}</Box>
                                </Grid>
                                {viewModal.log.error && (
                                    <Grid item xs={12}>
                                        <Typography variant="caption" color="error">Error Detail</Typography>
                                        <Typography variant="body2" sx={{ p: 1, bgcolor: '#fff5f5', borderRadius: 1, border: '1px solid #fee2e2', color: '#b91c1c' }}>
                                            {viewModal.log.error}
                                        </Typography>
                                    </Grid>
                                )}
                            </Grid>

                            <Divider />

                            <Typography variant="subtitle2">Subject: {viewModal.log.subject}</Typography>

                            <Typography variant="caption" color="textSecondary">Content Preview</Typography>
                            <Paper
                                variant="outlined"
                                sx={{ p: 2, maxHeight: '300px', overflowY: 'auto', bgcolor: '#f9fafb' }}
                            >
                                <div dangerouslySetInnerHTML={{ __html: viewModal.log.htmlContent || viewModal.log.textContent }} />
                            </Paper>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseView}>Close</Button>
                </DialogActions>
            </Dialog>

            <Footer />
        </Box>
    );
};

export default EmailLogsPage;

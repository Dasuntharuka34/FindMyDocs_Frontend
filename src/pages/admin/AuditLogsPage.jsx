import React, { useState, useEffect } from 'react';
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
    TablePagination,
    Chip,
    TextField,
    FormControl,
    Select,
    MenuItem,
    InputLabel,
    Grid,
    Button,
    CircularProgress,
} from '@mui/material';
import { Download as DownloadIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import api from '../../utils/api';

export default function AuditLogsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState({
        action: '',
        targetType: '',
        startDate: '',
        endDate: '',
    });

    useEffect(() => {
        fetchLogs();
    }, [page, rowsPerPage, filters]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page + 1,
                limit: rowsPerPage,
                ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '')),
            });

            const response = await api.get(`/audit/logs?${params}`);
            setLogs(response.data.logs);
            setTotal(response.data.pagination.total);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const params = new URLSearchParams(
                Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
            );

            const response = await api.get(`/audit/export?${params}`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `audit-logs-${Date.now()}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exporting logs:', error);
        }
    };

    const getActionColor = (action) => {
        const colors = {
            USER_CREATED: 'success',
            USER_UPDATED: 'info',
            USER_DELETED: 'error',
            USER_PASSWORD_RESET: 'warning',
            REGISTRATION_APPROVED: 'success',
            REGISTRATION_REJECTED: 'error',
            BULK_OPERATION: 'primary',
        };
        return colors[action] || 'default';
    };

    return (
        <Box sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    Audit Logs
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={fetchLogs}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={handleExport}
                    >
                        Export CSV
                    </Button>
                </Box>
            </Box>

            {/* Filters */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Filters
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Action</InputLabel>
                            <Select
                                value={filters.action}
                                label="Action"
                                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="USER_CREATED">User Created</MenuItem>
                                <MenuItem value="USER_UPDATED">User Updated</MenuItem>
                                <MenuItem value="USER_DELETED">User Deleted</MenuItem>
                                <MenuItem value="USER_PASSWORD_RESET">Password Reset</MenuItem>
                                <MenuItem value="REGISTRATION_APPROVED">Registration Approved</MenuItem>
                                <MenuItem value="REGISTRATION_REJECTED">Registration Rejected</MenuItem>
                                <MenuItem value="BULK_OPERATION">Bulk Operation</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Target Type</InputLabel>
                            <Select
                                value={filters.targetType}
                                label="Target Type"
                                onChange={(e) => setFilters({ ...filters, targetType: e.target.value })}
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="User">User</MenuItem>
                                <MenuItem value="Registration">Registration</MenuItem>
                                <MenuItem value="Request">Request</MenuItem>
                                <MenuItem value="System">System</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            label="Start Date"
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            label="End Date"
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* Logs Table */}
            <Paper>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Timestamp</TableCell>
                                        <TableCell>User</TableCell>
                                        <TableCell>Action</TableCell>
                                        <TableCell>Target</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>IP Address</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {logs.map((log) => (
                                        <TableRow key={log._id} hover>
                                            <TableCell>
                                                {new Date(log.createdAt).toLocaleString()}
                                            </TableCell>
                                            <TableCell>{log.userName}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={log.action.replace(/_/g, ' ')}
                                                    color={getActionColor(log.action)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {log.targetName || log.targetId || 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={log.status}
                                                    color={log.status === 'SUCCESS' ? 'success' : 'error'}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>{log.ipAddress || 'N/A'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            component="div"
                            count={total}
                            page={page}
                            onPageChange={(e, newPage) => setPage(newPage)}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={(e) => {
                                setRowsPerPage(parseInt(e.target.value, 10));
                                setPage(0);
                            }}
                            rowsPerPageOptions={[25, 50, 100]}
                        />
                    </>
                )}
            </Paper>
        </Box>
    );
}

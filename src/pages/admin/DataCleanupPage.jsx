import React, { useState, useContext, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Grid,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Card,
    CardContent,
    Divider,
    Alert
} from '@mui/material';
import {
    DeleteSweep as CleanupIcon,
    Archive as ArchiveIcon,
    CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import MessageModal from '../../components/MessageModal';
import Footer from '../../components/Footer';

const DataCleanupPage = () => {
    const { token } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const [days, setDays] = useState(365);
    const [selectedType, setSelectedType] = useState('ExcuseRequest');

    const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });

    useEffect(() => {
        fetchStats();
    }, [days]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/cleanup/stats?days=${days}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch stats');
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCleanup = async () => {
        if (!window.confirm(`Are you sure you want to archive and delete ${selectedType}s older than ${days} days? This action cannot be undone.`)) return;

        setLoading(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/cleanup/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ type: selectedType, days })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Cleanup failed');

            setMessageModal({ show: true, title: 'Success', message: data.message, onConfirm: () => setMessageModal({ show: false }) });
            fetchStats();

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
                    <CleanupIcon color="primary" fontSize="large" />
                    <Typography variant="h4" fontWeight="bold">Data Cleanup Tools</Typography>
                </Box>

                <Typography paragraph color="textSecondary">
                    Archive and remove old requests to maintain system performance.
                    Archived data is moved to a separate storage collection before deletion.
                </Typography>

                <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                    <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth>
                                <InputLabel>Request Type to Clean</InputLabel>
                                <Select
                                    value={selectedType}
                                    label="Request Type to Clean"
                                    onChange={(e) => setSelectedType(e.target.value)}
                                >
                                    <MenuItem value="ExcuseRequest">Excuse Requests</MenuItem>
                                    <MenuItem value="LeaveRequest">Leave Requests</MenuItem>
                                    <MenuItem value="Letter">Letters</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth>
                                <InputLabel>Age Threshold</InputLabel>
                                <Select
                                    value={days}
                                    label="Age Threshold"
                                    onChange={(e) => setDays(e.target.value)}
                                >
                                    <MenuItem value={30}>Older than 30 Days</MenuItem>
                                    <MenuItem value={180}>Older than 6 Months</MenuItem>
                                    <MenuItem value={365}>Older than 1 Year</MenuItem>
                                    <MenuItem value={730}>Older than 2 Years</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Button
                                variant="contained"
                                color="error"
                                size="large"
                                fullWidth
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ArchiveIcon />}
                                onClick={handleCleanup}
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : 'Archive & Delete'}
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>

                {stats && (
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Impact Preview</Typography>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                                Records older than {new Date(stats.cutoffDate).toLocaleDateString()}:
                            </Typography>

                            <Divider sx={{ my: 2 }} />

                            <Grid container spacing={2}>
                                <Grid item xs={4} textAlign="center">
                                    <Typography variant="h4" color="primary">{stats.ExcuseRequest}</Typography>
                                    <Typography variant="caption">Excuse Requests</Typography>
                                </Grid>
                                <Grid item xs={4} textAlign="center">
                                    <Typography variant="h4" color="secondary">{stats.LeaveRequest}</Typography>
                                    <Typography variant="caption">Leave Requests</Typography>
                                </Grid>
                                <Grid item xs={4} textAlign="center">
                                    <Typography variant="h4" color="info.main">{stats.Letter}</Typography>
                                    <Typography variant="caption">Letters</Typography>
                                </Grid>
                            </Grid>

                            <Box mt={2}>
                                <Alert severity="info" icon={<CheckCircleIcon />}>
                                    Selecting <strong>{selectedType}</strong> above will archive <strong>{stats[selectedType]}</strong> records.
                                </Alert>
                            </Box>
                        </CardContent>
                    </Card>
                )}

                <Box mt={3} display="flex" justifyContent="flex-end">
                    <Button
                        component={Link}
                        to="/admin/cleanup/orphaned"
                        variant="outlined"
                        startIcon={<CleanupIcon />}
                    >
                        Scan for Orphaned Files
                    </Button>
                </Box>
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

export default DataCleanupPage;

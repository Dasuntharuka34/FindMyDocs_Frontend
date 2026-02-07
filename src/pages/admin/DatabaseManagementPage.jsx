import React, { useState, useContext, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Card,
    CardContent,
    Grid,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    Divider
} from '@mui/material';
import {
    CloudDownload as DownloadIcon,
    Restore as RestoreIcon,
    Storage as StorageIcon,
    Warning as WarningIcon,
    DataUsage as DataIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import MessageModal from '../../components/MessageModal';
import Footer from '../../components/Footer';

const DatabaseManagementPage = () => {
    const { token } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });
    const [restoreModalOpen, setRestoreModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [restoreReport, setRestoreReport] = useState(null);
    const [dbStats, setDbStats] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/database/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setDbStats(data);
            }
        } catch (error) {
            console.error("Failed to fetch db stats", error);
        }
    };

    const handleBackup = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/database/backup`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to create backup');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `findmydocs-backup-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setMessageModal({ show: true, title: 'Success', message: 'Backup downloaded successfully.', onConfirm: () => setMessageModal({ show: false }) });

        } catch (error) {
            console.error(error);
            setMessageModal({ show: true, title: 'Error', message: error.message, onConfirm: () => setMessageModal({ show: false }) });
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleRestore = async () => {
        if (!selectedFile) return;

        if (!window.confirm('WARNING: restoring will OVERWRITE existing data. Are you sure?')) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('backupFile', selectedFile);

        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/database/restore`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to restore database');

            setRestoreReport(data.report);
            setRestoreModalOpen(false);
            setMessageModal({ show: true, title: 'Success', message: 'Database restored successfully!', onConfirm: () => setMessageModal({ show: false }) });
            fetchStats(); // Refresh stats after restore

        } catch (error) {
            console.error(error);
            setMessageModal({ show: true, title: 'Error', message: error.message, onConfirm: () => setMessageModal({ show: false }) });
        } finally {
            setLoading(false);
        }
    };

    const formatBytes = (bytes, decimals = 2) => {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Box sx={{ flex: 1, p: 3 }}>
                <Box display="flex" alignItems="center" gap={1} mb={3}>
                    <StorageIcon color="primary" fontSize="large" />
                    <Typography variant="h4" fontWeight="bold">Database Management</Typography>
                </Box>

                {/* Database Stats Section */}
                {dbStats && (
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                            <DataIcon color="action" /> Database Overview
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Paper sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="caption" color="textSecondary">Total Users</Typography>
                                    <Typography variant="h4" color="primary">{dbStats.users}</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Paper sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="caption" color="textSecondary">Active Requests</Typography>
                                    <Typography variant="h4" color="secondary">
                                        {dbStats.excuseRequests + dbStats.leaveRequests + dbStats.letters}
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Paper sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="caption" color="textSecondary">Archived Records</Typography>
                                    <Typography variant="h4" color="info.main">{dbStats.archived}</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Paper sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="caption" color="textSecondary">Storage Size</Typography>
                                    <Typography variant="h4" color="success.main">
                                        {formatBytes(dbStats.dbStats?.storageSize)}
                                    </Typography>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Box>
                )}

                <Divider sx={{ my: 4 }} />

                <Grid container spacing={4}>
                    <Grid item xs={12} md={6}>
                        <Card elevation={3} sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                            <CardContent>
                                <DownloadIcon sx={{ fontSize: 60, color: '#1a237e', mb: 2 }} />
                                <Typography variant="h5" gutterBottom>Download Backup</Typography>
                                <Typography variant="body2" color="textSecondary" paragraph>
                                    Create a full JSON backup of the current database state.
                                    Store this file securely.
                                </Typography>
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={handleBackup}
                                    disabled={loading}
                                    sx={{ backgroundColor: '#1a237e', mt: 2 }}
                                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                                >
                                    {loading ? 'Processing...' : 'Download Backup'}
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card elevation={3} sx={{ height: '100%', textAlign: 'center', p: 2, border: '1px solid #f44336' }}>
                            <CardContent>
                                <RestoreIcon sx={{ fontSize: 60, color: '#f44336', mb: 2 }} />
                                <Typography variant="h5" gutterBottom color="error">Restore Database</Typography>
                                <Typography variant="body2" color="textSecondary" paragraph>
                                    Upload a backup file to restore the database.
                                    <br />
                                    <strong>WARNING: This will replace existing data.</strong>
                                </Typography>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    size="large"
                                    onClick={() => setRestoreModalOpen(true)}
                                    disabled={loading}
                                    sx={{ mt: 2 }}
                                    startIcon={<WarningIcon />}
                                >
                                    Open Restore Tool
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {restoreReport && (
                    <Paper sx={{ mt: 4, p: 3 }} elevation={2}>
                        <Typography variant="h6" gutterBottom>Last Restore Report</Typography>
                        <List dense>
                            {Object.entries(restoreReport).map(([model, count]) => (
                                <ListItem key={model}>
                                    <ListItemText primary={model} secondary={`${count} records restored`} />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                )}
            </Box>

            {/* Restore Modal */}
            <Dialog open={restoreModalOpen} onClose={() => setRestoreModalOpen(false)}>
                <DialogTitle>Restore Database</DialogTitle>
                <DialogContent dividers>
                    <Typography color="error" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WarningIcon /> Warning: This action is irreversible.
                    </Typography>
                    <Typography paragraph>
                        All existing data will be deleted and replaced with the data from the backup file.
                        Please ensure you have a recent backup before proceeding.
                    </Typography>
                    <input
                        type="file"
                        accept=".json"
                        onChange={handleFileChange}
                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRestoreModalOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleRestore}
                        variant="contained"
                        color="error"
                        disabled={!selectedFile || loading}
                    >
                        {loading ? 'Restoring...' : 'Confirm Restore'}
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

export default DatabaseManagementPage;

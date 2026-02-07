import React, { useState, useEffect, useContext } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    CircularProgress,
    Tooltip,
    Checkbox,
    Alert,
    Breadcrumbs,
    Link as MuiLink,
    Stack,
    Divider
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Search as SearchIcon,
    FilePresent as FileIcon,
    DeleteSweep as DeleteAllIcon,
    ArrowBack as BackIcon,
    CheckCircle as CheckIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import MessageModal from '../../components/MessageModal';
import Footer from '../../components/Footer';

const OrphanedFilesPage = () => {
    const { token } = useContext(AuthContext);
    const [orphanedFiles, setOrphanedFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [selected, setSelected] = useState([]);
    const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });

    const fetchOrphanedFiles = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/cleanup/orphaned-files`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch orphaned files');
            const data = await response.json();
            setOrphanedFiles(data);
            setSelected([]);
        } catch (error) {
            setMessageModal({ show: true, title: 'Error', message: error.message, onConfirm: () => setMessageModal({ show: false }) });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSelected = async () => {
        if (selected.length === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${selected.length} files permanently?`)) return;

        setDeleting(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/cleanup/delete-orphaned`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ urls: selected })
            });

            if (!response.ok) throw new Error('Failed to delete files');
            const data = await response.json();

            setMessageModal({
                show: true,
                title: 'Success',
                message: data.message,
                onConfirm: () => { setMessageModal({ show: false }); fetchOrphanedFiles(); }
            });
        } catch (error) {
            setMessageModal({ show: true, title: 'Error', message: error.message, onConfirm: () => setMessageModal({ show: false }) });
        } finally {
            setDeleting(false);
        }
    };

    const handleSelectAll = (event) => {
        if (event.target.checked) {
            setSelected(orphanedFiles.map(f => f.url));
        } else {
            setSelected([]);
        }
    };

    const handleSelectOne = (url) => {
        setSelected(prev => prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]);
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Box sx={{ flex: 1, p: 3 }}>
                <Breadcrumbs sx={{ mb: 2 }}>
                    <MuiLink component={Link} to="/admin/cleanup" underline="hover" color="inherit">Data Cleanup</MuiLink>
                    <Typography color="text.primary">Orphaned Files</Typography>
                </Breadcrumbs>

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <FileIcon color="primary" fontSize="large" />
                        <Typography variant="h4" fontWeight="bold">Orphaned Files Cleanup</Typography>
                    </Box>
                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="outlined"
                            startIcon={<SearchIcon />}
                            onClick={fetchOrphanedFiles}
                            disabled={loading}
                        >
                            Scan for Orphaned Files
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<DeleteAllIcon />}
                            onClick={handleDeleteSelected}
                            disabled={selected.length === 0 || deleting}
                        >
                            Delete Selected ({selected.length})
                        </Button>
                    </Stack>
                </Box>

                <Alert severity="warning" sx={{ mb: 3 }}>
                    Orphaned files are attachments in cloud storage that have no corresponding record in the database.
                    Deleting them is permanent and will free up storage space.
                </Alert>

                <TableContainer component={Paper} elevation={2}>
                    <Table>
                        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        indeterminate={selected.length > 0 && selected.length < orphanedFiles.length}
                                        checked={orphanedFiles.length > 0 && selected.length === orphanedFiles.length}
                                        onChange={handleSelectAll}
                                    />
                                </TableCell>
                                <TableCell><strong>File Name</strong></TableCell>
                                <TableCell><strong>Size</strong></TableCell>
                                <TableCell><strong>Uploaded At</strong></TableCell>
                                <TableCell><strong>Action</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                                        <CircularProgress /><br />
                                        <Typography variant="body2" sx={{ mt: 2 }}>Scanning blob storage and database...</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : orphanedFiles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                                        <Typography variant="h6" color="textSecondary">No orphaned files found.</Typography>
                                        <Typography variant="body2">Click "Scan" to start the identification process.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orphanedFiles.map((file) => (
                                    <TableRow key={file.url} hover onClick={() => handleSelectOne(file.url)} sx={{ cursor: 'pointer' }}>
                                        <TableCell padding="checkbox">
                                            <Checkbox checked={selected.includes(file.url)} />
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <FileIcon fontSize="small" color="action" />
                                                <Typography variant="body2" sx={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {file.pathname}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>{formatSize(file.size)}</TableCell>
                                        <TableCell>{new Date(file.uploadedAt).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Tooltip title="View File">
                                                <IconButton size="small" component="a" href={file.url} target="_blank" onClick={(e) => e.stopPropagation()}>
                                                    <SearchIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {orphanedFiles.length > 0 && (
                    <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="textSecondary">
                            Found {orphanedFiles.length} orphaned files. Total size: {formatSize(orphanedFiles.reduce((acc, f) => acc + f.size, 0))}
                        </Typography>
                    </Box>
                )}
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

export default OrphanedFilesPage;

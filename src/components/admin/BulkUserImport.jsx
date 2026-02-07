import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Alert,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper
} from '@mui/material';
import { CloudUpload as UploadIcon, Download as DownloadIcon } from '@mui/icons-material';
import api from '../../utils/api';

const BulkUserImport = ({ open, onClose, onSuccess }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
            setError('Please upload a valid CSV file.');
            setFile(null);
            return;
        }
        setFile(selectedFile);
        setError(null);
        setResult(null);
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        setError(null);
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/users/bulk-import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setResult(response.data);
            if (response.data.successCount > 0 && typeof onSuccess === 'function') {
                onSuccess();
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.response?.data?.message || 'Error uploading file.');
        } finally {
            setLoading(false);
        }
    };

    const downloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8,"
            + "name,email,nic,mobile,role,department,indexNumber\n"
            + "John Doe,john@example.com,123456789V,0771234567,Student,Computing,K123456";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "user_import_template.csv");
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Bulk User Import</DialogTitle>
            <DialogContent dividers>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                        Upload a CSV file to import users. The CSV should have the following headers:
                        <strong> name, email, nic, mobile, role, department, indexNumber</strong>.
                    </Typography>
                    <Button
                        startIcon={<DownloadIcon />}
                        onClick={downloadTemplate}
                        size="small"
                        sx={{ mb: 2 }}
                    >
                        Download CSV Template
                    </Button>

                    <Box
                        sx={{
                            border: '2px dashed #ccc',
                            borderRadius: 2,
                            p: 3,
                            textAlign: 'center',
                            backgroundColor: '#fafafa',
                            cursor: 'pointer'
                        }}
                        component="label"
                    >
                        <input
                            type="file"
                            hidden
                            accept=".csv"
                            onChange={handleFileChange}
                        />
                        <UploadIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                        <Typography>
                            {file ? file.name : 'Click to select or drag and drop CSV file here'}
                        </Typography>
                    </Box>
                </Box>

                {loading && (
                    <Box display="flex" justifyContent="center" my={2}>
                        <CircularProgress />
                    </Box>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {result && (
                    <Box>
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {result.message}
                        </Alert>

                        {result.errors && result.errors.length > 0 && (
                            <Box mt={2}>
                                <Typography variant="subtitle2" color="error" gutterBottom>
                                    Failed Entries ({result.errors.length}):
                                </Typography>
                                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 200 }}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Email</TableCell>
                                                <TableCell>Error</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {result.errors.map((err, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{err.email}</TableCell>
                                                    <TableCell sx={{ color: 'error.main' }}>{err.error}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="inherit">Close</Button>
                <Button
                    onClick={handleUpload}
                    variant="contained"
                    disabled={!file || loading}
                >
                    Import Users
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BulkUserImport;

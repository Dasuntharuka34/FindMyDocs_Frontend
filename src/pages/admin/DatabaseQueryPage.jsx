import React, { useState, useContext } from 'react';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert,
    Divider
} from '@mui/material';
import {
    Storage as DbIcon,
    PlayArrow as RunIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';

const DatabaseQueryPage = () => {
    const { token } = useContext(AuthContext);
    const [modelName, setModelName] = useState('User');
    const [queryString, setQueryString] = useState('{}');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleRunQuery = async () => {
        setLoading(true);
        setError(null);
        try {
            let parsedQuery = {};
            try {
                parsedQuery = JSON.parse(queryString);
            } catch (e) {
                throw new Error('Invalid JSON query format');
            }

            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/api/developer/query`,
                { modelName, query: parsedQuery },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setResult(response.data);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
                <DbIcon color="primary" fontSize="large" />
                <Typography variant="h4" fontWeight="bold">Database Query Tool (Ready-only)</Typography>
            </Box>

            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                            <InputLabel>Collection / Model</InputLabel>
                            <Select
                                value={modelName}
                                label="Collection / Model"
                                onChange={(e) => setModelName(e.target.value)}
                            >
                                <MenuItem value="User">Users</MenuItem>
                                <MenuItem value="ExcuseRequest">Excuse Requests</MenuItem>
                                <MenuItem value="LeaveRequest">Leave Requests</MenuItem>
                                <MenuItem value="Letter">Letters</MenuItem>
                                <MenuItem value="Department">Departments</MenuItem>
                                <MenuItem value="Role">Roles</MenuItem>
                                <MenuItem value="AuditLog">Audit Logs</MenuItem>
                                <MenuItem value="SecurityLog">Security Logs</MenuItem>
                                <MenuItem value="ErrorLog">Error Logs</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <TextField
                            label="Mongoose Query (JSON)"
                            fullWidth
                            multiline
                            rows={4}
                            value={queryString}
                            onChange={(e) => setQueryString(e.target.value)}
                            placeholder='{"status": "Pending"}'
                            helperText="Enter a valid JSON object for the find() filter"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Button
                            variant="contained"
                            startIcon={<RunIcon />}
                            onClick={handleRunQuery}
                            disabled={loading}
                            fullWidth
                            size="large"
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Run Query'}
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {result && (
                <Paper elevation={2} sx={{ p: 2, bgcolor: '#fbfbfb' }}>
                    <Typography variant="h6" gutterBottom>Results ({result.length})</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
                        <pre style={{ margin: 0, fontSize: '0.9rem' }}>
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </Box>
                </Paper>
            )}
        </Box>
    );
};

export default DatabaseQueryPage;

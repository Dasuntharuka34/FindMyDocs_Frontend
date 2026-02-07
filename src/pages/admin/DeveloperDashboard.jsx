import React, { useState, useEffect, useContext } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    Button,
    List,
    ListItem,
    ListItemText,
    Chip,
    CircularProgress,
    Divider
} from '@mui/material';
import {
    Code as CodeIcon,
    Storage as StorageIcon,
    Speed as SpeedIcon,
    DeleteSweep as CacheIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';

const DeveloperDashboard = () => {
    const { token } = useContext(AuthContext);
    const [stats, setStats] = useState(null);
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, docsRes] = await Promise.all([
                axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/developer/system-stats`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/developer/docs`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setStats(statsRes.data);
            setRoutes(docsRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleClearCache = async () => {
        try {
            await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/developer/clear-cache`, {}, { headers: { Authorization: `Bearer ${token}` } });
            alert('Cache cleared!');
        } catch (err) {
            alert('Failed to clear cache');
        }
    };

    if (loading) return <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>;

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>Developer Tools & Diagnostics</Typography>

            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} md={6}>
                    <Card elevation={3}>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                                <SpeedIcon color="primary" />
                                <Typography variant="h6">System Performance (Real-time)</Typography>
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="textSecondary">Uptime</Typography>
                                    <Typography variant="h6">{Math.floor(stats?.uptime / 3600)}h {Math.floor((stats?.uptime % 3600) / 60)}m</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="textSecondary">Memory Usage</Typography>
                                    <Typography variant="h6">{Math.round(stats?.memoryUsage?.rss / 1024 / 1024)} MB</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="textSecondary">Node Version</Typography>
                                    <Typography variant="h6">{stats?.nodeVersion}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="textSecondary">Database</Typography>
                                    <Chip label={stats?.dbStatus} color={stats?.dbStatus === 'Connected' ? 'success' : 'error'} size="small" />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card elevation={3}>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                                <CacheIcon color="secondary" />
                                <Typography variant="h6">Cache Management</Typography>
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            <Typography variant="body2" color="textSecondary" mb={2}>
                                Clear global server-side caches, including template data and feature flag states.
                            </Typography>
                            <Button variant="contained" color="secondary" fullWidth onClick={handleClearCache}>
                                Purge All Caches
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Typography variant="h5" fontWeight="bold" gutterBottom>API Endpoint Documentation</Typography>
            <Paper elevation={3} sx={{ p: 0, maxHeight: 500, overflow: 'auto' }}>
                <List disablePadding>
                    {routes.map((route, idx) => (
                        <React.Fragment key={idx}>
                            <ListItem>
                                <ListItemText
                                    primary={
                                        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                                            <Chip
                                                label={route.method}
                                                color={route.method === 'GET' ? 'primary' : route.method === 'POST' ? 'success' : 'warning'}
                                                size="small"
                                                sx={{ width: 60, fontWeight: 'bold' }}
                                            />
                                            <Typography variant="body1" component="span" sx={{ fontFamily: 'monospace', fontWeight: 'medium' }}>
                                                /api{route.path}
                                            </Typography>
                                            {route.access && (
                                                <Chip
                                                    label={route.access}
                                                    size="small"
                                                    variant="outlined"
                                                    color={route.access === 'Admin' ? 'error' : route.access === 'Private' ? 'warning' : 'default'}
                                                    sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                                                />
                                            )}
                                        </Box>
                                    }
                                    secondary={
                                        route.description && (
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, ml: 9 }}>
                                                {route.description}
                                            </Typography>
                                        )
                                    }
                                />
                            </ListItem>
                            {idx < routes.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                </List>
            </Paper>
        </Box>
    );
};

export default DeveloperDashboard;

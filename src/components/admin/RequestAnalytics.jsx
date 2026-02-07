import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Grid,
    Typography,
    Card,
    CardContent,
    Box,
    CircularProgress,
    IconButton
} from '@mui/material';
import { Close as CloseIcon, BarChart as BarChartIcon } from '@mui/icons-material';
import {
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { AuthContext } from '../../context/AuthContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919'];

const RequestAnalytics = ({ open, onClose }) => {
    const { token } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/analytics/requests`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch analytics');
            const analyticsData = await response.json();
            setData(analyticsData);
        } catch (err) {
            console.error("Error fetching analytics:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (open) {
            fetchAnalytics();
        }
    }, [open, fetchAnalytics]);

    const prepareStatusData = (statusDist) => {
        if (!statusDist) return [];
        return statusDist.map((item, index) => ({
            name: item._id,
            value: item.count,
            color: item._id === 'Approved' ? '#4caf50' : item._id === 'Rejected' ? '#f44336' : '#ff9800'
        }));
    };

    if (!open) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold' }}>
                <Box display="flex" alignItems="center" gap={1}>
                    <BarChartIcon color="primary" />
                    Request Analytics
                </Box>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ backgroundColor: '#f8f9fa' }}>
                {loading ? (
                    <Box display="flex" justifyContent="center" p={5}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Typography color="error" align="center">{error}</Typography>
                ) : data ? (
                    <Grid container spacing={3}>
                        {/* Average Approval Times Cards */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom color="textSecondary">Average Approval Time (Hours)</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card elevation={2}>
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" color="primary" fontWeight="bold">
                                        {data.averageApprovalTimes.excuse || 0} h
                                    </Typography>
                                    <Typography variant="subtitle2" color="textSecondary">Excuse Requests</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card elevation={2}>
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" color="secondary" fontWeight="bold">
                                        {data.averageApprovalTimes.leave || 0} h
                                    </Typography>
                                    <Typography variant="subtitle2" color="textSecondary">Leave Requests</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card elevation={2}>
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" color="info.main" fontWeight="bold">
                                        {data.averageApprovalTimes.letter || 0} h
                                    </Typography>
                                    <Typography variant="subtitle2" color="textSecondary">Letter Requests</Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Charts Section */}
                        <Grid item xs={12} sx={{ mt: 3 }}>
                            <Typography variant="h6" gutterBottom color="textSecondary">Status Distribution</Typography>
                        </Grid>

                        {/* Excuse Status Chart */}
                        <Grid item xs={12} md={4}>
                            <Card elevation={2} sx={{ height: 350 }}>
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight="bold" align="center" gutterBottom>Excuse Requests</Typography>
                                    <Box height={280}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={prepareStatusData(data.statusDistribution.excuse)}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {prepareStatusData(data.statusDistribution.excuse).map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Leave Status Chart */}
                        <Grid item xs={12} md={4}>
                            <Card elevation={2} sx={{ height: 350 }}>
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight="bold" align="center" gutterBottom>Leave Requests</Typography>
                                    <Box height={280}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={prepareStatusData(data.statusDistribution.leave)}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {prepareStatusData(data.statusDistribution.leave).map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Letter Status Chart */}
                        <Grid item xs={12} md={4}>
                            <Card elevation={2} sx={{ height: 350 }}>
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight="bold" align="center" gutterBottom>Other Letters</Typography>
                                    <Box height={280}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={prepareStatusData(data.statusDistribution.letter)}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {prepareStatusData(data.statusDistribution.letter).map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                    </Grid>
                ) : null}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default RequestAnalytics;

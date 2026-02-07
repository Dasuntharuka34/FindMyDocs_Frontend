import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    FormControl,
    Select,
    MenuItem,
    CircularProgress,
    Card,
    CardContent,
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    People as PeopleIcon,
    Assignment as AssignmentIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
} from '@mui/icons-material';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../utils/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AnalyticsDashboard() {
    const [period, setPeriod] = useState('week');
    const [activityData, setActivityData] = useState(null);
    const [usageStats, setUsageStats] = useState(null);
    const [requestAnalytics, setRequestAnalytics] = useState(null);
    const [systemHealth, setSystemHealth] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const [activity, usage, requests, health] = await Promise.all([
                api.get(`/analytics/activity?period=${period}`),
                api.get('/analytics/usage'),
                api.get('/analytics/requests'),
                api.get('/analytics/system-health'),
            ]);

            setActivityData(activity.data);
            setUsageStats(usage.data);
            setRequestAnalytics(requests.data);
            setSystemHealth(health.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress size={60} />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    Analytics Dashboard
                </Typography>
                <FormControl sx={{ minWidth: 150 }}>
                    <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
                        <MenuItem value="day">Last 24 Hours</MenuItem>
                        <MenuItem value="week">Last 7 Days</MenuItem>
                        <MenuItem value="month">Last 30 Days</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {/* Key Metrics */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        New Users
                                    </Typography>
                                    <Typography variant="h4">{activityData?.metrics?.newUsers || 0}</Typography>
                                </Box>
                                <PeopleIcon sx={{ fontSize: 48, color: '#1976d2' }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        Total Requests
                                    </Typography>
                                    <Typography variant="h4">{activityData?.metrics?.totalRequests || 0}</Typography>
                                </Box>
                                <AssignmentIcon sx={{ fontSize: 48, color: '#9c27b0' }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        Approved
                                    </Typography>
                                    <Typography variant="h4">{activityData?.metrics?.approvedRequests || 0}</Typography>
                                </Box>
                                <CheckCircleIcon sx={{ fontSize: 48, color: '#2e7d32' }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        Approval Rate
                                    </Typography>
                                    <Typography variant="h4">{activityData?.metrics?.approvalRate || 0}%</Typography>
                                </Box>
                                <TrendingUpIcon sx={{ fontSize: 48, color: '#ed6c02' }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Charts */}
            <Grid container spacing={3}>
                {/* Request Types Distribution */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Request Types Distribution
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Excuse', value: activityData?.metrics?.excuseRequests || 0 },
                                        { name: 'Leave', value: activityData?.metrics?.leaveRequests || 0 },
                                        { name: 'Letter', value: activityData?.metrics?.letterRequests || 0 },
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry) => `${entry.name}: ${entry.value}`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {[0, 1, 2].map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Most Active Users */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Most Active Users
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={usageStats?.mostActiveUsers?.slice(0, 5) || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="requestCount" fill="#1976d2" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Requests by Department */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Requests by Department
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={usageStats?.requestsByDepartment || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="_id" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="totalRequests" fill="#2e7d32" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Peak Usage Times */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Peak Usage Times (by Hour)
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={usageStats?.peakTimes || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="_id" label={{ value: 'Hour', position: 'insideBottom', offset: -5 }} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="count" stroke="#ed6c02" />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* System Health */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            System Health
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box>
                                    <Typography variant="body2" color="textSecondary">
                                        Database Status
                                    </Typography>
                                    <Typography variant="h6" color={systemHealth?.database?.status === 'Connected' ? 'success.main' : 'error.main'}>
                                        {systemHealth?.database?.status || 'Unknown'}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box>
                                    <Typography variant="body2" color="textSecondary">
                                        Active Sessions
                                    </Typography>
                                    <Typography variant="h6">{systemHealth?.sessions?.active || 0}</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box>
                                    <Typography variant="body2" color="textSecondary">
                                        Errors (24h)
                                    </Typography>
                                    <Typography variant="h6" color={systemHealth?.errors?.last24Hours > 0 ? 'warning.main' : 'success.main'}>
                                        {systemHealth?.errors?.last24Hours || 0}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box>
                                    <Typography variant="body2" color="textSecondary">
                                        Uptime
                                    </Typography>
                                    <Typography variant="h6">
                                        {systemHealth?.uptime ? Math.floor(systemHealth.uptime / 3600) : 0}h
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

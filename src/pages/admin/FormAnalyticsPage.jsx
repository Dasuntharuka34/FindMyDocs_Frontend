import React, { useState, useEffect, useContext } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    CircularProgress,
    Card,
    CardContent
} from '@mui/material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const FormAnalyticsPage = () => {
    const { token } = useContext(AuthContext);
    const [analytics, setAnalytics] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/forms/analytics`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('Analytics Data Received:', response.data);
                setAnalytics(response.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [token]);

    const getProcessedData = () => {
        const dataMap = {};
        analytics.forEach(item => {
            if (!dataMap[item.formName]) {
                dataMap[item.formName] = { name: item.formName, total: 0 };
            }
            dataMap[item.formName][item.status] = item.count;
            dataMap[item.formName].total += item.count;
        });
        return Object.values(dataMap);
    };

    const getStatusDistribution = () => {
        const statusMap = {};
        analytics.forEach(item => {
            statusMap[item.status] = (statusMap[item.status] || 0) + item.count;
        });
        return Object.keys(statusMap).map(key => ({ name: key, value: statusMap[key] }));
    };

    console.log('Processed Data for Graph:', getProcessedData());

    if (loading) return <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>;

    const processedData = getProcessedData();

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>Form Analytics</Typography>

            {analytics.length === 0 ? (
                <Paper elevation={3} sx={{ p: 10, textAlign: 'center', mt: 4 }}>
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                        No submission data available yet.
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Analytics will be displayed here once users start submitting forms.
                    </Typography>
                </Paper>
            ) : (
                <>
                    <Grid container spacing={3} mb={4}>
                        <Grid item xs={12} md={8}>
                            <Paper elevation={3} sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom>Submissions by Form and Status</Typography>
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={processedData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="Pending" fill="#ffc658" stackId="a" />
                                        <Bar dataKey="Approved" fill="#82ca9d" stackId="a" />
                                        <Bar dataKey="Rejected" fill="#ff8042" stackId="a" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Paper elevation={3} sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom>Overall Status Distribution</Typography>
                                <ResponsiveContainer width="100%" height={400}>
                                    <PieChart>
                                        <Pie
                                            data={getStatusDistribution()}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {getStatusDistribution().map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Paper>
                        </Grid>
                    </Grid>

                    <Grid container spacing={3}>
                        {processedData.map((form, idx) => (
                            <Grid item xs={12} sm={6} md={3} key={idx}>
                                <Card elevation={2}>
                                    <CardContent>
                                        <Typography color="textSecondary" gutterBottom noWrap title={form.name}>
                                            {form.name}
                                        </Typography>
                                        <Typography variant="h4">{form.total}</Typography>
                                        <Typography variant="body2" color="textSecondary">Total Submissions</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </>
            )}
        </Box>
    );
};

export default FormAnalyticsPage;

import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import StatisticCard from '../components/StatisticCard';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  IconButton,
  Chip
} from '@mui/material';
import {
  Group as GroupIcon,
  PendingActions as PendingIcon,
  CheckCircle as CheckIcon,
  Description as DescriptionIcon,
  Visibility as ViewIcon,
  People as UserManagementIcon,
  DescriptionOutlined as FormIcon,
  Assessment as ReportIcon
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/pages/AdminDashboard.css';

import api from '../utils/api';

export default function AdminDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [totalUsers, setTotalUsers] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [approvedRequests, setApprovedRequests] = useState(0);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch dashboard statistics and recent data
        const [
          usersRes,
          pendingRegRes,
          allPendingRes,
          leaveRes,
          excuseRes,
          letterRes
        ] = await Promise.all([
          api.get('/users'),
          api.get('/users/registrations/pending'),
          api.get('/users/pendingRequests'),
          api.get('/leaverequests'),
          api.get('/excuserequests'),
          api.get('/letters').catch(() => ({ data: [] })) // Fallback for letters if needed
        ]);

        const totalUsersCount = usersRes.data.length;
        const pendingRegCount = pendingRegRes.data.length;
        const pendingRequestsData = allPendingRes.data;
        const pendingLeaveCount = pendingRequestsData.filter(r => r.type === 'leave').length;
        const pendingExcuseCount = pendingRequestsData.filter(r => r.type === 'excuse').length;

        const approvedLeaveCount = leaveRes.data.filter(r => r.status?.toLowerCase() === 'approved').length;
        const approvedExcuseCount = excuseRes.data.filter(r => r.status?.toLowerCase() === 'approved').length;
        const approvedLettersCount = letterRes.data.filter(r => r.status?.toLowerCase() === 'approved').length;

        setTotalUsers(totalUsersCount);
        setPendingRequests(pendingRegCount + pendingLeaveCount + pendingExcuseCount);
        setApprovedRequests(approvedLeaveCount + approvedExcuseCount + approvedLettersCount);

        // Combine and sort recent requests
        const combinedRequests = [
          ...leaveRes.data.map(r => ({ ...r, typeLabel: 'Leave' })),
          ...excuseRes.data.map(r => ({ ...r, typeLabel: 'Excuse' })),
          ...letterRes.data.map(r => ({ ...r, typeLabel: 'Letter', studentName: r.student })) // Letters might use 'student' instead of 'studentName'
        ];

        const sortedRecent = combinedRequests
          .sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate))
          .slice(0, 5);

        setRecentRequests(sortedRecent);
        setLoading(false);
      } catch (err) {
        console.error('Dashboard error:', err);
        setError('Failed to load dashboard data. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (!user || user.role !== 'Admin') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <Typography variant="h5" color="error">
          Access Denied! Administrator privileges required.
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" color="var(--text-secondary)">Loading dashboard data...</Typography>
      </Box>
    );
  }

  const quickActions = [
    { label: 'Pending Approvals', icon: PendingIcon, path: '/admin/registration-approvals', color: '#ed6c02' },
    { label: 'User Management', icon: UserManagementIcon, path: '/admin/user-management', color: '#1976d2' },
    { label: 'All Requests', icon: DescriptionIcon, path: '/admin/all-requests', color: '#2e7d32' },
    { label: 'Manage Forms', icon: FormIcon, path: '/admin/forms', color: '#9c27b0' },
    { label: 'Generate Reports', icon: ReportIcon, path: '/admin/reports', color: '#d32f2f' }
  ];

  return (
    <Box className="admin-dashboard-container" sx={{ p: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }} color="var(--text-h2)">
            Admin Overview
          </Typography>
          <Typography variant="body1" color="var(--text-secondary)">
            Manage users, requests, and system analytics.
          </Typography>
        </Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 'medium', color: 'var(--text-primary)' }}>
          Welcome back, <span style={{ color: 'var(--text-h2)' }}>{user.name}</span>
        </Typography>
      </Box>

      {error && (
        <Box sx={{
          mb: 4,
          p: 2,
          bgcolor: 'rgba(211, 47, 47, 0.1)',
          color: 'var(--error-color)',
          borderRadius: 2,
          border: '1px solid var(--error-color)'
        }}>
          <Typography variant="body2">{error}</Typography>
        </Box>
      )}

      {/* Statistics Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <StatisticCard label="Total Users" value={totalUsers} icon={GroupIcon} color="#1976d2" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatisticCard label="Pending Requests" value={pendingRequests} icon={PendingIcon} color="#ed6c02" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatisticCard label="Approved Requests" value={approvedRequests} icon={CheckIcon} color="#2e7d32" />
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Recent Requests Section */}
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{
            p: 3,
            borderRadius: 2,
            backgroundColor: 'var(--card-bg)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--card-shadow)'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Recent Activity
              </Typography>
              <Button component={Link} to="/admin/all-requests" size="small" variant="outlined">
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {recentRequests.length > 0 ? (
              <TableContainer>
                <Table size="medium">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentRequests.map((request) => (
                      <TableRow key={request._id} hover>
                        <TableCell sx={{ color: 'var(--text-primary)' }}>{request.studentName || request.student}</TableCell>
                        <TableCell>
                          <Chip
                            label={request.typeLabel}
                            size="small"
                            variant="outlined"
                            sx={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: 'var(--text-primary)' }}>{new Date(request.submittedDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className={`status-badge ${request.status ? request.status.toLowerCase() : ''}`}>
                            {request.status}
                          </span>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            component={Link}
                            to={request.typeLabel === 'Leave' ? `/leave-request/${request._id}` :
                              request.typeLabel === 'Excuse' ? `/excuse-request/${request._id}` :
                                `/documents/${request._id}`}
                            color="primary"
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" sx={{ textAlign: 'center', py: 4 }} color="textSecondary">
                No recent activity found.
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Quick Actions Section */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{
            p: 3,
            borderRadius: 2,
            height: '100%',
            backgroundColor: 'var(--card-bg)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--card-shadow)'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Quick Actions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  fullWidth
                  variant="outlined"
                  startIcon={<action.icon />}
                  onClick={() => navigate(action.path)}
                  sx={{
                    justifyContent: 'flex-start',
                    py: 1,
                    borderRadius: 2,
                    color: action.color,
                    borderColor: action.color,
                    '&:hover': {
                      borderColor: action.color,
                      backgroundColor: `${action.color}10`
                    }
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

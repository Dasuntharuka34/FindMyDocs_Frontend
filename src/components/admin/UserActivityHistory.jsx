import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Chip,
    Divider,
    IconButton
} from '@mui/material';
import {
    History as HistoryIcon,
    Description as DescriptionIcon,
    EventNote as EventNoteIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot, TimelineOppositeContent } from '@mui/lab';
import api from '../../utils/api';

const UserActivityHistory = ({ open, user, onClose }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (open && user) {
            fetchActivity();
        }
    }, [open, user]);

    const fetchActivity = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/users/${user._id}/activity`);
            setActivities(response.data);
        } catch (err) {
            console.error('Error fetching activity:', err);
            setError('Failed to load activity history.');
        } finally {
            setLoading(false);
        }
    };

    const getActivityIcon = (type) => {
        if (type.includes('Excuse')) return <DescriptionIcon />;
        if (type.includes('Leave')) return <EventNoteIcon />;
        if (type.includes('Letter')) return <DescriptionIcon />;
        return <HistoryIcon />;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return 'success';
            case 'Rejected': return 'error';
            default: return 'warning';
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Activity History: {user?.name}</Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                {loading ? (
                    <Box display="flex" justifyContent="center" p={4}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Typography color="error" align="center">{error}</Typography>
                ) : activities.length === 0 ? (
                    <Typography color="textSecondary" align="center" p={4}>
                        No activity history found for this user.
                    </Typography>
                ) : (
                    <Timeline position="alternate">
                        {activities.map((activity, index) => (
                            <TimelineItem key={index}>
                                <TimelineOppositeContent color="text.secondary">
                                    {new Date(activity.date).toLocaleDateString()}
                                    <br />
                                    {new Date(activity.date).toLocaleTimeString()}
                                </TimelineOppositeContent>
                                <TimelineSeparator>
                                    <TimelineDot color={getStatusColor(activity.status)}>
                                        {getActivityIcon(activity.type)}
                                    </TimelineDot>
                                    {index < activities.length - 1 && <TimelineConnector />}
                                </TimelineSeparator>
                                <TimelineContent>
                                    <Typography variant="h6" component="span">
                                        {activity.type}
                                    </Typography>
                                    <Typography>{activity.details}</Typography>
                                    <Chip
                                        label={activity.status}
                                        size="small"
                                        color={getStatusColor(activity.status)}
                                        variant="outlined"
                                        sx={{ mt: 1 }}
                                    />
                                </TimelineContent>
                            </TimelineItem>
                        ))}
                    </Timeline>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default UserActivityHistory;

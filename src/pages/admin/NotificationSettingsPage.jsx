import React, { useState, useEffect, useContext } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Switch,
    FormControlLabel,
    TextField,
    Button,
    CircularProgress,
    Divider,
    Alert,
    Card,
    CardContent,
    IconButton,
    Tooltip,
    MenuItem
} from '@mui/material';
import {
    NotificationsActive as NotificationIcon,
    Save as SaveIcon,
    Refresh as RefreshIcon,
    Email as EmailIcon,
    Timer as TimerIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import MessageModal from '../../components/MessageModal';
import Footer from '../../components/Footer';

const NotificationSettingsPage = () => {
    const { token } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [configs, setConfigs] = useState([]);
    const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            // Fetch both EMAIL_SETTINGS and SYSTEM_SETTINGS related to notifications
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/system-config`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch configurations');
            const data = await response.json();

            // Filter for notification/email related settings
            const relevantKeys = [
                'EMAIL_NOTIFICATIONS_ENABLED',
                'NOTIFICATION_POLLING_INTERVAL_SEC',
                'FEATURE_LEAVE_REQUESTS', // Example of feature flag
                'FEATURE_EXCUSE_REQUESTS',
                'FEATURE_LETTER_REQUESTS'
            ];
            setConfigs(data.filter(c => relevantKeys.includes(c.key)));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleValueChange = (key, newValue) => {
        setConfigs(prev => prev.map(c => c.key === key ? { ...c, value: newValue } : c));
    };

    const handleSave = async (config) => {
        setSaving(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/system-config/${config.key}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(config)
            });

            if (!response.ok) throw new Error('Failed to update configuration');

            setMessageModal({
                show: true,
                title: 'Success',
                message: `Configuration "${config.key}" updated successfully.`,
                onConfirm: () => setMessageModal({ show: false })
            });
        } catch (error) {
            setMessageModal({
                show: true,
                title: 'Error',
                message: error.message,
                onConfirm: () => setMessageModal({ show: false })
            });
        } finally {
            setSaving(false);
        }
    };

    const handleInitialize = async () => {
        if (!window.confirm('This will reset notification configurations to defaults. Continue?')) return;
        setLoading(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/system-config/initialize`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to initialize configs');
            fetchConfigs();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    const emailEnabled = configs.find(c => c.key === 'EMAIL_NOTIFICATIONS_ENABLED');
    const pollingInterval = configs.find(c => c.key === 'NOTIFICATION_POLLING_INTERVAL_SEC');

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Box sx={{ flex: 1, p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <NotificationIcon color="primary" fontSize="large" />
                        <Typography variant="h4" fontWeight="bold">Notification Settings</Typography>
                    </Box>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={handleInitialize}
                    >
                        Restore Defaults
                    </Button>
                </Box>

                <Alert severity="info" sx={{ mb: 4 }}>
                    Control how the system communicates with users through emails and real-time dashboard updates.
                </Alert>

                <Grid container spacing={4}>
                    {/* Email Settings */}
                    <Grid item xs={12} md={6}>
                        <Card elevation={2}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                                    <EmailIcon color="action" /> Email Notifications
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                {emailEnabled && (
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                        <Box>
                                            <Typography variant="subtitle1">Global Email Status</Typography>
                                            <Typography variant="body2" color="textSecondary">{emailEnabled.description}</Typography>
                                        </Box>
                                        <Switch
                                            checked={emailEnabled.value}
                                            onChange={(e) => handleValueChange(emailEnabled.key, e.target.checked)}
                                        />
                                    </Box>
                                )}

                                <Button
                                    variant="contained"
                                    startIcon={<SaveIcon />}
                                    onClick={() => handleSave(emailEnabled)}
                                    disabled={saving}
                                >
                                    Save Email Changes
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Application Settings */}
                    <Grid item xs={12} md={6}>
                        <Card elevation={2}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                                    <TimerIcon color="action" /> Dashboard Updates
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                {pollingInterval && (
                                    <Box mb={3}>
                                        <Typography variant="subtitle1">Polling Interval (Seconds)</Typography>
                                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>{pollingInterval.description}</Typography>
                                        <TextField
                                            type="number"
                                            fullWidth
                                            size="small"
                                            value={pollingInterval.value}
                                            onChange={(e) => handleValueChange(pollingInterval.key, parseInt(e.target.value))}
                                            InputProps={{ inputProps: { min: 5, max: 3600 } }}
                                        />
                                    </Box>
                                )}

                                <Button
                                    variant="contained"
                                    startIcon={<SaveIcon />}
                                    onClick={() => handleSave(pollingInterval)}
                                    disabled={saving}
                                >
                                    Save Interval Changes
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Feature Flags - Related to Notifications of specific features */}
                    <Grid item xs={12}>
                        <Card elevation={2}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Feature Notifications</Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Grid container spacing={2}>
                                    {configs.filter(c => c.key.startsWith('FEATURE_')).map(config => (
                                        <Grid item xs={12} sm={4} key={config.key}>
                                            <Paper variant="outlined" sx={{ p: 2 }}>
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={config.value}
                                                            onChange={(e) => handleValueChange(config.key, e.target.checked)}
                                                        />
                                                    }
                                                    label={config.key.replace('FEATURE_', '').replace('_', ' ')}
                                                />
                                                <Typography variant="caption" display="block" color="textSecondary">
                                                    {config.description}
                                                </Typography>
                                                <Box mt={1}>
                                                    <Button size="small" onClick={() => handleSave(config)}>Save</Button>
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
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

export default NotificationSettingsPage;

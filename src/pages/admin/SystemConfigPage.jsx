import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Switch,
    FormControlLabel,
    TextField,
    Button,
    Divider,
    CircularProgress,
    Alert,
    Tabs,
    Tab,
    Card,
    CardContent,
    Tooltip,
    IconButton
} from '@mui/material';
import {
    Save as SaveIcon,
    Refresh as RefreshIcon,
    Settings as SettingsIcon,
    Shield as ShieldIcon,
    ToggleOn as ToggleIcon,
    InfoOutlined as InfoIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import MessageModal from '../../components/MessageModal';
import Footer from '../../components/Footer';

function TabPanel({ children, value, index }) {
    return (
        <div hidden={value !== index} role="tabpanel">
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

const SystemConfigPage = () => {
    const { token } = useContext(AuthContext);
    const [tabValue, setTabValue] = useState(0);
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });

    const fetchConfigs = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/system-config`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch configurations');
            const data = await response.json();
            setConfigs(data);
        } catch (error) {
            console.error('Error fetching configs:', error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchConfigs();
        }
    }, [token, fetchConfigs]);

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
        if (!window.confirm('This will reset all system configurations to defaults. Continue?')) return;
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

    const renderConfigControl = (config) => {
        if (config.dataType === 'boolean' || typeof config.value === 'boolean') {
            return (
                <FormControlLabel
                    control={
                        <Switch
                            checked={config.value}
                            onChange={(e) => handleValueChange(config.key, e.target.checked)}
                        />
                    }
                    label={config.value ? "Enabled" : "Disabled"}
                />
            );
        }

        return (
            <TextField
                fullWidth
                size="small"
                type={config.dataType === 'number' ? 'number' : 'text'}
                value={config.value}
                onChange={(e) => handleValueChange(config.key, config.dataType === 'number' ? parseInt(e.target.value) : e.target.value)}
            />
        );
    };

    const renderConfigCard = (config) => (
        <Grid item xs={12} sm={6} key={config.key}>
            <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Typography variant="subtitle2" fontWeight="bold" color="primary">
                            {config.key.replace(/_/g, ' ')}
                        </Typography>
                        <Tooltip title={config.description || "No description provided"}>
                            <IconButton size="small"><InfoIcon fontSize="small" /></IconButton>
                        </Tooltip>
                    </Box>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2, minHeight: '3em' }}>
                        {config.description}
                    </Typography>
                    <Box mt="auto">
                        {renderConfigControl(config)}
                    </Box>
                </CardContent>
                <Divider />
                <Box p={1} display="flex" justifyContent="flex-end">
                    <Button
                        size="small"
                        startIcon={<SaveIcon />}
                        onClick={() => handleSave(config)}
                        disabled={saving}
                    >
                        Save
                    </Button>
                </Box>
            </Card>
        </Grid>
    );

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Box sx={{ flex: 1, p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <SettingsIcon color="primary" fontSize="large" />
                        <Typography variant="h4" fontWeight="bold">System Configuration</Typography>
                    </Box>
                    <Box gap={1} display="flex">
                        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchConfigs}>Refresh</Button>
                        <Button variant="outlined" color="warning" onClick={handleInitialize}>Reset Defaults</Button>
                    </Box>
                </Box>

                {configs.find(c => c.key === 'MAINTENANCE_MODE')?.value && (
                    <Alert severity="warning" variant="filled" sx={{ mb: 3 }} icon={<WarningIcon />}>
                        <strong>MAINTENANCE MODE IS ENABLED.</strong> Non-admin users currently cannot access the application.
                    </Alert>
                )}

                <Paper elevation={2}>
                    <Tabs
                        value={tabValue}
                        onChange={(e, newValue) => setTabValue(newValue)}
                        variant="fullWidth"
                        indicatorColor="primary"
                        textColor="primary"
                    >
                        <Tab icon={<ToggleIcon />} label="Feature Flags" />
                        <Tab icon={<SettingsIcon />} label="System Settings" />
                        <Tab icon={<ShieldIcon />} label="Security" />
                    </Tabs>

                    {/* Feature Flags */}
                    <TabPanel value={tabValue} index={0}>
                        <Grid container spacing={3}>
                            {configs.filter(c => c.category === 'FEATURE_FLAGS').map(renderConfigCard)}
                        </Grid>
                    </TabPanel>

                    {/* System Settings */}
                    <TabPanel value={tabValue} index={1}>
                        <Grid container spacing={3}>
                            {configs.filter(c => c.category === 'SYSTEM_SETTINGS' || c.category === 'EMAIL_SETTINGS' || c.category === 'GENERAL').map(renderConfigCard)}
                        </Grid>
                    </TabPanel>

                    {/* Security */}
                    <TabPanel value={tabValue} index={2}>
                        <Grid container spacing={3}>
                            {configs.filter(c => c.category === 'SECURITY').map(renderConfigCard)}
                        </Grid>
                    </TabPanel>
                </Paper>
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

export default SystemConfigPage;

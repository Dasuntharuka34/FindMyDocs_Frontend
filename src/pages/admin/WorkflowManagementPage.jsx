import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
    Box,
    Typography,
    Button,
    Grid,
    IconButton,
    TextField,
    CircularProgress,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Card,
    CardContent,
    List,
    ListItem,
    Divider,
    Alert
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    ArrowUpward as UpIcon,
    ArrowDownward as DownIcon,
    AccountTree as StepsIcon,
    Save as SaveIcon,
    Restore as RestoreIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import MessageModal from '../../components/MessageModal';
import Footer from '../../components/Footer';

const WorkflowManagementPage = () => {
    const { token } = useContext(AuthContext);
    const [workflows, setWorkflows] = useState([]);
    const [dynamicForms, setDynamicForms] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });

    const fetchDynamicForms = useCallback(async () => {
        try {
            const response = await api.get('/forms');
            setDynamicForms(response.data);
        } catch (error) {
            console.error("Error fetching dynamic forms:", error);
            setMessageModal({
                show: true,
                title: 'Error',
                message: error.response?.data?.message || 'Failed to fetch dynamic forms.',
                onConfirm: () => setMessageModal({ show: false })
            });
        }
    }, []);

    const fetchWorkflows = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/workflows');
            setWorkflows(response.data);
        } catch (error) {
            console.error("Error fetching workflows:", error);
            setMessageModal({
                show: true,
                title: 'Error',
                message: error.response?.data?.message || 'Failed to fetch workflows. Please try again.',
                onConfirm: () => setMessageModal({ show: false })
            });
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchRoles = useCallback(async () => {
        try {
            const response = await api.get('/roles');
            setRoles(response.data);
        } catch (error) {
            console.error("Error fetching roles:", error);
            setMessageModal({
                show: true,
                title: 'Error',
                message: error.response?.data?.message || 'Failed to fetch roles.',
                onConfirm: () => setMessageModal({ show: false })
            });
        }
    }, []);

    useEffect(() => {
        if (token) {
            fetchWorkflows();
            fetchRoles();
            fetchDynamicForms();
        }
    }, [token, fetchWorkflows, fetchRoles, fetchDynamicForms]);

    const handleAddWorkflow = (requestType) => {
        if (!requestType) return;
        if (workflows.some(w => w.requestType === requestType)) return;

        const newWorkflow = {
            requestType,
            description: `Workflow for ${requestType}`,
            steps: [],
            isActive: true
        };
        setWorkflows([...workflows, newWorkflow]);
    };

    const handleAddStep = (workflowIndex) => {
        const newWorkflows = [...workflows];
        newWorkflows[workflowIndex].steps.push({
            name: `Step ${newWorkflows[workflowIndex].steps.length + 1}`,
            approverRole: ''
        });
        setWorkflows(newWorkflows);
    };

    const handleRemoveStep = (workflowIndex, stepIndex) => {
        const newWorkflows = [...workflows];
        newWorkflows[workflowIndex].steps.splice(stepIndex, 1);
        setWorkflows(newWorkflows);
    };

    const handleStepChange = (wfIdx, sIdx, field, value) => {
        const newWorkflows = [...workflows];
        const updatedWf = { ...newWorkflows[wfIdx] };
        const updatedSteps = [...updatedWf.steps];
        updatedSteps[sIdx] = { ...updatedSteps[sIdx], [field]: value };
        updatedWf.steps = updatedSteps;
        newWorkflows[wfIdx] = updatedWf;
        setWorkflows(newWorkflows);
    };

    const handleMoveStep = (wfIdx, sIdx, direction) => {
        const newWorkflows = [...workflows];
        const updatedWf = { ...newWorkflows[wfIdx] };
        const updatedSteps = [...updatedWf.steps];
        const newIndex = sIdx + direction;
        if (newIndex >= 0 && newIndex < updatedSteps.length) {
            [updatedSteps[sIdx], updatedSteps[newIndex]] = [updatedSteps[newIndex], updatedSteps[sIdx]];
            updatedWf.steps = updatedSteps;
            newWorkflows[wfIdx] = updatedWf;
            setWorkflows(newWorkflows);
        }
    };

    const handleSave = async (workflow) => {
        setSaving(true);
        try {
            const response = await api.post('/workflows', workflow);

            setMessageModal({
                show: true,
                title: 'Success',
                message: `Workflow for ${workflow.requestType} updated successfully.`,
                onConfirm: () => setMessageModal({ show: false })
            });
            fetchWorkflows(); // Refresh list to get updated data
        } catch (error) {
            setMessageModal({
                show: true,
                title: 'Error',
                message: error.response?.data?.message || error.message,
                onConfirm: () => setMessageModal({ show: false })
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteWorkflow = async (workflow) => {
        if (!window.confirm(`Are you sure you want to delete the workflow for "${workflow.requestType}" requests? This action cannot be undone.`)) {
            return;
        }

        setSaving(true);
        try {
            await api.delete(`/workflows/${workflow.requestType}`);

            setMessageModal({
                show: true,
                title: 'Success',
                message: `Workflow for ${workflow.requestType} deleted successfully.`,
                onConfirm: () => {
                    setMessageModal({ show: false });
                    fetchWorkflows(); // Refresh list after deletion
                }
            });
        } catch (error) {
            setMessageModal({
                show: true,
                title: 'Error',
                message: error.response?.data?.message || 'Failed to delete workflow.',
                onConfirm: () => setMessageModal({ show: false })
            });
        } finally {
            setSaving(false);
        }
    };

    const handleInitialize = async () => {
        if (!window.confirm('This will reset all workflows to defaults. Existing requests might be affected. Continue?')) return;
        setLoading(true);
        try {
            await api.post('/workflows/initialize');
            fetchWorkflows();
        } catch (error) {
            console.error("Error initializing workflows:", error);
            setMessageModal({
                show: true,
                title: 'Error',
                message: 'Failed to initialize default workflows.',
                onConfirm: () => setMessageModal({ show: false })
            });
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

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Box sx={{ flex: 1, p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <StepsIcon color="primary" fontSize="large" />
                        <Typography variant="h4" fontWeight="bold">Approval Workflows</Typography>
                    </Box>
                    <Box display="flex" gap={2}>
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel>Add Workflow for Form</InputLabel>
                            <Select
                                value=""
                                displayEmpty
                                label="Add Workflow for Form"
                                onChange={(e) => handleAddWorkflow(e.target.value)}
                            >
                                <MenuItem value="" disabled>
                                    <em>Select a form to add workflow</em>
                                </MenuItem>
                                {dynamicForms
                                    .filter(f => !workflows.some(w => w.requestType === f.name))
                                    .map(f => (
                                        <MenuItem key={f._id} value={f.name}>{f.name}</MenuItem>
                                    ))}
                            </Select>
                        </FormControl>
                        <Button variant="outlined" startIcon={<RestoreIcon />} onClick={handleInitialize}>Reset Defaults</Button>
                    </Box>
                </Box>

                <Alert severity="info" sx={{ mb: 3 }} icon={<InfoIcon />}>
                    Workflows define the sequence of roles that must approve a request before it is fully "Approved".
                </Alert>

                <Grid container spacing={4}>
                    {workflows.map((workflow, wfIdx) => (
                        <Grid item xs={12} lg={6} key={workflow.requestType}>
                            <Card elevation={3}>
                                <CardContent>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                        <Typography variant="h6" fontWeight="bold">
                                            {workflow.requestType} Requests
                                        </Typography>
                                        <Box display="flex" gap={1}>
                                            <Button
                                                startIcon={<SaveIcon />}
                                                variant="contained"
                                                size="small"
                                                onClick={() => handleSave(workflow)}
                                                disabled={saving}
                                            >
                                                Save Workflow
                                            </Button>
                                            <Button
                                                startIcon={<DeleteIcon />}
                                                variant="outlined"
                                                color="error"
                                                size="small"
                                                onClick={() => handleDeleteWorkflow(workflow)}
                                                disabled={saving}
                                            >
                                                Delete
                                            </Button>
                                        </Box>
                                    </Box>
                                    <Typography variant="body2" color="textSecondary" mb={3}>
                                        {workflow.description}
                                    </Typography>

                                    <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                                        {workflow.steps.map((step, sIdx) => (
                                            <React.Fragment key={sIdx}>
                                                <ListItem>
                                                    <Grid container spacing={2} alignItems="center">
                                                        <Grid item xs={12} sm={5}>
                                                            <TextField
                                                                label="Step Name"
                                                                size="small"
                                                                fullWidth
                                                                value={step.name}
                                                                onChange={(e) => handleStepChange(wfIdx, sIdx, 'name', e.target.value)}
                                                            />
                                                        </Grid>
                                                        <Grid item xs={12} sm={5}>
                                                            <FormControl fullWidth size="small">
                                                                <InputLabel>Approver Role</InputLabel>
                                                                <Select
                                                                    value={step.approverRole}
                                                                    label="Approver Role"
                                                                    onChange={(e) => handleStepChange(wfIdx, sIdx, 'approverRole', e.target.value)}
                                                                >
                                                                    {roles.map(role => (
                                                                        <MenuItem key={role._id} value={role.name}>{role.name}</MenuItem>
                                                                    ))}
                                                                </Select>
                                                            </FormControl>
                                                        </Grid>
                                                        <Grid item xs={12} sm={2}>
                                                            <Box display="flex">
                                                                <IconButton size="small" onClick={() => handleMoveStep(wfIdx, sIdx, -1)} disabled={sIdx === 0}><UpIcon /></IconButton>
                                                                <IconButton size="small" onClick={() => handleMoveStep(wfIdx, sIdx, 1)} disabled={sIdx === workflow.steps.length - 1}><DownIcon /></IconButton>
                                                                <IconButton size="small" color="error" onClick={() => handleRemoveStep(wfIdx, sIdx)}><DeleteIcon /></IconButton>
                                                            </Box>
                                                        </Grid>
                                                    </Grid>
                                                </ListItem>
                                                {sIdx < workflow.steps.length - 1 && <Divider />}
                                            </React.Fragment>
                                        ))}
                                    </List>

                                    <Box mt={2}>
                                        <Button startIcon={<AddIcon />} variant="outlined" fullWidth onClick={() => handleAddStep(wfIdx)}>
                                            Add Approval Step
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
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

export default WorkflowManagementPage;

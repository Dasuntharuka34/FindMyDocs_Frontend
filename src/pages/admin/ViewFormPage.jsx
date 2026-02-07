import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  Stack,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as BackIcon,
  Label as LabelIcon,
  TypeSpecimen as TypeIcon,
  CheckCircleOutline as RequiredIcon,
  List as OptionsIcon,
  HelpOutline as LogicIcon
} from '@mui/icons-material';
import api from '../../utils/api';

const ViewFormPage = () => {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await api.get(`/forms/${id}`);
        setForm(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching form details.');
        setLoading(false);
      }
    };

    fetchForm();
  }, [id]);

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>;

  if (error) return <Box p={3}><Alert severity="error">{error}</Alert></Box>;

  if (!form) return <Box p={3}><Alert severity="warning">Form not found.</Alert></Box>;

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link component={RouterLink} to="/admin/forms" underline="hover" color="inherit">Manage Forms</Link>
          <Typography color="text.primary">View Form</Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>{form.name}</Typography>
            <Typography variant="body1" color="text.secondary">{form.description || 'No description provided.'}</Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              component={RouterLink}
              to="/admin/forms"
              variant="outlined"
              startIcon={<BackIcon />}
            >
              Back to List
            </Button>
            <Button
              component={RouterLink}
              to={`/admin/forms/edit/${id}`}
              variant="contained"
              startIcon={<EditIcon />}
            >
              Edit Form
            </Button>
          </Stack>
        </Box>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              Form Status
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              <ListItem sx={{ px: 0 }}>
                <ListItemText
                  primary="Status"
                  secondary={
                    <Chip
                      label={form.isEnabled ? 'Enabled' : 'Disabled'}
                      color={form.isEnabled ? 'success' : 'default'}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  }
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemText primary="Version" secondary={form.version} />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemText primary="Created At" secondary={new Date(form.createdAt).toLocaleDateString()} />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemText primary="Total Fields" secondary={form.fields.length} />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>Fields Configuration</Typography>
          <Stack spacing={2}>
            {form.fields.map((field, index) => (
              <Card key={index} variant="outlined" sx={{ borderRadius: 2, '&:hover': { boxShadow: 1 } }}>
                <CardContent sx={{ p: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <LabelIcon color="primary" fontSize="small" />
                        <Typography variant="subtitle1" fontWeight="bold">{field.label}</Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">ID: {field.name}</Typography>
                    </Grid>

                    <Grid item xs={12} sm={6} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Chip
                        icon={<TypeIcon fontSize="small" />}
                        label={field.type.toUpperCase()}
                        size="small"
                        variant="outlined"
                      />
                      {field.validation?.required && (
                        <Chip
                          icon={<RequiredIcon fontSize="small" />}
                          label="REQUIRED"
                          size="small"
                          color="error"
                          variant="outlined"
                        />
                      )}
                    </Grid>

                    {['select', 'radio', 'checkbox'].includes(field.type) && field.options && (
                      <Grid item xs={12}>
                        <Box sx={{ mt: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                            <OptionsIcon fontSize="inherit" /> Options
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {field.options.map((opt, i) => (
                              <Chip key={i} label={opt} size="small" variant="filled" sx={{ bgcolor: 'white' }} />
                            ))}
                          </Stack>
                        </Box>
                      </Grid>
                    )}

                    {field.logic?.showIf?.field && (
                      <Grid item xs={12}>
                        <Box sx={{ mt: 1, p: 1.5, border: '1px dashed', borderColor: 'info.light', borderRadius: 1, bgcolor: 'info.50' }}>
                          <Typography variant="caption" color="info.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LogicIcon fontSize="inherit" /> Conditional Logic: Show if <strong>{field.logic.showIf.field}</strong> {field.logic.showIf.operator} <strong>"{field.logic.showIf.value}"</strong>
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ViewFormPage;
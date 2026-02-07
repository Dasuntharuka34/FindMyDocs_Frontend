import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

export default function AdminFormsPage() {
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingRoles, setEditingRoles] = useState(null); // Track which form's roles are being edited
    const [allRoles, setAllRoles] = useState([]); // Dynamically loaded roles

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch forms
                const formsResponse = await api.get('/forms');
                setForms(formsResponse.data);

                // Fetch available roles from public roles endpoint
                const rolesResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/roles/public`);
                const rolesData = await rolesResponse.json();
                
                // Extract role names from the roles array
                const roleNames = Array.isArray(rolesData) ? rolesData.map(role => role.name) : [];
                setAllRoles(roleNames);
                setLoading(false);
            } catch (err) {
                setError('Failed to load forms');
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleToggleStatus = async (formId, currentStatus) => {
        try {
            await api.put(`/forms/${formId}/status`, { isEnabled: !currentStatus });
            setForms(forms.map(f => f._id === formId ? { ...f, isEnabled: !currentStatus } : f));
        } catch (err) {
            alert('Failed to update form status');
        }
    };

    const handleDeleteForm = async (formId) => {
        if (!window.confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
            return;
        }

        try {
            await api.delete(`/forms/${formId}`);
            setForms(forms.filter(f => f._id !== formId));
        } catch (err) {
            alert('Failed to delete form');
        }
    };

    const handleToggleRole = (formId, role) => {
        setForms(forms.map(f => {
            if (f._id === formId) {
                const defaultRoles = ['Student', 'Lecturer', 'HOD', 'Dean', 'Admin'];
                const currentRoles = Array.isArray(f.visibleToRoles) ? f.visibleToRoles : allRoles.length > 0 ? allRoles : defaultRoles;
                const newRoles = currentRoles.includes(role)
                    ? currentRoles.filter(r => r !== role)
                    : [...currentRoles, role];
                return { ...f, visibleToRoles: newRoles };
            }
            return f;
        }));
    };

    const handleSaveRoles = async (formId) => {
        const form = forms.find(f => f._id === formId);
        try {
            await api.put(`/forms/${formId}/roles`, { visibleToRoles: form.visibleToRoles });
            setEditingRoles(null);
            alert('Role visibility updated successfully');
        } catch (err) {
            alert('Failed to update role visibility');
        }
    };

    if (loading) return <p className="loading-text" style={{ textAlign: 'center', marginTop: '50px' }}>Loading forms...</p>;
    if (error) return <div className="error-message" style={{ color: 'red', textAlign: 'center', marginTop: '50px' }}>{error}</div>;

    return (
        <div className="admin-container" style={{ padding: '20px' }}>
            <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Manage Forms</h2>
                <Link to="/admin/forms/new" className="create-btn" style={{ padding: '8px 16px', background: '#1976d2', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
                    Create New Form
                </Link>
            </div>

            <div className="table-container" style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f5f5f5' }}>
                            <th style={{ padding: '14px', textAlign: 'left', fontSize: '1rem', fontWeight: '600' }}>Name</th>
                            <th style={{ padding: '14px', textAlign: 'left', fontSize: '1rem', fontWeight: '600' }}>Type</th>
                            <th style={{ padding: '14px', textAlign: 'left', fontSize: '1rem', fontWeight: '600' }}>Description</th>
                            <th style={{ padding: '14px', textAlign: 'left', fontSize: '1rem', fontWeight: '600' }}>Visible To Roles</th>
                            <th style={{ padding: '14px', textAlign: 'left', fontSize: '1rem', fontWeight: '600' }}>Status</th>
                            <th style={{ padding: '14px', textAlign: 'left', fontSize: '1rem', fontWeight: '600' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {forms.map((form) => (
                            <tr key={form._id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '14px', fontSize: '0.95rem' }}><strong>{form.name}</strong></td>
                                <td style={{ padding: '14px' }}>
                                    <span style={{
                                        padding: '5px 10px',
                                        borderRadius: '12px',
                                        fontSize: '0.85rem',
                                        fontWeight: '500',
                                        background: form.isSystemForm ? '#e3f2fd' : '#f3e5f5',
                                        color: form.isSystemForm ? '#1976d2' : '#7b1fa2'
                                    }}>
                                        {form.isSystemForm ? 'System' : 'Dynamic'}
                                    </span>
                                </td>
                                <td style={{ padding: '14px', fontSize: '0.9rem' }}>{form.description}</td>
                                <td style={{ padding: '14px' }}>
                                    {editingRoles === form._id ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {Array.isArray(allRoles) && allRoles.map(role => (
                                                <label key={role} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={(Array.isArray(form.visibleToRoles) ? form.visibleToRoles : allRoles).includes(role)}
                                                        onChange={() => handleToggleRole(form._id, role)}
                                                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                                    />
                                                    {role}
                                                </label>
                                            ))}
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                                <button
                                                    onClick={() => handleSaveRoles(form._id)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        background: '#4caf50',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '5px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.85rem',
                                                        fontWeight: '500'
                                                    }}
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingRoles(null)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        background: '#999',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '5px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.85rem',
                                                        fontWeight: '500'
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                                                {Array.isArray(form.visibleToRoles) && form.visibleToRoles.map(role => (
                                                    <span key={role} style={{
                                                        padding: '4px 8px',
                                                        background: '#e8f5e9',
                                                        color: '#2e7d32',
                                                        borderRadius: '10px',
                                                        fontSize: '0.85rem',
                                                        fontWeight: '500'
                                                    }}>
                                                        {role}
                                                    </span>
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => setEditingRoles(form._id)}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: '#1976d2',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '5px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem',
                                                    fontWeight: '500'
                                                }}
                                            >
                                                Edit Roles
                                            </button>
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '14px' }}>
                                    <button
                                        onClick={() => handleToggleStatus(form._id, form.isEnabled)}
                                        style={{
                                            padding: '6px 14px',
                                            borderRadius: '16px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            background: form.isEnabled ? '#e8f5e9' : '#ffebee',
                                            color: form.isEnabled ? '#2e7d32' : '#c62828',
                                            fontWeight: '600',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        {form.isEnabled ? 'Enabled' : 'Disabled'}
                                    </button>
                                </td>
                                <td style={{ padding: '14px' }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        {!form.isSystemForm && <Link to={`/admin/forms/edit/${form._id}`} style={{ color: '#1976d2', fontSize: '0.9rem', fontWeight: '500', textDecoration: 'none' }}>Edit</Link>}
                                        {!form.isSystemForm && (
                                            <button
                                                onClick={() => handleDeleteForm(form._id)}
                                                style={{ color: '#d32f2f', border: 'none', background: 'none', cursor: 'pointer', padding: 0, fontSize: '0.9rem', fontWeight: '500' }}
                                            >
                                                Delete
                                            </button>
                                        )}
                                        {form.isSystemForm && <span style={{ color: '#999', fontSize: '0.85rem', fontStyle: 'italic' }}>System Reserved</span>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
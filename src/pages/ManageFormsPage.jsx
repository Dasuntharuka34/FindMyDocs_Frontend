import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import '../styles/pages/ManageFormsPage.css';

const ManageFormsPage = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await api.get('/forms');
        setForms(response.data);
        setLoading(false);
      } catch (err) {
        setError('Error fetching forms.');
        setLoading(false);
      }
    };

    fetchForms();
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/forms/${id}`);
      setForms(forms.filter(form => form._id !== id));
    } catch (err) {
      setError('Error deleting form.');
    }
  };

  const handleToggle = async (id, isEnabled) => {
    try {
      const response = await api.put(`/forms/${id}/status`, { isEnabled: !isEnabled });
      setForms(forms.map(form => form._id === id ? response.data : form));
    } catch (err) {
      setError('Error updating form status.');
    }
  };

  if (loading) {
    return <p>Loading forms...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div className="manage-forms-page">
      <h2>Manage Forms</h2>
      <Link to="/admin/forms/new" className="create-form-btn">
        Create New Form
      </Link>
      {forms.length === 0 ? (
        <p>No forms created yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Form Name</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {forms.map(form => (
              <tr key={form._id} className={!form.isEnabled ? 'disabled' : ''}>
                <td data-label="Form Name">{form.name}</td>
                <td data-label="Status">{form.isEnabled ? 'Enabled' : 'Disabled'}</td>
                <td data-label="Actions" className="action-btns">
                  <Link to={`/admin/forms/view/${form._id}`}><button className="view-btn">View</button></Link>
                  <Link to={`/admin/forms/edit/${form._id}`}><button className="edit-btn">Edit</button></Link>
                  <button className="delete-btn" onClick={() => handleDelete(form._id)}>Delete</button>
                  <button className={`toggle-btn ${form.isEnabled ? 'disable-btn' : 'enable-btn'}`}
                          onClick={() => handleToggle(form._id, form.isEnabled)}>
                    {form.isEnabled ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ManageFormsPage;

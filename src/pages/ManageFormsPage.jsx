import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

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

  if (loading) {
    return <p>Loading forms...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div>
      <h2>Manage Forms</h2>
      <Link to="/admin/forms/new">
        <button>Create New Form</button>
      </Link>
      {forms.length === 0 ? (
        <p>No forms created yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Form Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {forms.map(form => (
              <tr key={form._id}>
                <td>{form.name}</td>
                <td>
                  <Link to={`/admin/forms/view/${form._id}`}><button>View</button></Link>
                  <Link to={`/admin/forms/edit/${form._id}`}><button>Edit</button></Link>
                  <button onClick={() => handleDelete(form._id)}>Delete</button>
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

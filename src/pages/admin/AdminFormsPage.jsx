import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

export default function AdminFormsPage() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/forms');
        setForms(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load forms');
        setLoading(false);
      }
    };

    fetchForms();
  }, []);

  if (loading) {
    return <p>Loading forms...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div>
      <h2>Manage Forms</h2>
      <Link to="/admin/forms/new">Create New Form</Link>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {forms.map((form) => (
            <tr key={form._id}>
              <td>{form.name}</td>
              <td>{form.description}</td>
              <td>
                <Link to={`/admin/forms/edit/${form._id}`}>Edit</Link>
                <button>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
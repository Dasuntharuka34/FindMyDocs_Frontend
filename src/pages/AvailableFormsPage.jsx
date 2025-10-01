import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import '../styles/pages/AvailableFormsPage.css';

const AvailableFormsPage = () => {
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

  if (loading) {
    return <p>Loading forms...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div className="available-forms-page">
      <h2>Available Forms</h2>
      {forms.length === 0 ? (
        <p>No forms available at the moment.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Form Name</th>
              <th>Description</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {forms.map(form => (
              <tr key={form._id}>
                <td data-label="Form Name">{form.name}</td>
                <td data-label="Description">{form.description}</td>
                <td data-label="Action">
                  <Link to={`/fill-form/${form._id}`}>
                    <button>Fill Form</button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AvailableFormsPage;

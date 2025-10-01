
import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const MySubmissionsPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await api.get('/form-submissions/my-submissions');
        setSubmissions(response.data);
        setLoading(false);
      } catch (err) {
        setError('Error fetching submissions.');
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  if (loading) {
    return <p>Loading your submissions...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div>
      <h2>My Form Submissions</h2>
      {submissions.length === 0 ? (
        <p>You have not submitted any forms yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Form Name</th>
              <th>Submitted At</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map(submission => (
              <tr key={submission._id}>
                <td>{submission.form.name}</td>
                <td>{new Date(submission.submittedAt).toLocaleDateString()}</td>
                <td>{submission.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MySubmissionsPage;

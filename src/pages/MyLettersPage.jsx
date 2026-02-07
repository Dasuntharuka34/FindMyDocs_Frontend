import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import '../styles/pages/MyLettersPage.css';
import { AuthContext } from '../context/AuthContext';
import MessageModal from '../components/MessageModel';


// Status colors consistent with RecentLetters component
const statusColors = {
  Submitted: '#808080',
  "Pending Lecturer Approval": '#5bc0de',
  "Pending HOD Approval": '#5bc0de',
  "Pending Dean Approval": '#5bc0de',
  "Pending VC Approval": '#5bc0de',
  Approved: '#5cb85c',
  Rejected: '#d9534f',
};

const getStatusColor = (status) => {
  if (statusColors[status]) return statusColors[status];
  if (status.startsWith('Pending')) return '#5bc0de'; // Default blue for pending
  if (status.toLowerCase().includes('approved')) return '#5cb85c';
  if (status.toLowerCase().includes('rejected')) return '#d9534f';
  return '#777'; // Fallback gray
};

function MyLettersPage() {
  const { user, token } = useContext(AuthContext);
  const [allRequests, setAllRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All');
  const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });

  const closeMessageModal = () => {
    setMessageModal({ show: false, title: '', message: '' });
  };

  useEffect(() => {
    const fetchAllRequests = async () => {
      if (!user || !user._id || !token) {
        setLoading(false);
        setMessageModal({
          show: true,
          title: 'Error',
          message: 'User not authenticated. Please log in to view your requests.',
          onConfirm: closeMessageModal
        });
        return;
      }

      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };

      try {
        const [lettersRes, leaveRes, excuseRes, formsRes] = await Promise.all([
          fetch(`${process.env.REACT_APP_BACKEND_URL}/api/letters/byUser/${user._id}`, { headers }).then(r => r.json()),
          user.role !== 'Student'
            ? fetch(`${process.env.REACT_APP_BACKEND_URL}/api/leaverequests/byUser/${user._id}`, { headers }).then(r => r.json())
            : Promise.resolve([]),
          fetch(`${process.env.REACT_APP_BACKEND_URL}/api/excuserequests/byUser/${user._id}`, { headers }).then(r => r.json()),
          fetch(`${process.env.REACT_APP_BACKEND_URL}/api/form-submissions/my-submissions`, { headers }).then(r => r.json())
        ]);

        const combined = [
          ...(Array.isArray(lettersRes) ? lettersRes.map(l => ({ ...l, reqType: 'Letter', displayType: l.type, date: l.submittedDate, viewLink: `/documents/${l._id}` })) : []),
          ...(Array.isArray(leaveRes) ? leaveRes.map(l => ({ ...l, reqType: 'Leave', displayType: 'Leave Request', date: l.submittedDate, viewLink: `/leave-request/${l._id}` })) : []),
          ...(Array.isArray(excuseRes) ? excuseRes.map(e => ({ ...e, reqType: 'Excuse', displayType: 'Excuse Request', date: e.submittedDate, viewLink: `/excuse-request/${e._id}` })) : []),
          ...(Array.isArray(formsRes) ? formsRes.map(f => ({ ...f, reqType: 'Form', displayType: f.form?.name || 'Dynamic Form', date: f.submittedAt, viewLink: `/form-submission/${f._id}` })) : [])
        ];

        // Sort by date descending
        combined.sort((a, b) => new Date(b.date) - new Date(a.date));

        setAllRequests(combined);
        setFilteredRequests(combined);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
        setMessageModal({
          show: true,
          title: 'Error',
          message: `Failed to load your data: ${error.message}`,
          onConfirm: closeMessageModal
        });
      }
    };

    fetchAllRequests();
  }, [user, token]);

  useEffect(() => {
    if (filterType === 'All') {
      setFilteredRequests(allRequests);
    } else {
      setFilteredRequests(allRequests.filter(req => req.reqType === filterType));
    }
  }, [filterType, allRequests]);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="approvals-layout">
          <main className="letter-content">
            <div className="letter-contenter">
              <div className="loading">Loading your requests...</div>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="approvals-layout">
        <main className="letter-content">
          <div className="letter-contenter">
            <div className="recent-letters">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                <h2 style={{ margin: 0 }}>My Submitted Requests</h2>
                <div className="filter-container" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label htmlFor="type-filter" style={{ fontWeight: 'bold' }}>Filter by Type:</label>
                  <select
                    id="type-filter"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="All">All Types</option>
                    <option value="Letter">Letters</option>
                    {user.role !== 'Student' && <option value="Leave">Leave Requests</option>}
                    <option value="Excuse">Excuse Requests</option>
                    <option value="Form">Dynamic Forms</option>
                  </select>
                </div>
              </div>

              {filteredRequests.length === 0 ? (
                <p>No requests found matching your filter.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Request Type</th>
                      <th>Detail</th>
                      <th>Submitted Date</th>
                      <th>Current Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map(req => (
                      <tr key={req._id}>
                        <td data-label="Request Type">{req.displayType}</td>
                        <td data-label="Detail">{req.reqType === 'Excuse' || req.reqType === 'Leave' ? req.reason : (req.reqType === 'Form' ? 'Dynamic Submission' : 'Official Letter')}</td>
                        <td data-label="Submitted Date">{new Date(req.date).toLocaleDateString()}</td>
                        <td data-label="Current Status">
                          <span
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(req.status) }}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td data-label="Action">
                          <Link to={req.viewLink} className="view-details-btn">
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>
      <Footer />
      <MessageModal
        show={messageModal.show}
        title={messageModal.title}
        message={messageModal.message}
        onConfirm={messageModal.onConfirm}
      />
    </div>
  );
}

export default MyLettersPage;

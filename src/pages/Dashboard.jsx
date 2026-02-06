import React, { useState, useEffect, useContext } from 'react';
import RecentLetters from '../components/RecentLetters';
import NotificationsWidget from '../components/NotificationsWidget';
import NewLetterModal from '../components/NewLetterModal';

import { AuthContext } from '../context/AuthContext';
import MessageModal from '../components/MessageModel';

// --- NEW STAGE DEFINITIONS FOR SEQUENTIAL APPROVAL ---
const approvalStages = [
  { name: "Submitted", approverRole: null },
  { name: "Pending Lecturer Approval", approverRole: "Lecturer" },
  { name: "Pending HOD Approval", approverRole: "HOD" },
  { name: "Pending Dean Approval", approverRole: "Dean" },
  { name: "Pending VC Approval", approverRole: "VC" },
  { name: "Approved", approverRole: null },
  { name: "Rejected", approverRole: null }
];

const submitterRoleToInitialStageIndex = {
  "Student": 0,
  "Lecturer": 1,
  "HOD": 2,
  "Dean": 3,
  "VC": 4
};
// --- END NEW STAGE DEFINITIONS ---

function Dashboard() {
  const { user, token } = useContext(AuthContext);


  const [letters, setLetters] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);


  const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });

  const closeMessageModal = () => {
    setMessageModal({ show: false, title: '', message: '' });
  };

  const fetchLetters = React.useCallback(async () => {
    if (!user || !user._id) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/letters/byUser/${user._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setLetters(data);



    } catch (error) {
      console.error("Error fetching letters:", error);
      setMessageModal({ show: true, title: 'Error', message: `Failed to load letters: ${error.message}`, onConfirm: closeMessageModal });
    }
  }, [user, token]);

  const fetchNotifications = React.useCallback(async () => {
    if (!user || !user._id) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/notifications/byUser/${user._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setMessageModal({ show: true, title: 'Error', message: `Failed to load notifications: ${error.message}`, onConfirm: closeMessageModal });
    }
  }, [user, token]);

  useEffect(() => {
    if (user && user._id) {
      fetchLetters();
      fetchNotifications();
    }
  }, [user, fetchLetters, fetchNotifications]);

  // Handle new letter submit (for non-Medical Certificate/Leave Request letters)
  const addLetter = async (newLetterData) => {
    if (!user || !user._id || !user.name || !user.role) {
      setMessageModal({ show: true, title: 'Error', message: 'User not authenticated or role missing. Please log in again.', onConfirm: closeMessageModal });
      return;
    }

    const initialStageIndex = submitterRoleToInitialStageIndex[user.role] || 0;
    const initialStatus = approvalStages[initialStageIndex].name;

    try {
      const formData = new FormData();
      formData.append('type', newLetterData.type);
      formData.append('reason', newLetterData.reason);
      formData.append('date', newLetterData.date);
      formData.append('studentId', user._id);
      formData.append('student', user.name);
      formData.append('submitterRole', user.role);
      formData.append('status', initialStatus);
      formData.append('currentStageIndex', initialStageIndex);
      formData.append('submittedDate', new Date().toISOString().slice(0, 10));

      if (newLetterData.attachments) {
        formData.append('attachments', newLetterData.attachments);
      }

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/letters`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to submit letter! status: ${response.status}`);
      }

      fetchLetters();

      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user._id,
          message: `New letter request submitted: ${newLetterData.type} and sent for ${approvalStages[initialStageIndex + 1]?.name || 'final approval'}.`,
          type: 'info',
          timestamp: new Date().toISOString()
        }),
      });
      fetchNotifications();

      setModalOpen(false);
      setMessageModal({ show: true, title: 'Success', message: 'New letter request submitted successfully!', onConfirm: closeMessageModal });

    } catch (error) {
      console.error("Error submitting new letter:", error);
      setMessageModal({ show: true, title: 'Error', message: `Failed to submit letter: ${error.message}`, onConfirm: closeMessageModal });
    }
  };





  if (!user) {
    return <p>Loading user data...</p>;
  }

  return (
    <main className="main-content">
      <section className="top-widgets">
        {/* <ProgressTracker stages={approvalStages.map(s => s.name)} currentStage={currentStage} /> */}
        <NotificationsWidget
          notifications={notifications}
          onNotificationUpdate={fetchNotifications}
        />
      </section>

      <section className="bottom-widgets">
        <RecentLetters letters={letters} />
        <div className="new-letter-button-container">
          <button
            className="new-letter-btn"
            onClick={() => setModalOpen(true)}
            aria-label="Submit a New Letter"
          >
            + Submit a New Letter
          </button>
        </div>
      </section>
      {modalOpen && <NewLetterModal user={user} onClose={() => setModalOpen(false)} onSubmit={addLetter} />}


      <MessageModal
        show={messageModal.show}
        title={messageModal.title}
        message={messageModal.message}
        onConfirm={messageModal.onConfirm}
      />
    </main>
  );
}

export default Dashboard;

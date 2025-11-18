import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
// import SpecialDashboard from './components/special-user-dashboard/SpecialDashboard';
import ExcuseRequestForm from './forms/ExcuseRequestForm';
import PendingApprovals from './pages/PendingApprovals';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DocumentsView from './pages/DocumentsView';
import MyLettersPage from './pages/MyLettersPage';
import ProfilePage from './pages/ProfilePage';
import { AuthContext } from './context/AuthContext';
import ExcuseRequestView from './pages/excuseRequestView';
import LeaveRequestForm from './forms/LeaveRequestForm';
import LeaveRequestView from './pages/LeaveRequestView';
import NotificationsPage from './pages/NotificationsPage';
import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';
import RegistrationApprovalPage from './pages/admin/RegistrationApprovalPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import AllRequestsPage from './pages/admin/AllRequestsPage';
import ApprovedRequestsPage from './pages/admin/ApprovedRequestsPage';
import ManageFormsPage from './pages/ManageFormsPage';
import NewFormPage from './pages/admin/NewFormPage';
import ViewFormPage from './pages/admin/ViewFormPage';
import EditFormPage from './pages/admin/EditFormPage';
import AvailableFormsPage from './pages/AvailableFormsPage';
import RenderFormPage from './pages/RenderFormPage';
import MySubmissionsPage from './pages/MySubmissionsPage';
import ContactSupportPage from './pages/ContactSupportPage';
import { ThemeProvider } from './context/ThemeContext';
import AutoLogout from './components/AutoLogout';


// PrivateRoute component (fixed)
const PrivateRoute = ({ children, allowedRoles }) => {
  const { isLoggedIn, user } = useContext(AuthContext);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <p style={{textAlign: 'center', marginTop: '50px', fontSize: '1.5rem', color: 'red'}}>Access Denied! You do not have permission to view this page.</p>;
  }

  return children;
};

function App() {
  const { isLoggedIn, user } = useContext(AuthContext);

  return (
    <Router>
      <AutoLogout />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={isLoggedIn ? <Navigate to={user?.role === 'Admin' ? "/admin-dashboard" : "/dashboard"} /> : <LoginPage />} />

        <Route path="/register" element={isLoggedIn ? <Navigate to={user?.role === 'Admin' ? "/admin-dashboard" : "/dashboard"} /> : <RegisterPage />} />

        <Route path="/" element={isLoggedIn ? <Navigate to={user?.role === 'Admin' ? "/admin-dashboard" : "/dashboard"} /> : <Navigate to="/login" />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <PrivateRoute allowedRoles={['Student','Lecturer', 'HOD', 'Dean', 'VC']}>
            <UserLayout>
              <Dashboard />
            </UserLayout>
          </PrivateRoute>
        } />

        <Route path="/admin-dashboard" element={
          <PrivateRoute allowedRoles={['Admin']}>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </PrivateRoute>
        } />

        <Route path="/admin/registration-approvals" element={
          <PrivateRoute allowedRoles={['Admin']}>
            <AdminLayout>
              <RegistrationApprovalPage />
            </AdminLayout>
          </PrivateRoute>
        } />

        <Route path="/admin/user-management" element={
          <PrivateRoute allowedRoles={['Admin']}>
            <AdminLayout>
              <UserManagementPage />
            </AdminLayout>
          </PrivateRoute>
        } />

        <Route path="/admin/all-requests" element={
          <PrivateRoute allowedRoles={['Admin']}>
            <AdminLayout>
              <AllRequestsPage />
            </AdminLayout>
          </PrivateRoute>
        } />

        <Route path="/admin/approved-requests" element={
          <PrivateRoute allowedRoles={['Admin']}>
            <AdminLayout>
              <ApprovedRequestsPage />
            </AdminLayout>
          </PrivateRoute>
        } />

        <Route path="/admin/forms" element={
          <PrivateRoute allowedRoles={['Admin']}>
            <AdminLayout>
              <ManageFormsPage />
            </AdminLayout>
          </PrivateRoute>
        } />

        <Route path="/admin/forms/new" element={
          <PrivateRoute allowedRoles={['Admin']}>
            <AdminLayout>
              <NewFormPage />
            </AdminLayout>
          </PrivateRoute>
        } />

        <Route path="/admin/forms/view/:id" element={
          <PrivateRoute allowedRoles={['Admin']}>
            <AdminLayout>
              <ViewFormPage />
            </AdminLayout>
          </PrivateRoute>
        } />

        <Route path="/admin/forms/edit/:id" element={
          <PrivateRoute allowedRoles={['Admin']}>
            <AdminLayout>
              <EditFormPage />
            </AdminLayout>
          </PrivateRoute>
        } />

        <Route path="/pending-approvals" element={
          <PrivateRoute allowedRoles={['Lecturer', 'HOD', 'Dean', 'VC']}>
            <UserLayout>
              <PendingApprovals />
            </UserLayout>
          </PrivateRoute>
        } />

        <Route path="/excuse-request" element={
          <PrivateRoute allowedRoles={['Student','Lecturer', 'HOD', 'Dean', 'VC']}>
            <UserLayout>
              <ExcuseRequestForm />
            </UserLayout>
          </PrivateRoute>
        } />

        <Route path="/leave-request" element={
          <PrivateRoute allowedRoles={['Lecturer', 'HOD', 'Dean', 'VC']}>
            <UserLayout>
              <LeaveRequestForm />
            </UserLayout>
          </PrivateRoute>
        } />

        <Route path="/my-letters" element={
          <PrivateRoute allowedRoles={['Student','Lecturer', 'HOD', 'Dean', 'VC']}>
            <UserLayout>
              <MyLettersPage />
            </UserLayout>
          </PrivateRoute>
        } />

        <Route path="/available-forms" element={
          <PrivateRoute allowedRoles={['Student','Lecturer', 'HOD', 'Dean', 'VC']}>
            <UserLayout>
              <AvailableFormsPage />
            </UserLayout>
          </PrivateRoute>
        } />

        <Route path="/fill-form/:id" element={
          <PrivateRoute allowedRoles={['Student','Lecturer', 'HOD', 'Dean', 'VC']}>
            <UserLayout>
              <RenderFormPage />
            </UserLayout>
          </PrivateRoute>
        } />

        <Route path="/documents/:id" element={
          <PrivateRoute allowedRoles={['Student', 'Lecturer', 'HOD', 'Dean', 'VC', 'Admin']}>
            {user?.role === 'Admin' ? (
              <AdminLayout>
                <DocumentsView />
              </AdminLayout>
            ) : (
              <UserLayout>
                <DocumentsView />
              </UserLayout>
            )}
          </PrivateRoute>
        } />

        <Route path="/excuse-request/:id" element={
          <PrivateRoute allowedRoles={['Student', 'Lecturer', 'HOD', 'Dean', 'VC', 'Admin']}>
            {user?.role === 'Admin' ? (
              <AdminLayout>
                <ExcuseRequestView />
              </AdminLayout>
            ) : (
              <UserLayout>
                <ExcuseRequestView />
              </UserLayout>
            )}
          </PrivateRoute>
        } />

        {/* Fixed: Consistent route pattern */}
        <Route path="/leave-request/:id" element={
          <PrivateRoute allowedRoles={['Student', 'Lecturer', 'HOD', 'Dean', 'VC', 'Admin']}>
            {user?.role === 'Admin' ? (
              <AdminLayout>
                <LeaveRequestView />
              </AdminLayout>
            ) : (
              <UserLayout>
                <LeaveRequestView />
              </UserLayout>
            )}
          </PrivateRoute>
        } />

        <Route path="/notifications" element={
          <PrivateRoute allowedRoles={['Student', 'Lecturer', 'HOD', 'Dean', 'VC', 'Admin']}>
            <UserLayout>
              <NotificationsPage />
            </UserLayout>
          </PrivateRoute>
        } />

        {/* Profile Page */}
        <Route path="/profile" element={
          <PrivateRoute allowedRoles={['Student', 'Lecturer', 'HOD', 'Dean', 'VC', 'Admin']}>
            {user?.role === 'Admin' ? (
              <AdminLayout>
                <ProfilePage isAdmin={true} />
              </AdminLayout>
            ) : (
              <UserLayout>
                <ProfilePage />
              </UserLayout>
            )}
          </PrivateRoute>
        } />

        <Route path="/contact-support" element={<ContactSupportPage />} />

        {/* Catch-all route for 404 - Not Found */}
        <Route path="*" element={<p style={{textAlign: 'center', marginTop: '50px', fontSize: '1.5rem'}}>404 - Page Not Found</p>} />
      </Routes>
    </Router>
  );
}

export default App;

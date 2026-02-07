import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
// import SpecialDashboard from './components/special-user-dashboard/SpecialDashboard';
import ExcuseRequestForm from './forms/ExcuseRequestForm';
import PendingApprovals from './pages/PendingApprovals';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
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
import AdminFormBuilder from './pages/admin/AdminFormBuilder';
import ViewFormPage from './pages/admin/ViewFormPage';
import AvailableFormsPage from './pages/AvailableFormsPage';
import RenderFormPage from './pages/RenderFormPage';
import FormSubmissionView from './pages/FormSubmissionView';
import ReportGenerationPage from './pages/admin/ReportGenerationPage';
import TemplateManagementPage from './pages/admin/TemplateManagementPage';
import AutoApprovalRulesPage from './pages/admin/AutoApprovalRulesPage';
import CustomReportPage from './pages/admin/CustomReportPage';
import ErrorLogPage from './pages/admin/ErrorLogPage';
import DatabaseQueryPage from './pages/admin/DatabaseQueryPage';
import DeveloperDashboard from './pages/admin/DeveloperDashboard';
import DatabaseManagementPage from './pages/admin/DatabaseManagementPage';
import EmailTemplateEditorPage from './pages/admin/EmailTemplateEditorPage';
import BulkEmailSenderPage from './pages/admin/BulkEmailSenderPage';
import DataCleanupPage from './pages/admin/DataCleanupPage';
import OrphanedFilesPage from './pages/admin/OrphanedFilesPage';
import SecurityDashboard from './pages/admin/SecurityDashboard';
import EmailLogsPage from './pages/admin/EmailLogsPage';
import DepartmentManagementPage from './pages/admin/DepartmentManagementPage';
import RoleManagementPage from './pages/admin/RoleManagementPage';
import FormAnalyticsPage from './pages/admin/FormAnalyticsPage';
import WorkflowManagementPage from './pages/admin/WorkflowManagementPage';
import NotificationSettingsPage from './pages/admin/NotificationSettingsPage';
import SystemConfigPage from './pages/admin/SystemConfigPage';
import MessageModal from './components/MessageModal';
import ContactSupportPage from './pages/ContactSupportPage';

import AutoLogout from './components/AutoLogout';
import AdminFormsPage from './pages/admin/AdminFormsPage';


// PrivateRoute component (fixed)
const PrivateRoute = ({ children, allowedRoles }) => {
  const { isLoggedIn, user } = useContext(AuthContext);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && user.role) {
    const userRoleLower = user.role.toLowerCase();
    const isAllowed = allowedRoles.some(role => role.toLowerCase() === userRoleLower);

    if (!isAllowed) {
      return <p style={{ textAlign: 'center', marginTop: '50px', fontSize: '1.5rem', color: 'red' }}>Access Denied! You do not have permission to view this page.</p>;
    }
  }

  return children;
};

function App() {
  const { isLoggedIn, user, maintenanceMode, setMaintenanceMode } = useContext(AuthContext);
  const [maintenanceMessage, setMaintenanceMessage] = React.useState('');

  React.useEffect(() => {
    const handleMaintenance = (e) => {
      setMaintenanceMessage(e.detail.message || 'System is under maintenance.');
      setMaintenanceMode(true);
    };

    window.addEventListener('maintenance-mode', handleMaintenance);
    return () => window.removeEventListener('maintenance-mode', handleMaintenance);
  }, [setMaintenanceMode]);

  const handleCloseMaintenance = () => {
    setMaintenanceMode(false);
    // Explicitly redirect to login if not already there, 
    // but usually a state change is enough to trigger redirection if logic is present.
    window.location.href = '/login';
  };

  return (
    <Router>
      <AutoLogout />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={isLoggedIn ? <Navigate to={user?.role?.toLowerCase() === 'admin' ? "/admin-dashboard" : "/dashboard"} /> : <LoginPage />} />

        <Route path="/register" element={isLoggedIn ? <Navigate to={user?.role?.toLowerCase() === 'admin' ? "/admin-dashboard" : "/dashboard"} /> : <RegisterPage />} />

        <Route path="/" element={isLoggedIn ? <Navigate to={user?.role?.toLowerCase() === 'admin' ? "/admin-dashboard" : "/dashboard"} /> : <Navigate to="/login" />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <PrivateRoute allowedRoles={['Student', 'Lecturer', 'HOD', 'Dean', 'VC']}>
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
              <AdminFormsPage/>
            </AdminLayout>
          </PrivateRoute>
        } />

        <Route path="/admin/forms/new" element={
          <PrivateRoute allowedRoles={['Admin']}>
            <AdminLayout>
              <AdminFormBuilder />
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
              <AdminFormBuilder />
            </AdminLayout>
          </PrivateRoute>
        } />

        <Route path="/admin/reports" element={
          <PrivateRoute allowedRoles={['Admin']}>
            <AdminLayout>
              <ReportGenerationPage />
            </AdminLayout>
          </PrivateRoute>
        } />

        <Route path="/admin/reports/custom" element={
          <PrivateRoute allowedRoles={['Admin']}>
            <AdminLayout>
              <CustomReportPage />
            </AdminLayout>
          </PrivateRoute>
        } />

        <Route path="/admin/developer/error-logs" element={
          <PrivateRoute allowedRoles={['Admin']}>
            <AdminLayout>
              <ErrorLogPage />
            </AdminLayout>
          </PrivateRoute>
        } />

        <Route path="/admin/developer/query" element={
          <PrivateRoute allowedRoles={['Admin']}>
            <AdminLayout>
              <DatabaseQueryPage />
            </AdminLayout>
          </PrivateRoute>
        } />

        <Route path="/admin/developer/docs" element={
          <PrivateRoute allowedRoles={['Admin']}>
            <AdminLayout>
              <DeveloperDashboard />
            </AdminLayout>
          </PrivateRoute>
        } />

        <Route path="/admin/templates" element={
          <PrivateRoute allowedRoles={['Admin']}>
            <AdminLayout>
              <TemplateManagementPage />
            </AdminLayout>
          </PrivateRoute>
        } />

        <Route path="/admin/auto-approval-rules" element={
          <PrivateRoute allowedRoles={['Admin']}>
            <AdminLayout>
              <AutoApprovalRulesPage />
            </AdminLayout>
          </PrivateRoute>
        } />

        <Route path="/admin/database" element={
          <PrivateRoute allowedRoles={['Admin']}>
            <AdminLayout>
              <DatabaseManagementPage />
            </AdminLayout>
          </PrivateRoute>
        } />

        <Route path="/admin/cleanup" element={
          <PrivateRoute allowedRoles={['Admin']}>
            <AdminLayout>
              <DataCleanupPage />
            </AdminLayout>
          </PrivateRoute>
        } />

        <Route path="/admin/cleanup/orphaned" element={
          <PrivateRoute allowedRoles={['Admin']}>
            <AdminLayout>
              <OrphanedFilesPage />
            </AdminLayout>
          </PrivateRoute>
        } />

        <Route path="/admin/security" element={
          <PrivateRoute allowedRoles={['Admin']}>
            <AdminLayout>
              <SecurityDashboard />
            </AdminLayout>
          </PrivateRoute>
        } />

        <Route path="/admin/email-templates" element={
          <PrivateRoute allowedRoles={['Admin']}>
            <AdminLayout>
              <EmailTemplateEditorPage />
            </AdminLayout>
          </PrivateRoute>
        } />

        <Route path="/admin/bulk-email" element={
          <PrivateRoute allowedRoles={['Admin']}>
            <AdminLayout>
              <BulkEmailSenderPage />
            </AdminLayout>
          </PrivateRoute>
        } />

        <Route path="/admin/email-logs" element={
          <PrivateRoute allowedRoles={['Admin']}>
            <AdminLayout>
              <EmailLogsPage />
            </AdminLayout>
          </PrivateRoute>
        } />

        <Route path="/admin/notification-settings" element={
          <PrivateRoute allowedRoles={['Admin']}>
            <AdminLayout>
              <NotificationSettingsPage />
            </AdminLayout>
          </PrivateRoute>
        } />
        <Route path="/admin/system-config" element={
          <PrivateRoute allowedRoles={['Admin']}>
            <AdminLayout>
              <SystemConfigPage />
            </AdminLayout>
          </PrivateRoute>
        } />

        <Route path="/admin/departments" element={
          <PrivateRoute allowedRoles={['Admin']}>
            <AdminLayout>
              <DepartmentManagementPage />
            </AdminLayout>
          </PrivateRoute>
        } />

        <Route path="/admin/roles" element={
          <PrivateRoute allowedRoles={['Admin']}>
            <AdminLayout>
              <RoleManagementPage />
            </AdminLayout>
          </PrivateRoute>
        } />

        <Route path="/admin/forms/analytics" element={
          <PrivateRoute allowedRoles={['Admin']}>
            <AdminLayout>
              <FormAnalyticsPage />
            </AdminLayout>
          </PrivateRoute>
        } />

        <Route path="/admin/workflows" element={
          <PrivateRoute allowedRoles={['Admin']}>
            <AdminLayout>
              <WorkflowManagementPage />
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
          <PrivateRoute allowedRoles={['Student', 'Lecturer', 'HOD', 'Dean', 'VC']}>
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
          <PrivateRoute allowedRoles={['Student', 'Lecturer', 'HOD', 'Dean', 'VC']}>
            <UserLayout>
              <MyLettersPage />
            </UserLayout>
          </PrivateRoute>
        } />

        <Route path="/available-forms" element={
          <PrivateRoute allowedRoles={['Student', 'Lecturer', 'HOD', 'Dean', 'VC']}>
            <UserLayout>
              <AvailableFormsPage />
            </UserLayout>
          </PrivateRoute>
        } />

        <Route path="/fill-form/:id" element={
          <PrivateRoute allowedRoles={['Student', 'Lecturer', 'HOD', 'Dean', 'VC']}>
            <UserLayout>
              <RenderFormPage />
            </UserLayout>
          </PrivateRoute>
        } />

        <Route path="/form-submission/:id" element={
          <PrivateRoute allowedRoles={['Student', 'Lecturer', 'HOD', 'Dean', 'VC', 'Admin']}>
            {user?.role?.toLowerCase() === 'admin' ? (
              <AdminLayout>
                <FormSubmissionView />
              </AdminLayout>
            ) : (
              <UserLayout>
                <FormSubmissionView />
              </UserLayout>
            )}
          </PrivateRoute>
        } />

        <Route path="/documents/:id" element={
          <PrivateRoute allowedRoles={['Student', 'Lecturer', 'HOD', 'Dean', 'VC', 'Admin']}>
            {user?.role?.toLowerCase() === 'admin' ? (
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
        <Route path="*" element={<p style={{ textAlign: 'center', marginTop: '50px', fontSize: '1.5rem' }}>404 - Page Not Found</p>} />
      </Routes>

      <MessageModal
        show={maintenanceMode}
        title="Maintenance Mode"
        message={maintenanceMessage}
        onConfirm={handleCloseMaintenance}
      />
    </Router>
  );
}

export default App;

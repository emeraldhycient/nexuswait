import { Routes, Route } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout'
import DashboardLayout from './layouts/DashboardLayout'
import AdminLayout from './layouts/AdminLayout'
import Landing from './pages/Landing'
import Pricing from './pages/Pricing'
import Resources from './pages/Resources'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import Contact from './pages/Contact'
import Legal from './pages/Legal'
import About from './pages/About'
import Changelog from './pages/Changelog'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import CreateProject from './pages/CreateProject'
import ViewProject from './pages/ViewProject'
import Integrations from './pages/Integrations'
import Settings from './pages/Settings'
import HostedPage from './pages/HostedPage'
import FormIntegrations from './pages/FormIntegrations'
import FormEmbed from './pages/FormEmbed'
import ApiDocs from './pages/ApiDocs'
import NotificationPreferences from './pages/NotificationPreferences'
import AdminOverview from './pages/admin/AdminOverview'
import AdminAccounts from './pages/admin/AdminAccounts'
import AdminAccountDetail from './pages/admin/AdminAccountDetail'
import AdminProjects from './pages/admin/AdminProjects'
import AdminSubscribers from './pages/admin/AdminSubscribers'
import AdminIntegrations from './pages/admin/AdminIntegrations'
import AdminNotifications from './pages/admin/AdminNotifications'
import AdminSystem from './pages/admin/AdminSystem'
import AdminPlans from './pages/admin/AdminPlans'
import AdminWebhookLogs from './pages/admin/AdminWebhookLogs'
import PublicWaitlistPage from './pages/PublicWaitlistPage'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      {/* Standalone public waitlist page — no layout */}
      <Route path="/w/:slug" element={<PublicWaitlistPage />} />

      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/legal" element={<Legal />} />
        <Route path="/about" element={<About />} />
        <Route path="/changelog" element={<Changelog />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/create" element={<CreateProject />} />
        <Route path="/dashboard/project/:id" element={<ViewProject />} />
        <Route path="/dashboard/integrations" element={<Integrations />} />
        <Route path="/dashboard/settings" element={<Settings />} />
        <Route path="/dashboard/hosted-page" element={<HostedPage />} />
        <Route path="/dashboard/form-integrations" element={<FormIntegrations />} />
        <Route path="/dashboard/embed" element={<FormEmbed />} />
        <Route path="/dashboard/api" element={<ApiDocs />} />
        <Route path="/dashboard/notification-preferences" element={<NotificationPreferences />} />
      </Route>
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminOverview />} />
        <Route path="/admin/accounts" element={<AdminAccounts />} />
        <Route path="/admin/accounts/:id" element={<AdminAccountDetail />} />
        <Route path="/admin/projects" element={<AdminProjects />} />
        <Route path="/admin/subscribers" element={<AdminSubscribers />} />
        <Route path="/admin/integrations" element={<AdminIntegrations />} />
        <Route path="/admin/plans" element={<AdminPlans />} />
        <Route path="/admin/webhook-logs" element={<AdminWebhookLogs />} />
        <Route path="/admin/notifications" element={<AdminNotifications />} />
        <Route path="/admin/system" element={<AdminSystem />} />
      </Route>
    </Routes>
  )
}

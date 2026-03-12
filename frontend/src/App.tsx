import { Routes, Route } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout'
import DashboardLayout from './layouts/DashboardLayout'
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
import ApiDocs from './pages/ApiDocs'

export default function App() {
  return (
    <Routes>
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
      </Route>
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/create" element={<CreateProject />} />
        <Route path="/dashboard/project/:id" element={<ViewProject />} />
        <Route path="/dashboard/integrations" element={<Integrations />} />
        <Route path="/dashboard/settings" element={<Settings />} />
        <Route path="/dashboard/hosted-page" element={<HostedPage />} />
        <Route path="/dashboard/form-integrations" element={<FormIntegrations />} />
        <Route path="/dashboard/api" element={<ApiDocs />} />
      </Route>
    </Routes>
  )
}

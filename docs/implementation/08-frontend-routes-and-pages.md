# 08 - Frontend Routes and Pages

## Route Table

All routes and their layout (Public vs Dashboard) and source page component.

| Path | Layout | Page | Notes |
|------|--------|------|-------|
| / | Public | Landing | |
| /pricing | Public | Pricing | |
| /resources | Public | Resources | |
| /login | Public | Login | |
| /signup | Public | Signup | |
| /terms | Public | Terms | New page |
| /privacy | Public | Privacy | New page |
| /forgot-password | Public | ForgotPassword | New page |
| /changelog | Public | Changelog | New page |
| /about | Public | About | New page |
| /contact | Public | Contact | New page |
| /legal | Public | Legal | New page |
| /dashboard | Dashboard | Dashboard | |
| /dashboard/create | Dashboard | CreateProject | |
| /dashboard/project/:id | Dashboard | ViewProject | |
| /dashboard/integrations | Dashboard | Integrations | |
| /dashboard/settings | Dashboard | Settings | |
| /dashboard/hosted-page | Dashboard | HostedPage | |
| /dashboard/form-integrations | Dashboard | FormIntegrations | |
| /dashboard/api | Dashboard | ApiDocs | |

## Link Mapping (Replace href="#")

### Signup.jsx

- “Terms of Service” → `Link to="/terms"`
- “Privacy Policy” → `Link to="/privacy"`

### Login.jsx

- “Forgot password?” → `Link to="/forgot-password"`

### PublicLayout.jsx (footer)

- Product: Features → `/#features` or `/`; Pricing → `/pricing`; Integrations → `/dashboard/integrations` (or `/resources`); Changelog → `/changelog`.
- Resources: Documentation → `/resources`; API Reference → `/dashboard/api` (or `/resources`); Blog → `/about` or `/blog` if page exists; Community → `/about` or external.
- Company: About → `/about`; Careers → `/about` or `/careers`; Contact → `/contact`; Legal → `/legal`.
- Social: Twitter, Discord, GitHub → external URLs (e.g. https://twitter.com/nexuswait) or keep `#` until URLs are known.

### Resources.jsx

- Quick Links: API Docs → `/dashboard/api` (or `/resources`); SDK → `/resources`; Community → `/resources` or external.
- Doc articles and guides: keep `#` or link to `/resources?topic=...` until doc routes exist.

### ApiDocs.jsx

- “Full Docs” → `/resources` or external docs URL.

## New Pages (Placeholder Content)

Create the following under `frontend/src/pages/` using existing theme (PublicLayout, Tailwind from index.css: nexus-*, cyan-glow, font-display, font-body, card-surface, btn-primary, etc.):

- **Terms.jsx** – Title “Terms of Service”; short placeholder text; same header/footer as other public pages.
- **Privacy.jsx** – Title “Privacy Policy”; placeholder text.
- **ForgotPassword.jsx** – Title “Forgot password?”; form with email input and “Send reset link” button (can be no-op or call backend when endpoint exists).
- **Changelog.jsx** – Title “Changelog”; list of placeholder version entries.
- **About.jsx** – Title “About NexusWait”; placeholder copy.
- **Contact.jsx** – Title “Contact”; placeholder form or email/address.
- **Legal.jsx** – Title “Legal”; links to Terms, Privacy, optional Cookie Policy.

All use `<PublicLayout>` and same visual style as Pricing/Resources (e.g. max-width container, typography, spacing).

## CreateProject Navigation

- Remove hardcoded `navigate('/dashboard/project/prj-005')`. After successful create (useCreateProject mutation success), use `navigate(\`/dashboard/project/${data.id}\`)` where `data` is the created project from the API.

## App.jsx Updates

- Add routes for `/terms`, `/privacy`, `/forgot-password`, `/changelog`, `/about`, `/contact`, `/legal` inside the PublicLayout route group, each pointing to the new page component.

## Summary

- One table of all routes; new public pages for Terms, Privacy, Forgot Password, Changelog, About, Contact, Legal.
- Every placeholder `href="#"` in Signup, Login, PublicLayout footer, Resources, ApiDocs replaced per table above.
- CreateProject uses API response id for navigation.

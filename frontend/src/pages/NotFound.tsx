import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function NotFound() {
  useDocumentTitle('Page Not Found')

  return (
    <div className="grid-bg min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-6xl font-black text-cyan-glow mb-4">404</h1>
      <p className="text-nexus-400 text-lg mb-8">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary no-underline">Go Home</Link>
    </div>
  )
}

/**
 * 404 Not Found Page
 *
 * Displays when user navigates to a non-existent route.
 */

import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#100f0a]">
      <div className="text-center px-6">
        <h1 className="text-9xl font-bold text-white mb-4">
          404
        </h1>
        <h2 className="text-3xl font-bold text-white mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-block px-8 py-4 bg-cream-500 text-gray-900 font-medium rounded-lg font-semibold hover:bg-cream-400 transition-all"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}

// file: src/components/Navbar.tsx
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Brand Name */}
          <div className="flex-shrink-0">
            <Link href="/" passHref>
              <span className="font-bold text-xl cursor-pointer text-gray-900 dark:text-white">
                Talent Screener
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" passHref>
              <span className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer">
                Upload CV
              </span>
            </Link>
            <Link href="/dashboard" passHref>
              <span className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer">
                Dashboard
              </span>
            </Link>
            <ThemeToggle />
            <Link href="/login" passHref>
              <span className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer">
                <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22"><path fill="currentColor" d="M17 1v1h1v4h-1V5h-1V3H6v16h10v-2h1v-1h1v4h-1v1H5v-1H4V2h1V1zm-4 5h2v1h1v1h1v1h1v1h1v2h-1v1h-1v1h-1v1h-1v1h-2v-2h1v-1h1v-1H8v-2h7V9h-1V8h-1z"/></svg>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
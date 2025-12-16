// file: src/components/Navbar.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'aws-amplify/auth';
import { configureAmplify } from '@/utils/amplify-config';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    configureAmplify();
  }, []);

  // Logic: Hilangkan Navbar di halaman login
  const disableNavbar = ["/login", "/register", "/forgot", "/reset-password"];

  if (disableNavbar.includes(pathname)) {
    return null;
  }

  // FUNGSI LOGOUT YANG BENAR DENGAN AMPLIFY
  const handleLogout = async () => {
    try {
      // Sign out dari AWS Amplify
      await signOut();
      console.log('Successfully logged out from Amplify');

      // Redirect ke halaman login
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      // Tetap redirect meskipun ada error
      router.push('/login');
    }
  };

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

          {/* Desktop Navigation */}
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

            {/* Tombol Logout Desktop */}
            <button
              onClick={handleLogout} // <--- Panggil fungsi logout di sini
              className="text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer"
              title="Logout"
            >
              <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col space-y-4">
              <Link href="/" passHref>
                <span className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer block" onClick={() => setIsOpen(false)}>
                  Upload CV
                </span>
              </Link>
              <Link href="/dashboard" passHref>
                <span className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer block" onClick={() => setIsOpen(false)}>
                  Dashboard
                </span>
              </Link>

              {/* Tombol Logout Mobile */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout(); // <--- Panggil fungsi logout di sini juga
                }}
                className="text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer flex items-center"
              >
                <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
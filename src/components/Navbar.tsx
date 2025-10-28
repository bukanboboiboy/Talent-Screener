// file: src/components/Navbar.tsx
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Brand Name */}
          <div className="flex-shrink-0">
            <Link href="/" passHref>
              <span className="font-bold text-xl cursor-pointer">
                Talent Screener
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" passHref>
              <span className="text-gray-600 hover:text-blue-600 transition cursor-pointer">
                Upload CV
              </span>
            </Link>
            <Link href="/dashboard" passHref>
              <span className="text-gray-600 hover:text-blue-600 transition cursor-pointer">
                Dashboard
              </span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
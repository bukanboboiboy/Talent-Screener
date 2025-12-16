// file: src/components/AuthGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCurrentUser } from "aws-amplify/auth";
import { configureAmplify } from "@/utils/amplify-config";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    configureAmplify(); // Ensure Amplify is configured
    checkAuth();
  }, [pathname]);

  const checkAuth = async () => {
    // --- DAFTAR HALAMAN YANG BOLEH DIAKSES TANPA LOGIN ---
    const publicPaths = ['/', '/login', '/register', '/forgot', '/reset-password'];

    // Cek apakah halaman sekarang ada di daftar public
    if (publicPaths.includes(pathname)) {
      setAuthorized(true);
      setLoading(false);
      return;
    }

    // --- CEK AMPLIFY SESSION UNTUK HALAMAN LAIN (DASHBOARD DLL) ---
    try {
      // Check if user is authenticated with Amplify
      await getCurrentUser();
      setAuthorized(true);
    } catch (error) {
      // Not authenticated, redirect to login
      console.log("User not authenticated, redirecting to login");
      router.push("/login");
      setAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}
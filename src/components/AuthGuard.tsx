// file: src/components/AuthGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // 1. Cek apakah user sedang di halaman public (Login/Register)
    // Kalau iya, biarkan lewat, jangan dicek tokennya (nanti looping)
    if (pathname === "/login" || pathname === "/register") {
      setAuthorized(true);
      return;
    }

    // 2. Ambil token dari saku
    const token = localStorage.getItem("token");

    // 3. Kalau nggak ada token, TENDANG ke Login
    if (!token) {
      router.push("/login");
      setAuthorized(false);
    } else {
      // 4. Kalau ada token, silakan masuk
      setAuthorized(true);
    }
  }, [router, pathname]);

  // Tampilkan layar putih/loading sebentar saat satpam lagi ngecek
  // Biar konten rahasia nggak sempat "ngintip" (FOUC - Flash of Unauthenticated Content)
  if (!authorized) {
    return null; // Atau bisa return <p>Loading...</p>
  }

  return <>{children}</>;
}
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthGuard from '../components/AuthGuard';
import Sidebar from "@/components/Sidebar";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ConfigureAmplifyClientSide from "@/components/ConfigureAmplify";

const inter = Inter({ subsets: ["latin"] });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Talent Screener",
  description: "Aplikasi Skripsi Bukan Boboiboy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <AuthGuard>
            <div className="flex min-h-screen">
              <Sidebar />
              <div className="flex-1">
                <main className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-all">
                  <ConfigureAmplifyClientSide />
                  {children}
                </main>
              </div>
            </div>
          </AuthGuard>
        </ThemeProvider>
      </body>
    </html>
  );
}
"use client";

import Link from "next/link";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function NotFound() {
  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-center p-12 ${inter.className}`}
    >
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </main>
  );
} 
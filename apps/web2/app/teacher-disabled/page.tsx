"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import FloatingIcons from "@/components/app/FloatingIcons";

export default function TeacherDisabled() {
  const [loaded, setLoaded] = useState(false);

  // Animation on page load
  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4 overflow-hidden">
      {/* Background animation */}
      <FloatingIcons />
      
      {/* Card container */}
      <div 
        className={`w-full max-w-md relative z-10 transition-all duration-700 ease-out ${
          loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Top logo section */}
        <div className="flex justify-center mb-6">
          <div className="relative h-24 w-24 animate-float">
            <Image
              src="/alterview-logo.svg"
              alt="AlterView Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
        
        {/* Heading */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-semibold text-gray-900 mb-4 animate-fadeIn">Teacher Dashboard</h1>
        </div>

        {/* Disabled message */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl px-8 pt-10 pb-10 mb-6 shadow-apple animate-scaleIn">
          <div className="text-center">
            <p className="text-xl text-gray-800 mb-4">
              Teacher dashboard is disabled for this demo
            </p>
            <p className="text-gray-500">
              This feature is not available in the demo version.
            </p>
          </div>
        </div>
        
        {/* Back link */}
        <div className="text-center animate-fadeIn" style={{ animationDelay: '200ms' }}>
          <Link
            href="/"
            className="inline-flex items-center justify-center text-alterview-indigo hover:text-alterview-violet transition-colors apple-hover"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>Back to home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
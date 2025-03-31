"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import FloatingIcons from "@/components/app/FloatingIcons";
import { AppleInput } from "@/components/app/AppleInput";

// Create a client component that uses useSearchParams
function StudentLoginForm() {
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
          
  // Animation on page load and check for studentId URL parameter
  useEffect(() => {
    setLoaded(true);
    
    // Check if studentId parameter exists in the URL
    if (searchParams) {
      const studentIdParam = searchParams.get('studentId');
      if (studentIdParam) {
        setStudentId(studentIdParam);
      }
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!studentId.trim()) {
      setError("Please enter your student ID");
      return;
    }
    
    // Check if the ID is the demo ID (654321)
    if (studentId !== "654321") {
      setError("Please use our demo ID: 654321");
      return;
    }
    
    // For demo users, navigate to a specific assessment
    if (isDemo) {
      router.push(`/assessment/${studentId}/1`);  // Demo assessment ID is 1
    } else {
      // Normal user flow - navigate to student dashboard
      router.push(`/students/${studentId}`);
    }
  };

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
        {/* Back to home button */}
        <div className="absolute -top-16 left-0">
          <Link href="/" className="text-gray-500 hover:text-gray-700 flex items-center transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span>Back to home</span>
          </Link>
        </div>
      
        {/* Top logo section  */}
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
        
        {/* Heading - larger and more prominent */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-semibold text-gray-900 mb-4 animate-fadeIn">
            {isDemo ? 'AlterView Demo Experience' : 'Welcome to the AlterView Demo!'}
          </h1>
          <p className="text-gray-500 text-lg animate-fadeIn" style={{ animationDelay: '100ms' }}>
            {isDemo 
              ? 'Experience our AI-powered assessment platform' 
              : 'Hit sign in with our pre-filled Demo ID: 654321'}
          </p>
          <p className="text-gray-500 text-lg animate-fadeIn" style={{ animationDelay: '100ms' }}> Desktop Recommended </p>
        </div>

        {/* Demo Badge */}
        {isDemo && (
          <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white p-4 rounded-xl mb-6 shadow-md">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p className="font-medium">Demo Mode Active</p>
            </div>
            <p className="text-sm mt-1 text-white/90">You're trying our demo with a pre-filled student ID.</p>
          </div>
        )}

        {/* Login Form - clean white card with subtle shadow - made taller */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl px-8 pt-10 pb-10 mb-6 shadow-apple animate-scaleIn">
          <form onSubmit={handleSubmit}>
            <AppleInput
              label="Student ID"
              variant="default"
              inputSize="lg"
              value={studentId}
              onChange={(e) => {
                setStudentId(e.target.value);
                if (error) setError("");
              }}
              error={error}
              showFocusEffect={true}
              className="text-gray-800 text-lg"
              disabled={isDemo}
            />
            {isDemo && (
              <p className="text-sm text-gray-500 mt-2">Demo ID pre-filled for you</p>
            )}
            
            <div className="flex justify-center mt-10">
              <button
                className={`w-full py-3.5 rounded-xl text-white font-medium text-lg transition-all duration-300 button-shine
                ${isDemo 
                  ? 'bg-gradient-to-r from-alterview-violet to-alterview-blue hover:from-alterview-blue hover:to-alterview-indigo shadow-lg font-bold' 
                  : studentId.trim() 
                    ? 'bg-alterview-gradient hover:shadow-md' 
                    : 'bg-gray-300 cursor-not-allowed'}`}
                type="submit"
                disabled={!isDemo && !studentId.trim()}
              >
                {isDemo ? "Start Demo Assessment" : "Sign In"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Create a loading fallback component
function StudentLoginLoading() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <div className="animate-pulse text-center">
        <div className="h-24 w-24 bg-gray-200 rounded-full mx-auto mb-6"></div>
        <div className="h-8 w-64 bg-gray-200 rounded mx-auto mb-4"></div>
        <div className="h-4 w-48 bg-gray-200 rounded mx-auto"></div>
      </div>
    </div>
  );
}

// Main component that wraps the form with Suspense
export default function StudentLogin() {
  return (
    <Suspense fallback={<StudentLoginLoading />}>
      <StudentLoginForm />
    </Suspense>
  );
} 
"use client"; // Keep this if needed for Suspense or other client hooks

import { Suspense } from "react";
import dynamic from "next/dynamic";

// Dynamically import the AssessmentForm component with ssr: false
const AssessmentForm = dynamic(() => import("@/components/app/AssessmentForm"), { 
  ssr: false,
  // Optional: Add a loading component while the form is being loaded dynamically
  loading: () => (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <div className="text-center">
        <h2 className="text-xl font-medium text-gray-700 mb-4">Loading form...</h2>
        {/* You can add a more sophisticated loading spinner here */}
        <div className="animate-pulse bg-gray-200 h-6 w-48 rounded mx-auto"></div>
      </div>
    </div>
  )
});

// Main page component remains simple, using Suspense for searchParams access within AssessmentForm
export default function CreateAssessmentPage() {
  return (
    <Suspense fallback={
      // Fallback for Suspense used by useSearchParams inside AssessmentForm
      // This can be the same or different from the dynamic import loading state
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-medium text-gray-700 mb-4">Initializing...</h2>
          <div className="animate-pulse bg-gray-200 h-6 w-48 rounded mx-auto"></div>
        </div>
      </div>
    }>
      <AssessmentForm />
    </Suspense>
  );
}

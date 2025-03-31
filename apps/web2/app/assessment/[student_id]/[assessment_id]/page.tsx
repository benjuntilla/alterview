"use client";

import { Inter } from "next/font/google";
import { Assistant } from "@/components/app/assistant";
import { useEffect, useState } from "react";
import { fetchAssessmentDetails } from "@/services/assessmentService";

const inter = Inter({ subsets: ["latin"] });

interface Assessment {
  id: number;
  created_at: string;
  name: string;
  first_question: string;
  system_prompt: string;
  mindmap_template: Record<string, any>;
}

export default function AssessmentPage({ params }: { params: { student_id: string, assessment_id: string } }) {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true); // Keep loading state for the page
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Store student ID in localStorage for later use
    if (params.student_id) {
      localStorage.setItem('studentId', params.student_id);
    }

    async function fetchAssessment() {
      setLoading(true); // Start loading
      setError(null); // Reset error
      try {
        // Use our service function to fetch the assessment
        const assessmentData = await fetchAssessmentDetails(params.assessment_id);
        setAssessment(assessmentData);
      } catch (err) {
        setError('Error loading assessment data');
        console.error(err);
        // Optionally set assessment to null or handle error state appropriately
        setAssessment(null);
      } finally {
        setLoading(false); // Finish loading
      }
    }

    fetchAssessment();
  }, [params.assessment_id, params.student_id]);

  // Handle page-level loading and error states before rendering Assistant
  if (loading) {
    return (
      <main className={`flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12 ${inter.className}`}>
        <div className="flex flex-col items-center justify-center py-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 text-base sm:text-lg">Loading assessment...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={`flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12 ${inter.className}`}>
        <div className="w-full max-w-md bg-red-50 border-l-4 border-red-500 p-4 rounded-md text-left">
          <p className="text-red-700 font-medium">{error}</p>
          <p className="text-red-600 text-sm mt-2">Please try refreshing the page or contact support.</p>
        </div>
      </main>
    );
  }

  // Render Assistant only when assessment data is potentially available (or handled error)
  return (
    <main
      // Adjusted padding for different screen sizes
      // Make the main container take full height and center the assistant vertically initially
      className={`flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12 ${inter.className}`}
    >
      {/* Assistant component takes up the main space */}
      {/* Ensure Assistant container allows it to grow */}
      <div className="w-full max-w-4xl flex-grow flex flex-col">
         <Assistant
           assessmentId={params.assessment_id}
           assessmentName={assessment?.name} // Pass the assessment name
         />
      </div>
    </main>
  );
}
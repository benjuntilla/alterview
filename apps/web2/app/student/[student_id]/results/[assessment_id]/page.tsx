"use client";

import { Inter } from "next/font/google";
import { useEffect, useState } from "react";
import MindMap from "@/components/app/MindMap";
import { fetchStudentAssessmentResult } from "@/services/assessmentService";

const inter = Inter({ subsets: ["latin"] });

const mindMap = {
  "nodes": [],
  "edges": []
};



// Add this custom CSS for the scrollbar
const customScrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(to bottom, rgba(79, 70, 229, 0.6), rgba(59, 130, 246, 0.6));
    border-radius: 10px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(to bottom, rgba(79, 70, 229, 0.8), rgba(59, 130, 246, 0.8));
  }
`;

interface AssessmentResult {
  id: number;
  created_at: string;
  assessment_id: number;
  teacher_id: number;
  student_id: number;
  voice_recording_id: number | null;
  transcript: string | null;
  mindmap: any | null;
  insights: any | null;
}

export default function StudentResultsPage({ params }: { params: { student_id: string, assessment_id: string } }) {
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parsedTranscript, setParsedTranscript] = useState<{speaker: string, text: string}[]>([]);

  useEffect(() => {
    // Parse transcript into structured format
    if (result?.transcript) {
      const lines = result.transcript.split('\n').filter(line => line.trim() !== '');
      const parsedLines = lines.map(line => {
        const [speaker, ...textParts] = line.split(': ');
        return {
          speaker: speaker.trim(),
          text: textParts.join(': ').trim()
        };
      });
      setParsedTranscript(parsedLines);
    }
  }, [result?.transcript]);

  useEffect(() => {
    async function fetchResults() {
      try {
        setLoading(true);
        setError(null);
        
        // Use our service function to fetch the student's assessment result
        const resultData = await fetchStudentAssessmentResult(
          params.student_id,
          params.assessment_id
        );
        
        console.log(resultData);

        setResult(resultData);
      } catch (err) {
        console.error("Error loading assessment results:", err);
        setError('Failed to load assessment results. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [params.student_id, params.assessment_id]);

  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-start p-6 ${inter.className}`}
    >
      {/* Custom scrollbar styles */}
      <style jsx global>{customScrollbarStyles}</style>
      
      {/* Header section with title */}
      <div className="w-full max-w-[95%] mb-0">
        <div className="text-center">
          {/* Animated indicator */}
          <div className="flex justify-center items-center space-x-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-indigo-600 animate-pulse"></div>
            <span className="text-gray-700 font-medium">AlterView</span>
          </div>
          
          {/* Gradient title */}
          <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-transparent bg-clip-text tracking-tight">
            Assessment Results
          </h1>
        </div>
      </div>

      {/* Stacked layout container - changed from side-by-side to vertical */}
      <div className="w-full max-w-[95%] flex flex-col gap-8 mt-2">
        {/* Assessment Results Section - now full width */}
        <div className="w-full relative">
          {/* Apple-style purple and blue inward gradient effect */}
          <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ 
            boxShadow: `inset 0 0 80px 30px rgba(79, 70, 229, 0.15), inset 0 0 40px 20px rgba(59, 130, 246, 0.15)`,
            borderRadius: 'inherit'
          }}></div>
          
          <div className="backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden border-0 p-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-600 text-xl">Loading results...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            ) : (
              <div className="transition-all duration-300 ease-in-out">
                {/* Results card */}
                <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-md border border-gray-100">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Assessment Results</h3>
                  
                  {/* Two-column layout for assessment info and transcript */}
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Left column: Assessment details */}
                    <div className="w-full md:w-1/2">
                      <div className="flex flex-col space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Assessment ID:</span>
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded text-indigo-700">{result?.assessment_id || params.assessment_id}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Student ID:</span>
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded text-indigo-700">{result?.student_id || params.student_id}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Teacher ID:</span>
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded text-indigo-700">{result?.teacher_id || 'N/A'}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Created At:</span>
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded text-indigo-700">
                            {result?.created_at ? new Date(result.created_at).toLocaleString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right column: Transcript (always show container, conditionally show content) */}
                    <div className="w-full md:w-1/2">
                      <div className="h-full">
                        <h4 className="text-md font-semibold text-gray-700 mb-2">Interview Transcript</h4>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-left h-64 overflow-y-auto custom-scrollbar">
                          {result?.transcript ? (
                            <div className="space-y-4">
                              {parsedTranscript.map((line, index) => (
                                <div key={index} className={`flex ${line.speaker === 'USER' ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[80%] rounded-lg p-3 ${
                                    line.speaker === 'USER' 
                                      ? 'bg-indigo-100 text-indigo-800' 
                                      : 'bg-gray-200 text-gray-800'
                                  }`}>
                                    <p className="text-xs font-semibold mb-1">{line.speaker}</p>
                                    <p>{line.text}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <p className="text-gray-500">No transcript available</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mind Map Section - now full width with increased height */}
        <div className="w-full relative">
          {/* Apple-style purple and blue inward gradient effect */}
          <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ 
            boxShadow: `inset 0 0 80px 30px rgba(79, 70, 229, 0.15), inset 0 0 40px 20px rgba(59, 130, 246, 0.15)`,
            borderRadius: 'inherit'
          }}></div>
          
          <div className="backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden border-0 p-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-600 text-xl">Loading results...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-md border border-gray-100">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-2 text-center">Mind Map</h3>
                
                {result?.mindmap ? (
                  <div className="h-[70vh] w-full">
                    <MindMap data={result.mindmap} className="rounded-xl" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px]">
                    <p className="text-gray-500 text-center">No mind map data available for this assessment.</p>
                    <button 
                      className="mt-4 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition-colors"
                      onClick={() => {
                        // For testing purposes, we'll use the sample data
                        fetch('/sample.json')
                          .then(response => response.json())
                          .then(data => {
                            if (result) {
                              setResult({
                                ...result,
                                mindmap: data
                              });
                            }
                          })
                          .catch(err => console.error('Error loading sample mindmap:', err));
                      }}
                    >
                      Load Sample Mind Map
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 
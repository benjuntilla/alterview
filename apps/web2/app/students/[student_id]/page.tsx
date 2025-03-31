"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeftCircle,
  BookOpen,
  ChevronRight,
  LogOut,
  History,
  ExternalLink,
  FileText,
  Calendar,
  ChevronDown,
  Settings,
  Clock,
  CheckCircle,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import FloatingIcons from "@/components/app/FloatingIcons";
import { getStudentName } from "@/services/supabaseService";
import StudentSettings from "@/components/app/StudentSettings";
import { fetchStudentAssessments } from "@/services/assessmentService";

// Define student assessment interface
interface StudentAssessment {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  status: string;
}

// Type definition for assessment results
interface AssessmentResult {
  id: number;
  created_at: string;
  assessment_id: number;
  teacher_id: number;
  student_id: number;
  voice_recording_id: number | null;
  transcript_id: number | null;
}

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

export default function StudentDashboard({
  params,
}: {
  params: { student_id: string };
}) {
  const [loaded, setLoaded] = useState(false);
  const [studentName, setStudentName] = useState("Student");
  const [assessments, setAssessments] = useState<StudentAssessment[]>([]);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllResults, setShowAllResults] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setLoaded(true);

    // Fetch student name
    const fetchStudentName = async () => {
      try {
        const name = await getStudentName(parseInt(params.student_id));
        setStudentName(name);
      } catch (err) {
        console.error("Error fetching student name:", err);
      }
    };

    // Fetch assignments
    const loadAssignments = async () => {
      try {
        const data = await fetchStudentAssessments(params.student_id);
        setAssessments(data);
      } catch (err) {
        console.error("Error fetching student assessments:", err);
      }
    };

    // Fetch assessment results
    const fetchAssessmentResults = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/assessment-results/student/${params.student_id}`,
          {
            headers: {
              'Authorization': `Bearer ${API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch assessment results: ${response.status}`
          );
        }

        const data = await response.json();
        // Sort assessment results from latest to oldest based on created_at date
        const sortedData = [...data].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setAssessmentResults(sortedData);
      } catch (err) {
        console.error("Error fetching assessment results:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch assessment results"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentName();
    loadAssignments();
    fetchAssessmentResults();
  }, [params.student_id]);

  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get visible results - either all or just the first 5
  const visibleResults = showAllResults
    ? assessmentResults
    : assessmentResults.slice(0, 5);

  // Function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-100 text-blue-800";
      case "learning": return "bg-amber-100 text-amber-800";
      case "reviewing": return "bg-purple-100 text-purple-800";
      case "mastered": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Function to get difficulty icon
  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return <span className="text-green-500">●</span>;
      case "medium": return <span className="text-amber-500">●</span>;
      case "hard": return <span className="text-red-500">●</span>;
      default: return <span className="text-gray-500">●</span>;
    }
  };

  // Format for spaced repetition dates
  const formatReviewDate = (dateString: string | null) => {
    if (!dateString) return "Not scheduled";
    
    const date = new Date(dateString);
    const today = new Date();
    
    // If it's today
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }
    
    // If it's tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }
    
    // If it's within a week
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    if (date < nextWeek) {
      const options: Intl.DateTimeFormatOptions = { weekday: 'long' };
      return date.toLocaleDateString('en-US', options);
    }
    
    // Otherwise return the date
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Function to determine how long since last review
  const getDaysSince = (dateString: string | null) => {
    if (!dateString) return "Never";
    
    const lastDate = new Date(dateString);
    const today = new Date();
    
    // Calculate the difference in days
    const diffTime = today.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Filter assessments to only show IDs 4, 5, and 1
  const filteredAssessments = assessments.filter(assessment => 
    ['4', '5', '1'].includes(assessment.id)
  );

  // Group concepts by status for the practice view
  const conceptsByStatus = {
    new: [],
    learning: [],
    reviewing: [],
    mastered: []
  };

  return (
    <div className="relative min-h-[calc(100vh-10rem)] px-4 py-8 overflow-hidden">
      {/* Background animation */}
      <FloatingIcons />

      {/* Settings Modal */}
      <StudentSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Main container */}
      <div className="container mx-auto max-w-4xl relative z-10">
        {/* Header section with welcome message */}
        <div
          className={`transition-all duration-700 ease-out ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <h1 className="text-4xl font-semibold text-gray-900 animate-fadeIn">
                Welcome, {studentName || "Student"}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <p
                className="text-gray-500 text-lg animate-fadeIn"
                style={{ animationDelay: "100ms" }}
              >
                ID: {params.student_id}
              </p>
              <div className="flex items-center space-x-3">
                <Link
                  href="/"
                  className="inline-flex items-center text-sm text-alterview-indigo hover:text-alterview-violet transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  <span>Logout</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Create Assessment Button */}
        <div
          className={`bg-white/90 backdrop-blur-md rounded-2xl mb-6 shadow-apple animate-scaleIn overflow-hidden transition-all duration-700 ease-out ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ animationDelay: "100ms" }}
        >
          <div className="px-8 py-6">
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-alterview-indigo/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-alterview-indigo" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Create Custom Assessment
                </h3>
                <p className="text-gray-600">
                  Want to test your knowledge on a custom topic? Try it here.
                </p>
              </div>
              <div className="flex-shrink-0">
                <Link
                  href={`/create-assessment?creator_id=${params.student_id}&is_creator_student=true`}
                  className="inline-flex items-center px-4 py-2.5 bg-alterview-gradient text-white rounded-xl hover:shadow-md transition-all duration-300 group"
                >
                  <span className="text-base font-medium">Create</span>
                  <ChevronRight className="h-4 w-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Standard view - show assessments and past attempts */}
        <div
          className={`bg-white/90 backdrop-blur-md rounded-2xl mb-6 shadow-apple animate-scaleIn overflow-hidden transition-all duration-700 ease-out ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ animationDelay: "100ms" }}
        >
          {/* Section header */}
          <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center">
              <BookOpen className="h-5 w-5 text-alterview-indigo mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">
                Your Assessments
              </h2>
            </div>
            <span className="text-sm text-gray-500">
              {filteredAssessments.length} total
            </span>
          </div>

          {/* Assessment list */}
          {filteredAssessments.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredAssessments.map((assessment, index) => (
                <div
                  key={assessment.id}
                  className="hover:bg-gray-50/80 transition-colors"
                  style={{ animationDelay: `${150 + index * 50}ms` }}
                >
                  <div className="px-8 py-5 flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">
                        {assessment.title}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 space-x-3">
                        <span>{assessment.course}</span>
                        <span className="h-1 w-1 rounded-full bg-gray-300"></span>
                        <span>Due: {assessment.dueDate}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {/* <Link
                        href={`/student/${params.student_id}/practice/${assessment.id}`}
                        className="flex items-center px-5 py-2.5 bg-white border border-alterview-indigo/30 text-alterview-indigo rounded-xl hover:bg-alterview-indigo/5 transition-all duration-300 group"
                      >
                        <span>Practice</span>
                        <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                      </Link> */}
                      <Link
                        href={`/assessment/${params.student_id}/${assessment.id}`}
                        className="flex items-center px-5 py-2.5 bg-alterview-gradient text-white rounded-xl hover:shadow-md transition-all duration-300 group"
                      >
                        <span>Start</span>
                        <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-8 py-12 text-center">
              <p className="text-gray-500">
                No assessments available at this time.
              </p>
            </div>
          )}
        </div>

        {/* Past Attempts section */}
        <div
          className={`bg-white/90 backdrop-blur-md rounded-2xl mb-6 shadow-apple animate-scaleIn overflow-hidden transition-all duration-700 ease-out ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ animationDelay: "200ms" }}
        >
          {/* Section header */}
          <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center">
              <History className="h-5 w-5 text-alterview-violet mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">
                Past Attempts
              </h2>
            </div>
            <span className="text-sm text-gray-500">
              {assessmentResults.length > 0 &&
                `Showing ${visibleResults.length} of ${assessmentResults.length}`}
            </span>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="px-8 py-10 text-center">
              <div className="max-w-md mx-auto">
                <div className="bg-gray-50 rounded-xl p-6 mb-4 animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <div className="h-5 bg-gray-200 rounded w-1/2 mx-auto mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                </div>
              </div>
            </div>
          )}

          {/* Error state */}
          {!isLoading && error && (
            <div className="px-8 py-10 text-center">
              <div className="max-w-md mx-auto">
                <div className="bg-red-50 rounded-xl p-6 mb-4">
                  <h3 className="text-lg font-medium text-red-800 mb-2">
                    Error loading results
                  </h3>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
                <button
                  className="mt-2 inline-flex items-center px-4 py-2 text-sm font-medium text-alterview-indigo border border-alterview-indigo/30 rounded-xl hover:bg-alterview-indigo/5 transition-colors"
                  onClick={() => window.location.reload()}
                >
                  <History className="h-4 w-4 mr-2" />
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* Assessment results list */}
          {!isLoading && !error && assessmentResults.length > 0 ? (
            <>
              <div className="divide-y divide-gray-100">
                {visibleResults.map((result, index) => {
                  // Find matching assessment from our assessments array
                  const matchingAssessment = assessments.find(
                    (a) => a.id === result.assessment_id.toString()
                  );

                  return (
                    <div
                      key={result.id}
                      className="hover:bg-gray-50/80 transition-colors"
                      style={{ animationDelay: `${150 + index * 50}ms` }}
                    >
                      <div className="px-8 py-5 flex justify-between items-center">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">
                            {matchingAssessment?.title || `Assessment #${result.assessment_id}`}
                          </h3>
                          <div className="flex items-center text-sm text-gray-500 space-x-3">
                            <div className="flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1 text-gray-400" />
                              <span>{formatDate(result.created_at)}</span>
                            </div>
                            {matchingAssessment && (
                              <>
                                <span className="h-1 w-1 rounded-full bg-gray-300"></span>
                                <span>{matchingAssessment.course}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Link
                          href={`/student/${params.student_id}/results/${result.id}`}
                          className="flex items-center px-4 py-2 text-alterview-indigo border border-alterview-indigo/30 rounded-xl hover:bg-alterview-indigo/5 transition-colors group"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          <span>View</span>
                          <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Show More button - only display if there are more than 5 results */}
              {assessmentResults.length > 5 && (
                <div className="px-8 py-4 border-t border-gray-100 flex justify-center">
                  <button
                    onClick={() => setShowAllResults(!showAllResults)}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-alterview-indigo hover:text-alterview-violet transition-colors"
                  >
                    {showAllResults ? (
                      <>
                        <span>Show Less</span>
                        <ChevronDown className="h-4 w-4 ml-1 transform rotate-180" />
                      </>
                    ) : (
                      <>
                        <span>Show More</span>
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            !isLoading &&
            !error && (
              <div className="px-8 py-10 text-center">
                <div className="max-w-md mx-auto">
                  <div className="bg-gray-50 rounded-xl p-6 mb-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <History className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">
                      No past attempts yet
                    </h3>
                    <p className="text-gray-500 text-sm">
                      After you complete an assessment, your attempts will
                      appear here for review.
                    </p>
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* Back to home link */}
        <div
          className="text-center animate-fadeIn"
          style={{ animationDelay: "300ms" }}
        >
          <Link
            href="/"
            className="inline-flex items-center justify-center text-alterview-indigo hover:text-alterview-violet transition-colors apple-hover"
          >
            <ArrowLeftCircle className="h-4 w-4 mr-1" />
            <span>Back to home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

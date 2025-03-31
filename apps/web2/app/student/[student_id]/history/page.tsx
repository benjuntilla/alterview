"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeftCircle,
  Clock,
  ChevronRight,
  Search,
  Calendar,
  BookOpen,
  FileText,
  BarChart2,
} from "lucide-react";
import FloatingIcons from "@/components/app/FloatingIcons";
import { fetchStudentAssessmentResults } from "@/services/assessmentService";

// Type definition for assessment results (same as in dashboard)
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

export default function StudentHistory({
  params,
}: {
  params: { student_id: string };
}) {
  const [loaded, setLoaded] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<AssessmentResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLoaded(true);

    // Fetch assessment results
    const fetchAssessmentResults = async () => {
      try {
        setIsLoading(true);
        
        // Use our service function to fetch student assessment results
        const data = await fetchStudentAssessmentResults(params.student_id);
        
        // Sort assessment results from latest to oldest based on created_at date
        const sortedData = [...data].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        setAssessmentResults(sortedData);
        setFilteredResults(sortedData);
        setError(null);
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

  // Handle search/filter functionality
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredResults(assessmentResults);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = assessmentResults.filter(
        (result) =>
          result.assessment_id.toString().includes(query) ||
          formatDate(result.created_at).toLowerCase().includes(query)
      );
      setFilteredResults(filtered);
    }
  }, [searchQuery, assessmentResults]);

  return (
    <div className="relative min-h-[calc(100vh-10rem)] px-4 py-8 overflow-hidden">
      {/* Background animation */}
      <FloatingIcons />

      {/* Main container */}
      <div className="container mx-auto max-w-4xl relative z-10">
        {/* Header section */}
        <div
          className={`transition-all duration-700 ease-out ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="mb-8">
            <h1 className="text-4xl font-semibold text-gray-900 mb-3 animate-fadeIn">
              Assessment History
            </h1>
            <div className="flex items-center space-x-4">
              <p
                className="text-gray-500 text-lg animate-fadeIn"
                style={{ animationDelay: "100ms" }}
              >
                Student ID: {params.student_id}
              </p>
            </div>
          </div>
        </div>

        {/* Search and filter section */}
        <div
          className={`bg-white/90 backdrop-blur-md rounded-2xl mb-6 shadow-apple animate-scaleIn overflow-hidden transition-all duration-700 ease-out ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ animationDelay: "100ms" }}
        >
          <div className="px-8 py-5">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-alterview-indigo focus:border-transparent transition-all"
                placeholder="Search assessments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Assessment results section */}
        <div
          className={`bg-white/90 backdrop-blur-md rounded-2xl mb-6 shadow-apple animate-scaleIn overflow-hidden transition-all duration-700 ease-out ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ animationDelay: "200ms" }}
        >
          {/* Section header */}
          <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center">
              <BarChart2 className="h-5 w-5 text-alterview-violet mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">
                All Assessment Attempts
              </h2>
            </div>
            <span className="text-sm text-gray-500">
              {filteredResults.length} total
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
                  <BarChart2 className="h-4 w-4 mr-2" />
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* Assessment results list */}
          {!isLoading && !error && filteredResults.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredResults.map((result, index) => (
                <div
                  key={result.id}
                  className="hover:bg-gray-50/80 transition-colors"
                  style={{ animationDelay: `${150 + index * 50}ms` }}
                >
                  <div className="px-8 py-5 flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">
                        Assessment #{result.assessment_id}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 space-x-3">
                        <div className="flex items-center">
                          <Calendar className="h-3.5 w-3.5 mr-1 text-gray-400" />
                          <span>{formatDate(result.created_at)}</span>
                        </div>
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
              ))}
            </div>
          ) : (
            !isLoading &&
            !error && (
              <div className="px-8 py-10 text-center">
                <div className="max-w-md mx-auto">
                  <div className="bg-gray-50 rounded-xl p-6 mb-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">
                      No results found
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {searchQuery.trim() !== ""
                        ? "Try adjusting your search criteria to find your assessment attempts."
                        : "You don't have any assessment attempts yet."}
                    </p>
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* Back to dashboard link */}
        <div
          className="text-center animate-fadeIn"
          style={{ animationDelay: "300ms" }}
        >
          <Link
            href={`/students/${params.student_id}`}
            className="inline-flex items-center justify-center text-alterview-indigo hover:text-alterview-violet transition-colors apple-hover"
          >
            <ArrowLeftCircle className="h-4 w-4 mr-1" />
            <span>Back to dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Inter } from "next/font/google";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");

    try {
      // This is a placeholder for actual form submission
      // In a real implementation, you would send this data to your backend
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

      console.log("Form submitted:", formData);
      setSubmitSuccess(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitError(
        "There was an error submitting your form. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-start p-12 ${inter.className}`}
    >
      {/* Modern header design */}
      <div className="w-full max-w-3xl text-center mb-16">
        {/* Enhanced title with larger size and improved gradient */}
        <h1 className="text-6xl font-extrabold mb-4 bg-gradient-to-r from-indigo-600 via-purple-500 to-blue-500 text-transparent bg-clip-text tracking-tight">
          Contact Us
        </h1>

        {/* Improved subtitle with better typography and spacing */}
        <p className="text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Have questions about AlterView? We&apos;re here to help!
        </p>

        {/* Decorative element */}
        <div className="w-20 h-1 bg-gradient-to-r from-indigo-500 to-blue-500 mx-auto mt-8 rounded-full"></div>
      </div>

      {/* Contact Form */}
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        {submitSuccess ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-8">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Message Sent!
            </h2>
            <p className="text-gray-600 mb-10 text-lg max-w-md mx-auto">
              Thank you for reaching out. We&apos;ll get back to you as soon as
              possible.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-8 py-4 rounded-lg bg-gradient-to-r from-indigo-600 via-purple-500 to-blue-500 text-white font-medium text-sm hover:opacity-90 transition-all shadow-md"
            >
              Back to Home
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 md:p-12">
            <div className="space-y-6">
              {/* Name Field */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow-sm"
                  placeholder="Your Name"
                />
              </div>

              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow-sm"
                  placeholder="you@example.com"
                />
              </div>

              {/* Subject Field */}
              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Subject
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow-sm"
                >
                  <option value="">Select a subject</option>
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Feedback">Feedback</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Message Field */}
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Your Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow-sm resize-y"
                  placeholder="How can we help you?"
                ></textarea>
              </div>

              {/* Error Message */}
              {submitError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                  <p className="text-red-700 text-sm">{submitError}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-4 rounded-lg bg-gradient-to-r from-indigo-600 via-purple-500 to-blue-500 text-white font-medium text-sm hover:opacity-90 transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  "Send Message"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

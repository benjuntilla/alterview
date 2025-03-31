"use client";

import { useState } from "react";
import {
  Settings,
  Moon,
  Sun,
  Globe,
  Bell,
  BellOff,
  Check,
  Accessibility,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TeacherSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const TeacherSettings = ({ isOpen, onClose }: TeacherSettingsProps) => {
  // Settings state
  const [theme, setTheme] = useState("light");
  const [fontSize, setFontSize] = useState("medium");
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState("english");
  const [highContrast, setHighContrast] = useState(false);

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    // Functionality to be implemented later
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    // Functionality to be implemented later
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    // Functionality to be implemented later
  };

  const toggleNotifications = () => {
    setNotifications(!notifications);
    // Functionality to be implemented later
  };

  const toggleHighContrast = () => {
    setHighContrast(!highContrast);
    // Functionality to be implemented later
  };

  // Function to render option buttons
  const renderOptionButtons = (
    label: string,
    options: string[],
    activeOption: string,
    onChange: (option: string) => void,
    icon?: React.ReactNode
  ) => (
    <div className="mb-6 pb-6 border-b border-gray-100 last:border-b-0 last:pb-0 last:mb-0">
      <div className="flex items-center mb-3">
        {icon && <div className="mr-2 text-alterview-indigo">{icon}</div>}
        <span className="text-sm text-gray-700">{label}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option.toLowerCase())}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              activeOption === option.toLowerCase()
                ? "bg-alterview-indigo text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );

  // Function to render toggle option
  const renderToggle = (
    label: string,
    isActive: boolean,
    onToggle: () => void,
    icon?: React.ReactNode
  ) => (
    <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100 last:border-b-0 last:pb-0 last:mb-0">
      <div className="flex items-center">
        {icon && <div className="mr-2 text-alterview-indigo">{icon}</div>}
        <span className="text-sm text-gray-700">{label}</span>
      </div>
      <button
        onClick={onToggle}
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors duration-300",
          isActive ? "bg-alterview-indigo" : "bg-gray-300"
        )}
      >
        <span
          className={cn(
            "absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300",
            isActive && "translate-x-5"
          )}
        />
      </button>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="relative bg-white/95 backdrop-blur-md w-full max-w-md rounded-2xl shadow-apple animate-scaleIn overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center">
            <Settings className="h-5 w-5 text-alterview-indigo mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-500"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Settings Content */}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
          {/* Theme Selection */}
          {renderOptionButtons(
            "Theme",
            ["Light", "Dark", "System"],
            theme,
            handleThemeChange,
            theme === "dark" ? <Moon size={18} /> : <Sun size={18} />
          )}

          {/* Font Size Selection */}
          {renderOptionButtons(
            "Font Size",
            ["Small", "Medium", "Large"],
            fontSize,
            handleFontSizeChange
          )}

          {/* Language Selection */}
          {renderOptionButtons(
            "Language",
            ["English", "Spanish", "French", "German", "Chinese"],
            language,
            handleLanguageChange,
            <Globe size={18} />
          )}

          {/* Notifications Toggle */}
          {renderToggle(
            "Notifications",
            notifications,
            toggleNotifications,
            notifications ? <Bell size={18} /> : <BellOff size={18} />
          )}

          {/* High Contrast Toggle */}
          {renderToggle(
            "High Contrast Mode",
            highContrast,
            toggleHighContrast,
            <Accessibility size={18} />
          )}
        </div>

        {/* Footer with save button */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-alterview-gradient text-white rounded-lg flex items-center hover:shadow-md transition-all"
          >
            <Check className="h-4 w-4 mr-2" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherSettings;

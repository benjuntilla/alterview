import { Message, MessageTypeEnum, TranscriptMessageTypeEnum, MessageRoleEnum } from "@/lib/types/conversation.type";
import { vapi } from "@/lib/vapi.sdk";
import React, { useEffect, useRef, useState, useLayoutEffect, CSSProperties } from "react";
import { CALL_STATUS } from "@/hooks/useVapi"; // Import CALL_STATUS
import { Loader2 } from "lucide-react"; // Import Loader2
import AudioVisualizer from "./AudioVisualizer"; // Import the new component

// Configuration constants (keep existing TELEPROMPTER_CONFIG)
const TELEPROMPTER_CONFIG = {
  // ... (keep existing config)
  container: {
    height: '70vh',
    widthPercentage: 75,
    borderRadius: '1.5rem',
    boxShadow: '0 0 40px rgba(0, 0, 0, 0.1)',
    headerHeight: 60,
  },
  text: {
    fontSize: 'text-5xl',
    fontWeight: 'font-extrabold',
    lineHeight: 'leading-snug',
    letterSpacing: 'tracking-normal',
    marginBetweenSegments: 'mb-3',
    padding: 'py-20',
    transitionDuration: 300,
  },
  colors: {
    assistantText: 'text-indigo-600',
    userText: 'text-gray-900',
    background: 'bg-black/5',
    border: 'border-white/20',
    cursor: {
      color: 'bg-indigo-600',
      width: 'w-2',
      height: 'h-7',
    },
    scrollbar: {
      thumb: 'bg-indigo-400/50',
      track: 'bg-transparent',
    },
    // Add ripple colors from AssistantButton
    ripple: {
      active: 'rgba(128, 0, 128, 0.15)', // Purple
      loading: 'rgba(93, 63, 211, 0.15)', // Indigo
      inactive: 'rgba(65, 105, 225, 0.15)', // Blue
    }
  },
  effects: {
    inwardGlow: {
      purple: 'rgba(79, 70, 229, 0.15)',
      blue: 'rgba(59, 130, 246, 0.15)',
      intensity: {
        outer: { spread: '80px', blur: '30px' },
        inner: { spread: '40px', blur: '20px' },
      },
    },
    fadeIn: 'transition-opacity duration-300 ease-in-out',
  },
};


interface TranscriptSegment {
  role: MessageRoleEnum;
  text: string;
}

interface LoadingStep {
  id: number;
  label: string;
  completed: boolean;
}

// Update DisplayProps to include call control props
interface DisplayProps {
  assessmentName?: string;
  toggleCall?: () => void; // Make optional for potential reuse without controls
  callStatus?: CALL_STATUS; // Make optional
  audioLevel?: number; // Make optional
}

function Display({
  assessmentName,
  toggleCall,
  callStatus = CALL_STATUS.INACTIVE, // Default status
  audioLevel = 0 // Default audio level
}: DisplayProps) {
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [activePartial, setActivePartial] = useState<string>("");
  const [activeRole, setActiveRole] = useState<MessageRoleEnum | null>(null);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [showLoadingPopup, setShowLoadingPopup] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState<{height: number, width: number}>({height: 0, width: 0});
  const activePartialRef = useRef<string>("");

  const [loadingSteps, setLoadingSteps] = useState<LoadingStep[]>([
    { id: 1, label: "Analyzing conversation", completed: false },
    { id: 2, label: "Processing feedback", completed: false },
    { id: 3, label: "Generating insights", completed: false },
    { id: 4, label: "Preparing results", completed: false }
  ]);

  // ... (keep existing useLayoutEffect for dimensions)
  useLayoutEffect(() => {
    const updateContainerDimensions = () => {
      if (containerRef.current) {
        const viewportWidth = window.innerWidth;
        const containerWidth = viewportWidth * (TELEPROMPTER_CONFIG.container.widthPercentage / 100);
        setContainerDimensions({
          height: containerRef.current.clientHeight,
          width: containerWidth
        });
      }
    };
    updateContainerDimensions();
    window.addEventListener('resize', updateContainerDimensions);
    return () => window.removeEventListener('resize', updateContainerDimensions);
  }, []);


  // ... (keep existing useEffect for scroll)
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcriptSegments, activePartial]);

  // ... (keep existing useEffect for loading steps)
   useEffect(() => {
    if (!showLoadingPopup) return;
    const completeSteps = async () => {
      for (let i = 0; i < loadingSteps.length - 1; i++) {
        await new Promise(resolve => setTimeout(resolve, 4000 + Math.random() * 1000));
        setLoadingSteps(prevSteps =>
          prevSteps.map(step =>
            step.id === i + 1 ? { ...step, completed: true } : step
          )
        );
      }
    };
    completeSteps();
  }, [showLoadingPopup, loadingSteps.length]);


  // ... (keep existing joinTextSegments function)
  const joinTextSegments = (existingText: string, newText: string): string => {
    existingText = existingText.trim();
    newText = newText.trim();
    if (!existingText) return newText;
    if (!newText) return existingText;
    if (existingText.endsWith(newText)) return existingText;

    let maxOverlap = 0;
    const minLength = Math.min(existingText.length, newText.length);
    for (let i = 1; i <= minLength; i++) {
      const endOfExisting = existingText.slice(-i);
      const startOfNew = newText.slice(0, i);
      if (endOfExisting === startOfNew) maxOverlap = i;
    }

    if (maxOverlap > 0) {
      return existingText + newText.slice(maxOverlap);
    } else if (/[.,\-:;!?]$/.test(existingText)) {
      return `${existingText} ${newText}`;
    } else {
      const needsSpace = !/^[.,\-:;!?]/.test(newText);
      return needsSpace ? `${existingText} ${newText}` : `${existingText}${newText}`;
    }
  };


  // ... (keep existing useEffect for Vapi messages)
  useEffect(() => {
    const onMessageUpdate = (message: Message) => {
      if (message.type === MessageTypeEnum.TRANSCRIPT && 'transcript' in message) {
        const text = message.transcript.trim();
        const role = message.role;
        if (text.startsWith('{') || text.includes('"type":') || text.includes('"status":')) return;

        if (message.transcriptType === TranscriptMessageTypeEnum.PARTIAL) {
          activePartialRef.current = text;
          setActivePartial(prevPartial => {
            if (text.length > 0 && prevPartial.length > 0) {
              const similarity = text.includes(prevPartial) || prevPartial.includes(text);
              if (similarity && Math.abs(text.length - prevPartial.length) < 5) return prevPartial;
            }
            return text;
          });
          setActiveRole(role);
        } else if (message.transcriptType === TranscriptMessageTypeEnum.FINAL) {
          setIsTransitioning(true);
          setTimeout(() => {
            setTranscriptSegments(prev => {
              if (prev.length === 0) return [{ role, text }];
              const lastSegment = prev[prev.length - 1];
              if (lastSegment.role === role) {
                const updatedSegments = [...prev];
                updatedSegments[updatedSegments.length - 1] = { ...lastSegment, text: joinTextSegments(lastSegment.text, text) };
                return updatedSegments;
              } else {
                return [...prev, { role, text }];
              }
            });
            setTimeout(() => {
              setActivePartial("");
              setActiveRole(null);
              setIsTransitioning(false);
            }, TELEPROMPTER_CONFIG.text.transitionDuration / 2);
          }, TELEPROMPTER_CONFIG.text.transitionDuration / 2);
        }
      }
    };

    const reset = () => {
      setTranscriptSegments([]);
      setActivePartial("");
      setActiveRole(null);
      activePartialRef.current = "";
    };

    const handleCallEnd = () => {
      setShowLoadingPopup(true);
      reset();
    };

    vapi.on("message", onMessageUpdate);
    vapi.on("call-end", handleCallEnd);
    return () => {
      vapi.off("message", onMessageUpdate);
      vapi.off("call-end", handleCallEnd);
    };
  }, []);

  // Generate button ripple effect based on audio level (adapted from AssistantButton)
  const getRippleStyle = (): CSSProperties => {
    const size = containerDimensions.width * 0.1 + audioLevel * (containerDimensions.width * 0.2); // Ripple size relative to container
    let color = TELEPROMPTER_CONFIG.colors.ripple.inactive;
    if (callStatus === CALL_STATUS.ACTIVE) color = TELEPROMPTER_CONFIG.colors.ripple.active;
    else if (callStatus === CALL_STATUS.LOADING) color = TELEPROMPTER_CONFIG.colors.ripple.loading;

    return {
      position: 'absolute',
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      transform: 'translate(-50%, -50%)',
      top: '50%',
      left: '50%',
      background: color,
      transition: 'all 0.2s ease',
      pointerEvents: 'none' as 'none',
      zIndex: 1, // Ensure ripple is behind text but above background effects
    };
  };

  const isClickable = callStatus === CALL_STATUS.INACTIVE && toggleCall;
  const showTranscript = transcriptSegments.length > 0 || activePartial;

  return (
    <div className="flex justify-center w-full">
      {/* Make this div clickable */}
      <div
        ref={containerRef}
        className={`flex flex-col relative backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden border ${isClickable ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
        style={{
          width: containerDimensions.width > 0 ? `${containerDimensions.width}px` : `${TELEPROMPTER_CONFIG.container.widthPercentage}%`,
          height: TELEPROMPTER_CONFIG.container.height,
          boxShadow: TELEPROMPTER_CONFIG.container.boxShadow,
          backgroundColor: TELEPROMPTER_CONFIG.colors.background,
          borderColor: TELEPROMPTER_CONFIG.colors.border
        }}
        onClick={isClickable ? toggleCall : undefined} // Add onClick handler
        role={isClickable ? "button" : undefined}
        aria-label={isClickable ? "Start Interview" : undefined}
        tabIndex={isClickable ? 0 : undefined} // Make it focusable
      >
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md p-4 border-b border-gray-100 flex items-center space-x-2 z-10">
          {/* Replace the status dot with the AudioVisualizer */}
          <AudioVisualizer
            audioLevel={audioLevel}
            isActive={callStatus === CALL_STATUS.ACTIVE}
          />
          <h2 className="text-lg font-medium text-gray-800">
            {assessmentName || "Assessment"}
          </h2>
        </div>

        {/* Main content container */}
        <div
          className="flex-1 flex flex-col items-center px-6 py-8 overflow-hidden relative" // Removed justify-center
          style={{
            height: `calc(${TELEPROMPTER_CONFIG.container.height} - ${TELEPROMPTER_CONFIG.container.headerHeight}px)`
          }}
        >
          {/* Inward Glow Effect */}
          <div className="absolute inset-0 pointer-events-none" style={{
            boxShadow: `inset 0 0 ${TELEPROMPTER_CONFIG.effects.inwardGlow.intensity.outer.spread} ${TELEPROMPTER_CONFIG.effects.inwardGlow.intensity.outer.blur} ${TELEPROMPTER_CONFIG.effects.inwardGlow.purple}, inset 0 0 ${TELEPROMPTER_CONFIG.effects.inwardGlow.intensity.inner.spread} ${TELEPROMPTER_CONFIG.effects.inwardGlow.intensity.inner.blur} ${TELEPROMPTER_CONFIG.effects.inwardGlow.blue}`,
            borderRadius: 'inherit'
          }}></div>


          {/* Content Area */}
          <div className="w-full max-w-3xl h-full flex flex-col items-center relative z-10"> {/* Removed justify-center, Ensure content is above ripple */}
            {!showTranscript && callStatus !== CALL_STATUS.LOADING ? (
              <div className="text-center text-gray-500 pt-16"> {/* Added padding top for initial message */}
                <p className={"text-2xl sm:text-3xl md:text-4xl " + TELEPROMPTER_CONFIG.text.fontWeight}>
                  {callStatus === CALL_STATUS.INACTIVE ? "Click anywhere to begin" : "Waiting..."}
                </p>
                {callStatus === CALL_STATUS.INACTIVE && (
                  <p className="mt-2 text-lg">Start your assessment interview</p>
                )}
              </div>
            ) : callStatus === CALL_STATUS.LOADING ? (
               <div className="text-center text-gray-500 flex flex-col items-center pt-16"> {/* Added padding top */}
                 <Loader2 className="h-12 w-12 animate-spin text-alterview-indigo mb-4" />
                 <p className={"text-2xl sm:text-3xl md:text-4xl " + TELEPROMPTER_CONFIG.text.fontWeight}>Connecting...</p>
               </div>
            ) : (
              /* Display the transcript segments */
              <div className="w-full h-full flex flex-col items-center overflow-hidden relative"> {/* Removed justify-center */}
                <div
                  className={`w-full text-center py-8 h-full custom-scrollbar`} /* Reduced padding from py-20 to py-8 */
                  style={{
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    scrollbarWidth: 'thin',
                    scrollbarColor: `${TELEPROMPTER_CONFIG.colors.scrollbar.thumb} ${TELEPROMPTER_CONFIG.colors.scrollbar.track}`,
                    msOverflowStyle: 'none'
                  }}
                >
                  <div style={{ /* Removed height: 100% and overflowY: auto as parent handles scroll */ }}>
                    {transcriptSegments.map((segment, index) => (
                      <div
                        key={index}
                        className={`${TELEPROMPTER_CONFIG.text.marginBetweenSegments} ${
                          segment.role === MessageRoleEnum.ASSISTANT
                            ? TELEPROMPTER_CONFIG.colors.assistantText
                            : TELEPROMPTER_CONFIG.colors.userText
                        } ${TELEPROMPTER_CONFIG.effects.fadeIn}`}
                      >
                        <p className={`text-2xl md:${TELEPROMPTER_CONFIG.text.fontSize} ${TELEPROMPTER_CONFIG.text.fontWeight} ${TELEPROMPTER_CONFIG.text.lineHeight} ${TELEPROMPTER_CONFIG.text.letterSpacing} break-words`}>
                          {segment.text}
                        </p>
                      </div>
                    ))}

                    {/* Show the active partial with a blinking cursor effect */}
                    {activePartial && activeRole && (
                      <div
                        className={`${TELEPROMPTER_CONFIG.text.marginBetweenSegments} ${
                          activeRole === MessageRoleEnum.ASSISTANT
                            ? TELEPROMPTER_CONFIG.colors.assistantText
                            : TELEPROMPTER_CONFIG.colors.userText
                        } ${isTransitioning ? 'opacity-50' : 'opacity-100'} transition-opacity duration-200`}
                      >
                        <p className={`text-2xl md:${TELEPROMPTER_CONFIG.text.fontSize} ${TELEPROMPTER_CONFIG.text.fontWeight} ${TELEPROMPTER_CONFIG.text.lineHeight} ${TELEPROMPTER_CONFIG.text.letterSpacing} break-words`}>
                          {activePartial}
                          <span className={`inline-block ${TELEPROMPTER_CONFIG.colors.cursor.width} ${TELEPROMPTER_CONFIG.colors.cursor.height} ${TELEPROMPTER_CONFIG.colors.cursor.color} ml-1 animate-pulse`}></span>
                        </p>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading Popup (keep existing) */}
      {showLoadingPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-lg w-full mx-4 transform transition-transform duration-300 ease-out scale-100">
            <div className="text-center mb-6">
              {/* ... (spinner) */}
               <div className="w-20 h-20 mx-auto mb-4 relative">
                 <div className="absolute inset-0 border-t-4 border-indigo-600 border-solid rounded-full animate-spin"></div>
                 <div className="absolute inset-3 border-t-4 border-indigo-400 border-solid rounded-full animate-spin animation-delay-150"></div>
               </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Processing Results</h2>
              <p className="text-gray-600">Please wait while we analyze your conversation</p>
            </div>
            <div className="space-y-6">
              {loadingSteps.map((step) => (
                <div key={step.id} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 transition-colors duration-500 ease-out ${step.completed ? 'bg-green-500 text-white' : step.id === loadingSteps.findIndex(s => !s.completed) + 1 ? 'bg-indigo-100 text-indigo-600 animate-pulse' : 'bg-gray-200 text-gray-400'}`}>
                    {step.completed ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    ) : (
                      <span className="text-sm font-medium">{step.id}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className={`font-medium transition-colors duration-300 ${step.completed ? 'text-green-600' : step.id === loadingSteps.findIndex(s => !s.completed) + 1 ? 'text-indigo-600' : 'text-gray-500'}`}>
                        {step.label}
                      </span>
                      {step.completed ? (
                        <span className="text-green-500 text-sm">Completed</span>
                      ) : step.id === loadingSteps.findIndex(s => !s.completed) + 1 ? (
                        <span className="text-indigo-500 text-sm flex items-center">
                          <span className="mr-1">Processing</span>
                          <span className="flex space-x-1">
                            <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </span>
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">Pending</span>
                      )}
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ease-out ${step.completed ? 'bg-green-500 w-full' : step.id === loadingSteps.findIndex(s => !s.completed) + 1 ? 'bg-indigo-500 animate-progress' : 'bg-gray-300 w-0'}`}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Consolidated global styles (keep existing) */}
      <style jsx global>{`
        /* Scrollbar styles */
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(79, 70, 229, 0.5); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(79, 70, 229, 0.7); }

        /* Animation keyframes */
        @keyframes progress { 0% { width: 0%; } 20% { width: 20%; } 40% { width: 40%; } 60% { width: 65%; } 80% { width: 85%; } 100% { width: 95%; } }
        .animate-progress { animation: progress 4s ease-in-out infinite; }
        .animation-delay-150 { animation-delay: 150ms; }
        .animation-delay-300 { animation-delay: 300ms; }
      `}</style>
    </div>
  );
}

export { Display };

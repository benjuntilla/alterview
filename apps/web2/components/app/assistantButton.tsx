import { CALL_STATUS, useVapi } from "@/hooks/useVapi";
import { Loader2, Mic, Square } from "lucide-react";
import { Button } from "../ui/button";
import { CSSProperties } from "react";

const AssistantButton = ({
  toggleCall,
  callStatus,
  audioLevel = 0,
}: Partial<ReturnType<typeof useVapi>>) => {
  
  // Generate dynamic button classes based on call status
  const getButtonClasses = () => {
    const baseClasses = "rounded-full w-16 h-16 flex items-center justify-center shadow-soft transition-all duration-300 ease-in-out";
    
    if (callStatus === CALL_STATUS.ACTIVE) {
      return `${baseClasses} bg-alterview-purple hover:bg-alterview-purple/90 text-white`;
    } else if (callStatus === CALL_STATUS.LOADING) {
      return `${baseClasses} bg-alterview-indigo hover:bg-alterview-indigo/90 text-white`;
    } else {
      return `${baseClasses} bg-alterview-blue hover:bg-alterview-blue/90 text-white`;
    }
  };

  // Generate button ripple effect based on audio level
  const getRippleStyle = (): CSSProperties => {
    const size = 64 + audioLevel * 80; // Base size + audio level effect
    
    return {
      position: 'absolute',
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      transform: 'translate(-50%, -50%)',
      top: '50%',
      left: '50%',
      background: callStatus === CALL_STATUS.ACTIVE 
        ? 'rgba(128, 0, 128, 0.15)' 
        : callStatus === CALL_STATUS.LOADING
        ? 'rgba(93, 63, 211, 0.15)'
        : 'rgba(65, 105, 225, 0.15)',
      transition: 'all 0.2s ease',
      pointerEvents: 'none' as 'none'
    };
  };

  return (
    <div className="relative flex items-center justify-center py-8">
      {callStatus === CALL_STATUS.ACTIVE && audioLevel > 0.05 && (
        <div style={getRippleStyle()} className="animate-pulse" />
      )}
      <Button
        className={getButtonClasses()}
        onClick={toggleCall}
      >
        {callStatus === CALL_STATUS.ACTIVE ? (
          <Square className="h-6 w-6" />
        ) : callStatus === CALL_STATUS.LOADING ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
      </Button>
      <p className="absolute -bottom-2 text-xs text-gray-500 font-medium">
        {callStatus === CALL_STATUS.ACTIVE ? 'Stop' : callStatus === CALL_STATUS.LOADING ? 'Loading...' : 'Start Interview'}
      </p>
    </div>
  );
};

export { AssistantButton };

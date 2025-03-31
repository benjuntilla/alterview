"use client";

import { useVapi } from "../../hooks/useVapi";
// Remove AssistantButton import
// import { AssistantButton } from "./assistantButton";
import { Display } from "./display";
import { StopButton } from "./stopButton"; // Import StopButton

interface AssistantProps {
  assessmentId: string;
  assessmentName?: string;
}

function Assistant({ assessmentId, assessmentName }: AssistantProps) {
  const { toggleCall, callStatus, audioLevel } = useVapi(assessmentId);

  return (
    // Use a flex column layout to stack Display and StopButton
    <div className="flex flex-col items-center w-full h-full">
      {/* Display takes up most space */}
      <div className="flex-grow w-full flex items-center justify-center">
        <Display
          assessmentName={assessmentName}
          toggleCall={toggleCall} // Pass toggleCall
          callStatus={callStatus} // Pass callStatus
          audioLevel={audioLevel} // Pass audioLevel
        />
      </div>

      {/* Stop Button container - appears below Display */}
      <div className="w-full flex justify-center p-4 bg-transparent"> {/* Adjust background/padding as needed */}
        <StopButton
          toggleCall={toggleCall}
          callStatus={callStatus}
        />
        {/* Remove the old AssistantButton */}
        {/*
        <AssistantButton
          audioLevel={audioLevel}
          callStatus={callStatus}
          toggleCall={toggleCall}
        />
        */}
      </div>
    </div>
  );
}

export { Assistant };

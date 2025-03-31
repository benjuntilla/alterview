"use client";

import { useVapi } from "../../hooks/useVapi";
import { AssistantButton } from "./assistantButton";
import { Display } from "./display";

interface AssistantProps {
  assessmentId: string;
}

function Assistant({ assessmentId }: AssistantProps) {
  const { toggleCall, callStatus, audioLevel } = useVapi(assessmentId);

  return (
    <>
      <div className="chat-history">
        <Display />
      </div>

      <div className="user-input">
        <AssistantButton
          audioLevel={audioLevel}
          callStatus={callStatus}
          toggleCall={toggleCall}
        ></AssistantButton>
      </div>
    </>
  );
}

export { Assistant };

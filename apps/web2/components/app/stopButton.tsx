import { CALL_STATUS } from "@/hooks/useVapi";
import { Square } from "lucide-react";
import { Button } from "../ui/button";

interface StopButtonProps {
  toggleCall: () => void;
  callStatus: CALL_STATUS;
}

const StopButton = ({ toggleCall, callStatus }: StopButtonProps) => {
  // Only render the button if the call is active
  if (callStatus !== CALL_STATUS.ACTIVE) {
    return null;
  }

  // Replicate the active button style from the original AssistantButton
  const buttonClasses = "rounded-full w-16 h-16 flex items-center justify-center shadow-soft transition-all duration-300 ease-in-out bg-alterview-purple hover:bg-alterview-purple/90 text-white";

  return (
    <div className="relative flex items-center justify-center py-4"> {/* Reduced padding */}
      <Button
        className={buttonClasses}
        onClick={toggleCall}
        aria-label="Stop Interview"
      >
        <Square className="h-6 w-6" />
      </Button>
      <p className="absolute -bottom-0 text-xs text-gray-500 font-medium"> {/* Adjusted position */}
        Stop
      </p>
    </div>
  );
};

export { StopButton };
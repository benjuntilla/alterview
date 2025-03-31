import React from 'react';
import { cn } from '@/lib/utils';

interface AudioVisualizerProps {
  audioLevel: number; // Expected range: 0 to 1
  isActive: boolean;
  className?: string;
  barCount?: number;
  barWidth?: number;
  gap?: number;
  maxHeight?: number;
  minHeight?: number;
  color?: string;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioLevel,
  isActive,
  className,
  barCount = 5,
  barWidth = 3,
  gap = 2,
  maxHeight = 16, // Corresponds to h-4 in Tailwind
  minHeight = 2,
  color = 'bg-alterview-purple', // Default color
}) => {
  // Clamp audio level between 0 and 1
  const clampedAudioLevel = Math.max(0, Math.min(1, audioLevel));

  // Generate heights for each bar
  const barHeights = Array.from({ length: barCount }, (_, i) => {
    if (!isActive) {
      return minHeight; // Minimal height when inactive
    }
    // Introduce some variation based on index and audio level
    const variationFactor = (Math.sin(i * Math.PI / (barCount - 1)) * 0.5 + 0.5); // Sine wave variation
    const randomFactor = Math.random() * 0.3 + 0.7; // Slight randomness
    const targetHeight = minHeight + (maxHeight - minHeight) * clampedAudioLevel * variationFactor * randomFactor;
    // Ensure height is at least minHeight
    return Math.max(minHeight, Math.min(maxHeight, targetHeight));
  });

  const totalWidth = barCount * barWidth + (barCount - 1) * gap;

  return (
    <div
      className={cn("flex items-end justify-center", className)}
      style={{ height: `${maxHeight}px`, width: `${totalWidth}px`, gap: `${gap}px` }}
      aria-hidden="true" // Decorative element
    >
      {barHeights.map((height, index) => (
        <div
          key={index}
          className={cn(
            "transition-all duration-100 ease-out rounded-full",
            color
          )}
          style={{
            height: `${isActive && clampedAudioLevel > 0.02 ? height : minHeight}px`, // Use minHeight if inactive or very low audio
            width: `${barWidth}px`,
          }}
        />
      ))}
    </div>
  );
};

export default AudioVisualizer;
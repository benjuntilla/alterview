"use client";

import React, { useEffect, useState } from 'react';

interface FloatingIcon {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  color: string;
  speed: number;
  direction: number;
}

export default function FloatingIcons() {
  const [icons, setIcons] = useState<FloatingIcon[]>([]);
  
  useEffect(() => {
    // Colors from the AlterView palette with moderate opacity
    const colors = [
      'rgba(65, 105, 225, 0.25)', // blue
      'rgba(79, 134, 247, 0.25)', // lightblue
      'rgba(93, 63, 211, 0.25)',  // indigo
      'rgba(138, 43, 226, 0.25)', // violet
      'rgba(147, 112, 219, 0.25)', // lavender
      'rgba(128, 0, 128, 0.25)',  // purple
    ];
    
    // Create random icons
    const newIcons: FloatingIcon[] = [];
    // Moderate number of icons
    const count = Math.floor(window.innerWidth / 300); 
    
    for (let i = 0; i < count; i++) {
      newIcons.push({
        id: i,
        x: Math.random() * 100, // % position
        y: Math.random() * 100,
        size: 30 + Math.random() * 50, // Size between 30 and 80px
        opacity: 0.3 + Math.random() * 0.3, // Opacity between 0.3 and 0.6
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: 0.08 + Math.random() * 0.15, // Moderate movement
        direction: Math.random() > 0.5 ? 1 : -1, // Direction: up or down
      });
    }
    
    setIcons(newIcons);
    
    // Animation loop
    let animationFrame: number;
    let lastTime = 0;
    
    const animate = (time: number) => {
      if (!lastTime) lastTime = time;
      const delta = time - lastTime;
      lastTime = time;
      
      setIcons(prevIcons => {
        return prevIcons.map(icon => {
          // Move icon
          let newY = icon.y + (icon.speed * icon.direction * delta / 75); // Moderate movement speed
          
          // Reverse direction if reaching edges
          let newDirection = icon.direction;
          if (newY > 95) newDirection = -1;
          if (newY < 5) newDirection = 1;
          
          // Small random horizontal movement
          let newX = icon.x + (Math.random() * 0.15 - 0.075);
          if (newX > 95) newX = 95;
          if (newX < 5) newX = 5;
          
          return {
            ...icon,
            y: newY,
            x: newX,
            direction: newDirection,
          };
        });
      });
      
      animationFrame = requestAnimationFrame(animate);
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => cancelAnimationFrame(animationFrame);
  }, []);
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {icons.map(icon => (
        <div
          key={icon.id}
          className="absolute rounded-full blur-lg transition-all duration-1000 ease-in-out"
          style={{
            left: `${icon.x}%`,
            top: `${icon.y}%`,
            width: `${icon.size}px`,
            height: `${icon.size}px`,
            backgroundColor: icon.color,
            opacity: icon.opacity,
            transform: `translate(-50%, -50%)`
          }}
        />
      ))}
    </div>
  );
} 
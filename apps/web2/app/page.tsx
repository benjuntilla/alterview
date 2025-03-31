"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [visibleSections, setVisibleSections] = useState<{
    [key: string]: boolean;
  }>({
    hero: false,
    features: false,
    cta: false,
  });

  const featuresRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  // Check if element is in viewport - adjusted for quicker triggering
  const isInViewport = useCallback((element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    return rect.top <= window.innerHeight * 0.85 && rect.bottom >= 0;
  }, []);

  // Handle scroll events to check which sections are visible
  const handleScroll = useCallback(() => {
    if (featuresRef.current) {
      setVisibleSections((prev) => ({
        ...prev,
        features: isInViewport(featuresRef.current!),
      }));
    }

    if (ctaRef.current) {
      setVisibleSections((prev) => ({
        ...prev,
        cta: isInViewport(ctaRef.current!),
      }));
    }
  }, [isInViewport]);

  useEffect(() => {
    setIsLoaded(true);
    setVisibleSections((prev) => ({
      ...prev,
      hero: true,
    }));

    // Add scroll event listener with passive option for better performance
    window.addEventListener("scroll", handleScroll, { passive: true });
    // Initial check for visible sections
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  return (
    <div className="container mx-auto px-4 py-12 relative">
      {/* Hero Section - no top banner anymore */}
      <section className="flex flex-col md:flex-row items-center justify-between mb-40 min-h-[80vh] relative z-50">
        <div
          className={`md:w-2/3 mb-10 md:mb-0 transition-all duration-500 relative z-20 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              <div className="text-alterview-blue">Revolutionizing</div>
              <div className="bg-clip-text text-transparent bg-alterview-gradient">
                Student Assessments
              </div>
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Empowering educators with AI-powered interview assessments that
              provide deeper insights into student understanding.
            </p>
            
            {/* Buttons container */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {/* Demo button - takes full width on mobile, spans both columns on desktop */}
              <div className="relative md:col-span-2">
                <div className="absolute -inset-1 bg-gradient-to-r from-alterview-violet via-alterview-blue to-alterview-violet rounded-xl blur opacity-70 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse-slow"></div>
                <Link
                  href="/student-login?studentId=654321"
                  className="relative px-8 py-3 bg-gradient-to-r from-alterview-violet to-alterview-blue text-white rounded-xl font-bold transition-all duration-300 shadow-xl text-center flex items-center justify-center hover:shadow-2xl hover:-translate-y-1 transform active:scale-95 group border-2 border-alterview-violet w-full"
                >
                  <div className="mr-3 bg-white/20 p-1 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span>Try the Demo Now!</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
              
              {/* Student Portal button */}
              <Link
                href="/student-login"
                className="px-8 py-3 bg-alterview-indigo hover:bg-alterview-violet text-white rounded-xl font-medium transition-colors duration-200 shadow-soft text-center active:scale-95 transform border-2 border-alterview-indigo w-full"
              >
                Student Portal
              </Link>
              
              {/* Teacher Portal button */}
              <Link
                href="/teacher-login"
                className="px-8 py-3 border-2 border-alterview-indigo text-alterview-indigo hover:bg-alterview-indigo hover:text-white rounded-xl font-medium transition-colors duration-200 text-center active:scale-95 transform w-full"
              >
                Teacher Portal
              </Link>
            </div>
          </div>
        </div>
        <div
          className={`md:w-1/3 h-80 relative z-10`}
        >
          {/* Network graph contained to this area */}
          <div className="absolute inset-0">
            <NetworkGraph contained={true} />
          </div>
        </div>
      </section>

      {/* Background network for the rest of the page (more subtle) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-25 blur-[2px]">
        <NetworkGraph contained={false} subtle={true} />
      </div>

      {/* Features Section */}
      <section ref={featuresRef} className="mb-40 py-16 relative z-10">
        <div
          className={`transition-all duration-500 ${
            visibleSections.features
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-12"
          }`}
        >
          <h2 className="text-3xl font-bold text-center mb-16 text-gray-800">
            What Makes Alterview Special
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/90 backdrop-blur-md p-8 rounded-xl shadow-apple hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <div className="bg-alterview-blue/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-alterview-blue"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">
                AI-Powered Conversations
              </h3>
              <p className="text-gray-600">
                Our advanced AI conducts natural, adaptive interviews that feel like real conversations, not scripted tests. Students engage in a dialogue that adjusts based on their responses, creating a more authentic assessment experience.
              </p>
            </div>
            <div className="bg-white/90 backdrop-blur-md p-8 rounded-xl shadow-apple hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <div className="bg-alterview-indigo/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-alterview-indigo"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">
                Comprehensive Insights
              </h3>
              <p className="text-gray-600">
                Go beyond simple scores. Our detailed mind maps and analytics reveal students' conceptual understanding, knowledge gaps, and misconceptions. Teachers gain actionable insights to personalize instruction and target specific areas for improvement.
              </p>
            </div>
            <div className="bg-white/90 backdrop-blur-md p-8 rounded-xl shadow-apple hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <div className="bg-alterview-purple/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-alterview-purple"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">
                Time-Saving Efficiency
              </h3>
              <p className="text-gray-600">
                Automate the assessment process without sacrificing quality. AlterView conducts individualized interviews with each student simultaneously, providing educators with more time to focus on targeted teaching instead of repetitive testing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section ref={ctaRef} className="py-16 relative z-10">
        <div
          className={`transition-all duration-500 ${
            visibleSections.cta
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-12"
          }`}
        >
          <div className="bg-gradient-to-r from-alterview-blue via-alterview-indigo to-alterview-purple rounded-xl p-10 text-white shadow-apple">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Transform Student Assessments?
              </h2>
              <p className="max-w-lg mx-auto">
              </p>
            </div>

            <div className="max-w-md mx-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center">
                <h3 className="text-xl font-semibold mb-4">Get Started With AlterView</h3>
                <p className="mb-6">Fill out our Notion form to learn more about how AlterView can transform your assessment process.</p>
                <a
                  href="https://sumptuous-basin-2fa.notion.site/1b90f99daa9d809389cdc5718918d351"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block w-full px-8 py-3 bg-white text-alterview-indigo hover:bg-gray-100 rounded-xl font-medium transition-all duration-200 active:scale-98 transform hover:shadow-md"
                >
                  Interest Form
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Interactive 3D Network Graph
function NetworkGraph({
  contained = false,
  subtle = false,
}: {
  contained?: boolean;
  subtle?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<any[]>([]);
  const animationRef = useRef<number>(0);

  // Colors from the AlterView palette
  const nodeColors = [
    "#4169E1", // blue
    "#4F86F7", // lightblue
    "#5D3FD3", // indigo
    "#8A2BE2", // violet
    "#9370DB", // lavender
    "#800080", // purple
  ];

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const parentRect = canvas.parentElement?.getBoundingClientRect();

      if (parentRect) {
        canvas.width = parentRect.width;
        canvas.height = parentRect.height;
      } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener("resize", resizeCanvas, { passive: true });
    resizeCanvas();

    // Create nodes
    const createNodes = () => {
      const newNodes = [];
      // Moderately reduce node count for subtle mode
      const nodeCount = subtle ? 18 : contained ? 15 : 25;

      // Define padding to prevent nodes from approaching the edge too closely
      const edgePadding = contained ? 25 : 40; // Larger padding for non-contained mode

      for (let i = 0; i < nodeCount; i++) {
        // Adjust size for subtle mode - but less drastically
        const baseMaxRadius = contained ? 7 : 10;
        const maxRadius = subtle ? baseMaxRadius * 0.8 : baseMaxRadius; // Less reduction in subtle mode
        const glowMultiplier = subtle ? 1.8 : 2; // Moderately reduced glow effect in subtle mode

        // Calculate the safe area for node positions considering their size and glow
        const effectiveRadius = maxRadius * glowMultiplier;
        const safeAreaPadding = edgePadding + effectiveRadius;

        // Position nodes within the safe area
        newNodes.push({
          id: i,
          x:
            safeAreaPadding +
            Math.random() * (canvas.width - 2 * safeAreaPadding),
          y:
            safeAreaPadding +
            Math.random() * (canvas.height - 2 * safeAreaPadding),
          z: Math.random() * 200 - 100, // Z-axis for 3D effect (-100 to 100)
          // Less dramatic radius reduction for subtle mode
          radius: subtle
            ? 2.5 + Math.random() * 3.5
            : contained
            ? 3 + Math.random() * 4
            : 4 + Math.random() * 6,
          color: nodeColors[Math.floor(Math.random() * nodeColors.length)],
          velocity: {
            // Slightly slower movement for subtle mode, but not as slow as before
            x: (Math.random() - 0.5) * (subtle ? 0.3 : contained ? 0.4 : 0.5),
            y: (Math.random() - 0.5) * (subtle ? 0.3 : contained ? 0.4 : 0.5),
            z: (Math.random() - 0.5) * (subtle ? 0.25 : contained ? 0.3 : 0.4),
          },
          connections: [] as number[],
          // Store the padding value with each node to use during bounce calculations
          effectiveRadius: effectiveRadius,
        });
      }

      // Create connections between nodes (network edges)
      for (let i = 0; i < newNodes.length; i++) {
        // Moderate number of connections for subtle mode
        const connectionCount = subtle
          ? 1 + Math.floor(Math.random() * 2.5)
          : 2 + Math.floor(Math.random() * 3);
        for (let j = 0; j < connectionCount; j++) {
          const target = Math.floor(Math.random() * newNodes.length);
          if (target !== i && !newNodes[i].connections.includes(target)) {
            newNodes[i].connections.push(target);
          }
        }
      }

      nodesRef.current = newNodes;
    };

    createNodes();

    // Animation loop
    const animate = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections first (behind nodes)
      // Moderate line thickness for subtle mode - not as thin as before
      ctx.lineWidth = subtle ? 0.7 : contained ? 0.8 : 1;
      const nodes = nodesRef.current;

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        for (const targetId of node.connections) {
          const target = nodes[targetId];
          if (!target) continue;

          // Calculate opacity based on z positions (3D effect)
          const zFactor = (200 - Math.abs(node.z - target.z)) / 200;
          // Moderate opacity for subtle mode - higher than before
          const baseOpacity = subtle ? 0.25 : contained ? 0.4 : 0.3;
          const opacity = baseOpacity * zFactor;

          // Draw connection
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(target.x, target.y);
          ctx.strokeStyle = `rgba(125, 100, 255, ${opacity})`;
          ctx.stroke();
        }
      }

      // Define edge padding for bounce calculations
      const edgePadding = contained ? 25 : 40;

      // Then draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        // Update position
        node.x += node.velocity.x;
        node.y += node.velocity.y;
        node.z += node.velocity.z;

        // Calculate size based on z position (3D effect)
        const scale = (node.z + 100) / 200; // 0 to 1 based on z (-100 to 100)
        const displayRadius = node.radius * (0.5 + scale * 0.8); // Scale between 50% and 130%
        // Moderate opacity for subtle mode - higher than before
        const opacityBase = subtle ? 0.5 : 0.6;
        const opacity = opacityBase + scale * (subtle ? 0.3 : 0.4);

        // Calculate glow radius (used for bounce detection)
        const glowRadius = displayRadius * (subtle ? 1.8 : 2);

        // Bounce off edges with padding to prevent visual cutoff
        // For right and bottom edges, include the display radius
        if (node.x < edgePadding + glowRadius) {
          node.x = edgePadding + glowRadius;
          node.velocity.x *= -1;
        } else if (node.x > canvas.width - edgePadding - glowRadius) {
          node.x = canvas.width - edgePadding - glowRadius;
          node.velocity.x *= -1;
        }

        if (node.y < edgePadding + glowRadius) {
          node.y = edgePadding + glowRadius;
          node.velocity.y *= -1;
        } else if (node.y > canvas.height - edgePadding - glowRadius) {
          node.y = canvas.height - edgePadding - glowRadius;
          node.velocity.y *= -1;
        }

        // Z-axis bounce remains the same
        if (node.z < -100 || node.z > 100) node.velocity.z *= -1;

        // Draw node with glow effect
        // Moderate glow size and intensity for subtle mode
        const innerGlowRadius = subtle
          ? displayRadius * 0.4
          : displayRadius * 0.5;
        const outerGlowRadius = subtle
          ? displayRadius * 1.8
          : displayRadius * 2;

        // Outer glow
        const gradient = ctx.createRadialGradient(
          node.x,
          node.y,
          innerGlowRadius,
          node.x,
          node.y,
          outerGlowRadius
        );

        // Moderate transparency steps for subtle mode
        if (subtle) {
          gradient.addColorStop(0, node.color + "60"); // Slightly more visible
          gradient.addColorStop(0.7, node.color + "30"); // Moderate transparency
          gradient.addColorStop(1, node.color + "00");
        } else {
          gradient.addColorStop(0, node.color + "80"); // Semi-transparent
          gradient.addColorStop(1, node.color + "00"); // Transparent
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, outerGlowRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Main node
        ctx.beginPath();
        ctx.arc(node.x, node.y, displayRadius, 0, Math.PI * 2);
        // Adjust opacity value format based on mode
        const opacityHex = Math.round(opacity * 255)
          .toString(16)
          .padStart(2, "0");
        ctx.fillStyle = node.color + opacityHex;
        ctx.fill();
      }

      // Continue animation
      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [contained, subtle]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

<style jsx global>{`
  @keyframes gentle-bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }
  
  .animate-bounce-gentle {
    animation: gentle-bounce 3s ease-in-out infinite;
  }

  @keyframes pulse-slow {
    0%, 100% {
      opacity: 0.7;
    }
    50% {
      opacity: 0.4;
    }
  }
  
  .animate-pulse-slow {
    animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
`}</style>

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface MindMapProps {
  data: any;
  className?: string;
}

interface NodeData {
  name: string;
  description: string;
  understandingLevel?: number;
  studentResponse?: string;
  subtopics?: NodeData[];
  assessmentCriteria?: {
    excellentUnderstanding?: string[];
    adequateUnderstanding?: string[];
    misconceptions?: string[];
    tutorGuidance?: string;
  };
}

interface TreeNode {
  x: number;
  y: number;
  data: NodeData;
  depth: number;
  parent?: TreeNode;
  children?: TreeNode[];
}

interface Link {
  source: TreeNode;
  target: TreeNode;
}

const MindMap: React.FC<MindMapProps> = ({ data, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindmapRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || !data || typeof data !== 'object') return;

    // Clear any existing SVG
    d3.select(containerRef.current).select('svg').remove();

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Create SVG container
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Create a group for the mind map content
    const g = svg.append('g');

    // Set up zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 2])
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        g.attr('transform', event.transform.toString());
      });

    svg.call(zoom);

    // Color scale for understanding levels (Apple-inspired)
    const colorScale: Record<number, string> = {
      0: '#FF3B30', // Red
      1: '#FF9500', // Orange
      2: '#FFCC00', // Yellow
      3: '#34C759', // Green
      4: '#5AC8FA', // Blue
      5: '#007AFF'  // Dark Blue
    };

    // Ensure data has the expected structure before proceeding
    if (!data.topic) {
      // Render a message that data is missing or invalid
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#666')
        .text('Mind map data is missing or invalid');
      return;
    }

    // Create the root node manually to ensure we have a valid node
    const rootNode: TreeNode = {
      x: 0,
      y: 0,
      data: data.topic || { name: "No Data", description: "No data available" },
      depth: 0
    };

    // Set fixed node dimensions
    const nodeWidth = 220;
    const nodeHeight = 120;
    const horizontalSpacing = 350;
    const verticalSpacing = 180;

    // Create children nodes recursively
    function createChildren(
      node: TreeNode, 
      subtopics: NodeData[] | undefined, 
      depth: number
    ): TreeNode[] {
      if (!subtopics || subtopics.length === 0) return [];

      return subtopics.map(subtopic => {
        const child: TreeNode = {
          data: subtopic,
          depth: depth,
          parent: node
        } as TreeNode; // Initialize without x,y which will be set later

        // Recursively create children for this node
        child.children = createChildren(child, subtopic.subtopics, depth + 1);

        return child;
      });
    }

    // Create the tree structure with null check
    rootNode.children = data.topic.subtopics 
      ? createChildren(rootNode, data.topic.subtopics, 1)
      : [];

    // Position all nodes with improved spacing based on subtree size
    function positionNodes(node: TreeNode, x: number, y: number): void {
      // Set node position
      node.x = x;
      node.y = y;

      if (!node.children || node.children.length === 0) return;

      // Calculate subtree sizes to improve spacing
      const getLeafCount = (n: TreeNode): number => {
        if (!n.children || n.children.length === 0) return 1;
        return n.children.reduce((sum, child) => sum + getLeafCount(child), 0);
      };

      // Calculate sizes for each child's subtree
      const childSizes = node.children.map(child => Math.max(1, getLeafCount(child)));
      const totalSize = childSizes.reduce((a, b) => a + b, 0);

      // Calculate total height needed
      const totalHeight = totalSize * verticalSpacing;
      // Start position, centered around parent
      let currentY = x - (totalHeight / 2) + (verticalSpacing / 2);

      // Position each child with spacing proportional to its subtree size
      node.children.forEach((child, i) => {
        const childSpace = childSizes[i] * verticalSpacing;
        const childX = currentY + (childSpace / 2);
        const childY = y + horizontalSpacing;

        positionNodes(child, childX, childY);
        currentY += childSpace;
      });
    }

    // Start positioning from the root
    positionNodes(rootNode, height / 2, 100);

    // Helper function to get all nodes (including all descendants)
    function getAllNodes(root: TreeNode): TreeNode[] {
      if (!root) {
        console.warn('getAllNodes called with undefined root');
        return [];
      }
    
      const nodes: TreeNode[] = [root];
      
      function collectNodes(node: TreeNode) {
        if (!node) return;
        
        if (node.children && node.children.length > 0) {
          node.children.forEach(child => {
            if (child) {
              nodes.push(child);
              collectNodes(child);
            }
          });
        }
      }
      
      collectNodes(root);
      return nodes;
    }

    // Get all nodes for rendering - with error handling
    const allNodes = getAllNodes(rootNode);
    if (allNodes.length === 0) {
      console.error('No nodes available for rendering');
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#666')
        .text('No mind map data available');
      return;
    }

    // Create links
    const links: Link[] = [];
    allNodes.forEach(node => {
      if (node.parent) {
        links.push({
          source: node.parent,
          target: node
        });
      }
    });

    // Render links
    g.selectAll('.link')
      .data(links)
      .join('path')
      .attr('class', 'link')
      .attr('d', d => {
        return `M${d.source.y},${d.source.x}
                C${(d.source.y + d.target.y) / 2},${d.source.x}
                 ${(d.source.y + d.target.y) / 2},${d.target.x}
                 ${d.target.y},${d.target.x}`;
      })
      .attr('fill', 'none')
      .attr('stroke', '#ccc')
      .attr('stroke-width', '1.5px')
      .attr('stroke-dasharray', '3');

    // Render nodes
    const node = g.selectAll('.node')
      .data(allNodes)
      .join('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.y}, ${d.x})`)
      .style('cursor', 'pointer')
      .on('click', function(event, d) {
        event.stopPropagation();
        showPopup(d, event);
      });

    // Add nodes with dynamic sizing based on depth
    node.each(function(d) {
      const el = d3.select(this);

      // Scale factor based on depth - minimum size of 80%
      const scaleFactor = Math.max(0.8, 1 - d.depth * 0.05);
      const width = nodeWidth * scaleFactor;
      const height = nodeHeight * scaleFactor;

      // Add card background
      el.append('rect')
        .attr('class', 'node-card')
        .attr('width', width)
        .attr('height', height)
        .attr('x', -width / 2)
        .attr('y', -height / 2)
        .attr('fill', 'white')
        .attr('rx', '12px')
        .attr('ry', '12px')
        .attr('filter', 'drop-shadow(0 2px 5px rgba(0, 0, 0, 0.1))')
        .attr('stroke', 'rgba(0, 0, 0, 0.05)')
        .attr('stroke-width', '1px');

      // Add title with proper wrapping
      const titleFontSize = 16 * scaleFactor;
      const titlePadding = 18 * scaleFactor;

      // Title container to prevent overflow
      const titleText = d.data.name;
      const titleLines = wrapTextToFit(titleText, width - 24, titleFontSize);

      // Calculate the height needed for the title section
      const titleHeight = titleLines.length * (titleFontSize + 2);

      // Render title lines
      titleLines.forEach((line, i) => {
        el.append('text')
          .attr('class', 'node-title')
          .attr('y', -height / 2 + titlePadding + i * (titleFontSize + 2))
          .attr('font-size', `${titleFontSize}px`)
          .attr('fill', '#333')
          .attr('font-weight', '600')
          .attr('text-anchor', 'middle')
          .text(line);
      });

      // Add description with padding after title
      const desc = d.data.description;
      const descFontSize = 12 * scaleFactor;
      const descriptionPadding = 8 * scaleFactor;

      // Truncate and wrap description
      const truncLength = Math.min(120 * scaleFactor, desc.length);
      const truncatedDesc = desc.length > truncLength
        ? desc.substring(0, truncLength) + '...'
        : desc;

      // Use improved text wrapping function
      const descriptionLines = wrapTextToFit(truncatedDesc, width - 24, descFontSize);

      // Calculate the starting position for description
      const descriptionStartY = -height / 2 + titlePadding + titleHeight + descriptionPadding;

      // Only show up to 3 lines of description
      const maxLines = 3;
      descriptionLines.slice(0, maxLines).forEach((line, i) => {
        el.append('text')
          .attr('class', 'node-description')
          .attr('y', descriptionStartY + i * (descFontSize + 3))
          .attr('font-size', `${descFontSize}px`)
          .attr('fill', '#666')
          .attr('text-anchor', 'middle')
          .text(line);
      });

      // Move the understanding bar to bottom area with more padding
      const bottomPadding = 24 * scaleFactor;
      const barY = height / 2 - bottomPadding;

      // Add understanding bar background
      el.append('rect')
        .attr('class', 'understanding-bar-bg')
        .attr('x', -width / 2 + 20 * scaleFactor)
        .attr('y', barY)
        .attr('width', (width - 40 * scaleFactor))
        .attr('height', 6 * scaleFactor)
        .attr('fill', '#e7e7e7')
        .attr('rx', '2px')
        .attr('ry', '2px');

      // Add understanding bar (if understanding level is available)
      const understandingLevel = d.data.understandingLevel || 0;
      el.append('rect')
        .attr('class', 'understanding-bar')
        .attr('x', -width / 2 + 20 * scaleFactor)
        .attr('y', barY)
        .attr('width', (understandingLevel / 5) * (width - 40 * scaleFactor))
        .attr('height', 6 * scaleFactor)
        .attr('fill', colorScale[understandingLevel])
        .attr('rx', '2px')
        .attr('ry', '2px');

      // Add understanding level text
      el.append('text')
        .attr('class', 'node-understanding')
        .attr('y', barY + 15 * scaleFactor)
        .attr('font-size', `${11 * scaleFactor}px`)
        .attr('fill', '#999')
        .attr('text-anchor', 'middle')
        .text(`Understanding: ${understandingLevel}/5`);
    });

    // Set initial transform - center on root node with better initial scale
    svg.call(
      zoom.transform,
      d3.zoomIdentity
        .translate(width / 2 - rootNode.y, height / 2 - rootNode.x)
        .scale(0.6)
    );

    // Add zoom controls
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'controls';
    controlsContainer.style.cssText = `
      position: absolute;
      bottom: 20px;
      right: 20px;
      display: flex;
      gap: 8px;
      z-index: 100;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(8px);
      padding: 10px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    `;

    const createButton = (text: string, onClick: () => void) => {
      const button = document.createElement('button');
      button.className = 'control-btn';
      button.innerHTML = text;
      button.style.cssText = `
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: none;
        background: #0071e3;
        color: white;
        font-size: 18px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      button.addEventListener('click', onClick);
      return button;
    };

    const zoomInBtn = createButton('+', () => {
      svg.transition().duration(300).call(zoom.scaleBy, 1.3);
    });

    const zoomOutBtn = createButton('−', () => {
      svg.transition().duration(300).call(zoom.scaleBy, 0.7);
    });

    const resetBtn = createButton('↺', () => {
      svg.transition().duration(300).call(
        zoom.transform,
        d3.zoomIdentity
          .translate(width / 2 - rootNode.y, height / 2 - rootNode.x)
          .scale(0.6)
      );
    });

    controlsContainer.appendChild(zoomInBtn);
    controlsContainer.appendChild(zoomOutBtn);
    controlsContainer.appendChild(resetBtn);
    container.appendChild(controlsContainer);

    // Create popup elements
    const popupOverlay = document.createElement('div');
    popupOverlay.id = 'popup-overlay';
    popupOverlay.className = 'popup-overlay';
    popupOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.1);
      z-index: 999;
      display: none;
    `;

    const popup = document.createElement('div');
    popup.id = 'popup';
    popup.className = 'popup';
    popup.style.cssText = `
      position: fixed;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
      padding: 20px;
      max-width: 600px;
      width: 90%;
      z-index: 1000;
      display: none;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      max-height: 80vh;
      overflow-y: auto;
    `;

    popup.innerHTML = `
      <div id="popup-close" class="popup-close" style="
        position: absolute;
        top: 12px;
        right: 12px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #f2f2f2;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 20px;
        line-height: 1;
      ">×</div>
      <div class="popup-title" id="popup-title" style="
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 10px;
        padding-right: 20px;
      "></div>
      
      <div class="popup-section" style="margin-bottom: 15px;">
        <div class="popup-label" style="
          font-weight: 500;
          color: #555;
          margin-bottom: 5px;
        ">Description:</div>
        <div class="popup-text" id="popup-description" style="
          line-height: 1.4;
          margin-bottom: 10px;
        "></div>
      </div>
      
      <div class="popup-section" id="popup-response-section" style="margin-bottom: 15px;">
        <div class="popup-label" style="
          font-weight: 500;
          color: #555;
          margin-bottom: 5px;
        ">Student Response:</div>
        <div class="popup-text" id="popup-response" style="
          line-height: 1.4;
          margin-bottom: 10px;
        "></div>
      </div>
      
      <div class="popup-understanding" style="
        display: flex;
        align-items: center;
        margin-top: 15px;
      ">
        <span id="popup-level-text">Understanding: 0/5</span>
        <div class="popup-dots" id="popup-dots" style="
          display: flex;
          margin-left: 10px;
        "></div>
      </div>
    `;

    container.appendChild(popupOverlay);
    container.appendChild(popup);

    // Popup functionality
    let currentPopupNode = null;

    function showPopup(d: TreeNode, event: MouseEvent) {
      const popupTitle = document.getElementById('popup-title');
      const popupDescription = document.getElementById('popup-description');
      const responseSection = document.getElementById('popup-response-section');
      const popupResponse = document.getElementById('popup-response');
      const popupLevelText = document.getElementById('popup-level-text');
      const dotsContainer = document.getElementById('popup-dots');
      
      if (!popupTitle || !popupDescription || !responseSection || 
          !popupResponse || !popupLevelText || !dotsContainer) {
        console.error('Popup DOM elements not found');
        return;
      }
      
      // Set popup content
      popupTitle.textContent = d.data?.name || 'Unnamed Topic';
      popupDescription.textContent = d.data?.description || 'No description available';
      
      // Check if there's a response
      if (d.data?.studentResponse) {
        popupResponse.textContent = d.data.studentResponse;
        responseSection.style.display = 'block';
      } else {
        responseSection.style.display = 'none';
      }
      
      // Set understanding level
      const understandingLevel = d.data?.understandingLevel || 0;
      popupLevelText.textContent = `Understanding: ${understandingLevel}/5`;
      
      // Create dots for understanding level
      dotsContainer.innerHTML = '';
      
      for (let i = 0; i < 5; i++) {
        const dot = document.createElement('div');
        dot.className = 'popup-dot';
        dot.style.cssText = `
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-right: 5px;
          background-color: ${i < understandingLevel ? colorScale[understandingLevel] : '#e0e0e0'};
        `;
        dotsContainer.appendChild(dot);
      }
      
      // Show popup and overlay
      const popup = document.getElementById('popup');
      const popupOverlay = document.getElementById('popup-overlay');
      
      if (popup && popupOverlay) {
        popup.style.display = 'block';
        popupOverlay.style.display = 'block';
      }
      
      // Store current node
      currentPopupNode = d;
    }

    function closePopup() {
      const popup = document.getElementById('popup');
      const popupOverlay = document.getElementById('popup-overlay');
      
      if (popup) {
        popup.style.display = 'none';
      }
      
      if (popupOverlay) {
        popupOverlay.style.display = 'none';
      }
      
      currentPopupNode = null;
    }

    // Set up popup close events
    document.getElementById('popup-close').addEventListener('click', closePopup);
    popupOverlay.addEventListener('click', closePopup);

    // Close popup on ESC key
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape') {
        closePopup();
      }
    });

    // Store the references for cleanup
    mindmapRef.current = {
      zoom,
      svg,
      container,
      controlsContainer,
      popup,
      popupOverlay
    };

    // Handle window resize
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;

      svg.attr('width', newWidth)
         .attr('height', newHeight);

      svg.transition().duration(300).call(
        zoom.transform,
        d3.zoomIdentity
          .translate(newWidth / 2 - rootNode.y, newHeight / 2 - rootNode.x)
          .scale(0.6)
      );
    };

    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mindmapRef.current) {
        container.removeChild(mindmapRef.current.controlsContainer);
        container.removeChild(mindmapRef.current.popup);
        container.removeChild(mindmapRef.current.popupOverlay);
      }
    };
  }, [data]);

  return (
    <div 
      ref={containerRef} 
      className={`mindmap-container ${className}`}
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'relative'
      }}
    >
      <style jsx>{`
        .mindmap-container :global(.link) {
          fill: none;
          stroke: #ccc;
          stroke-width: 1.5px;
          stroke-dasharray: 3;
          pointer-events: none;
        }

        .mindmap-container :global(.node) {
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .mindmap-container :global(.node:hover .node-card) {
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
          transform: translateY(-2px);
        }

        .mindmap-container :global(.popup-overlay.visible),
        .mindmap-container :global(.popup.visible) {
          display: block;
        }
      `}</style>
    </div>
  );
};

// Improved text wrapping function for better containment
function wrapTextToFit(text: string, maxWidth: number, fontSize: number): string[] {
  // Handle edge cases
  if (!text) return [];
  if (maxWidth <= 0 || fontSize <= 0) return [text];
  
  // Approximate character width based on font size
  const charWidth = fontSize * 0.6;
  const maxCharsPerLine = Math.floor(maxWidth / charWidth);
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";
  
  // Handle long words that need breaking
  for (let i = 0; i < words.length; i++) {
    let word = words[i];
    
    // If a single word is too long, break it
    if (word.length > maxCharsPerLine) {
      // If the current line isn't empty, push it first
      if (currentLine) {
        lines.push(currentLine);
        currentLine = "";
      }
      
      // Break the long word across multiple lines
      while (word.length > maxCharsPerLine) {
        lines.push(word.substring(0, maxCharsPerLine - 1) + "-");
        word = word.substring(maxCharsPerLine - 1);
      }
      
      // Set the remaining part as the current line
      currentLine = word;
    } else {
      // Normal word handling
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length > maxCharsPerLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
  }
  
  // Don't forget the last line
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

export default MindMap; 
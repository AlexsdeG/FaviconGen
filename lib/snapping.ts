import { Layer, CanvasConfig, SnappingOptions } from '../types';
import Konva from 'konva';

export interface Guide {
  orientation: 'v' | 'h';
  position: number;
}

export interface SnapResult {
  x: number;
  y: number;
  guides: Guide[];
}

export const getGuides = (
  lineGuideStops: Record<string, number[]>,
  itemBounds: { start: number; center: number; end: number },
  orientation: 'v' | 'h'
) => {
  const result: { lineGuide: number; diff: number; snap: number; offset: number }[] = [];
  
  // Checking for close matches
  // orientation 'v' means vertical lines (x-axis positions)
  // orientation 'h' means horizontal lines (y-axis positions)
  
  // We check start (left/top), center, and end (right/bottom) of item against stops
  const boundsKeys = ['start', 'center', 'end'] as const;
  
  boundsKeys.forEach((key) => {
      const boundVal = itemBounds[key];
      const stops = lineGuideStops[key];
      
      stops.forEach((stopVal) => {
          const diff = Math.abs(boundVal - stopVal);
          if (diff < 10) { // Hardcoded 10px snap distance for now, or use options
              result.push({
                  lineGuide: stopVal,
                  diff: diff,
                  snap: stopVal,
                  offset: boundVal - stopVal,
              });
          }
      });
  });

  return result;
};


// Helper to get snap stops (extracted for reuse)
export const getSnapStops = (
    otherLayers: Layer[],
    canvasConfig: CanvasConfig,
    options: SnappingOptions // We just need options to check enabled flags
): { vertical: Record<string, number[]>; horizontal: Record<string, number[]> } => {
    const verticalStops: { [key: string]: number[] } = {
        start: [],
        center: [],
        end: []
    };
    const horizontalStops: { [key: string]: number[] } = {
        start: [],
        center: [],
        end: []
    };

    // Canvas Edge/Center Snapping
    if (options.canvas) {
        // Vertical Lines (X)
        verticalStops.start.push(0); // Left edge of canvas
        verticalStops.center.push(canvasConfig.width / 2);
        verticalStops.end.push(canvasConfig.width);
        
        // Horizontal Lines (Y)
        horizontalStops.start.push(0);
        horizontalStops.center.push(canvasConfig.height / 2);
        horizontalStops.end.push(canvasConfig.height);
    }

    // Object Snapping
    if (options.objects) {
        otherLayers.forEach(layer => {
            const lx = layer.x;
            const ly = layer.y;
            const lw = layer.width * layer.scaleX;
            const lh = layer.height * layer.scaleY;
            
            const isCenterAnchored = layer.offsetX !== 0; 
            
            let lLeft, lCenter, lRight;
            let lTop, lMid, lBottom;

            if (isCenterAnchored) {
                 lCenter = lx;
                 lLeft = lx - (layer.offsetX * layer.scaleX);
                 lRight = lx + (layer.width * layer.scaleX) - (layer.offsetX * layer.scaleX);
                 
                 lMid = ly;
                 lTop = ly - (layer.offsetY * layer.scaleY);
                 lBottom = ly + (layer.height * layer.scaleY) - (layer.offsetY * layer.scaleY);
            } else {
                 lLeft = lx;
                 lCenter = lx + lw / 2;
                 lRight = lx + lw;
                 
                 lTop = ly;
                 lMid = ly + lh / 2;
                 lBottom = ly + lh;
            }

            verticalStops.start.push(lLeft);
            verticalStops.center.push(lCenter);
            verticalStops.end.push(lRight);
            
            horizontalStops.start.push(lTop);
            horizontalStops.center.push(lMid);
            horizontalStops.end.push(lBottom);
        });
    }

    return { vertical: verticalStops, horizontal: horizontalStops };
};

// New function for resizing snap
export const snapBox = (
    newBox: { x: number; y: number; width: number; height: number },
    oldBox: { x: number; y: number; width: number; height: number },
    snapStops: { vertical: Record<string, number[]>; horizontal: Record<string, number[]> },
    options: SnappingOptions
): { x: number; y: number; width: number; height: number; guides: Guide[] } => {
    if (!options.enabled) return { ...newBox, guides: [] };

    const guides: Guide[] = [];
    const threshold = options.threshold || 5;

    // Determine which edges are moving
    // Epsilon for float comparison
    const EPSILON = 0.001;
    
    // Check if X changed (Left edge moved)
    const leftMoved = Math.abs(newBox.x - oldBox.x) > EPSILON;
    // Check if Y changed (Top edge moved)
    const topMoved = Math.abs(newBox.y - oldBox.y) > EPSILON;
    // Check if Right edge moved (x + w)
    const rightMoved = Math.abs((newBox.x + newBox.width) - (oldBox.x + oldBox.width)) > EPSILON;
    // Check if Bottom edge moved (y + h)
    const bottomMoved = Math.abs((newBox.y + newBox.height) - (oldBox.y + oldBox.height)) > EPSILON;

    // If nothing moved (unlikely in boundBoxFunc), just return
    if (!leftMoved && !topMoved && !rightMoved && !bottomMoved) return { ...newBox, guides: [] };

    // Prepare Stops
    const verticalStops = { ...snapStops.vertical, start: [...snapStops.vertical.start], center: [...snapStops.vertical.center], end: [...snapStops.vertical.end] };
    const horizontalStops = { ...snapStops.horizontal, start: [...snapStops.horizontal.start], center: [...snapStops.horizontal.center], end: [...snapStops.horizontal.end] };

    // Add Grid Stops
    if (options.grid && options.gridSize > 0) {
        const gridSize = options.gridSize;
        const getNearestSnap = (val: number) => Math.round(val / gridSize) * gridSize;

        // Add stops relevant to the moving edges?
        // Or just add nearest for newBox
        verticalStops.start.push(getNearestSnap(newBox.x));
        verticalStops.end.push(getNearestSnap(newBox.x + newBox.width));
        
        horizontalStops.start.push(getNearestSnap(newBox.y));
        horizontalStops.end.push(getNearestSnap(newBox.y + newBox.height));
    }

    // Check Snaps
    const currentBoundsX = {
        start: newBox.x,
        center: newBox.x + newBox.width / 2,
        end: newBox.x + newBox.width
    };
    
    const currentBoundsY = {
        start: newBox.y,
        center: newBox.y + newBox.height / 2,
        end: newBox.y + newBox.height
    };

    const xSnaps = getGuides(verticalStops, currentBoundsX, 'v');
    const ySnaps = getGuides(horizontalStops, currentBoundsY, 'h');
    
    xSnaps.sort((a, b) => a.diff - b.diff);
    ySnaps.sort((a, b) => a.diff - b.diff);

    let finalX = newBox.x;
    let finalWidth = newBox.width;
    let finalY = newBox.y;
    let finalHeight = newBox.height;

    // Apply Snapping INTELLIGENTLY
    // Iterate through sorted snaps to find the first ACTIONABLE one.
    // (i.e., one that affects a moving edge).
    
    // Apply best X snap
    for (const snap of xSnaps) {
        if (snap.diff > threshold) break; // Sorted, so we can stop
        
        const stop = snap.lineGuide;
        let applied = false;
        
        // Check which part matched and if it is allowed to move
        // Note: A snap might match multiple bounds if object size is 0 or bounds overlap, 
        // but sorting is by diff, so we check diff again to be sure which one this 'snap' object refers to?
        // Actually 'snap' object IS specific to a value. 
        // getGuides returns { lineGuide, diff, snap, offset }. 
        // It doesn't say which bound generated it.
        // So we re-check distance to bounds.
        
        // Start (Left) Match
        if (Math.abs(currentBoundsX.start - stop) <= threshold) {
             if (leftMoved) {
                 if (!rightMoved) {
                     // Right Anchored
                     const anchoredRight = oldBox.x + oldBox.width;
                     finalX = stop;
                     finalWidth = anchoredRight - finalX;
                 } else {
                     // Both moved (center scale) or resize logic
                     finalX = stop;
                     // If we strictly snap X, and don't touch Width, Right Edge shifts.
                     // Standard behavior for center scale? 
                     // Let's stick to standard behavior: simply snap position.
                 }
                 guides.push({ orientation: 'v', position: stop });
                 applied = true;
             }
        }
        
        // End (Right) Match
        // Use 'else if' or just 'if'? 
        // If both Start and End match the SAME stop (width=0), we can apply either.
        // If valid, apply and break.
        if (!applied && Math.abs(currentBoundsX.end - stop) <= threshold) {
             if (rightMoved) {
                 if (!leftMoved) {
                     // Left Anchored
                     finalWidth = stop - finalX;
                 } else {
                     // Both moved
                     // Adjust Width to snap right edge, X stays?
                     // Or adjust X?
                     // If we adjust Width, and X moves, Right edge moves.
                     // X is already "newBox.x" (moving).
                     // finalWidth = stop - finalX;
                     finalWidth = stop - finalX;
                 }
                 guides.push({ orientation: 'v', position: stop });
                 applied = true;
             }
        }
        
        // Center Match
        if (!applied && Math.abs(currentBoundsX.center - stop) <= threshold) {
             if (leftMoved && rightMoved) {
                 const shift = stop - (finalX + finalWidth/2);
                 finalX += shift;
                 guides.push({ orientation: 'v', position: stop });
                 applied = true;
             }
        }
        
        if (applied) break; // Found the best actionable snap
    }
    
    // Apply best Y snap
    for (const snap of ySnaps) {
        if (snap.diff > threshold) break;
        
        const stop = snap.lineGuide;
        let applied = false;
        
        if (Math.abs(currentBoundsY.start - stop) <= threshold) {
             if (topMoved) {
                 if (!bottomMoved) { // Bottom Anchored
                     const anchoredBottom = oldBox.y + oldBox.height;
                     finalY = stop;
                     finalHeight = anchoredBottom - finalY;
                 } else {
                     finalY = stop;
                 }
                 guides.push({ orientation: 'h', position: stop });
                 applied = true;
             }
        } 
        
        if (!applied && Math.abs(currentBoundsY.end - stop) <= threshold) {
             if (bottomMoved) {
                 if (!topMoved) { // Top Anchored
                     finalHeight = stop - finalY;
                 } else {
                     finalHeight = stop - finalY;
                 }
                 guides.push({ orientation: 'h', position: stop });
                 applied = true;
             }
        } 
        
        if (!applied && Math.abs(currentBoundsY.center - stop) <= threshold) {
             if (topMoved && bottomMoved) {
                 const shift = stop - (finalY + finalHeight/2);
                 finalY += shift;
                 guides.push({ orientation: 'h', position: stop });
                 applied = true;
             }
        }
        
        if (applied) break;
    }

    return {
        x: finalX,
        y: finalY,
        width: Math.abs(finalWidth), // Ensure positive width
        height: Math.abs(finalHeight),
        guides
    };
};

export const calculateSnap = (
  node: Konva.Node,
  otherLayers: Layer[],
  canvasConfig: CanvasConfig,
  options: SnappingOptions
): SnapResult => {
    // If snapping disabled, return current position
    if (!options.enabled) {
        return { x: node.x(), y: node.y(), guides: [] };
    }

    // Current node bounds
    const box = node.getClientRect({ relativeTo: node.getParent() });
    
    // We assume rotation 0 for translation snapping usually.
    const width = box.width;
    const height = box.height;

    // 1. Get Stops
    const stops = getSnapStops(otherLayers, canvasConfig, options);
    
    // 2. Add dynamic grid stops based on current box position (calculateSnap logic handles this inside or we allow getSnapStops to do it?)
    // In original code, grid stops were added based on box position. 
    // Let's manually add them here to match original behavior using the same logic.
    if (options.grid && options.gridSize > 0) {
        const gridSize = options.gridSize;
        const getNearestSnap = (val: number) => Math.round(val / gridSize) * gridSize;
        
        stops.vertical.start.push(getNearestSnap(box.x));
        stops.vertical.center.push(getNearestSnap(box.x + width / 2));
        stops.vertical.end.push(getNearestSnap(box.x + width));
        
        stops.horizontal.start.push(getNearestSnap(box.y));
        stops.horizontal.center.push(getNearestSnap(box.y + height / 2));
        stops.horizontal.end.push(getNearestSnap(box.y + height));
    }

    // 3. Find Snaps
    const currentBoundsX = {
        start: box.x,
        center: box.x + width / 2,
        end: box.x + width
    };
    const currentBoundsY = {
        start: box.y,
        center: box.y + height / 2,
        end: box.y + height
    };

    const xSnaps = getGuides(stops.vertical, currentBoundsX, 'v');
    const ySnaps = getGuides(stops.horizontal, currentBoundsY, 'h');
    
    xSnaps.sort((a, b) => a.diff - b.diff);
    ySnaps.sort((a, b) => a.diff - b.diff);
    
    let snappedX = box.x;
    let snappedY = box.y;
    const guides: Guide[] = [];

    if (xSnaps.length > 0) {
        const best = xSnaps[0];
        if (best.diff <= options.threshold) {
             snappedX = box.x - best.offset;
             guides.push({ orientation: 'v', position: best.lineGuide });
        }
    }
    
    if (ySnaps.length > 0) {
        const best = ySnaps[0];
        if (best.diff <= options.threshold) {
            snappedY = box.y - best.offset;
            guides.push({ orientation: 'h', position: best.lineGuide });
        }
    }

    const nodeX = snappedX + (node.offsetX() * node.scaleX());
    const nodeY = snappedY + (node.offsetY() * node.scaleY());
    
    return {
        x: nodeX,
        y: nodeY,
        guides
    };
};

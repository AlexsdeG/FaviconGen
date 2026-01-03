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
    options: SnappingOptions,
    keepRatio: boolean = true
): { x: number; y: number; width: number; height: number; guides: Guide[] } => {
    if (!options.enabled) return { ...newBox, guides: [] };

    const guides: Guide[] = [];
    const threshold = options.threshold || 5;

    // Determine which edges are moving
    const EPSILON = 0.001;
    const leftMoved = Math.abs(newBox.x - oldBox.x) > EPSILON;
    const topMoved = Math.abs(newBox.y - oldBox.y) > EPSILON;
    const rightMoved = Math.abs((newBox.x + newBox.width) - (oldBox.x + oldBox.width)) > EPSILON;
    const bottomMoved = Math.abs((newBox.y + newBox.height) - (oldBox.y + oldBox.height)) > EPSILON;

    // If nothing moved, just return
    if (!leftMoved && !topMoved && !rightMoved && !bottomMoved) return { ...newBox, guides: [] };

    const verticalStops = { ...snapStops.vertical, start: [...snapStops.vertical.start], center: [...snapStops.vertical.center], end: [...snapStops.vertical.end] };
    const horizontalStops = { ...snapStops.horizontal, start: [...snapStops.horizontal.start], center: [...snapStops.horizontal.center], end: [...snapStops.horizontal.end] };

    // Grid Stops removed for resizing as per request.
    // relying only on passed 'snapStops' which handles Canvas/Object bounds.

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

    // Ratio Calculation
    const aspectRatio = oldBox.width / oldBox.height;

    // Apply Snapping
    // We need to know which dimension "wins" if both snap.
    // Usually, the closest snap wins.

    let bestXSnap: { stop: number, type: 'start' | 'end' | 'center' } | null = null;
    let bestYSnap: { stop: number, type: 'start' | 'end' | 'center' } | null = null;

    // Evaluate X Snaps
    for (const snap of xSnaps) {
        if (snap.diff > threshold) break;
        const stop = snap.lineGuide;

        // Logic to determine if this snap is valid for the moving edges
        if (Math.abs(currentBoundsX.start - stop) <= threshold && leftMoved) {
            bestXSnap = { stop, type: 'start' };
            break;
        } else if (Math.abs(currentBoundsX.end - stop) <= threshold && rightMoved) {
            bestXSnap = { stop, type: 'end' };
            break;
        } else if (Math.abs(currentBoundsX.center - stop) <= threshold && (leftMoved || rightMoved)) {
            bestXSnap = { stop, type: 'center' };
            break;
        }
    }

    // Evaluate Y Snaps
    for (const snap of ySnaps) {
        if (snap.diff > threshold) break;
        const stop = snap.lineGuide;

        if (Math.abs(currentBoundsY.start - stop) <= threshold && topMoved) {
            bestYSnap = { stop, type: 'start' };
            break;
        } else if (Math.abs(currentBoundsY.end - stop) <= threshold && bottomMoved) {
            bestYSnap = { stop, type: 'end' };
            break;
        } else if (Math.abs(currentBoundsY.center - stop) <= threshold && (topMoved || bottomMoved)) {
            bestYSnap = { stop, type: 'center' };
            break;
        }
    }

    // Apply X Snap
    if (bestXSnap) {
        const { stop, type } = bestXSnap;
        let appliedX = false;

        if (type === 'start') {
            const anchoredRight = oldBox.x + oldBox.width;
            // If resizing left, X changes, width changes.
            // But if we are Center Scaling (left and right moved), anchored point is center?
            // Assuming corner drag standard:
            if (rightMoved) { // Both moving, e.g. center scale
                // Complex... usually center scale keeps center fixed. Or we just snap left.
                // If we snap left, and right is also moving freely, we stretch.
                // For now assume standard resize logic.
                finalX = stop;
                finalWidth = newBox.width + (newBox.x - stop); // Adjust width by delta
            } else {
                // Left drag, Right anchor
                finalX = stop;
                finalWidth = anchoredRight - finalX;
            }
            appliedX = true;
        } else if (type === 'end') {
            if (leftMoved) {
                // Both moving
                finalWidth = stop - finalX; // X unchanged (from newBox perspective)
            } else {
                // Right drag, Left anchor
                finalWidth = stop - oldBox.x;
            }
            appliedX = true;
        } else if (type === 'center') {
            // Center Snap
            if (leftMoved && rightMoved) {
                // Shift both
                const shift = stop - (finalX + finalWidth / 2);
                finalX += shift;
                appliedX = true;
            } else if (leftMoved) {
                // Adjust Left to align center. Right Anchored.
                // NewCenter = stop. Right = anchoredRight.
                // (L + R)/2 = stop => L = 2*stop - R
                const anchoredRight = oldBox.x + oldBox.width;
                finalX = 2 * stop - anchoredRight;
                finalWidth = anchoredRight - finalX;
                appliedX = true;
            } else if (rightMoved) {
                // Adjust Right to align center. Left Anchored.
                // R = 2*stop - L
                const anchoredLeft = oldBox.x;
                finalWidth = (2 * stop - anchoredLeft) - anchoredLeft + anchoredLeft; // Wait. w = R - L
                finalWidth = (2 * stop - anchoredLeft) - anchoredLeft;
                appliedX = true;
            }
        }

        if (appliedX) {
            guides.push({ orientation: 'v', position: stop });
            if (keepRatio) {
                // Adjust Height to match new Width
                // Avoid flipping
                if (finalWidth < 0) finalWidth = -finalWidth;
                finalHeight = finalWidth / aspectRatio;

                // We need to adjust Y as well if we are scaling from center or corner?
                // If topMoved, we adjust top. If bottomMoved, adjust bottom.
                // If both (center), adjust both.

                if (topMoved && bottomMoved) {
                    const cy = oldBox.y + oldBox.height / 2;
                    finalY = cy - finalHeight / 2;
                } else if (topMoved) {
                    const bottom = oldBox.y + oldBox.height;
                    finalY = bottom - finalHeight;
                } else {
                    // Top anchored or just changing height downwards
                    // finalY stays same (oldBox.y)
                }
            }
        }
    }

    // Apply Y Snap (Only if X didn't enforce a ratio change? Or if Y snap is "stronger"?)
    // If keepRatio is true, we can only satisfy ONE snap direction fully, unless we are lucky.
    // We should pick the 'best' snap.
    // For now, if we applied X snap and keepRatio is true, we skip Y snap calculation to avoid conflict,
    // OR we check if Y snap is also valid for the NEW height?
    // Let's implement: If X applied and keepRatio, Skip Y. (X dominates).
    // Unless X didn't apply.

    if (bestYSnap && (!keepRatio || !bestXSnap)) {
        const { stop, type } = bestYSnap;
        let appliedY = false;

        if (type === 'start') {
            if (bottomMoved) {
                finalY = stop;
                finalHeight = newBox.height + (newBox.y - stop);
            } else {
                const anchoredBottom = oldBox.y + oldBox.height;
                finalY = stop;
                finalHeight = anchoredBottom - finalY;
            }
            appliedY = true;
        } else if (type === 'end') {
            if (topMoved) {
                finalHeight = stop - finalY;
            } else {
                finalHeight = stop - oldBox.y;
            }
            appliedY = true;
        } else if (type === 'center') {
            if (topMoved && bottomMoved) {
                const shift = stop - (finalY + finalHeight / 2);
                finalY += shift;
                appliedY = true;
            } else if (topMoved) {
                const anchoredBottom = oldBox.y + oldBox.height;
                finalY = 2 * stop - anchoredBottom;
                finalHeight = anchoredBottom - finalY;
                appliedY = true;
            } else if (bottomMoved) {
                const anchoredTop = oldBox.y;
                finalHeight = (2 * stop - anchoredTop) - anchoredTop;
                appliedY = true;
            }
        }

        if (appliedY) {
            guides.push({ orientation: 'h', position: stop });
            if (keepRatio && !bestXSnap) { // If X didn't drive the ratio
                // Adjust Width to match new Height
                if (finalHeight < 0) finalHeight = -finalHeight;
                finalWidth = finalHeight * aspectRatio;

                if (leftMoved && rightMoved) {
                    const cx = oldBox.x + oldBox.width / 2;
                    finalX = cx - finalWidth / 2;
                } else if (leftMoved) {
                    const right = oldBox.x + oldBox.width;
                    finalX = right - finalWidth;
                }
            }
        }
    }

    return {
        x: finalX,
        y: finalY,
        width: Math.abs(finalWidth),
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

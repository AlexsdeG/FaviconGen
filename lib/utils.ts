import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Calculates start and end points for a linear gradient based on angle.
 * Angle 0 is Top-to-Bottom (standard CSS is different, but for Konva/Canvas usually 0 is Right).
 * Let's map CSS degrees: 0deg = Bottom to Top, 90deg = Left to Right, 180deg = Top to Bottom.
 * Konva defaults: Usually just points.
 * 
 * We will assume standard CSS-like angle:
 * 0deg: Bottom -> Top
 * 90deg: Left -> Right
 * 180deg: Top -> Bottom
 * 270deg: Right -> Left
 */
export function getLinearGradientPoints(angleDeg: number, width: number, height: number) {
    // Convert CSS angle (0 is Up, 90 is Right) to Math radians (0 is Right, 90 is Down)
    // 0 deg -> -90 deg (Up)
    // 90 deg -> 0 deg (Right)
    // 180 deg -> 90 deg (Down)
    const rad = (angleDeg - 90) * (Math.PI / 180);
    
    const r = Math.sqrt(width * width + height * height) / 2;
    
    const cx = width / 2;
    const cy = height / 2;
    
    // Calculate end point from center
    // Adjusting so that angle represents visual direction
    const x = cx + r * Math.cos(rad);
    const y = cy + r * Math.sin(rad);
    
    // Start point is opposite
    const sx = cx - r * Math.cos(rad);
    const sy = cy - r * Math.sin(rad);

    return {
        start: { x: sx, y: sy },
        end: { x, y }
    };
}
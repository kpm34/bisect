
import { Point, PathData, ShapeType } from '../lib/types/types';

// Convert an array of points to a standard SVG path string using straight lines
export const pointsToLinedPath = (points: Point[]): string => {
  if (points.length === 0) return '';
  const d = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
  return d;
};

// Calculate squared distance from a point p to the line segment p1-p2
export const getSqSegDist = (p: Point, p1: Point, p2: Point) => {
  let x = p1.x, y = p1.y, dx = p2.x - x, dy = p2.y - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) { x = p2.x; y = p2.y; }
    else if (t > 0) { x += dx * t; y += dy * t; }
  }
  return (p.x - x) ** 2 + (p.y - y) ** 2;
};

// Calculate distance from point to path (min distance to any segment)
export const getDistanceToPath = (point: Point, pathPoints: Point[]): number => {
  if (pathPoints.length < 2) return Infinity;
  let minSqDist = Infinity;
  for (let i = 0; i < pathPoints.length - 1; i++) {
    const d = getSqSegDist(point, pathPoints[i], pathPoints[i+1]);
    if (d < minSqDist) minSqDist = d;
  }
  return Math.sqrt(minSqDist);
};

export const getBoundingBox = (points: Point[]) => {
  if (points.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
};

// Get bounding box for multiple paths combined
export const getCombinedBoundingBox = (paths: PathData[]) => {
  const allPoints = paths.flatMap(p => p.points);
  return getBoundingBox(allPoints);
};

export const rotatePoint = (point: Point, center: Point, angleRad: number): Point => {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + (dx * cos - dy * sin),
    y: center.y + (dx * sin + dy * cos)
  };
};

export const scalePoint = (point: Point, origin: Point, scaleX: number, scaleY: number): Point => {
  return {
    x: origin.x + (point.x - origin.x) * scaleX,
    y: origin.y + (point.y - origin.y) * scaleY
  };
};

// Canvas context cache for accurate text measurement
let measureCanvas: HTMLCanvasElement | null = null;
let measureContext: CanvasRenderingContext2D | null = null;

// Get accurate text dimensions using Canvas API
export const getTextDimensions = (text: string, fontSize: number, fontFamily: string) => {
  // Lazily create canvas for text measurement
  if (!measureCanvas) {
    measureCanvas = document.createElement('canvas');
    measureContext = measureCanvas.getContext('2d');
  }

  if (measureContext) {
    measureContext.font = `${fontSize}px ${fontFamily}`;
    const metrics = measureContext.measureText(text);
    return {
      width: metrics.width,
      height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent || fontSize
    };
  }

  // Fallback if canvas context not available
  const avgCharWidth = fontSize * 0.6;
  const width = text.length * avgCharWidth;
  const height = fontSize;
  return { width, height };
};

export const isPointInPolygon = (point: Point, vs: Point[]) => {
    // ray-casting algorithm
    const x = point.x, y = point.y;
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i].x, yi = vs[i].y;
        const xj = vs[j].x, yj = vs[j].y;
        
        const intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

// Check if path intersects rect (simplified: check bounds overlap)
export const isPathInRect = (pathPoints: Point[], rect: {x: number, y: number, w: number, h: number}) => {
    const bounds = getBoundingBox(pathPoints);
    const rRight = rect.x + rect.w;
    const rBottom = rect.y + rect.h;
    const bRight = bounds.x + bounds.w;
    const bBottom = bounds.y + bounds.h;
    
    // No intersection
    if (bounds.x > rRight || bRight < rect.x || bounds.y > rBottom || bBottom < rect.y) return false;
    
    return true;
};

// Circle-Segment intersection
// Returns t values [0, 1] where intersection occurs
const getCircleSegmentIntersections = (
  p1: Point,
  p2: Point,
  center: Point,
  radius: number
): number[] => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const a = dx * dx + dy * dy;
  const b = 2 * (dx * (p1.x - center.x) + dy * (p1.y - center.y));
  const c = (p1.x - center.x) ** 2 + (p1.y - center.y) ** 2 - radius * radius;

  const det = b * b - 4 * a * c;
  if (det < 0) return []; // No intersection

  const t1 = (-b - Math.sqrt(det)) / (2 * a);
  const t2 = (-b + Math.sqrt(det)) / (2 * a);

  const intersections: number[] = [];
  if (t1 >= 0 && t1 <= 1) intersections.push(t1);
  if (t2 >= 0 && t2 <= 1) intersections.push(t2);
  
  return intersections.sort((a, b) => a - b);
};

// Ramer-Douglas-Peucker simplification algorithm
const simplifyPoints = (points: Point[], tolerance: number): Point[] => {
  if (points.length <= 2) return points;
  const sqTolerance = tolerance * tolerance;
  
  let maxSqDist = 0;
  let index = 0;
  
  for (let i = 1; i < points.length - 1; i++) {
    const sqDist = getSqSegDist(points[i], points[0], points[points.length - 1]);
    if (sqDist > maxSqDist) {
      maxSqDist = sqDist;
      index = i;
    }
  }
  
  if (maxSqDist > sqTolerance) {
    const left = simplifyPoints(points.slice(0, index + 1), tolerance);
    const right = simplifyPoints(points.slice(index), tolerance);
    return [...left.slice(0, -1), ...right];
  }
  
  return [points[0], points[points.length - 1]];
};

// Moving average smoothing to reduce jitter while preserving general form
const smoothPointsAverage = (points: Point[], iterations: number): Point[] => {
  if (points.length < 3) return points;
  if (iterations <= 0) return points;

  let currentPoints = [...points];
  
  for (let iter = 0; iter < iterations; iter++) {
    const nextPoints = [currentPoints[0]]; // Keep start
    
    for (let i = 1; i < currentPoints.length - 1; i++) {
      const prev = currentPoints[i - 1];
      const curr = currentPoints[i];
      const next = currentPoints[i + 1];
      
      // Weighted average (Gaussian-like kernel)
      nextPoints.push({
        x: 0.25 * prev.x + 0.5 * curr.x + 0.25 * next.x,
        y: 0.25 * prev.y + 0.5 * curr.y + 0.25 * next.y
      });
    }
    
    nextPoints.push(currentPoints[currentPoints.length - 1]); // Keep end
    currentPoints = nextPoints;
  }
  
  return currentPoints;
};

// Convert an array of points to a smoothed Quadratic Bezier SVG path string
export const pointsToSmoothedPath = (points: Point[], smoothingFactor: number = 0): string => {
  if (points.length < 2) return '';

  // If smoothing is explicitly 0 (used for Geometric Shapes), return straight lines.
  if (smoothingFactor === 0) {
    return pointsToLinedPath(points);
  }

  let processingPoints = points;

  if (smoothingFactor > 0) {
    // 1. Apply Moving Average Smoothing
    const iterations = Math.ceil(smoothingFactor);
    processingPoints = smoothPointsAverage(processingPoints, iterations);

    // 2. Apply Simplification (RDP)
    const tolerance = 0.5 + (smoothingFactor * 0.1);
    processingPoints = simplifyPoints(processingPoints, tolerance);
  }

  if (processingPoints.length < 2) return '';
  if (processingPoints.length === 2) return pointsToLinedPath(processingPoints);

  // 3. Generate Quadratic Bezier Curves through midpoints
  const first = processingPoints[0];
  let d = `M ${first.x} ${first.y}`;

  for (let i = 1; i < processingPoints.length - 1; i++) {
    const p0 = processingPoints[i];
    const p1 = processingPoints[i + 1];
    const midX = (p0.x + p1.x) / 2;
    const midY = (p0.y + p1.y) / 2;
    d += ` Q ${p0.x} ${p0.y} ${midX} ${midY}`;
  }

  // Link the last two points
  const last = processingPoints[processingPoints.length - 1];
  d += ` L ${last.x} ${last.y}`;

  return d;
};

// Convert an array of points to a Cubic Bezier SVG path string
// Uses Catmull-Rom spline algorithm for smoother curves
export const pointsToCubicPath = (points: Point[], tension: number = 0.5): string => {
  if (points.length < 2) return '';
  if (points.length === 2) return pointsToLinedPath(points);

  const first = points[0];
  let d = `M ${first.x} ${first.y}`;

  // For cubic bezier, we need to calculate control points
  // Using Catmull-Rom to Bezier conversion
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    // Calculate control points using tension
    const cp1x = p1.x + (p2.x - p0.x) * tension / 3;
    const cp1y = p1.y + (p2.y - p0.y) * tension / 3;
    const cp2x = p2.x - (p3.x - p1.x) * tension / 3;
    const cp2y = p2.y - (p3.y - p1.y) * tension / 3;

    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
  }

  return d;
};

// Generate cubic Bezier with explicit control points for each segment
export interface BezierSegment {
  start: Point;
  cp1: Point;
  cp2: Point;
  end: Point;
}

export const pointsToBezierSegments = (points: Point[], tension: number = 0.5): BezierSegment[] => {
  if (points.length < 2) return [];

  const segments: BezierSegment[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    segments.push({
      start: p1,
      cp1: {
        x: p1.x + (p2.x - p0.x) * tension / 3,
        y: p1.y + (p2.y - p0.y) * tension / 3
      },
      cp2: {
        x: p2.x - (p3.x - p1.x) * tension / 3,
        y: p2.y - (p3.y - p1.y) * tension / 3
      },
      end: p2
    });
  }

  return segments;
};

// Evaluate a point on a cubic Bezier curve at parameter t [0,1]
export const evaluateCubicBezier = (segment: BezierSegment, t: number): Point => {
  const t2 = t * t;
  const t3 = t2 * t;
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;

  return {
    x: mt3 * segment.start.x + 3 * mt2 * t * segment.cp1.x + 3 * mt * t2 * segment.cp2.x + t3 * segment.end.x,
    y: mt3 * segment.start.y + 3 * mt2 * t * segment.cp1.y + 3 * mt * t2 * segment.cp2.y + t3 * segment.end.y
  };
};

// Convert Bezier segments back to points for processing
export const bezierSegmentsToPoints = (segments: BezierSegment[], resolution: number = 10): Point[] => {
  if (segments.length === 0) return [];

  const points: Point[] = [segments[0].start];

  for (const segment of segments) {
    for (let i = 1; i <= resolution; i++) {
      const t = i / resolution;
      points.push(evaluateCubicBezier(segment, t));
    }
  }

  return points;
};

// Cached SVG container for path baking (performance optimization)
let cachedBakeContainer: HTMLDivElement | null = null;
let cachedBakeSvg: SVGSVGElement | null = null;
let cachedBakePathEl: SVGPathElement | null = null;

// Initialize or get cached SVG elements for path baking
const getBakeElements = () => {
  if (!cachedBakeContainer) {
    cachedBakeContainer = document.createElement('div');
    cachedBakeContainer.style.cssText = 'position:absolute;visibility:hidden;width:0;height:0;pointer-events:none;';
    document.body.appendChild(cachedBakeContainer);

    cachedBakeSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    cachedBakeContainer.appendChild(cachedBakeSvg);

    cachedBakePathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
    cachedBakeSvg.appendChild(cachedBakePathEl);
  }
  return cachedBakePathEl!;
};

export const bakePath = (path: PathData): PathData => {
  // If already baked (smoothing 0) or text, return as is.
  if (path.type === 'text') return path;
  if (path.smoothing === 0) return path;

  const d = pointsToSmoothedPath(path.points, path.smoothing || 0);
  if (!d) return path;

  // Use cached SVG elements for performance
  const pathEl = getBakeElements();
  pathEl.setAttribute("d", d);

  const len = pathEl.getTotalLength();
  const points: Point[] = [];

  // Step size: balance performance vs quality. 2px is quite detailed.
  const step = 2;

  for (let i = 0; i < len; i += step) {
     const p = pathEl.getPointAtLength(i);
     points.push({ x: p.x, y: p.y });
  }
  // Make sure we get the very end
  const last = pathEl.getPointAtLength(len);
  points.push({ x: last.x, y: last.y });

  return {
    ...path,
    points,
    smoothing: 0, // Baked
    style: path.style // Preserve style (crayon etc)
  };
};

// Erase parts of a path that are inside the eraser circle
// Returns an array of new paths (can be 0 if fully erased, 1 if touched/unaffected, or >1 if split)
export const eraseFromPath = (path: PathData, center: Point, radius: number): PathData[] => {
  // Ignore text for now - eraser only works on vector paths
  if (path.type === 'text') return [path];

  // Optimization: Check if path is even close to the eraser
  const bbox = getBoundingBox(path.points);
  // Add padding for stroke width?
  const padding = (path.strokeWidth || 1) + radius; 
  
  if (
    center.x + radius < bbox.x - padding ||
    center.x - radius > bbox.x + bbox.w + padding ||
    center.y + radius < bbox.y - padding ||
    center.y - radius > bbox.y + bbox.h + padding
  ) {
    return [path];
  }

  // Bake path if it has smoothing, to prevent distortion of the curve
  let targetPath = path;
  if (path.smoothing && path.smoothing > 0) {
      targetPath = bakePath(path);
  }

  const radiusSq = radius * radius;
  const newPaths: PathData[] = [];
  let currentPoints: Point[] = [];

  const startNewPath = () => {
    if (currentPoints.length >= 2) {
      newPaths.push({
        ...targetPath,
        id: targetPath.id + '-' + Math.random().toString(36).substr(2, 5),
        points: [...currentPoints]
      });
    }
    currentPoints = [];
  };

  const points = targetPath.points;
  if (points.length < 2) return [targetPath];

  // Start with the first point
  let isPrevInside = (points[0].x - center.x) ** 2 + (points[0].y - center.y) ** 2 < radiusSq;
  if (!isPrevInside) {
    currentPoints.push(points[0]);
  }

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    
    // Skip zero length segments to avoid division by zero in intersection calc
    if (Math.abs(p1.x - p2.x) < 0.001 && Math.abs(p1.y - p2.y) < 0.001) {
       continue;
    }

    // Check intersection with segment
    const intersections = getCircleSegmentIntersections(p1, p2, center, radius);
    const isNextInside = (p2.x - center.x) ** 2 + (p2.y - center.y) ** 2 < radiusSq;

    if (intersections.length === 0) {
      if (!isPrevInside) {
         currentPoints.push(p2);
      }
    } else {
      // Intersections found - handle entry/exit from eraser circle properly
      let lastWasInside = isPrevInside;

      for (let j = 0; j < intersections.length; j++) {
        const t = intersections[j];
        const ix = p1.x + t * (p2.x - p1.x);
        const iy = p1.y + t * (p2.y - p1.y);

        if (lastWasInside) {
          // Exiting the eraser circle - start a new path segment
          currentPoints.push({ x: ix, y: iy });
        } else {
          // Entering the eraser circle - end current path segment
          if (currentPoints.length > 0) {
            currentPoints.push({ x: ix, y: iy });
            startNewPath(); // Cut here
          }
          // If currentPoints is empty, we're at the start inside the circle - just skip
        }

        // Toggle state after crossing boundary
        lastWasInside = !lastWasInside;
      }
      
      if (!isNextInside) {
        currentPoints.push(p2);
      }
    }
    
    isPrevInside = isNextInside;
  }
  
  // Close any remaining path
  startNewPath();

  if (newPaths.length === 1 && newPaths[0].points.length === targetPath.points.length) {
     return [targetPath];
  }

  return newPaths;
};

export const parseSvgToPaths = (svgString: string): { paths: PathData[], viewBox: { x: number, y: number, w: number, h: number } | null } => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const svgRoot = doc.querySelector('svg');
  
  if (!svgRoot) return { paths: [], viewBox: null };

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.visibility = 'hidden';
  container.style.pointerEvents = 'none';
  container.style.width = '0px';
  container.style.height = '0px';
  container.style.overflow = 'hidden';
  
  document.body.appendChild(container);
  
  const svgInstance = svgRoot.cloneNode(true) as SVGSVGElement;
  container.appendChild(svgInstance);

  const extractedPaths: PathData[] = [];
  
  const elements = svgInstance.querySelectorAll('path, circle, rect, ellipse, line, polyline, polygon');
  
  elements.forEach((el, index) => {
     if (el instanceof SVGGeometryElement) {
        const len = el.getTotalLength();
        if (len < 0.1) return;
        
        let step = 4; 
        if (len < 100) step = 2;
        if (len > 2000) step = 10;

        const points: Point[] = [];
        const ctm = el.getCTM(); 
        
        for (let i = 0; i <= len; i += step) {
           const p = el.getPointAtLength(i);
           if (ctm) {
             points.push({
               x: p.x * ctm.a + p.y * ctm.c + ctm.e,
               y: p.x * ctm.b + p.y * ctm.d + ctm.f
             });
           } else {
             points.push({ x: p.x, y: p.y });
           }
        }
        
        const last = el.getPointAtLength(len);
        if (ctm) {
           points.push({
             x: last.x * ctm.a + last.y * ctm.c + ctm.e,
             y: last.x * ctm.b + last.y * ctm.d + ctm.f
           });
        } else {
           points.push({ x: last.x, y: last.y });
        }

        const style = window.getComputedStyle(el);
        
        let strokeColor = '#000000';
        let fillColor = 'none';

        if (style.stroke && style.stroke !== 'none') {
          strokeColor = style.stroke;
        }
        
        if (style.fill && style.fill !== 'none') {
          fillColor = style.fill;
        } else if (!style.stroke) {
           // If no stroke and no fill explicitly set, some SVGs default to black fill
           // But here we'll check computed style
           if (style.fill === '#000000' || style.fill === 'rgb(0, 0, 0)') {
              fillColor = '#000000';
           }
        }

        const strokeWidth = parseFloat(style.strokeWidth) || 1;

        extractedPaths.push({
           id: `imported-${index}-${Date.now()}`,
           type: 'path',
           points,
           color: strokeColor,
           fillColor: fillColor,
           strokeWidth: strokeWidth,
           smoothing: 0,
           style: 'solid'
        });
     }
  });

  let viewBox = null;
  if (svgInstance.viewBox && svgInstance.viewBox.baseVal) {
    const vb = svgInstance.viewBox.baseVal;
    if (vb.width > 0 && vb.height > 0) {
      viewBox = { x: vb.x, y: vb.y, w: vb.width, h: vb.height };
    }
  }
  
  if (!viewBox) {
    const w = parseFloat(svgInstance.getAttribute('width') || '0');
    const h = parseFloat(svgInstance.getAttribute('height') || '0');
    if (w > 0 && h > 0) {
      viewBox = { x: 0, y: 0, w, h };
    }
  }

  document.body.removeChild(container);

  return { paths: extractedPaths, viewBox };
};

export const getShapePoints = (type: ShapeType, start: Point, end: Point): Point[] => {
  const points: Point[] = [];
  let minX = Math.min(start.x, end.x);
  let minY = Math.min(start.y, end.y);
  let width = Math.abs(end.x - start.x);
  let height = Math.abs(end.y - start.y);
  
  if (type === 'square' || type === 'circle') {
    const size = Math.max(width, height);
    width = size;
    height = size;
    if (end.x < start.x) minX = start.x - size;
    else minX = start.x;
    
    if (end.y < start.y) minY = start.y - size;
    else minY = start.y;
  }

  const cx = minX + width / 2;
  const cy = minY + height / 2;

  if (type === 'rectangle' || type === 'square') {
    points.push({ x: minX, y: minY });
    points.push({ x: minX + width, y: minY });
    points.push({ x: minX + width, y: minY + height });
    points.push({ x: minX, y: minY + height });
    points.push({ x: minX, y: minY }); 
  } else if (type === 'ellipse' || type === 'circle') {
     const steps = 60;
     for (let i = 0; i <= steps; i++) {
       const theta = (i / steps) * Math.PI * 2;
       points.push({
         x: cx + (width / 2) * Math.cos(theta),
         y: cy + (height / 2) * Math.sin(theta)
       });
     }
  } else if (type === 'triangle') {
     points.push({ x: cx, y: minY }); 
     points.push({ x: minX + width, y: minY + height }); 
     points.push({ x: minX, y: minY + height }); 
     points.push({ x: cx, y: minY }); 
  } else if (type === 'star') {
      const outerRadius = Math.min(width, height) / 2;
      const innerRadius = outerRadius * 0.4;
      const steps = 10;
      for (let i = 0; i <= steps; i++) {
        const r = i % 2 === 0 ? outerRadius : innerRadius;
        const theta = (i / steps) * Math.PI * 2 - Math.PI / 2;
        points.push({
           x: cx + r * Math.cos(theta),
           y: cy + r * Math.sin(theta)
        });
      }
  } else if (type === 'line') {
      points.push(start);
      points.push(end);
  }

  return points;
};

// ============================================================================
// PATH BOOLEAN OPERATIONS (Union, Subtract, Intersect)
// Using Sutherland-Hodgman clipping and polygon operations
// ============================================================================

export type PathBooleanOp = 'union' | 'subtract' | 'intersect';

// Helper: Check if a polygon is clockwise
const isClockwise = (points: Point[]): boolean => {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    sum += (p2.x - p1.x) * (p2.y + p1.y);
  }
  return sum > 0;
};

// Helper: Reverse polygon winding
const reversePolygon = (points: Point[]): Point[] => {
  return [...points].reverse();
};

// Helper: Ensure polygon is closed
const ensureClosed = (points: Point[]): Point[] => {
  if (points.length < 2) return points;
  const first = points[0];
  const last = points[points.length - 1];
  if (Math.abs(first.x - last.x) > 0.001 || Math.abs(first.y - last.y) > 0.001) {
    return [...points, { x: first.x, y: first.y }];
  }
  return points;
};

// Sutherland-Hodgman polygon clipping algorithm
const clipPolygon = (subjectPolygon: Point[], clipPolygon: Point[]): Point[] => {
  if (subjectPolygon.length < 3 || clipPolygon.length < 3) return [];

  let outputList = [...subjectPolygon];

  for (let i = 0; i < clipPolygon.length - 1; i++) {
    if (outputList.length === 0) return [];

    const inputList = outputList;
    outputList = [];

    const edgeStart = clipPolygon[i];
    const edgeEnd = clipPolygon[i + 1];

    for (let j = 0; j < inputList.length; j++) {
      const current = inputList[j];
      const previous = inputList[(j + inputList.length - 1) % inputList.length];

      const currentInside = isLeft(edgeStart, edgeEnd, current) >= 0;
      const previousInside = isLeft(edgeStart, edgeEnd, previous) >= 0;

      if (currentInside) {
        if (!previousInside) {
          const intersection = lineIntersection(edgeStart, edgeEnd, previous, current);
          if (intersection) outputList.push(intersection);
        }
        outputList.push(current);
      } else if (previousInside) {
        const intersection = lineIntersection(edgeStart, edgeEnd, previous, current);
        if (intersection) outputList.push(intersection);
      }
    }
  }

  return outputList;
};

// Check if point is to the left of line (positive = left, negative = right, 0 = on line)
const isLeft = (lineStart: Point, lineEnd: Point, point: Point): number => {
  return (lineEnd.x - lineStart.x) * (point.y - lineStart.y) -
         (lineEnd.y - lineStart.y) * (point.x - lineStart.x);
};

// Find intersection point of two line segments
const lineIntersection = (p1: Point, p2: Point, p3: Point, p4: Point): Point | null => {
  const x1 = p1.x, y1 = p1.y, x2 = p2.x, y2 = p2.y;
  const x3 = p3.x, y3 = p3.y, x4 = p4.x, y4 = p4.y;

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 0.0001) return null;

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;

  return {
    x: x1 + t * (x2 - x1),
    y: y1 + t * (y2 - y1)
  };
};

// Compute polygon area (signed - positive for CCW, negative for CW)
export const polygonArea = (points: Point[]): number => {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return area / 2;
};

// Get convex hull using Graham scan (needed for union)
const convexHull = (points: Point[]): Point[] => {
  if (points.length < 3) return points;

  // Find lowest point
  let lowest = 0;
  for (let i = 1; i < points.length; i++) {
    if (points[i].y < points[lowest].y ||
        (points[i].y === points[lowest].y && points[i].x < points[lowest].x)) {
      lowest = i;
    }
  }

  const pivot = points[lowest];

  // Sort by polar angle
  const sorted = points.filter((_, i) => i !== lowest).sort((a, b) => {
    const angleA = Math.atan2(a.y - pivot.y, a.x - pivot.x);
    const angleB = Math.atan2(b.y - pivot.y, b.x - pivot.x);
    return angleA - angleB;
  });

  const hull: Point[] = [pivot];

  for (const point of sorted) {
    while (hull.length > 1 &&
           isLeft(hull[hull.length - 2], hull[hull.length - 1], point) <= 0) {
      hull.pop();
    }
    hull.push(point);
  }

  return hull;
};

/**
 * Perform boolean operation on two paths
 * Note: This works best with closed paths (polygons). Open paths will be auto-closed.
 */
export const pathBooleanOperation = (
  pathA: PathData,
  pathB: PathData,
  operation: PathBooleanOp
): PathData | null => {
  // Bake paths if they have smoothing
  const bakedA = pathA.smoothing && pathA.smoothing > 0 ? bakePath(pathA) : pathA;
  const bakedB = pathB.smoothing && pathB.smoothing > 0 ? bakePath(pathB) : pathB;

  let pointsA = ensureClosed(bakedA.points);
  let pointsB = ensureClosed(bakedB.points);

  // Ensure both polygons have consistent winding (CCW)
  if (isClockwise(pointsA)) pointsA = reversePolygon(pointsA);
  if (isClockwise(pointsB)) pointsB = reversePolygon(pointsB);

  let resultPoints: Point[] = [];

  switch (operation) {
    case 'intersect':
      // Intersection: clip A by B
      resultPoints = clipPolygon(pointsA, pointsB);
      break;

    case 'subtract':
      // Subtract B from A: clip A by reversed B
      const reversedB = reversePolygon(pointsB);
      resultPoints = clipPolygon(pointsA, reversedB);
      // Note: This is a simplified subtraction that works for convex shapes
      // For complex concave shapes, would need more sophisticated algorithm
      break;

    case 'union':
      // Union: combine both polygons' convex hull as an approximation
      // For accurate union, would need Weiler-Atherton or similar
      const allPoints = [...pointsA, ...pointsB];
      resultPoints = convexHull(allPoints);
      resultPoints.push(resultPoints[0]); // Close the polygon
      break;
  }

  if (resultPoints.length < 3) return null;

  return {
    ...pathA,
    id: `${pathA.id}-${operation}-${pathB.id}-${Date.now()}`,
    points: resultPoints,
    smoothing: 0
  };
};

/**
 * Path offset/inset - expand or contract a path by a given distance
 */
export const offsetPath = (path: PathData, distance: number): PathData => {
  const baked = path.smoothing && path.smoothing > 0 ? bakePath(path) : path;
  const points = baked.points;

  if (points.length < 3) return path;

  const offsetPoints: Point[] = [];

  for (let i = 0; i < points.length; i++) {
    const prev = points[(i - 1 + points.length) % points.length];
    const curr = points[i];
    const next = points[(i + 1) % points.length];

    // Calculate normals for adjacent edges
    const dx1 = curr.x - prev.x;
    const dy1 = curr.y - prev.y;
    const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) || 1;
    const nx1 = -dy1 / len1;
    const ny1 = dx1 / len1;

    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;
    const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1;
    const nx2 = -dy2 / len2;
    const ny2 = dx2 / len2;

    // Average normal at vertex
    let nx = (nx1 + nx2) / 2;
    let ny = (ny1 + ny2) / 2;
    const nlen = Math.sqrt(nx * nx + ny * ny) || 1;
    nx /= nlen;
    ny /= nlen;

    // Miter correction
    const dot = nx1 * nx2 + ny1 * ny2;
    const miterLength = distance / Math.sqrt((1 + dot) / 2 + 0.001);

    offsetPoints.push({
      x: curr.x + nx * Math.min(miterLength, distance * 2),
      y: curr.y + ny * Math.min(miterLength, distance * 2)
    });
  }

  return {
    ...path,
    id: `${path.id}-offset-${Date.now()}`,
    points: offsetPoints,
    smoothing: 0
  };
};

// ============================================================================
// NODE/ANCHOR POINT EDITING
// ============================================================================

export interface AnchorPoint {
  index: number;
  point: Point;
  handleIn?: Point;  // Control point for incoming curve
  handleOut?: Point; // Control point for outgoing curve
  type: 'corner' | 'smooth' | 'symmetric';
}

/**
 * Extract editable anchor points from a path
 */
export const getPathAnchors = (path: PathData): AnchorPoint[] => {
  const baked = path.smoothing && path.smoothing > 0 ? bakePath(path) : path;
  const points = baked.points;
  const anchors: AnchorPoint[] = [];

  // For simplified editing, we'll identify key points
  // In a full implementation, we'd preserve Bezier handles from the original path

  for (let i = 0; i < points.length; i++) {
    const prev = points[(i - 1 + points.length) % points.length];
    const curr = points[i];
    const next = points[(i + 1) % points.length];

    // Calculate handles based on neighbors (using 25% of distance to neighbors)
    anchors.push({
      index: i,
      point: curr,
      handleIn: {
        x: curr.x - (curr.x - prev.x) * 0.25,
        y: curr.y - (curr.y - prev.y) * 0.25
      },
      handleOut: {
        x: curr.x + (next.x - curr.x) * 0.25,
        y: curr.y + (next.y - curr.y) * 0.25
      },
      type: 'smooth'
    });
  }

  return anchors;
};

/**
 * Update a specific anchor point in a path
 */
export const updatePathAnchor = (
  path: PathData,
  anchorIndex: number,
  newPosition: Point,
  updateHandles: boolean = true
): PathData => {
  const points = [...path.points];

  if (anchorIndex < 0 || anchorIndex >= points.length) return path;

  const oldPosition = points[anchorIndex];
  const dx = newPosition.x - oldPosition.x;
  const dy = newPosition.y - oldPosition.y;

  points[anchorIndex] = newPosition;

  // Optionally smooth neighboring points
  if (updateHandles && points.length > 2) {
    // Simple smoothing: slightly adjust neighbors
    const prevIdx = (anchorIndex - 1 + points.length) % points.length;
    const nextIdx = (anchorIndex + 1) % points.length;

    // Mild adjustment to maintain curve smoothness
    points[prevIdx] = {
      x: points[prevIdx].x + dx * 0.1,
      y: points[prevIdx].y + dy * 0.1
    };
    points[nextIdx] = {
      x: points[nextIdx].x + dx * 0.1,
      y: points[nextIdx].y + dy * 0.1
    };
  }

  return {
    ...path,
    points,
    smoothing: 0 // Editing bakes the path
  };
};

/**
 * Add a new anchor point to a path at a specific segment
 */
export const addAnchorToPath = (
  path: PathData,
  segmentIndex: number,
  t: number = 0.5 // Parameter along segment [0,1]
): PathData => {
  const points = [...path.points];

  if (segmentIndex < 0 || segmentIndex >= points.length - 1) return path;

  const p1 = points[segmentIndex];
  const p2 = points[segmentIndex + 1];

  const newPoint: Point = {
    x: p1.x + (p2.x - p1.x) * t,
    y: p1.y + (p2.y - p1.y) * t
  };

  points.splice(segmentIndex + 1, 0, newPoint);

  return {
    ...path,
    points,
    smoothing: 0
  };
};

/**
 * Remove an anchor point from a path
 */
export const removeAnchorFromPath = (path: PathData, anchorIndex: number): PathData => {
  if (path.points.length <= 2) return path; // Can't remove from line

  const points = path.points.filter((_, i) => i !== anchorIndex);

  return {
    ...path,
    points,
    smoothing: 0
  };
};

/**
 * Find the closest anchor point to a given position
 */
export const findClosestAnchor = (
  path: PathData,
  position: Point,
  maxDistance: number = 10
): { index: number; distance: number } | null => {
  let closestIndex = -1;
  let closestDistance = Infinity;

  for (let i = 0; i < path.points.length; i++) {
    const p = path.points[i];
    const dist = Math.sqrt((p.x - position.x) ** 2 + (p.y - position.y) ** 2);

    if (dist < closestDistance && dist <= maxDistance) {
      closestDistance = dist;
      closestIndex = i;
    }
  }

  if (closestIndex === -1) return null;

  return { index: closestIndex, distance: closestDistance };
};

/**
 * Find the closest segment to a given position (for adding points)
 */
export const findClosestSegment = (
  path: PathData,
  position: Point,
  maxDistance: number = 10
): { segmentIndex: number; t: number; distance: number } | null => {
  let closestSegment = -1;
  let closestT = 0;
  let closestDistance = Infinity;

  for (let i = 0; i < path.points.length - 1; i++) {
    const p1 = path.points[i];
    const p2 = path.points[i + 1];

    // Project point onto segment
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lenSq = dx * dx + dy * dy;

    if (lenSq < 0.0001) continue;

    let t = ((position.x - p1.x) * dx + (position.y - p1.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));

    const projX = p1.x + t * dx;
    const projY = p1.y + t * dy;
    const dist = Math.sqrt((position.x - projX) ** 2 + (position.y - projY) ** 2);

    if (dist < closestDistance && dist <= maxDistance) {
      closestDistance = dist;
      closestSegment = i;
      closestT = t;
    }
  }

  if (closestSegment === -1) return null;

  return { segmentIndex: closestSegment, t: closestT, distance: closestDistance };
};


export type AppMode = 'converter' | 'generator';

export interface GeneratedIcon {
  blob: Blob;
  size: number;
  name: string;
}

export interface ConverterState {
  originalFile: File | null;
  croppedImage: string | null; // Base64
  isCropping: boolean;
  generatedIcons: GeneratedIcon[];
  setOriginalFile: (file: File | null) => void;
  setCroppedImage: (img: string | null) => void;
  setIsCropping: (isCropping: boolean) => void;
  setGeneratedIcons: (icons: GeneratedIcon[]) => void;
}

// --- Export Types ---
export type PackageType = 'essential' | 'complete';

export interface ExportSettings {
    packageType: PackageType;
    includeSvg: boolean; // For Generator mainly
    appName: string;
    appShortName: string;
    themeColor?: string;
    backgroundColor?: string;
}

// --- Generator Types ---

export type LayerType = 'text' | 'image' | 'shape' | 'emoji';
export type ShapeType = 'rect' | 'circle' | 'star' | 'triangle' | 'pentagon' | 'hexagon' | 'octagon' | 'custom';
export type ImageFillMode = 'cover' | 'contain' | 'stretch' | 'custom';
export type FillType = 'solid' | 'gradient' | 'image' | 'none';

export interface GradientStop {
  id: string;
  offset: number; // 0 to 1
  color: string;
}

export interface GradientConfig {
  type: 'linear' | 'radial';
  angle: number; // degrees, for linear
  stops: GradientStop[];
}

export interface BaseLayer {
  id: string;
  type: LayerType;
  name: string;
  visible: boolean;
  locked: boolean;
  x: number;
  y: number;
  offsetX?: number;
  offsetY?: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  width: number;
  height: number;
  opacity: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
}

export interface SnappingOptions {
    enabled: boolean;
    grid: boolean;
    gridSize: number;
    objects: boolean;
    canvas: boolean; // edge and center
    rotation: boolean;
    rotationIncrement: number;
    threshold: number;
}

export interface ShapeLayer extends BaseLayer {
  type: 'shape';
  shapeType: ShapeType;
  
  // Fill Configuration
  fillType: FillType;
  fill: string; // Solid color
  gradient?: GradientConfig; // Gradient config
  
  stroke: string;
  strokeWidth: number;
  cornerRadius?: number;
  
  // Custom Shape Props
  pathData?: string;
  viewBox?: string;

  // Image Fill Properties
  fillPatternImage?: string; // Base64
  fillImageMode?: ImageFillMode;
  fillPatternScale?: number; // Zoom factor for custom/cover modes
  fillPatternX?: number; // Offset X
  fillPatternY?: number; // Offset Y
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  align: 'left' | 'center' | 'right';
  fontStyle: string; // 'normal' | 'bold' | 'italic' | 'italic bold'
  textDecoration: string; // '' | 'underline' | 'line-through' | 'underline line-through'

  // Advanced Fill (Shared with Shape)
  fillType: FillType;
  fill: string;
  gradient?: GradientConfig;
  fillPatternImage?: string;
  fillImageMode?: ImageFillMode;
  fillPatternScale?: number;
  fillPatternX?: number;
  fillPatternY?: number;
  
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number; // Added for consistency, though usually applies to background box if implemented
}

export interface ImageLayer extends BaseLayer {
  type: 'image';
  src: string;
}

export interface EmojiLayer extends BaseLayer {
  type: 'emoji';
  text: string; // The emoji char
  fontSize: number;
}

export type Layer = ShapeLayer | TextLayer | ImageLayer | EmojiLayer;

export interface CanvasConfig {
  width: number;
  height: number;
  backgroundType: FillType;
  background: string; // Solid Color
  backgroundGradient?: GradientConfig;
  cornerRadius?: number; // Added for canvas border radius
  
  // Canvas Image Properties
  backgroundImage?: string; // Base64
  backgroundImageMode?: ImageFillMode;
  backgroundPatternScale?: number;
  backgroundPatternX?: number;
  backgroundPatternY?: number;
}

export interface EditorState {
  layers: Layer[];
  selectedLayerId: string | null;
  canvasConfig: CanvasConfig;
  stageConfig: {
    scale: number;
    x: number;
    y: number;
  };
  snapping: SnappingOptions;
  
  // History
  history: { layers: Layer[], canvasConfig: CanvasConfig }[];
  historyIndex: number;

  // Actions
  addLayer: (layer: Layer) => void;
  updateLayer: (id: string, updates: Partial<Layer>, saveHistory?: boolean) => void;
  removeLayer: (id: string) => void;
  selectLayer: (id: string | null) => void;
  reorderLayer: (id: string, direction: 'up' | 'down') => void;
  setCanvasBackground: (bg: string) => void;
  setCanvasConfig: (config: Partial<CanvasConfig>, saveHistory?: boolean) => void;
  setStageConfig: (config: { scale: number; x: number; y: number }) => void;
  setSnappingOptions: (options: Partial<SnappingOptions>) => void;
  deselectAll: () => void;
  centerSelection: () => void;
  
  // Undo/Redo
  undo: () => void;
  redo: () => void;
  saveHistory: () => void; // Manual trigger
}

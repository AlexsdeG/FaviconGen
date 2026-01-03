## 1. Project Overview
**Name:** Ultimate Favicon Generator & Converter
**Type:** Client-Side Single Page Application (SPA)
**Core Value:** A privacy-focused, zero-backend tool to generate production-ready favicon packages. It features a simple image converter and a complex, layer-based graphic design editor (The Generator) with modern "Apple Glass" UI aesthetics.

## 2. Tech Stack & Dependencies

### Core Framework
*   **Runtime/Build:** Vite (Latest)
*   **Language:** TypeScript (Strict Mode)
*   **Frontend Library:** React (Functional Components + Hooks)
*   **State Management:** `zustand` (For complex editor state: layers, selection, history, settings)

### Graphics & Image Processing (The Engine)
*   **Canvas Rendering:** `react-konva` & `konva` (Industry standard for layer-based canvas manipulation: drag, rotate, resize, z-index).
*   **Image Resizing:** `pica` (High-quality Lanczos3 downscaling to prevent blurriness in 16x16 icons).
*   **Cropping:** `react-easy-crop` (For the Converter module).
*   **Color Handling:** `colord` (Color manipulation, blending, and contrast checking) + `react-colorful` (Color picker UI).
*   **SVG Sanitization:** `dompurify` (Security: prevent XSS in uploaded SVGs).

### File Operations
*   **Zip Bundling:** `jszip` (Bundles all output files into a single archive).
*   **File Saving:** `file-saver`.
*   **MIME Types:** `file-type` (Validation of uploaded files).

### UI & Design System ("Apple Glass")
*   **CSS Framework:** Tailwind CSS.
*   **Components:** Headless UI or Radix UI (Primitives) styled with Tailwind.
*   **Icons:** `lucide-react` (Interface icons).
*   **Animations:** `framer-motion` (Smooth, spring-based transitions for modals and panels).
*   **Font Loading:** `webfontloader` (Dynamic Google Font loading for the text layer).
*   **Emoji:** `emoji-picker-react`.

### AI Integration
*   **Provider:** Google Gemini API (via Google Generative AI SDK).
*   **Usage:** Text-to-Icon generation (SVG/Path data generation) and Smart Color Palette suggestions.

---

## 3. Directory Structure

```text
/src
  /assets              # Static assets
  /components
    /common            # Buttons, Modals, Inputs (Glassmorphism styled)
    /layout            # Header, Footer, MainLayout
    /converter         # Dropzone, Cropper, Preview
    /generator         # The Advanced Editor
      /canvas          # Konva Stage & Layers
      /panels          # Right sidebar: Layer Properties (Color, Shadow, etc.)
      /layers          # Left sidebar: Layer List (Reorder, Delete, Hide)
      /toolbar         # Top toolbar: Add Text, Add Shape, Undo/Redo
  /hooks               # Custom hooks (useKeyboardShortcuts, useHistory)
  /lib                 # Utility libraries
    /ai                # Gemini API integration
    /image-processing  # Pica resize logic, ICO binary generation
    /zip               # JSZip bundling logic
  /store               # Zustand stores (editorStore.ts, userSettings.ts)
  /types               # TypeScript interfaces (Layer, CanvasState, ExportConfig)
  /workers             # Web Workers for heavy image processing
```

---

## 4. Feature Specifications

### Module A: The Converter (Image -> Favicon)
*   **Input:** Drag & Drop (PNG, JPG, WEBP, SVG, BMP).
*   **Pre-processing:**
    *   **Crop Modal:** Opens immediately upon upload. Allows user to select aspect ratio (1:1 standard).
    *   **Mask Preview:** Overlay a "Circle" mask and "Rounded Square" mask to show users how mobile OSs might crop their icon.
*   **Processing:**
    *   Input image is resized using `pica` to all required resolutions.
    *   Color extraction (optional): Auto-detect dominant color for `theme_color` in manifest.

### Module B: The Generator (Advanced Editor)
This is a Photoshop-lite experience specifically for icons.

#### 1. Canvas & Stage
*   **Dimensions:** 512x512 or 1024x1024 (Work at high res, downscale on export).
*   **Background:** Support for Transparent, Solid Color, Linear Gradient, Radial Gradient.

#### 2. Layer System
The editor must support a stack of layers. Each layer has a unique ID and Z-index.
*   **Layer Types:**
    *   **Text:** Font Family (Google Fonts), Weight, Size, Color, Spacing, Arc text (curved text).
    *   **Emoji:** Native or Twemoji rendering.
    *   **Shape:** Rectangle, Circle, Star, Polygon (all vector-based).
    *   **Image:** User upload.
    *   **SVG/Icon:** Library integration (Lucide/FontAwesome) or custom SVG upload.
    *   **AI:** AI-generated shape/symbol (via Gemini).

#### 3. Layer Properties (Per Layer)
*   **Transform:** Position (X, Y), Rotation (0-360), Scale, Skew.
*   **Style:** Fill (Solid/Gradient), Stroke (Width, Color), Opacity.
*   **Effects:** Shadow (Blur, Color, Offset), Blur (Gaussian).
*   **Blending:** CSS Blend Modes (Multiply, Overlay, etc.).

#### 4. AI Features (Gemini)
*   **"Magic Icon":** User types "A blue rocket taking off" -> Gemini generates SVG path data or a base64 image -> Added as a layer.
*   **"Smart Colors":** AI analyzes current layers and suggests a complementary background gradient.

---

## 5. Output & Export Logic

The application must generate a `.zip` file containing exactly these files.
*Note: All resizing happens in a Web Worker to keep the UI smooth.*

### File List & Specs
1.  **`favicon.ico`**:
    *   Must be a valid binary ICO container.
    *   Must include two embedded sizes: 16x16 and 32x32.
2.  **`favicon-16x16.png`**: Standard PNG.
3.  **`favicon-32x32.png`**: Standard PNG.
4.  **`apple-touch-icon.png`**: 180x180 (High quality, no transparency recommended by Apple, auto-fill background if transparent).
5.  **`android-chrome-192x192.png`**: Standard PNG.
6.  **`android-chrome-512x512.png`**: Standard PNG.
7.  **`icon.svg`**:
    *   **Converter Mode:** The original SVG (if uploaded) or a vectorized wrapper.
    *   **Generator Mode:** A clean SVG export of the vector layers (Text/Shapes) for infinite scalability.
8.  **`site.webmanifest`**: JSON file.
    ```json
    {
        "name": "User Input or Default",
        "short_name": "User Input",
        "icons": [
            { "src": "/android-chrome-192x192.png", "sizes": "192x192", "type": "image/png" },
            { "src": "/android-chrome-512x512.png", "sizes": "512x512", "type": "image/png" }
        ],
        "theme_color": "#ffffff",
        "background_color": "#ffffff",
        "display": "standalone"
    }
    ```

### HTML Snippet Generation
The app must display a copy-paste code block in the UI:
```html
<link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
<link rel="icon" type="image/svg+xml" href="/icon.svg" />
<link rel="shortcut icon" href="/favicon.ico" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
```

---

## 6. UI/UX Design System: "Apple Glass"

### Visual Language
*   **Glassmorphism:** Heavily use `backdrop-filter: blur(12px)` and `bg-white/10` (or `bg-black/10` in dark mode).
*   **Borders:** Thin, subtle borders `border-white/20` to define edges on glass surfaces.
*   **Shadows:** Soft, diffused shadows for depth. No harsh black shadows.
*   **Typography:** System font stack (`Inter` or `-apple-system`), clean, variable weights.
*   **Colors:**
    *   **Primary:** Vivid Blue/Purple gradient for Call-to-Actions (CTAs).
    *   **Surface:** Translucent whites/greys.
    *   **Feedback:** Success (Green), Error (Red) - using pastel tones.

### Layout
*   **Header:** Floating glass bar.
*   **Main Area:**
    *   **Left:** Layer Panel (Glass pane).
    *   **Center:** The Canvas (Checkerboard background to denote transparency, floating in 3D space with a slight drop shadow).
    *   **Right:** Properties Panel (Glass pane, tabs for Settings/Export).

---

## 7. Security & Performance Guidelines

### Security
1.  **Input Sanitization:**
    *   Use `DOMPurify` on any uploaded SVG before rendering it to Canvas to prevent XSS.
    *   Validate file magic numbers (signatures) not just extensions to prevent malware upload attempts.
2.  **No Server Data:** Strictly client-side. No user assets are ever sent to a server (except the text prompt sent to Gemini API, which must be stateless).
3.  **API Key Safety:** If using Gemini, users should ideally provide their own key OR the app uses a proxy backend (Edge Function) to rate-limit requests.

### Performance
1.  **Web Workers:**
    *   Image resizing (Pica) and Zip compression (JSZip) are CPU intensive. These **MUST** run in a Web Worker to prevent the "Apple Glass" UI from freezing or stuttering.
2.  **Lazy Loading:**
    *   Load `ffmpeg` (if needed later) or heavy canvas filters only when requested.
    *   Lazy load fonts to avoid bandwidth spikes.
3.  **Canvas Optimization:**
    *   Use `Konva`'s caching methods (`layer.cache()`) for static layers to reduce re-draw overhead during drag operations.

---

## 8. Development Data Models (TypeScript)

**Layer Interface Example:**
```typescript
type LayerType = 'text' | 'image' | 'shape' | 'svg' | 'emoji';

interface BaseLayer {
  id: string;
  type: LayerType;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  shadow?: { color: string; blur: number; offsetX: number; offsetY: number };
}

interface TextLayer extends BaseLayer {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string | Gradient; // Support solid or gradient
  align: 'left' | 'center' | 'right';
}

// ... other layer types
```

**Export Configuration Example:**
```typescript
interface ExportConfig {
  appName: string;
  appShortName: string;
  themeColor: string; // Hex
  backgroundColor: string; // Hex
  includeSvg: boolean;
  generateManifest: boolean;
}
```
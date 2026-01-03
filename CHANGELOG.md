# Changelog

All notable changes to this project will be documented in this file.

## [0.0.9] - 2024-05-23

### Added
- **Advanced Snapping System**:
  - Added snapping to grid, objects, and canvas edges/center.
  - Implemented visual smart guides (red dashed lines) when snapping occurs.
  - Added snapping toolbar menu with toggle controls.
- **Snapping Configuration**:
  - Enable/Disable global snapping.
  - Toggle Grid snapping.
  - Toggle Object snapping.
  - Toggle Canvas snapping.

## [0.0.8] - 2024-05-23

### Added
- **UI Refinements**:
  - Added border radius control for canvas.
  - Improved toolbar layout with better centering.
  - Added conditional AI feature visibility based on API key presence.
- **Smart Features**:
  - Integrated Google Gemini for "Magic Icon" generation.
  - Added "Smart Colors" for AI-suggested palettes.

## [0.0.7] - 2024-05-22

### Added
- **Magic Icon Generation**:
  - New "AI Gen" button in toolbar.
  - Modal for describing and generating icon shapes.
  - Integration with Gemini API for SVG path generation.
- **Smart Color Suggestions**:
  - "Suggest Colors" button in Gradient Editor.
  - AI-powered color palette generation based on prompts.

### Changed
- Refactored `PropertiesPanel` to support AI features.
- Updated `Toolbar` to include AI controls.

## [0.0.6] - 2024-05-21

### Added
- **Advanced Mockups**:
  - Added `BrowserMockup` component for realistic previews.
  - Integrated mockup into `ConverterPreview` panel.
- **Preset Palettes**:
  - Added curated list of modern gradients in `PropertiesPanel`.
  - Added quick-apply functionality for presets.

## [0.0.5] - 2024-05-20

### Added
- **Shape System**:
  - Added support for Circle, Triangle, Star, Polygon shapes.
  - Added shape library menu in toolbar.
- **Layer Management**:
  - Added ability to lock/unlock layers.
  - Added visibility toggle for layers.

## [0.0.4] - 2024-05-19

### Added
- **Emoji Support**:
  - Integrated `emoji-picker-react`.
  - Added emoji tool to toolbar.
  - Render emojis as text layers on canvas.

## [0.0.3] - 2024-05-18

### Added
- **Text Tools**:
  - Added text layer support.
  - Added font family selection (Google Fonts).
  - Added font weight/style controls (Bold, Italic, etc.).

## [0.0.2] - 2024-05-17

### Added
- **Basic Canvas**:
  - Initial Konva.js integration.
  - Basic layer rendering (Shapes).
  - Transformer support (Resize/Rotate).
- **Export**:
  - Basic PNG export functionality.

## [0.0.1] - 2024-05-16

### Initial Release
- Project setup with Vite + React + TypeScript.
- Tailwind CSS configuration.
- Basic store structure with Zustand.
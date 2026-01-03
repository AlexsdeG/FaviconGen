# Favicon Generator & Converter

A privacy-focused, zero-backend tool for creating production-ready favicon packages. Whether you need to quickly convert an existing logo or design a new icon from scratch in a professional editor, FaviconGen handles it all purely in your browser.

![App Screenshot](https://github.com/AlexsdeG/FaviconGen/blob/main/FaviconGen.png)

---

## ✨ Features

### 🎨 Advanced Generator (Editor)
A Photoshop-lite experience tailored for icon design.
- **Layer-Based Editing**: Manage multiple layers (Text, Shapes, Images, Emoji) with full Z-index control.
- **Smart Snapping**: 
    - Snap to **Grid**, **Canvas Edges**, **Center Lines**, and **Other Objects**.
    - **Smart Aspect Ratio**: Maintenance of ratio during corner resize even when snapping to edges.
    - **Free Scale Mode**: Toggle to freely Resize layers without locked aspect ratios.
- **Rich Customization**:
    - **Shapes**: Rectangle, Circle, Star, Polygon, and more.
    - **Backgrounds**: Solid colors, Linear/Radial Gradients, or Transparent.
    - **Styling**: Shadows, Strokes, Opacity, and Blending modes.
- **Undo/Redo History**: Full state management for worry-free editing.
- **Google Fonts Integration**: Access a wide library of fonts for text layers.

### 🔄 Quick Converter
Convert any image into a full favicon suite in seconds.
- **Drag & Drop**: Supports PNG, JPG, WEBP, and SVG.
- **Smart Cropping**: Built-in cropper to select the perfect square area.
- **Instant Preview**: See how your icon looks on Browser Tabs, Google Search results, and iOS/Android home screens.

### 🤖 AI Integration (Powered by Gemini)
- **Magic Icon**: Generate SVG shapes and icons from text prompts.
- **Smart Colors**: AI analysis suggests complementary gradients and palettes based on your design.

### 📦 Production-Ready Export
Generates a standard `.zip` package containing:
- `favicon.ico` (Binary, 16x16 & 32x32 embedded)
- `favicon-16x16.png` & `favicon-32x32.png`
- `apple-touch-icon.png` (180x180)
- `android-chrome-192x192.png` & `android-chrome-512x512.png`
- `icon.svg` (Scalable vector source)
- `site.webmanifest` (JSON configuration)

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [pnpm](https://pnpm.io/) (Recommended) or npm/yarn

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/favicongen.git
    cd favicongen
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    # or npm install
    ```

3.  **Environment Setup (Optional for AI):**
    To enable AI features (Text-to-Icon, Smart Colors), you need a Google Gemini API Key.
    
    Create a `.env.local` file in the root directory:
    ```bash
    VITE_GEMINI_API_KEY=your_api_key_here
    ```
    *Note: The app runs perfectly without this key; AI features will simply be disabled.*

4.  **Run Development Server:**
    ```bash
    pnpm dev
    # or npm run dev
    ```
    Open [http://localhost:5173](http://localhost:5173) to view the app.

---

## 🛠️ Technology Stack

- **Framework**: React + Vite + TypeScript
- **State Management**: Zustand
- **Canvas Engine**: React-Konva
- **Styling**: Tailwind CSS (Apple Glass Aesthetic)
- **Image Processing**: Pica (High-quality resizing), JSZip (Bundling)
- **AI**: Google Generative AI SDK

---

## 🔒 Privacy & Security

- **Client-Side Only**: All image processing happens in your browser. No files are ever uploaded to a server.
- **AI Privacy**: If used, only the text prompt is sent to Google's API. Your images remain local.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

import React, { useRef } from 'react';
import Toolbar from './toolbar/Toolbar';
import LayerList from './panels/LayerList';
import PropertiesPanel from './panels/PropertiesPanel';
import EditorCanvas from './canvas/EditorCanvas';
import Konva from 'konva';
import { useEditorStore } from '../../store/editorStore';
import { useUIStore } from '../../store/uiStore';
import { toast } from 'sonner';

const GeneratorLayout: React.FC = () => {
  const stageRef = useRef<Konva.Stage>(null);
  const { canvasConfig, deselectAll } = useEditorStore();
  const { setExportModalOpen } = useUIStore();

  const handleExportRequest = async () => {
    if (!stageRef.current) return;

    try {
        // 1. Deselect everything so selection handles don't show up in export
        deselectAll();
        
        // Wait for next tick to ensure transformer is gone
        setTimeout(() => {
            if (!stageRef.current) return;

            // 2. Export only the artboard area
            // Konva toDataURL allows defining x,y,width,height of the area to crop
            // Since our "Artboard" is essentially a Rectangle at (0,0) in the layer coordinates,
            // we want to export that exact region.
            // However, toDataURL exports pixels relative to the Stage viewport if not careful.
            
            // 2. Export only the artboard area
            // STRATEGY: Create a "Virtual Stage" to guarantee 1:1 export regardless of Zoom/Pan.
            
            // A. Get the main layer
            const layers = stageRef.current.getLayers();
            if (layers.length === 0) return;
            const originalLayer = layers[0];

            // B. Clone the layer to isolate it
            const clonedLayer = originalLayer.clone();

            // C. Remove Transformer from the clone (it might be selected)
            const transformers = clonedLayer.find('Transformer');
            transformers.forEach(t => t.destroy());

            // D. Create a temporary container for the virtual stage
            const tempDiv = document.createElement('div');
            // Hide it just in case, though it's not attached to document body unless we want to debug
            tempDiv.style.visibility = 'hidden'; 
            document.body.appendChild(tempDiv);

            // E. Create the Virtual Stage (Exact Artboard Dimensions)
            const virtualStage = new Konva.Stage({
                container: tempDiv,
                width: canvasConfig.width,
                height: canvasConfig.height,
                scale: { x: 1, y: 1 },
                x: 0,
                y: 0
            });

            // F. Add cloned layer and ensure it's at 0,0
            virtualStage.add(clonedLayer as unknown as Konva.Layer);
            clonedLayer.position({ x: 0, y: 0 });
            clonedLayer.scale({ x: 1, y: 1 });
            
            // G. Export
            const dataUrl = virtualStage.toDataURL({
                pixelRatio: 1, // 1:1 matching the stage size
                width: canvasConfig.width,
                height: canvasConfig.height,
                mimeType: 'image/png'
            });

            // H. Clean up
            virtualStage.destroy();
            document.body.removeChild(tempDiv);

            // 3. Convert DataURL to Blob
            fetch(dataUrl)
                .then(res => res.blob())
                .then(blob => {
                    setExportModalOpen(true, blob);
                });

        }, 50);

    } catch (e) {
        console.error(e);
        toast.error("Failed to capture canvas");
    }
  };

  return (
    <div className="flex flex-col h-full w-full glass-panel rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-500 border border-white/10">
      {/* Top Toolbar */}
      <Toolbar onExport={handleExportRequest} />

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Layers */}
        <div className="w-64 bg-[#1e1e1e] border-r border-white/10 hidden md:flex flex-col z-10">
            <LayerList />
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 bg-[#0f172a] relative overflow-hidden">
            <EditorCanvas ref={stageRef} />
        </div>

        {/* Right: Properties */}
        <div className="w-80 bg-[#1e1e1e] border-l border-white/10 hidden lg:flex flex-col overflow-hidden z-10">
            <PropertiesPanel />
        </div>
      </div>
      
      {/* Mobile view warning (hidden on desktop) */}
      <div className="md:hidden absolute inset-0 bg-black/90 z-50 flex items-center justify-center p-8 text-center backdrop-blur-md">
          <p className="text-white">The Generator works best on larger screens. Please switch to a desktop or tablet.</p>
      </div>
    </div>
  );
};

export default GeneratorLayout;

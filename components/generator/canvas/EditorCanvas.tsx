import React, { useState, useMemo, forwardRef } from 'react';
import { Stage, Layer as KonvaLayer, Rect } from 'react-konva';
import { useEditorStore } from '../../../store/editorStore';
import RenderLayer from './layers/RenderLayer';
import Transformer from './Transformer';
import Konva from 'konva';
import useImage from 'use-image';
import { getLinearGradientPoints } from '../../../lib/utils';
import { calculateSnap, getSnapStops, Guide } from '../../../lib/snapping';
import { Line } from 'react-konva';

// We wrap the component to forward the ref to the Stage
const EditorCanvas = forwardRef<Konva.Stage>((props, ref) => {
  const { 
    layers, 
    selectedLayerId, 
    canvasConfig, 
    stageConfig,
    setStageConfig,
    selectLayer, 
    updateLayer, 
    deselectAll
  } = useEditorStore();

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<Konva.Node | undefined>(undefined);
  const [guides, setGuides] = useState<Guide[]>([]);
  const { snapping } = useEditorStore();

  // Load Background Image
  const [bgImg] = useImage(canvasConfig.backgroundImage || '');

  // ... (Keep existing zoom logic)
  const fitStage = React.useCallback(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight;
    if (containerWidth === 0 || containerHeight === 0) return;
    
    // Calculate scale to fit with padding
    const padding = 40; // 20px on each side
    const availableWidth = containerWidth - padding;
    const availableHeight = containerHeight - padding;
    
    const scaleW = availableWidth / canvasConfig.width;
    const scaleH = availableHeight / canvasConfig.height;
    
    // We want to fit strictly within the view, so take the min scale.
    // We don't cap at 1.0 anymore if we want "fit to screen", but maybe user wants max 100%?
    // Usually "Fit" means show everything.
    const newScale = Math.min(scaleW, scaleH, 1) * 0.95; // 0.95 factor for extra safety space or use precise padding?
    // Let's stick to precise 20px padding logic requested.
    
    const finalScale = Math.min(scaleW, scaleH);
    // Be careful not to zoom in too much on huge screens if image is small? 
    // Usually design tools limit fit zoom to 100% or allow zooming in if small.
    // Let's cap at 5 (same as max zoom) but for "Fit" usually we just ensure visibility.
    // If canvas is 16x16, we probably WANT to zoom in.
    
    // User complaint: "purple canvas area when fit to screen is outside the view area".
    // This implies offset is wrong.
    
    const scaledWidth = canvasConfig.width * finalScale;
    const scaledHeight = canvasConfig.height * finalScale;
    
    const newX = (containerWidth - scaledWidth) / 2;
    const newY = (containerHeight - scaledHeight) / 2;

    setStageConfig({ scale: finalScale, x: newX, y: newY });
  }, [canvasConfig.width, canvasConfig.height, setStageConfig]);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
       if (stageConfig.scale === 1 && stageConfig.x === 0 && stageConfig.y === 0) {
           window.requestAnimationFrame(() => fitStage());
       }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [fitStage, stageConfig]);

  // Clear guides when snapping options change
  React.useEffect(() => {
    setGuides([]);
  }, [snapping]);

  // Sync selected node for transformer
  React.useEffect(() => {
    // We need to access the stage to find the node, so we use the forwarded ref
    if (selectedLayerId && ref && 'current' in ref && ref.current) {
        const node = ref.current.findOne('#' + selectedLayerId);
        setSelectedNode(node || undefined);
    } else {
        setSelectedNode(undefined);
    }
  }, [selectedLayerId, layers, ref]);

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const stage = e.target.getStage();
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    let newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    if (newScale < 0.1) newScale = 0.1;
    if (newScale > 5) newScale = 5;

    setStageConfig({
      scale: newScale,
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale
    });
  };

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      deselectAll();
      setGuides([]);
      return;
    }
    if (e.target.attrs.id === 'canvas-bg') {
        deselectAll();
        setGuides([]);
    }
  };

  const handleDragMove = React.useCallback((e: Konva.KonvaEventObject<DragEvent>, layerId: string) => {
      const node = e.target;
      // Filter out the current layer from others
      const otherLayers = layers.filter(l => l.id !== layerId && l.visible);
      
      const result = calculateSnap(node, otherLayers, canvasConfig, snapping);
      
      // Apply snapped position
      node.position({ x: result.x, y: result.y });
      
      setGuides(result.guides);
  }, [layers, canvasConfig, snapping]);

  const handleDragEnd = () => {
      setGuides([]);
  };

  // Calculate Snap Stops for resizing
  // We exclude the selected layer from the stops logic
  const snapStops = useMemo(() => {
      if (!selectedLayerId) return undefined;
      const otherLayers = layers.filter(l => l.id !== selectedLayerId && l.visible);
      return getSnapStops(otherLayers, canvasConfig, snapping);
  }, [layers, selectedLayerId, canvasConfig, snapping]);

  // Prepare Background Props (Copied from previous logic)
  const bgProps = useMemo(() => {
      if (canvasConfig.backgroundType === 'image' && canvasConfig.backgroundImage && bgImg) {
          const mode = canvasConfig.backgroundImageMode || 'cover';
          const zoom = canvasConfig.backgroundPatternScale || 1;
          const userX = canvasConfig.backgroundPatternX || 0;
          const userY = canvasConfig.backgroundPatternY || 0;
          
          const shapeW = canvasConfig.width;
          const shapeH = canvasConfig.height;
          const imgW = bgImg.width;
          const imgH = bgImg.height;

          let scaleX = 1, scaleY = 1, finalOffsetX = 0, finalOffsetY = 0;

          if (mode === 'stretch') {
              scaleX = shapeW / imgW;
              scaleY = shapeH / imgH;
          } else if (mode === 'cover') {
              const scale = Math.max(shapeW / imgW, shapeH / imgH) * zoom;
              scaleX = scale;
              scaleY = scale;
              finalOffsetX = (imgW * scale - shapeW) / 2 / scale;
              finalOffsetY = (imgH * scale - shapeH) / 2 / scale;
          } else if (mode === 'contain') {
              const scale = Math.min(shapeW / imgW, shapeH / imgH) * zoom;
              scaleX = scale;
              scaleY = scale;
              finalOffsetX = (imgW * scale - shapeW) / 2 / scale;
              finalOffsetY = (imgH * scale - shapeH) / 2 / scale;
          } else {
              scaleX = zoom;
              scaleY = zoom;
          }

          return {
              fillPatternImage: bgImg,
              fillPatternScaleX: scaleX,
              fillPatternScaleY: scaleY,
              fillPatternOffset: { 
                  x: finalOffsetX - (userX / scaleX), 
                  y: finalOffsetY - (userY / scaleY) 
              },
              fillPatternRepeat: 'no-repeat'
          };
      }
      
      if (canvasConfig.backgroundType === 'gradient' && canvasConfig.backgroundGradient) {
          const { type, angle, stops } = canvasConfig.backgroundGradient;
          const colorStops = stops.flatMap(s => [s.offset, s.color]);
          if (type === 'linear') {
              const { start, end } = getLinearGradientPoints(angle, canvasConfig.width, canvasConfig.height);
              return {
                  fillLinearGradientStartPoint: start,
                  fillLinearGradientEndPoint: end,
                  fillLinearGradientColorStops: colorStops
              };
          } else {
              return {
                  fillRadialGradientStartPoint: { x: canvasConfig.width/2, y: canvasConfig.height/2 },
                  fillRadialGradientEndPoint: { x: canvasConfig.width/2, y: canvasConfig.height/2 },
                  fillRadialGradientStartRadius: 0,
                  fillRadialGradientEndRadius: Math.max(canvasConfig.width, canvasConfig.height) / 2,
                  fillRadialGradientColorStops: colorStops
              }
          }
      } 
      
      if (canvasConfig.backgroundType === 'solid') {
          return { fill: canvasConfig.background };
      }
      
      return { fill: undefined }; 
  }, [canvasConfig, bgImg]);

  return (
    <div ref={containerRef} className="w-full h-full bg-[#121212] relative overflow-hidden">
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
            backgroundImage: `linear-gradient(45deg, #fff 25%, transparent 25%), linear-gradient(-45deg, #fff 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #fff 75%), linear-gradient(-45deg, transparent 75%, #fff 75%)`,
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
        }}
      />

      <Stage
        width={containerRef.current?.offsetWidth || window.innerWidth} 
        height={containerRef.current?.offsetHeight || window.innerHeight}
        scaleX={stageConfig.scale}
        scaleY={stageConfig.scale}
        x={stageConfig.x}
        y={stageConfig.y}
        ref={ref}
        onMouseDown={handleStageClick}
        onWheel={handleWheel}
        draggable
      >
        <KonvaLayer>
            {/* Background Rect */}
            <Rect 
                id="canvas-bg"
                x={0}
                y={0}
                width={canvasConfig.width}
                height={canvasConfig.height}
                {...bgProps}
                cornerRadius={canvasConfig.cornerRadius || 0}
                shadowColor="black"
                shadowBlur={50}
                shadowOpacity={0.5}
            />

            {/* Transparent Mode Outline (Visual only, not exported usually if we crop correctly) */}
            {(canvasConfig.backgroundType === 'none' || canvasConfig.background === 'transparent') && (
                <>
                <Rect 
                    x={0}
                    y={0}
                    width={canvasConfig.width}
                    height={canvasConfig.height}
                    stroke="rgba(255,255,255,0.5)"
                    strokeWidth={2}
                    dash={[10, 10]}
                    listening={false}
                />
                </>
            )}
            
            {layers.filter(l => l.visible).map((layer) => (
                <RenderLayer
                    key={layer.id}
                    layer={layer}
                    isSelected={layer.id === selectedLayerId}
                    onSelect={() => selectLayer(layer.id)}
                    onChange={(newAttrs) => updateLayer(layer.id, newAttrs, true)}
                    onDragMove={(e) => handleDragMove(e, layer.id)}
                />
            ))}
            
            {/* Snap Guides */}
            {guides.map((guide, i) => {
                if (guide.orientation === 'v') {
                    return (
                        <Line
                             key={i}
                             points={[guide.position, 0, guide.position, canvasConfig.height]}
                             stroke="#ef4444"
                             strokeWidth={1}
                             dash={[4, 4]}
                             listening={false}
                        />
                    );
                } else {
                    return (
                        <Line
                             key={i}
                             points={[0, guide.position, canvasConfig.width, guide.position]}
                             stroke="#ef4444"
                             strokeWidth={1}
                             dash={[4, 4]}
                             listening={false}
                        />
                    );
                }
            })}



            <Transformer 
                selectedNode={selectedNode} 
                rotationSnaps={snapping.rotation ? Array.from({ length: 360 / (snapping.rotationIncrement || 15) }, (_, i) => i * (snapping.rotationIncrement || 15)) : []}
                snapStops={snapStops}
                snappingOptions={snapping}
                setGuides={setGuides}
            />
        </KonvaLayer>
      </Stage>
      
      <div className="absolute bottom-4 left-4 text-xs text-white/40 font-mono bg-black/60 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-md pointer-events-none">
        Zoom: {Math.round(stageConfig.scale * 100)}% | {canvasConfig.width}x{canvasConfig.height}px
      </div>
    </div>
  );
});

export default EditorCanvas;

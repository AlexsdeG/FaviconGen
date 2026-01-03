import React, { useEffect, useRef } from 'react';
import { Transformer as KonvaTransformer } from 'react-konva';
import Konva from 'konva';
import { useEditorStore } from '../../../store/editorStore';

import { Guide, snapBox } from '../../../lib/snapping';
import { SnappingOptions } from '../../../types';

interface TransformerProps {
  selectedNode?: Konva.Node;
  rotationSnaps?: number[];
  snapStops?: { vertical: Record<string, number[]>; horizontal: Record<string, number[]> };
  snappingOptions?: SnappingOptions;
  setGuides?: (guides: Guide[]) => void;
}

const Transformer: React.FC<TransformerProps> = ({
  selectedNode,
  rotationSnaps,
  snapStops,
  snappingOptions,
  setGuides
}) => {
  const { isFreeScale } = useEditorStore();
  const trRef = useRef<Konva.Transformer>(null);

  // We use a ref to track guides during resize to avoid re-renders of the Transformer itself driving the update loop,
  // but we need to notify parent (EditorCanvas) to render guides.
  // Ideally, EditorCanvas passes a setter. We call it.

  // To avoid spamming setState on every pixel drag which might lag, we could throttle, but let's try direct first.
  // boundBoxFunc runs frequently. 

  // We clear guides on transform end.
  const handleTransformEnd = () => {
    setGuides?.([]);
  };

  useEffect(() => {
    if (trRef.current) {
      if (selectedNode) {
        trRef.current.nodes([selectedNode]);
        trRef.current.getLayer()?.batchDraw();
      } else {
        trRef.current.nodes([]);
        trRef.current.getLayer()?.batchDraw();
      }
    }
  }, [selectedNode]);

  return (
    <KonvaTransformer
      ref={trRef}
      rotationSnaps={rotationSnaps}
      keepRatio={!isFreeScale}
      onTransformEnd={handleTransformEnd}
      boundBoxFunc={(oldBox, newBox) => {
        // limit resize
        if (newBox.width < 5 || newBox.height < 5) {
          return oldBox;
        }

        // Apply Snapping
        if (snappingOptions?.enabled && snapStops) {
          const result = snapBox(newBox, oldBox, snapStops, snappingOptions, !isFreeScale);

          // Update guides visually
          // Note: calling setGuides here forces a React render of EditorCanvas.
          // If performance is bad, we might need a ref-based guide renderer or optimization.
          if (setGuides) {
            // Check if guides actually changed to avoid unnecessary renders?
            // For now, trust React state diffing or Konva speed.
            // Actually, calling setState in render loop (boundBox is part of drag) is risky for perf.
            // But let's try.
            setGuides(result.guides);
          }

          return {
            x: result.x,
            y: result.y,
            width: result.width,
            height: result.height,
            rotation: newBox.rotation
          };
        }

        setGuides?.([]);
        return newBox;
      }}
      anchorSize={8}
      anchorCornerRadius={4}
      borderStroke="#6366f1"
      anchorStroke="#6366f1"
      anchorFill="#ffffff"
    />
  );
};

export default Transformer;

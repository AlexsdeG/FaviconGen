import React, { useRef, useMemo } from 'react';
import { Rect, Circle, Star, RegularPolygon, Text, Path, Image as KonvaImage, Group } from 'react-konva';
import useImage from 'use-image';
import { Layer, ImageLayer, ShapeLayer, TextLayer } from '../../../../types';
import { getLinearGradientPoints } from '../../../../lib/utils';
import Konva from 'konva';

interface RenderLayerProps {
  layer: Layer;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: Partial<Layer>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

const RenderLayer: React.FC<RenderLayerProps> = ({ layer, isSelected, onSelect, onChange, onDragMove }) => {
  const shapeRef = useRef<Konva.Shape | Konva.Image | Konva.Text | Konva.Group>(null);

  // Determine image source
  const imageSrc =
    layer.type === 'image'
      ? (layer as ImageLayer).src
      : (layer.type === 'shape' || layer.type === 'text')
        ? (layer as ShapeLayer | TextLayer).fillPatternImage
        : undefined;

  const [img] = useImage(imageSrc || '');

  // Calculate Offset for Center Rotation (Prefer stored offset if available)
  const offsetX = (layer.width) / 2;
  const offsetY = (layer.height) / 2;

  const commonProps = {
    id: layer.id,
    x: layer.x,
    y: layer.y,
    rotation: layer.rotation,
    scaleX: layer.scaleX,
    scaleY: layer.scaleY,
    opacity: layer.opacity,
    draggable: !layer.locked,
    name: layer.id,
    onClick: onSelect,
    onTap: onSelect,
    shadowColor: layer.shadowColor,
    shadowBlur: layer.shadowBlur,
    shadowOffsetX: layer.shadowOffsetX,
    shadowOffsetY: layer.shadowOffsetY,
    offsetX: offsetX,
    offsetY: offsetY,
    onDragMove: onDragMove,
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
      onChange({
        x: e.target.x(),
        y: e.target.y(),
      });
    },
    onTransformEnd: (e: Konva.KonvaEventObject<Event>) => {
      const node = shapeRef.current;
      if (!node) return;
      onChange({
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
      });
    },
  };

  // Calculate Pattern Properties (Shared for Shape and Text)
  const patternProps = useMemo(() => {
    if ((layer.type !== 'shape' && layer.type !== 'text') || !(layer as any).fillPatternImage || !img) return {};
    const shape = layer as ShapeLayer | TextLayer;
    const mode = shape.fillImageMode || 'cover';
    const zoom = shape.fillPatternScale || 1;
    const userX = shape.fillPatternX || 0;
    const userY = shape.fillPatternY || 0;

    const shapeW = layer.type === 'text' ? (shapeRef.current?.width() || shape.width) : shape.width;
    const shapeH = layer.type === 'text' ? (shapeRef.current?.height() || shape.height) : shape.height;
    const imgW = img.width;
    const imgH = img.height;

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

    // Important: Account for shape being drawn relative to its own offset/center.
    // We force offsetX=w/2, so the shape origin (0,0) is at center of visual box.
    // To align pattern to top-left of visual box (-w/2, -h/2), we shift by half size.

    let shiftX = (shapeW / 2) / scaleX;
    let shiftY = (shapeH / 2) / scaleY;

    return {
      fillPatternImage: img,
      fillPatternScaleX: scaleX,
      fillPatternScaleY: scaleY,
      fillPatternOffset: {
        x: shiftX + (finalOffsetX / scaleX) - (userX / scaleX),
        y: shiftY + (finalOffsetY / scaleY) - (userY / scaleY)
      },
      fillPatternRepeat: 'no-repeat'
    };
  }, [layer, img, shapeRef.current]);

  // Calculate Gradient Props (Shared)
  const gradientProps = useMemo(() => {
    if (layer.type !== 'shape' && layer.type !== 'text') return {};
    const shape = layer as ShapeLayer | TextLayer;

    if (shape.fillType === 'gradient' && shape.gradient) {
      const { type, angle, stops } = shape.gradient;
      const colorStops = stops.flatMap(s => [s.offset, s.color]);
      const w = layer.type === 'text' ? (shapeRef.current?.width() || layer.width) : layer.width;
      const h = layer.type === 'text' ? (shapeRef.current?.height() || layer.height) : layer.height;

      if (type === 'linear') {
        const { start, end } = getLinearGradientPoints(angle, w, h);
        return {
          fillLinearGradientStartPoint: { x: start.x - w / 2, y: start.y - h / 2 },
          fillLinearGradientEndPoint: { x: end.x - w / 2, y: end.y - h / 2 },
          fillLinearGradientColorStops: colorStops
        };
      } else {
        return {
          fillRadialGradientStartPoint: { x: 0, y: 0 },
          fillRadialGradientEndPoint: { x: 0, y: 0 },
          fillRadialGradientStartRadius: 0,
          fillRadialGradientEndRadius: Math.max(w, h) / 2,
          fillRadialGradientColorStops: colorStops
        }
      }
    }
    return {};
  }, [layer, shapeRef.current]);

  const getFillProps = (shape: ShapeLayer | TextLayer) => {
    if (shape.fillType === 'image' && shape.fillPatternImage && img) {
      return patternProps;
    } else if (shape.fillType === 'gradient' && shape.gradient) {
      return gradientProps;
    } else if (shape.fillType === 'solid' || !shape.fillType) {
      return { fill: shape.fill };
    }
    return { fill: undefined };
  };

  if (layer.type === 'shape') {
    const shape = layer as ShapeLayer;
    const fillProps = getFillProps(shape);
    const strokeProps = {
      stroke: shape.stroke === 'transparent' ? undefined : shape.stroke,
      strokeWidth: shape.strokeWidth,
      lineJoin: 'round' as const, // Makes corners round for strokes
      lineCap: 'round' as const,
    };

    if (shape.shapeType === 'rect' || shape.shapeType === 'line') {
      return (
        <Rect
          {...commonProps}
          {...fillProps}
          {...strokeProps}
          ref={shapeRef as React.RefObject<Konva.Rect>}
          width={shape.width}
          height={shape.height}
          cornerRadius={shape.cornerRadius}
        />
      );
    }
    if (shape.shapeType === 'circle') {
      return (
        <Group
          {...commonProps}
          ref={shapeRef as React.RefObject<Konva.Group>}
          width={shape.width}
          height={shape.height}
        >
          <Circle
            {...fillProps}
            {...strokeProps}
            width={shape.width}
            height={shape.height}
            x={shape.width / 2}
            y={shape.height / 2}
          />
        </Group>
      );
    }

    if (shape.shapeType === 'custom' && shape.pathData) {
      const vb = shape.viewBox?.split(' ').map(Number) || [0, 0, 24, 24];
      const vbW = vb[2] || 24;
      const vbH = vb[3] || 24;

      return (
        <Group
          {...commonProps}
          ref={shapeRef as React.RefObject<Konva.Group>}
          clipFunc={shape.cornerRadius ? (ctx) => {
            // Start path for clip
            ctx.beginPath();
            // Clip rect at 0,0 locally with width/height and radius
            // Note: shape.width/height are the visual boundaries.
            // Konva's ctx corresponds to the node's local coordinate system.
            // Since commonProps sets offsetX/offsetY on the Group, (0,0) in local space is the top-left of the content relative to anchor.
            // However, we want the clip to align with the CONTENT.
            // If we draw content at (0,0), then clip should be at (0,0).

            // Use roundRect if available (standard canvas), fallback to rect
            if (typeof ctx.roundRect === 'function') {
              ctx.roundRect(0, 0, shape.width, shape.height, shape.cornerRadius);
            } else {
              // @ts-ignore
              if (ctx.roundRect) ctx.roundRect(0, 0, shape.width, shape.height, shape.cornerRadius);
              else ctx.rect(0, 0, shape.width, shape.height);
            }
            ctx.closePath();
          } : undefined}
        >
          <Path
            {...fillProps}
            {...strokeProps}
            data={shape.pathData}
            // Scale path to fit the container width/height
            scaleX={shape.width / vbW}
            scaleY={shape.height / vbH}
            x={0}
            y={0}
          />
        </Group>
      );
    }
    if (shape.shapeType === 'star') {
      return (
        <Group
          {...commonProps}
          ref={shapeRef as React.RefObject<Konva.Group>}
          width={shape.width}
          height={shape.height}
        >
          <Star
            {...fillProps}
            {...strokeProps}
            numPoints={5}
            innerRadius={shape.width / 4}
            outerRadius={shape.width / 2}
            x={shape.width / 2}
            y={shape.height / 2}
            cornerRadius={shape.cornerRadius}
          />
        </Group>
      )
    }

    const polyMap: Record<string, number> = { 'triangle': 3, 'pentagon': 5, 'hexagon': 6, 'octagon': 8 };
    if (polyMap[shape.shapeType]) {
      return (
        <Group
          {...commonProps}
          ref={shapeRef as React.RefObject<Konva.Group>}
          width={shape.width}
          height={shape.height}
        >
          <RegularPolygon
            {...fillProps}
            {...strokeProps}
            sides={polyMap[shape.shapeType]}
            radius={shape.width / 2}
            x={shape.width / 2}
            y={shape.height / 2}
            cornerRadius={shape.cornerRadius}
          />
        </Group>
      )
    }
  }

  if (layer.type === 'text') {
    const text = layer as TextLayer;
    const fillProps = getFillProps(text);
    return (
      <Text
        {...commonProps}
        {...fillProps}
        ref={shapeRef as React.RefObject<Konva.Text>}
        text={text.text}
        fontSize={text.fontSize}
        fontFamily={text.fontFamily}
        align={text.align}
        fontStyle={text.fontStyle}
        textDecoration={text.textDecoration}
        stroke={text.stroke}
        strokeWidth={text.strokeWidth}
        lineJoin="round"
        // approximate centering
        offsetX={text.text.length * text.fontSize * 0.3}
        offsetY={text.fontSize / 2}
      />
    );
  }

  if (layer.type === 'emoji') {
    const emoji = layer;
    return (
      <Text
        {...commonProps}
        ref={shapeRef as React.RefObject<Konva.Text>}
        text={emoji.text}
        fontSize={emoji.fontSize}
        align="center"
        offsetX={emoji.fontSize / 2}
        offsetY={emoji.fontSize / 2}
      />
    )
  }

  if (layer.type === 'image' && img) {
    const imgLayer = layer;
    return (
      <KonvaImage
        {...commonProps}
        ref={shapeRef as React.RefObject<Konva.Image>}
        image={img}
        width={imgLayer.width}
        height={imgLayer.height}
      />
    );
  }

  return null;
};

export default RenderLayer;

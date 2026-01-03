import React, { useState } from 'react';
import { useEditorStore } from '../../../store/editorStore';
import { Eye, EyeOff, Trash2, ArrowUp, ArrowDown, Type, Image as ImageIcon, Box, Star, Circle as CircleIcon, Pen, Lock, Unlock, Triangle, Hexagon, Octagon } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Layer } from '../../../types';

const LayerIcon = ({ layer }: { layer: Layer }) => {
    if (layer.type === 'text') return <Type size={14} />;
    if (layer.type === 'image') return <ImageIcon size={14} />;
    if (layer.type === 'shape') {
        const { shapeType } = layer;
        if (shapeType === 'rect') return <Box size={14} />;
        if (shapeType === 'circle') return <CircleIcon size={14} />;
        if (shapeType === 'star') return <Star size={14} />;
        if (shapeType === 'triangle') return <Triangle size={14} />;
        if (shapeType === 'hexagon') return <Hexagon size={14} />;
        if (shapeType === 'octagon') return <Octagon size={14} />;
        if (shapeType === 'pentagon') return <Hexagon size={14} />; // fallback
    }
    return <Box size={14} />;
}

const LayerList: React.FC = () => {
  const { layers, selectedLayerId, selectLayer, removeLayer, updateLayer, reorderLayer } = useEditorStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Reverse layers for display so top layer is at top of list
  const displayLayers = [...layers].reverse();

  const startEditing = (e: React.MouseEvent, layer: Layer) => {
      e.stopPropagation();
      setEditingId(layer.id);
      setEditName(layer.name);
  }

  const saveName = () => {
      if (editingId && editName.trim()) {
          updateLayer(editingId, { name: editName });
      }
      setEditingId(null);
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') saveName();
      if (e.key === 'Escape') setEditingId(null);
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Layers</h3>
      </div>
      
      <div className="flex-grow overflow-y-auto p-2 space-y-1">
        {displayLayers.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-xs">
                No layers added.
            </div>
        )}
        
        {displayLayers.map((layer) => (
          <div 
            key={layer.id}
            onClick={() => selectLayer(layer.id)}
            className={cn(
                "group flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm transition-colors border relative",
                selectedLayerId === layer.id 
                    ? "bg-brand-500/20 border-brand-500/50 text-white" 
                    : "bg-transparent border-transparent hover:bg-white/5 text-slate-300"
            )}
          >
            <div className="opacity-70">
                <LayerIcon layer={layer} />
            </div>
            
            {editingId === layer.id ? (
                <input 
                    autoFocus
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={saveName}
                    onKeyDown={handleKeyDown}
                    className="flex-grow bg-black/50 text-white px-1 py-0.5 rounded outline-none border border-brand-500/50"
                    onClick={(e) => e.stopPropagation()}
                />
            ) : (
                <span className="flex-grow truncate select-none flex items-center gap-2" title={layer.name}>
                    {layer.name}
                    <button 
                        onClick={(e) => startEditing(e, layer)}
                        className="opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity"
                    >
                        <Pen size={10} />
                    </button>
                </span>
            )}

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { locked: !layer.locked }); }}
                    className={cn("p-1 hover:text-white transition-colors", layer.locked ? "text-brand-400 opacity-100" : "text-slate-400")}
                    title={layer.locked ? "Unlock Layer" : "Lock Layer"}
                >
                    {layer.locked ? <Lock size={12} /> : <Unlock size={12} />}
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }); }}
                    className={cn("p-1 hover:text-white transition-colors", !layer.visible ? "text-slate-600" : "text-slate-400")}
                    title="Toggle Visibility"
                >
                    {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); reorderLayer(layer.id, 'up'); }}
                    className="p-1 hover:text-white text-slate-400"
                    title="Move Up"
                >
                    <ArrowUp size={12} />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); reorderLayer(layer.id, 'down'); }}
                    className="p-1 hover:text-white text-slate-400"
                    title="Move Down"
                >
                    <ArrowDown size={12} />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }}
                    className="p-1 hover:text-red-400 text-slate-400"
                    title="Delete Layer"
                >
                    <Trash2 size={12} />
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LayerList;

import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, Sparkles, Wand2, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { generateIconShape, isAIConfigured } from '../../lib/ai/geminiClient';
import { toast } from 'sonner';
import { readFileAsBase64, cn } from '../../lib/utils';

interface MagicIconModalProps {
  onClose: () => void;
}

const MagicIconModal: React.FC<MagicIconModalProps> = ({ onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { addLayer, canvasConfig } = useEditorStore();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          try {
              const base64 = await readFileAsBase64(e.target.files[0]);
              setSelectedImage(base64);
          } catch (error) {
              toast.error("Failed to read image");
          }
      }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !selectedImage) return;
    
    // Check for API Key
    if (!isAIConfigured()) {
        toast.error("Gemini API Key missing. Check .env file.");
        return;
    }

    setLoading(true);
    try {
        const result = await generateIconShape(prompt, selectedImage || undefined);
        if (result) {
            const size = 200;
            addLayer({
                id: Math.random().toString(36).substr(2, 9),
                type: 'shape',
                shapeType: 'custom',
                name: `AI: ${prompt}`,
                fillType: 'solid',
                fill: '#4f46e5',
                stroke: '#ffffff',
                strokeWidth: 0,
                visible: true,
                locked: false,
                x: canvasConfig.width / 2,
                y: canvasConfig.height / 2,
                // Center origin for rotation and proper placement
                offsetX: size / 2,
                offsetY: size / 2,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
                opacity: 1,
                width: size,
                height: size,
                pathData: result.path,
                viewBox: result.viewBox
            });
            toast.success("Magic Icon created!");
            onClose();
        } else {
            toast.error("Failed to generate icon. Try a different prompt.");
        }
    } catch (e) {
        console.error(e);
        toast.error("An error occurred.");
    } finally {
        setLoading(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-[400px] bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-2">
                    <Sparkles className="text-brand-400" size={18} />
                    <h3 className="text-sm font-semibold text-white">Magic Icon</h3>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                    <X size={18} />
                </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
                <div className="space-y-2">
                    <label className="text-xs text-slate-400 font-medium ml-1">Describe your icon</label>
                    <textarea 
                        className="w-full h-24 bg-black/30 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none resize-none placeholder:text-slate-600"
                        placeholder="e.g., A simple flat rocket ship, geometric fox head, lightning bolt..."
                        value={prompt}
                        autoFocus
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleGenerate();
                            }
                        }}
                    />
                </div>
                
                {/* Image Reference */}
                <div className="space-y-2">
                    <label className="text-xs text-slate-400 font-medium ml-1 flex justify-between">
                        <span>Reference Image (Optional)</span>
                        {selectedImage && <span className="text-brand-400 cursor-pointer hover:underline" onClick={() => setSelectedImage(null)}>Remove</span>}
                    </label>
                    
                    {!selectedImage ? (
                        <div 
                            onClick={() => fileRef.current?.click()}
                            className="h-16 border border-dashed border-white/10 rounded-lg bg-black/20 hover:bg-white/5 cursor-pointer flex items-center justify-center gap-2 text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            <ImageIcon size={16} />
                            <span className="text-xs">Click to upload reference</span>
                        </div>
                    ) : (
                         <div className="relative h-20 rounded-lg overflow-hidden border border-white/10 group">
                             <img src={selectedImage} alt="Reference" className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                             <button 
                                onClick={() => setSelectedImage(null)}
                                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                             >
                                 <Trash2 className="text-red-400" size={20} />
                             </button>
                         </div>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </div>

                <div className="bg-brand-500/10 border border-brand-500/20 rounded-lg p-3 flex gap-3 items-start">
                     <Wand2 size={16} className="text-brand-400 mt-0.5 shrink-0" />
                     <p className="text-[11px] text-brand-200/80 leading-relaxed">
                        AI will generate a unique vector shape based on your description. Simple, geometric prompts work best.
                     </p>
                </div>

                <button 
                    onClick={handleGenerate}
                    disabled={(!prompt.trim() && !selectedImage) || loading}
                    className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm font-semibold shadow-lg shadow-brand-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    {loading ? 'Generating...' : 'Generate Magic Icon'}
                </button>
            </div>
        </div>
    </div>,
    document.body
  );
};

export default MagicIconModal;

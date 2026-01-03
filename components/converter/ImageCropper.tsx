import React, { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { useConverterStore } from '../../store/converterStore';
import { readFileAsBase64 } from '../../lib/utils';
import { X, Check, Maximize, Scan } from 'lucide-react';

const ImageCropper: React.FC = () => {
  const { originalFile, setCroppedImage, setOriginalFile, setIsCropping } = useConverterStore();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [minZoomLimit, setMinZoomLimit] = useState(0.1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  React.useEffect(() => {
    if (originalFile) {
      readFileAsBase64(originalFile).then((src) => {
        setImageSrc(src);
        const img = new Image();
        img.onload = () => {
            // Calculate aspect ratio to determine the minimum zoom needed to fit the image perfectly
            // If aspect < 1 (Portrait), we need to zoom out to fit Height. Ratio = Width/Height.
            // If aspect > 1 (Landscape), we need to zoom out to fit Width. Ratio = Height/Width.
            // This ensures "Fit" zoom level makes the largest dimension equal to the crop box size.
            const ratio = Math.min(img.width, img.height) / Math.max(img.width, img.height);
            setMinZoomLimit(ratio);
        };
        img.src = src;
      });
    }
  }, [originalFile]);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async () => {
    try {
      if (!imageSrc || !croppedAreaPixels) return;
      
      const image = new Image();
      image.src = imageSrc;
      await new Promise(r => image.onload = r);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      // Clear with transparency
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Handle Zoom-Out (Padding) Logic
      // If we are zoomed out, we draw the full image centered in the canvas
      
      const imgRect = { x: 0, y: 0, w: image.width, h: image.height };
      const cropRect = { 
          x: croppedAreaPixels.x, 
          y: croppedAreaPixels.y, 
          w: croppedAreaPixels.width, 
          h: croppedAreaPixels.height 
      };

      // Calculate intersection of image and crop area
      const intersectX = Math.max(imgRect.x, cropRect.x);
      const intersectY = Math.max(imgRect.y, cropRect.y);
      const intersectW = Math.min(imgRect.x + imgRect.w, cropRect.x + cropRect.w) - intersectX;
      const intersectH = Math.min(imgRect.y + imgRect.h, cropRect.y + cropRect.h) - intersectY;

      if (intersectW > 0 && intersectH > 0) {
          // Destination coordinates on canvas (relative to crop area)
          const destX = intersectX - cropRect.x;
          const destY = intersectY - cropRect.y;

          ctx.drawImage(
              image,
              intersectX, intersectY, intersectW, intersectH, // Source (Image Coords)
              destX, destY, intersectW, intersectH // Dest (Canvas Coords)
          );
      }

      const base64Image = canvas.toDataURL('image/png');
      setCroppedImage(base64Image);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFit = () => {
     setZoom(minZoomLimit);
     setCrop({ x: 0, y: 0 });
  };

  const handleFill = () => {
      setZoom(1);
      setCrop({ x: 0, y: 0 });
  };

  const handleCancel = () => {
      setOriginalFile(null);
      setIsCropping(false);
  }

  if (!imageSrc) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md h-screen w-screen">
      <div className="w-full max-w-5xl h-[85vh] flex flex-col glass-panel rounded-2xl overflow-hidden relative mx-4">
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
            <h3 className="text-white font-medium ml-2">Crop & Resize</h3>
            <button 
                onClick={handleCancel}
                className="p-2 rounded-full bg-black/50 hover:bg-red-500/50 text-white transition-colors border border-white/10"
            >
                <X size={20} />
            </button>
        </div>

        {/* Cropper Area */}
        <div className="flex-grow relative bg-[#0f172a]" style={{ backgroundImage: 'radial-gradient(#ffffff10 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            restrictPosition={false} // Allows zooming out to create transparent padding
            minZoom={minZoomLimit} // Dynamically limited to fit image
            maxZoom={3}
            classes={{
                containerClassName: "bg-transparent",
                cropAreaClassName: "border border-white/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.8)] rounded-none"
            }}
          />
          
          {/* Helper Guidelines */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
              <div className="w-[1px] h-full bg-brand-500/30"></div>
              <div className="h-[1px] w-full bg-brand-500/30 absolute"></div>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="p-6 glass-panel border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 bg-[#141414]">
           
           <div className="flex items-center gap-4 w-full md:w-1/2">
             <div className="flex items-center">
                 <button 
                    onClick={handleFit}
                    className="p-2.5 rounded-l-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors"
                    title="Fit (Show All)"
                 >
                    <Maximize size={18} />
                 </button>
                 <button 
                    onClick={handleFill}
                    className="p-2.5 rounded-r-lg bg-white/5 hover:bg-white/10 border-y border-r border-white/10 border-l-0 text-slate-300 transition-colors"
                    title="Fill (Square Crop)"
                 >
                    <Scan size={18} />
                 </button>
             </div>
             
             <div className="flex flex-col flex-1 gap-2 relative">
                 <div className="flex justify-between text-xs text-slate-400">
                     <span>Zoom Out</span>
                     <span className="text-white font-mono font-medium absolute left-1/2 -translate-x-1/2 top-0">
                        {Math.round(zoom * 100)}%
                     </span>
                     <span>Zoom In</span>
                 </div>
                 <input
                   type="range"
                   value={zoom}
                   min={minZoomLimit}
                   max={3}
                   step={0.01}
                   aria-labelledby="Zoom"
                   onChange={(e) => setZoom(Number(e.target.value))}
                   className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-brand-500"
                 />
             </div>
           </div>

           <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={handleCancel}
                className="flex-1 md:flex-none px-6 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={createCroppedImage}
                className="flex-1 md:flex-none px-8 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-colors"
              >
                <Check size={18} />
                Confirm Crop
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;

import JSZip from 'jszip';
import { ExportSettings, PackageType } from '../types';
import { generateIco } from './image-processing/icoGenerator';
import { resizeImage } from './image-processing/resizer';

const RESIZE_MAP: Record<PackageType, number[]> = {
    essential: [16, 32, 180, 192, 512],
    complete: [16, 32, 48, 64, 96, 128, 180, 192, 256, 512]
};

export const exportManager = {
    generatePackage: async (sourceImage: Blob, settings: ExportSettings): Promise<Blob> => {
        const zip = new JSZip();
        const sizes = RESIZE_MAP[settings.packageType];
        
        // Create an Object URL for the source blob to use with the resizer
        const sourceUrl = URL.createObjectURL(sourceImage);

        try {
            const pngs: Record<number, Blob> = {};
            
            // 1. Process images sequentially to keep memory usage reasonable on main thread
            for (const size of sizes) {
                 // Use the pica-based resizer
                 const resizedBlob = await resizeImage(sourceUrl, size, size);
                 pngs[size] = resizedBlob;
                 
                 // Determine filename based on size/standard
                 let filename = `favicon-${size}x${size}.png`;
                 if (size === 180) filename = 'apple-touch-icon.png';
                 if (size === 192) filename = 'android-chrome-192x192.png';
                 if (size === 512) filename = 'android-chrome-512x512.png';
                 
                 zip.file(filename, resizedBlob);
            }

            // 2. Generate ICO (combining 16x16 and 32x32)
            if (pngs[16] && pngs[32]) {
                 const b16 = await pngs[16].arrayBuffer();
                 const b32 = await pngs[32].arrayBuffer();
                 const icoData = generateIco([
                     { width: 16, height: 16, data: new Uint8Array(b16) },
                     { width: 32, height: 32, data: new Uint8Array(b32) }
                 ]);
                 zip.file('favicon.ico', icoData);
            }

            // 3. Generate Manifest
            // We always generate a manifest as it's best practice for PWA/Android
            const manifest = {
                name: settings.appName || 'My App',
                short_name: settings.appShortName || 'App',
                icons: [
                    { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
                    { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" }
                ],
                theme_color: settings.themeColor || '#ffffff',
                background_color: settings.backgroundColor || '#ffffff',
                display: "standalone"
            };
            zip.file('site.webmanifest', JSON.stringify(manifest, null, 2));

            // 4. Generate the final ZIP blob
            const content = await zip.generateAsync({ type: 'blob' });
            return content;

        } catch (error) {
            console.error("Export generation failed:", error);
            throw error;
        } finally {
            // Clean up the object URL to avoid leaks
            URL.revokeObjectURL(sourceUrl);
        }
    }
};
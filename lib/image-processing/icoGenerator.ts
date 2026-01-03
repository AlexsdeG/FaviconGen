
/**
 * Simple ICO Generator
 * Based on the structure of .ico files
 */

interface PngData {
    width: number;
    height: number;
    data: Uint8Array; // The PNG file bytes
}

export function generateIco(images: PngData[]): Uint8Array {
    const count = images.length;
    const headerLen = 6;
    const entryLen = 16;
    const headerSize = headerLen + (count * entryLen);
    
    let totalSize = headerSize;
    for (const img of images) {
        totalSize += img.data.length;
    }
    
    const buffer = new Uint8Array(totalSize);
    const view = new DataView(buffer.buffer);
    
    // Write Header
    view.setUint16(0, 0, true); // Reserved
    view.setUint16(2, 1, true); // Type (1 = ICO)
    view.setUint16(4, count, true); // Count
    
    let offset = headerSize;
    
    for (let i = 0; i < count; i++) {
        const img = images[i];
        const entryOffset = headerLen + (i * entryLen);
        
        // Width (0 means 256)
        view.setUint8(entryOffset, img.width >= 256 ? 0 : img.width);
        // Height
        view.setUint8(entryOffset + 1, img.height >= 256 ? 0 : img.height);
        // Colors (0 = true color)
        view.setUint8(entryOffset + 2, 0);
        // Reserved
        view.setUint8(entryOffset + 3, 0);
        // Color Planes
        view.setUint16(entryOffset + 4, 1, true);
        // Bits per pixel
        view.setUint16(entryOffset + 6, 32, true);
        // Size of data
        view.setUint32(entryOffset + 8, img.data.length, true);
        // Offset
        view.setUint32(entryOffset + 12, offset, true);
        
        // Write Image Data
        buffer.set(img.data, offset);
        offset += img.data.length;
    }
    
    return buffer;
}

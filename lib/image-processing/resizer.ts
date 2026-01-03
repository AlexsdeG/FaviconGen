import pica from 'pica';

const picaInstance = pica();

export async function resizeImage(source: string | HTMLImageElement | HTMLCanvasElement, width: number, height: number): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  let img: HTMLImageElement;

  if (typeof source === 'string') {
      img = new Image();
      img.src = source;
      await new Promise(r => img.onload = r);
  } else if (source instanceof HTMLImageElement) {
      img = source;
  } else {
      // It's a canvas
      const fromCanvas = source;
       // Pica can resize from canvas to canvas
       return picaInstance.resize(fromCanvas, canvas)
         .then((result) => picaInstance.toBlob(result, 'image/png', 1.0));
  }

  return picaInstance.resize(img, canvas)
    .then((result) => picaInstance.toBlob(result, 'image/png', 1.0));
}

export const REQUIRED_SIZES = [16, 32, 48, 64, 96, 128, 180, 192, 256, 512];

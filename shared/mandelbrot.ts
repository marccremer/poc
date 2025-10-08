export interface MandelbrotTileInput {
  xStart: number; // left edge of region (real axis)
  yStart: number; // top edge of region (imaginary axis)
  width: number; // width of region in complex plane
  height: number; // height of region in complex plane
  imageWidth: number; // number of pixels horizontally
  imageHeight: number; // number of pixels vertically
  maxIterations: number;
}

export interface MandelbrotTileResult {
  xStart: number;
  yStart: number;
  imageWidth: number;
  imageHeight: number;
  data: number[]; // iteration counts (flattened row-major array)
}

/**
 * Computes Mandelbrot iterations for a region of the complex plane.
 * Each pixel’s value is the number of iterations before escape (or maxIterations if bounded).
 */
export function computeMandelbrotTile(input: MandelbrotTileInput): MandelbrotTileResult {
  const { xStart, yStart, width, height, imageWidth, imageHeight, maxIterations } = input;

  const data = new Array(imageWidth * imageHeight);

  for (let py = 0; py < imageHeight; py++) {
    const y0 = yStart - (py / imageHeight) * height;

    for (let px = 0; px < imageWidth; px++) {
      const x0 = xStart + (px / imageWidth) * width;

      let x = 0;
      let y = 0;
      let iter = 0;

      while (x * x + y * y <= 4 && iter < maxIterations) {
        const xtemp = x * x - y * y + x0;
        y = 2 * x * y + y0;
        x = xtemp;
        iter++;
      }

      data[py * imageWidth + px] = iter;
    }
  }

  return {
    xStart,
    yStart,
    imageWidth,
    imageHeight,
    data,
  };
}

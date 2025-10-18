<template>

  <v-card class="pa-4" elevation="4" rounded="xl">
    <v-card-title>Mandelbrot Set ({{ width }}×{{ height }}, {{ tilesPerRow * tilesPerRow }} tiles)</v-card-title>
    <v-card-text>
      <v-row>
        <canvas ref="canvasRef" :width="width" :height="height" class="d-block mx-auto"
          style="border-radius: 8px; border: 1px solid #444"></canvas>
        <v-list :items="items" item-title="name" item-value="id">
        </v-list>
      </v-row>
    </v-card-text>
    <v-card-actions>
      <v-btn color="primary" @click="renderMandelbrot" :loading="isRendering"> Render </v-btn>
      <v-btn color="secondary" @click="zoom" :loading="isRendering"> Zoom </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { computeMandelbrotTile } from "~/shared/mandelbrot";

const canvasRef = ref<HTMLCanvasElement | null>(null);
const isRendering = ref(false);
const items = [
  {
    name: 'Item #1',
    id: 1,
  },
  {
    name: 'Item #2',
    id: 2,
  },
  {
    name: 'Item #3',
    id: 3,
  },
]
const width = 600;
const height = 600;
const tilesPerRow = 100; // 10×10 = 100 tiles
const tileSize = width / tilesPerRow;
const maxIterations = 50000;

// Mandelbrot region state
const xMin = ref(-2.4);
const xMax = ref(1.0);
const yMin = ref(-1.5);
const yMax = ref(1.5);

function iterationToColor(iter: number, maxIter: number): [number, number, number] {
  if (iter === maxIter) return [0, 0, 0];
  const t = iter / maxIter;
  const hue = Math.floor(360 * t);
  const s = 100,
    l = 50;
  const a = (s * Math.min(l / 100, 1 - l / 100)) / 100;
  const f = (n: number) => {
    const k = (n + hue / 30) % 12;
    const color = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round((color / 100) * 255);
  };
  return [f(0), f(8), f(4)];
}

function renderMandelbrot() {

  if (!canvasRef.value) return;
  isRendering.value = true;
  const ctx = canvasRef.value.getContext("2d")!;
  const imageData = ctx.createImageData(width, height);

  const jobs: Array<ReturnType<typeof computeMandelbrotTile>> = [];

  for (let ty = 0; ty < tilesPerRow; ty++) {
    for (let tx = 0; tx < tilesPerRow; tx++) {
      const xStart = xMin.value + (tx * (xMax.value - xMin.value)) / tilesPerRow;
      const yStart = yMax.value - (ty * (yMax.value - yMin.value)) / tilesPerRow;
      const tileWidth = (xMax.value - xMin.value) / tilesPerRow;
      const tileHeight = (yMax.value - yMin.value) / tilesPerRow;

      jobs.push(
        computeMandelbrotTile({
          xStart,
          yStart,
          width: tileWidth,
          height: tileHeight,
          imageWidth: tileSize,
          imageHeight: tileSize,
          maxIterations,
        })
      );
    }
  }

  Promise.all(jobs).then((tiles) => {

    for (let i = 0; i < tiles.length; i++) {
      const tx = i % tilesPerRow;
      const ty = Math.floor(i / tilesPerRow);
      const tile = tiles[i];

      for (let py = 0; py < tile.imageHeight; py++) {
        for (let px = 0; px < tile.imageWidth; px++) {
          const iter = tile.data[py * tile.imageWidth + px];
          const [r, g, b] = iterationToColor(iter, maxIterations);

          const globalX = tx * tileSize + px;
          const globalY = ty * tileSize + py;
          const idx = (globalY * width + globalX) * 4;

          imageData.data[idx] = r;
          imageData.data[idx + 1] = g;
          imageData.data[idx + 2] = b;
          imageData.data[idx + 3] = 255;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    isRendering.value = false;
  });
}

// Zoom into the center of the current view by  factor 2
function zoom(factor = 0.9) {
  const xCenter = (xMin.value + xMax.value) / 2;
  const yCenter = (yMin.value + yMax.value) / 2;
  const xHalf = (xMax.value - xMin.value) / (2 * factor);
  const yHalf = (yMax.value - yMin.value) / (2 * factor);

  xMin.value = xCenter - xHalf;
  xMax.value = xCenter + xHalf;
  yMin.value = yCenter - yHalf;
  yMax.value = yCenter + yHalf;

  renderMandelbrot();
}
</script>

<style scoped>
canvas {
  image-rendering: pixelated;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #ccc;
  /* light gray border */
  border-top-color: #3498db;
  /* blue top */
  border-radius: 50%;
  /* make it round */
  animation: spin 1s linear infinite;
  margin: 50px auto;
  /* center horizontally */
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

<template>
  <v-container>
    <v-row>
      <v-col>
        <h1>Web Worker Example</h1>
        <v-number-input
          reverse
          controlVariant="stacked"
          label="input"
          :max="100"
          v-model="current"
          @keydown.enter="
            () => {
              if (current !== null) {
                values.push(current);
                current = null;
              }
            }
          "
          :min="1"
          required
          :hideInput="false"
          :inset="false"
        ></v-number-input>
        <p>Values: {{ values.join(", ") }}</p>
        <v-btn @click="calculateMean">calculate mean</v-btn>
        <v-btn @click="primeLocal">calculate mean Local</v-btn>

        <p>Mean: {{ mean }}</p>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { createDispatcher } from "~/shared/package";
import MyWorker from "../shared/worker?worker&inline";
import type { WorkerEventMap } from "../shared/worker";
function computePrimes(limit: number): number[] {
  const primes: number[] = [];

  for (let i = 2; i <= limit; i++) {
    let isPrime = true;

    // Naive primality test (O(n^2) complexity)
    for (let j = 2; j * j <= i; j++) {
      if (i % j === 0) {
        isPrime = false;
        break;
      }
    }

    if (isPrime) primes.push(i);
  }

  return primes;
}
const limit = 20000000;
function primeLocal() {
  const result = computePrimes(limit);
  mean.value = result;
}
const values = ref<number[]>([]);
const current = ref<number | null>(null);
const mean = ref<number | null>(null);
const createWorker = () => new MyWorker();
const worker = createDispatcher<WorkerEventMap>(createWorker);
async function calculateMean() {
  try {
    const input = toRaw(values.value);
    values.value = [];
    worker.computePrimes(limit).then((result) => {
      console.log("Primes computed:", result.length);
      mean.value = result;
    });
  } catch (error) {
    console.error("Error computing mean:", error);
    mean.value = error;
  }
}
</script>

import { computeMandelbrotTile } from "./mandelbrot";
import type { FunctionRecord, WorkerMessage, WorkerResponse } from "./package";
import { generateEventId } from "./utils";
const workerID = generateEventId();
/**
 * Performs a CPU-intensive task for benchmarking:
 * computes all prime numbers up to the given limit.
 *
 * @param limit - The upper bound for prime computation.
 * @returns An array of all found prime numbers.
 */
function computePrimes(limit: number): number[] {
  const primes: number[] = [];

  for (let i = 2; i <= limit; i++) {
    let isPrime = true;

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

const functions = {
  add: (a: number, b: number) => a + b,
  greet: (name: string) => `Hello, ${name}!`,
  mean: (numbers: number[]) => {
    if (numbers.length === 0) throw new Error("Cannot compute mean of empty array");
    const sum = numbers.reduce((acc, val) => acc + val, 0);
    return sum / numbers.length;
  },
  fibonacci: (n: number): number => {
    if (n < 0) throw new Error("Negative arguments not supported");
    if (n <= 1) return n;
    let a = 0,
      b = 1,
      temp: number;
    for (let i = 2; i <= n; i++) {
      temp = a + b;
      a = b;
      b = temp;
    }
    return b;
  },
  computePrimes,
  computeMandelbrotTile,
} as const satisfies FunctionRecord;

self.onmessage = async <Msg extends WorkerMessage<typeof functions>>(event: MessageEvent<Msg>) => {
  const { id, method, args } = event.data;

  let response: WorkerResponse<typeof functions>;
  console.log(`Worker received message:`, event.data);
  try {
    type Method = typeof method;
    type FN = typeof functions;
    const fn = functions[method] as FN[Method];

    const result = await fn(...args);

    response = { id, result, workerID } as WorkerResponse<FN>;
  } catch (err: any) {
    response = {
      id,
      workerID,
      error: err instanceof Error ? err.message : String(err),
    } as WorkerResponse<FN>;
  }

  postMessage(response);
};

export type WorkerEventMap = typeof functions;

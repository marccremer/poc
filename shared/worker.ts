import type { FunctionRecord, WorkerMessage, WorkerResponse } from "./package";

const functions = {
  add: (a: number, b: number) => a + b,
  greet: (name: string) => `Hello, ${name}!`,
} as const satisfies FunctionRecord;

self.onmessage = async <Msg extends WorkerMessage<typeof functions>>(
  event: MessageEvent<Msg>
) => {
  const { id, method, args } = event.data;

  let response: WorkerResponse<typeof functions>;
  console.log(`Worker received message:`, event.data);
  try {
    // Narrow by casting event.data to the specific branch of the union
    type Method = typeof method;
    type FN = typeof functions;
    const fn = functions[method] as FN[Method];

    // Now args matches Parameters<typeof fn>
    const result = await fn(...args);

    response = { id, result } as WorkerResponse<FN>;
  } catch (err: any) {
    response = {
      id,
      error: err instanceof Error ? err.message : String(err),
    } as WorkerResponse<FN>;
  }

  postMessage(response);
};

export type WorkerEventMap = typeof functions;

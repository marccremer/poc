type AsyncReturnType<T extends (...args: any[]) => any> = Awaited<
  ReturnType<T>
>;
// Keep the keys literal instead of widening to string
export type FunctionRecord = {
  [K in string]: (...args: any[]) => any;
};

type WorkerDispatcher<T extends FunctionRecord> = {
  [K in keyof T]: (...args: Parameters<T[K]>) => Promise<AsyncReturnType<T[K]>>;
};
type BaseWorker = new (options?: { name?: string }) => Worker;

class MockWorker implements Worker {
  onmessage: ((this: Worker, ev: MessageEvent<any>) => any) | null = null;
  onmessageerror: ((this: Worker, ev: MessageEvent) => any) | null = null;
  onerror: ((this: AbstractWorker, ev: ErrorEvent) => any) | null = null;

  constructor(private scriptUrl?: string) {
    console.log(`MockWorker created with script: ${scriptUrl}`);
  }

  postMessage(message: any) {
    console.log("postMessage called with:", message);
    worker
      .add(2)
      .then((res) => {
        if (this.onmessage) {
          const message = new MessageEvent("base", { data: res });
          this.onmessage(message);
        }
      })
      .catch((err) => {
        if (this.onerror) {
          const message = new ErrorEvent("bad", { error: err });
          this.onerror(message);
        }
      });
  }

  terminate() {
    console.log("terminate called");
  }

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) {
    console.log(
      `addEventListener called with type: ${type}, listener:`,
      listener,
      "options:",
      options
    );
  }

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ) {
    console.log(
      `removeEventListener called with type: ${type}, listener:`,
      listener,
      "options:",
      options
    );
  }

  dispatchEvent(event: Event): boolean {
    console.log("dispatchEvent called with:", event);
    return true; // return true just to satisfy the interface
  }
}
function generateEventId() {
  return crypto.randomUUID(); // modern browsers, very fast
}
export type WorkerMessage<FN extends FunctionRecord> = {
  [K in keyof FN]: {
    id: string;
    method: K;
    args: Parameters<FN[K]>;
  };
}[keyof FN];

export type WorkerResponse<FN extends FunctionRecord> = {
  [K in keyof FN]:
    | { id: string; result: Awaited<ReturnType<FN[K]>>; error?: undefined }
    | { id: string; result?: undefined; error: string };
}[keyof FN];
export function createDispatcher<T extends FunctionRecord>(
  worker: Worker
): WorkerDispatcher<T> {
  const pending = new Map<string, { resolve: Function; reject: Function }>();

  // Only set these once
  worker.onmessage = (event) => {
    const { error, result, id } = event.data as WorkerResponse<any>;
    const handlers = pending.get(id);
    if (!handlers) return;
    const { resolve, reject } = handlers;
    pending.delete(id);

    if (error) reject(new Error(error));
    else resolve(result);
  };

  worker.onerror = (err) => {
    // Reject all pending promises if worker errors
    pending.forEach(({ reject }) => reject(err));
    pending.clear();
  };

  return new Proxy({} as WorkerDispatcher<T>, {
    get(_, prop: string) {
      return (...args: any[]) => {
        return new Promise((resolve, reject) => {
          const id = generateEventId();
          pending.set(id, { resolve, reject });
          worker.postMessage({ id, method: prop, args });
        });
      };
    },
  });
}

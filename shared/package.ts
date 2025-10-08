import { generateEventId } from "./utils";

type AsyncReturnType<T extends (...args: any[]) => any> = Awaited<ReturnType<T>>;
// Keep the keys literal instead of widening to string
export type FunctionRecord = {
  [K in string]: (...args: any[]) => any;
};

type WorkerDispatcher<T extends FunctionRecord> = {
  [K in keyof T]: (...args: Parameters<T[K]>) => Promise<AsyncReturnType<T[K]>>;
};

export type WorkerMessage<FN extends FunctionRecord> = {
  [K in keyof FN]: {
    id: string;
    method: K;
    args: Parameters<FN[K]>;
  };
}[keyof FN];

export type WorkerResponse<FN extends FunctionRecord> = {
  [K in keyof FN]:
    | { id: string; workerID: string; result: Awaited<ReturnType<FN[K]>>; error?: undefined }
    | { id: string; workerID: string; result?: undefined; error: string };
}[keyof FN];
const poolSize = 4;
const workerLimit = 4;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
type Job = { id: string; resolve: Function; reject: Function; workerIndex: number };
export function createDispatcher<T extends FunctionRecord>(createWorker: () => Worker): WorkerDispatcher<T> {
  const pool = Array.from({ length: poolSize }, () => createWorker());

  const activeJobs = new Map<Worker, Job[]>();
  let nextWorkerIndex = 0;

  async function getNextWorker(resolve: Function, reject: Function, id: string) {
    const worker = pool[nextWorkerIndex];
    const activeJob = activeJobs.get(worker) || [];
    if (activeJob.length < workerLimit) {
      activeJobs.set(worker, [...activeJob, { id, resolve, reject, workerIndex: nextWorkerIndex }]);
      return worker;
    }
    const load = activeJobs
      .values()
      .flatMap((jobs) => jobs)
      .reduce((a, _) => a + 1, 0);
    if (load >= poolSize * workerLimit) await sleep(10);
    nextWorkerIndex = (nextWorkerIndex + 1) % poolSize;
    return getNextWorker(resolve, reject, id);
  }
  const messageHandler = (worker: Worker) => (event: MessageEvent) => {
    const { error, result, id, workerID } = event.data as WorkerResponse<any>;
    const jobs = activeJobs.get(worker) || [];
    const job = jobs.find((job) => job.id === id);
    if (!job) {
      console.error(jobs.map((j) => j.workerIndex + ":" + j.id).join(", "));
      throw new Error(`Job with id ${id} and workerID ${workerID} not found in active jobs`);
    }
    const handlers = job;
    if (!handlers) return;
    const { resolve, reject } = handlers;
    activeJobs.set(
      worker,
      jobs.filter((j) => j.id !== id)
    );

    if (error) reject(new Error(error));
    else resolve(result);
  };
  const errorHandler = (worker: Worker) => (err: ErrorEvent) => {
    const jobs = activeJobs.get(worker) || [];
    jobs.forEach(({ reject }) => reject(err));
    activeJobs.set(worker, []);
  };

  pool.forEach((worker) => {
    worker.addEventListener("message", messageHandler(worker));
    worker.addEventListener("error", errorHandler(worker));
  });

  return new Proxy({} as WorkerDispatcher<T>, {
    get(_, prop: string) {
      return (...args: any[]) => {
        return new Promise((resolve, reject) => {
          const id = generateEventId();
          console.log(`Main thread sending message:`, { id, method: prop, args });
          getNextWorker(resolve, reject, id).then((worker) => {
            worker.postMessage({ id, method: prop, args });
          });
        });
      };
    },
  });
}

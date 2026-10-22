// Reads the text in a picture ON THIS DEVICE. The picture is never uploaded: only the reader itself
// (a small program and its English word list) is downloaded, once, from a public CDN.

type Worker = { recognize: (image: string) => Promise<{ data: { text: string } }> };

let workerPromise: Promise<Worker> | null = null;
let queue: Promise<unknown> = Promise.resolve();

function timeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

export function readText(dataUrl: string): Promise<string> {
  const run = async () => {
    workerPromise ??= import("tesseract.js").then((m) => m.createWorker("eng") as unknown as Promise<Worker>);
    let worker: Worker;
    try {
      worker = await timeout(workerPromise, 120_000);
    } catch (e) {
      workerPromise = null; // allow a retry later
      throw e;
    }
    const { data } = await timeout(worker.recognize(dataUrl), 90_000);
    return data.text ?? "";
  };
  const next = queue.then(run, run); // one picture at a time
  queue = next.catch(() => undefined);
  return next;
}

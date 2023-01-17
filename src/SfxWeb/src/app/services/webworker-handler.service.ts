import { Injectable } from '@angular/core';
import { IWorkerMessage, registeredFunctions } from '../Common/webworkerConfig';

@Injectable({
  providedIn: 'root'
})
export class WebworkerHandlerService {
  private inFlightRequests: Record<string, (value: any) => void > = {};
  private webWorker: Worker;

  constructor() {
    if (typeof Worker !== 'undefined') {
      const worker = new Worker(new URL('../app.worker.ts', import.meta.url), { type: 'module'});
      this.webWorker = worker;
      worker.onmessage = (event) => {
        const data = event.data as IWorkerMessage
        this.inFlightRequests[data.messageId](data.data);
        delete this.inFlightRequests[data.messageId];
      };
    };
   }

  public requestFunction<T>(functionName: string, data: unknown): Promise<T> {
    if(this.webWorker) {
      const id = Math.random().toString();
      let resolver;
      const f = new Promise<T>(resolve => {
        resolver = resolve;
      });

      this.inFlightRequests[id] = resolver;
      this.webWorker.postMessage({functionName: functionName, messageId: id, data});
      return f;
    }else{
      return registeredFunctions[functionName](data);
    }
  }
}

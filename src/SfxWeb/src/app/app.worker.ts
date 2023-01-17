/// <reference lib="webworker" />

import { IWorkerMessage, registeredFunctions } from "./Common/webworkerConfig";

self.addEventListener('message', (event) => {
  console.log(event)
  const data = (event as any).data as IWorkerMessage;

  const result = registeredFunctions[data.functionName](data.data);
  postMessage({
    messageId: data.messageId,
    data: result
  });
});

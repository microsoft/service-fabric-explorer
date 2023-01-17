import { getSimultaneousEventsForEvent } from '../Models/eventstore/rcaEngine';

export type registeredFunctions = 'rca'

export const registeredFunctions: Record<registeredFunctions, Function> = {
  'rca': getSimultaneousEventsForEvent
}

export interface IWorkerMessage {
  messageId: string;
  functionName: registeredFunctions;
  data: unknown;
}

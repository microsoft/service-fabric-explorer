export interface INodeEvent {
    kind: string;
    nodeName: string;
    timeStamp: string;
    raw: Record<string, any>;
}

export const NodeMessageThrottlingStarted = 'NodeMessageThrottlingStarted';
export const NodeMessageThrottlingEnded = 'NodeMessageThrottlingEnded';
export const NodeMessageThrottlingEventKinds = [NodeMessageThrottlingStarted, NodeMessageThrottlingEnded];
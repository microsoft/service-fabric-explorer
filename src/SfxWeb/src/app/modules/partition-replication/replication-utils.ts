import { ITimedReplication } from './replica-status-container/replica-status-container.component';

export function generateReplicationDeltas(datapoints: ITimedReplication[]) {
  return datapoints.map((value, index) => {
    if (index > 0) {
      const previous = datapoints[index - 1];
      const duration = (value.date.getTime() - previous.date.getTime()) / 1000;
      const diff = (+value.LastAppliedReplicationSequenceNumber - +previous.LastAppliedReplicationSequenceNumber) / duration;
      return {
        delta: diff,
        date: value.date
      };
    } else {
      return {
        delta: 0,
        date: value.date
      };
    }
  }).splice(1); // remove first one since it will always have a delta of 0 given its one data point
}

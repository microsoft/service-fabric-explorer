import { PointOptionsObject, SeriesLineOptions, SeriesOptionsType } from 'highcharts';
import { IReplicationTimeLineData, ITimedReplication } from './replica-status-container/replica-status-container.component';

export function generateReplicationDeltas(datapoints: IReplicationTimeLineData[]): SeriesOptionsType[] {
  const series: Record<string, SeriesLineOptions> = {}

  datapoints.forEach((value, index) => {
    value.dataPoints.forEach((dataPoint, i) => {
      if(!(dataPoint.ReplicaId in series)) {
        series[dataPoint.ReplicaId] = {
          data: [],
          type: 'line',
          name: dataPoint.ReplicaId
        }
      }

      let point = {
        x: value.date.getTime(),
        y: 0
      };
      if (index > 0) {
        const previous = datapoints[index - 1].dataPoints[i];
        const duration = (value.date.getTime() - datapoints[index - 1].date.getTime()) / 1000;
        const diff = (+dataPoint.LastAppliedReplicationSequenceNumber - +previous.LastAppliedReplicationSequenceNumber) / duration;
        point =  {
          y: diff,
          x: value.date.getTime()
        };
      }

      series[dataPoint.ReplicaId].data.push(point);
    })

  })
  // remove first one since it will always have a delta of 0 given its one data point
  return Object.keys(series).map(key => {
    series[key].data.splice(0, 1);
    return series[key];
  })
}

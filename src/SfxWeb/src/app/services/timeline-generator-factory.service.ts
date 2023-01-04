import { Injectable } from '@angular/core';
import { ClusterTimelineGenerator, NodeTimelineGenerator, ApplicationTimelineGenerator, PartitionTimelineGenerator, RepairTaskTimelineGenerator, TimeLineGeneratorBase } from '../Models/eventstore/timelineGenerators';
import { EventType } from '../modules/event-store/event-store/event-store.component';

@Injectable({
  providedIn: 'root'
})
export class TimelineGeneratorFactoryService {

  private clusterGenerator?: ClusterTimelineGenerator;
  private nodeGenerator?: NodeTimelineGenerator;
  private appGenerator?: ApplicationTimelineGenerator;
  private partitionGenerator?: PartitionTimelineGenerator;
  private repairGenerator?: RepairTaskTimelineGenerator;

  public getTimelineGenerator(type: EventType): TimeLineGeneratorBase<any> {
    switch (type) {
      case EventType.Cluster:
        if (!this.clusterGenerator) {
          this.clusterGenerator = new ClusterTimelineGenerator();
        }
        return this.clusterGenerator;
      
      case EventType.Node:
        if (!this.nodeGenerator) {
          this.nodeGenerator = new NodeTimelineGenerator();
        }
        return this.nodeGenerator;
      
      case EventType.Application:
        if (!this.appGenerator) {
          this.appGenerator = new ApplicationTimelineGenerator();
        }
        return this.appGenerator;
      
      case EventType.Partition:
        if (!this.partitionGenerator) {
          this.partitionGenerator = new PartitionTimelineGenerator();
        }
        return this.partitionGenerator;
          
      case EventType.RepairTask:
        if (!this.repairGenerator) {
          this.repairGenerator = new RepairTaskTimelineGenerator();
        }
        return this.repairGenerator;
          
      default:
        return null;
    }
  }
}

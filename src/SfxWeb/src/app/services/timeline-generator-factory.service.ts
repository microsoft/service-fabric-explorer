import { Injectable } from '@angular/core';
import { ClusterTimelineGenerator, NodeTimelineGenerator, ApplicationTimelineGenerator, PartitionTimelineGenerator, RepairTaskTimelineGenerator, TimeLineGeneratorBase, ServiceTimelineGenerator, ReplicaTimelineGenerator } from '../Models/eventstore/timelineGenerators';
import { EventType } from '../modules/event-store/event-store/event-store.component';

@Injectable({
  providedIn: 'root'
})
export class TimelineGeneratorFactoryService {

  private clusterGenerator?: ClusterTimelineGenerator;
  private nodeGenerator?: NodeTimelineGenerator;
  private appGenerator?: ApplicationTimelineGenerator;
  private serviceGenerator?: ServiceTimelineGenerator;
  private partitionGenerator?: PartitionTimelineGenerator;
  private replicaGenerator?: ReplicaTimelineGenerator;
  private repairGenerator?: RepairTaskTimelineGenerator;

  public getTimelineGenerator(type: EventType): TimeLineGeneratorBase<any> {
    switch (type) {
      case "Cluster":
        if (!this.clusterGenerator) {
          this.clusterGenerator = new ClusterTimelineGenerator();
        }
        return this.clusterGenerator;
      
      case "Node":
        if (!this.nodeGenerator) {
          this.nodeGenerator = new NodeTimelineGenerator();
        }
        return this.nodeGenerator;
      
      case "Application":
        if (!this.appGenerator) {
          this.appGenerator = new ApplicationTimelineGenerator();
        }
        return this.appGenerator;
      
      case "Service":
        if (!this.serviceGenerator) {
          this.serviceGenerator = new ServiceTimelineGenerator();
        }
        return this.serviceGenerator;
      
      case "Partition":
        if (!this.partitionGenerator) {
          this.partitionGenerator = new PartitionTimelineGenerator();
        }
        return this.partitionGenerator;
      
      case "Replica":
        if (!this.replicaGenerator) {
          this.replicaGenerator = new ReplicaTimelineGenerator();
        }
        return this.replicaGenerator;
      
      case "RepairTask":
        if (!this.repairGenerator) {
          this.repairGenerator = new RepairTaskTimelineGenerator();
        }
        return this.repairGenerator;
          
      default:
        return null;
    }
  }
}

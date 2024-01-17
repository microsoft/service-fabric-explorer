import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ReplicaOnPartition } from '../Models/DataModels/Replica';
import { Node } from '../Models/DataModels/Node';
import { Observable, Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-replica-map',
  templateUrl: './replica-map.component.html',
  styleUrls: ['./replica-map.component.scss']
})
export class ReplicaMapComponent implements OnInit, OnChanges {

  @Input() replicas: ReplicaOnPartition[] = [];

  $ReplicaMap = new Subject<ReplicaOnPartition[]>();
  $map: Observable<Record<string, ReplicaOnPartition[]>>;

  map: Record<string, ReplicaOnPartition[]> = {};
  nodes: Node[] = [];

  constructor(private data: DataService) { }

  ngOnChanges(): void {

    this.map = {};
    this.replicas.forEach(replica => {
      const arr = this.map[replica.raw.NodeName] || [];
      arr.push(replica);
      this.map[replica.raw.NodeName] = arr;
    })
  }

  ngOnInit(): void {
    this.$map = this.$ReplicaMap.pipe(switchMap(replicas => {
      return this.
    }))
  }

}

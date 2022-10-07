import { Component, OnInit } from '@angular/core';
import { IParallelChartData } from 'src/app/modules/concurrent-events-visualization/timeseries/timeseries.component';
import { DataService } from 'src/app/services/data.service';
import { Observable, forkJoin } from 'rxjs';

@Component({
  selector: 'app-naming-viewer',
  templateUrl: './naming-viewer.component.html',
  styleUrls: ['./naming-viewer.component.scss']
})
export class NamingViewerComponent implements OnInit {

  dataset: IParallelChartData = {
    dataSet: [
      {
        x: 0,
        y: 1
      },
      {
        x: 2,
        y: 2
      },
      {
        x: 3,
        y: 3
      }
    ],
    series: [
      {
        name: 'Average Latency',
        xProperty: 'x',
        yProperty: 'y'
      },
      {
        name: 'Request Volume',
        xProperty: 'x',
        yProperty: 'y'
      }
    ]
  }

  constructor(private dataService: DataService) { }

  ngOnInit(): void {
    this.dataService.getService("System", "System/NamingService").subscribe(app => {
      const ess = [];
      app.partitions.ensureInitialized().subscribe(_ => {
        forkJoin(app.partitions.collection.map(partition => {
          console.log(partition.id);
          const es = this.dataService.getPartitionEventData(partition.id);
          ess.push(es);
          return es.eventsList.refresh();
        })).subscribe(() => {
          console.log(ess.map(e => e.collection))
        })
      })
    })
  }
}

import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { IEventStoreData } from 'src/app/modules/event-store/event-store/event-store.component';

@Component({
    selector: 'app-nodes-events',
    templateUrl: './events.component.html',
    styleUrls: ['./events.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class EventsComponent implements OnInit {
  data = inject(DataService);


  listEventStoreData!: IEventStoreData<any, any> [];

  ngOnInit() {
    this.listEventStoreData = [
      this.data.getNodeThrottlingEventData()
    ];
  }

}

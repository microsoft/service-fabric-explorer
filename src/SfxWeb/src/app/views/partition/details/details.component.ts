import { Component, OnInit, inject } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { PartitionBaseControllerDirective } from '../PartitionBase';

@Component({
    selector: 'app-details',
    templateUrl: './details.component.html',
    styleUrls: ['./details.component.scss'],
    standalone: false
})
export class DetailsComponent extends PartitionBaseControllerDirective {
  protected data: DataService = inject(DataService);
  private settings = inject(SettingsService);

  setup() {

  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    return forkJoin([
      this.partition.loadInformation.refresh(messageHandler),
      this.partition.health.refresh(messageHandler),
      this.partition.replicas.refresh(messageHandler),
    ]);
  }
}

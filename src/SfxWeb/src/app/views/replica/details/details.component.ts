import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { ReplicaBaseControllerDirective } from '../ReplicaBase';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { DataService } from 'src/app/services/data.service';

@Component({
    selector: 'app-details',
    templateUrl: './details.component.html',
    styleUrls: ['./details.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class DetailsComponent extends ReplicaBaseControllerDirective {
  protected data: DataService = inject(DataService);

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    return this.replica.detail.refresh(messageHandler);
  }
}

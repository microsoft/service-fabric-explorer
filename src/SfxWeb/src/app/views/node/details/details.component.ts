import { Component, inject } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { Observable, forkJoin } from 'rxjs';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { SettingsService } from 'src/app/services/settings.service';
import { NodeBaseControllerDirective } from '../NodeBase';

@Component({
    selector: 'app-details',
    templateUrl: './details.component.html',
    styleUrls: ['./details.component.scss'],
    standalone: false
})
export class DetailsComponent extends NodeBaseControllerDirective {
  protected data: DataService = inject(DataService);
  private settings = inject(SettingsService);

  setup() {
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    return forkJoin([
      this.node.loadInformation.refresh(messageHandler),
    ]);
  }
}

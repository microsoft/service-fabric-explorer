import { Component, OnInit, Injector } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { ImageStore } from 'src/app/Models/DataModels/ImageStore';
import { SettingsService } from 'src/app/services/settings.service';
import { BaseController } from 'src/app/ViewModels/BaseController';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-imagestore',
  templateUrl: './imagestore.component.html',
  styleUrls: ['./imagestore.component.scss']
})
export class ImagestoreComponent extends BaseController {

  imageStore: ImageStore;

  constructor(public data: DataService, injector: Injector, public settings: SettingsService) {
    super(injector);
   }

  setup() {
    this.imageStore = new ImageStore(this.data);
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return this.imageStore.refresh(messageHandler);
  }
}

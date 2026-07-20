import { Component, OnInit, inject } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { ImageStore } from 'src/app/Models/DataModels/ImageStore';
import { SettingsService } from 'src/app/services/settings.service';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-imagestore',
    templateUrl: './imagestore.component.html',
    styleUrls: ['./imagestore.component.scss'],
    standalone: false
})
export class ImagestoreComponent extends BaseControllerDirective {
  data = inject(DataService);
  settings = inject(SettingsService);


  imageStore: ImageStore;

  setup() {
    this.imageStore = new ImageStore(this.data);
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return this.imageStore.refresh(messageHandler);
  }
}

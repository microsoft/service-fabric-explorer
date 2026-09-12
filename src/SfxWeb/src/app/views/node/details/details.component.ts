import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { Observable, forkJoin } from 'rxjs';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { SettingsService } from 'src/app/services/settings.service';
import { NodeBaseControllerDirective } from '../NodeBase';
import { ExperienceService } from 'src/app/services/experience.service';

@Component({
    selector: 'app-details',
    templateUrl: './details.component.html',
    styleUrls: ['./details.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class DetailsComponent extends NodeBaseControllerDirective {
  public experience = inject(ExperienceService);
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

import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { ApplicationTypeGroup } from 'src/app/Models/DataModels/ApplicationType';
import { mergeMap } from 'rxjs/operators';
import { forkJoin, Observable } from 'rxjs';
import { ApplicationTypeBaseControllerDirective } from '../ApplicationTypeBase';
import { ExperienceService } from 'src/app/services/experience.service';

@Component({
    selector: 'app-details',
    templateUrl: './details.component.html',
    styleUrls: ['./details.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class DetailsComponent extends ApplicationTypeBaseControllerDirective {
  public experience = inject(ExperienceService);
  protected data: DataService = inject(DataService);

  appTypeName!: string;
  appTypeGroup!: ApplicationTypeGroup;

  setup() { }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return forkJoin(this.appTypeGroup.appTypes.map(appType => appType.serviceTypes.refresh(messageHandler).pipe(mergeMap(() => {
      return forkJoin(appType.serviceTypes.collection.map(serviceType => serviceType.manifest.refresh(messageHandler)));
    }))));
  }

}

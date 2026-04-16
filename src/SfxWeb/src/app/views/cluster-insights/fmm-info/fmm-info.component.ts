import { Component, Injector } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';
import { IRawFailoverManagerManagerInformation } from 'src/app/Models/RawDataTypes';
import { RestClientService } from 'src/app/services/rest-client.service';
import { DataService } from 'src/app/services/data.service';

@Component({
    selector: 'app-fmm-info',
    templateUrl: './fmm-info.component.html',
    styleUrls: ['./fmm-info.component.scss'],
    standalone: false
})
export class FmmInfoComponent extends BaseControllerDirective {
  fmmInfo: IRawFailoverManagerManagerInformation;
  isLoading = true;
  isFmmEstimate = false;

  override fixedRefreshIntervalMs = 65000; // 65 seconds

  constructor(private restClientService: RestClientService, private dataService: DataService, injector: Injector) {
    super(injector);
  }

  refresh(): Observable<any> {
    this.isLoading = true;
    return this.restClientService.getFailoverManagerManagerInformation().pipe(
      map(data => {
        this.fmmInfo = data;
        this.isLoading = false;
      }),
      catchError(() => this.estimateFmmNode())
    );
  }

  private estimateFmmNode(): Observable<any> {
    return this.dataService.getNodes(true).pipe(
      map(nodeCollection => {
        const fmmNode = nodeCollection.getLikelyFmmNode();
        if (fmmNode) {
          this.fmmInfo = {
            NodeName: fmmNode.name,
            NodeId: fmmNode.raw.Id,
            NodeInstanceId: fmmNode.raw.InstanceId
          };
          this.isFmmEstimate = true;
        }
        this.isLoading = false;
      }),
      catchError(() => {
        this.isLoading = false;
        return of(null);
      })
    );
  }
}
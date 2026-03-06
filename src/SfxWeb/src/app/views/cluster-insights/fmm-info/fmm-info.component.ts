import { Component, Injector } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';
import { NodeStatusConstants } from 'src/app/Common/Constants';
import { IRawFailoverManagerManagerInformation } from 'src/app/Models/RawDataTypes';
import { RestClientService } from 'src/app/services/rest-client.service';

@Component({
  selector: 'app-fmm-info',
  templateUrl: './fmm-info.component.html',
  styleUrls: ['./fmm-info.component.scss']
})
export class FmmInfoComponent extends BaseControllerDirective {
  fmmInfo: IRawFailoverManagerManagerInformation;
  isLoading = true;
  isFmmEstimate = false;

  override fixedRefreshIntervalMs = 60000; // 60 seconds

  constructor(private restClientService: RestClientService, injector: Injector) {
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
    return this.restClientService.getNodes().pipe(
      map(nodes => {
        const upNodes = nodes.filter(node => node.NodeStatus === NodeStatusConstants.Up);
        if (upNodes.length > 0) {
          let lowest = upNodes[0];
          
          // FMM is on the node with the lowest NodeId
          upNodes.forEach(node => {
            if (parseInt(node.Id.Id, 16) < parseInt(lowest.Id.Id, 16)) {
              lowest = node;
            }
          });
          this.fmmInfo = {
            NodeName: lowest.Name,
            NodeId: lowest.Id,
            NodeInstanceId: lowest.InstanceId
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
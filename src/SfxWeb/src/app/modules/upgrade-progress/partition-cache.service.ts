import { Injectable, inject } from '@angular/core';
import { Observable, Subject, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { IRawSafetyCheckDescription } from 'src/app/Models/RawDataTypes';
import { DataService } from 'src/app/services/data.service';
import { MessageService, MessageSeverity } from 'src/app/services/message.service';
import { RestClientService } from 'src/app/services/rest-client.service';
import { RoutesService } from 'src/app/services/routes.service';
import { IPartitionData } from './safety-checks/safety-checks.component';

@Injectable({
  providedIn: 'root'
})
export class PartitionCacheService {
  private dataService = inject(DataService);
  private restClientService = inject(RestClientService);
  private messageService = inject(MessageService);


  partitions: Record<string, IPartitionData> = {};
  public partitionDataChanges: Subject<string> = new Subject();

  checkCache(partition: string) {
    return partition in this.partitions;
  }

  ensureInitialCache(check: IRawSafetyCheckDescription) {
    if (!this.checkCache(check.SafetyCheck.PartitionId)) {
      this.partitions[check.SafetyCheck.PartitionId] = {
        loading: 'unstarted',
        ...check
      };
  }

  }

  getPartitionInfo(id: string, check: IRawSafetyCheckDescription): Observable<IPartitionData> {
    this.partitions[id].loading = 'inflight';

    return forkJoin({
      partition: this.restClientService.getPartitionById(id),
      serviceName: this.restClientService.getServiceNameInfo(id),
    }).pipe(
      switchMap(({ partition, serviceName }) =>
        this.restClientService.getApplicationNameInfo(serviceName.Id).pipe(
          switchMap(applicationName => {
            const app$ = applicationName.Id === 'System'
              ? this.dataService.getSystemApp()
              : this.dataService.getApp(applicationName.Id);

            return app$.pipe(
              map(app => {
                this.partitions[id] = {
                  ...check,
                  serviceName: serviceName.Id,
                  applicationName: applicationName.Id,
                  partition: partition.PartitionInformation.Id,
                  link: RoutesService.getPartitionViewPath(app.raw.TypeName, applicationName.Id,
                    serviceName.Id, partition.PartitionInformation.Id),
                  applicationLink: RoutesService.getAppViewPath(app.raw.TypeName, applicationName.Id),
                  serviceLink: RoutesService.getServiceViewPath(app.raw.TypeName, applicationName.Id, serviceName.Id),
                  loading: 'loaded',
                };

                return this.partitions[id];
              })
            );
          })
        )
      ),
      catchError(() => {
        this.messageService.showMessage('There was an issue getting partition info', MessageSeverity.Err);
        this.partitions[id] = {
          ...check,
          loading: 'failed',
        };

        return of(this.partitions[id]);
      }),
      tap(() => this.partitionDataChanges.next(id)),
    );
  }
}

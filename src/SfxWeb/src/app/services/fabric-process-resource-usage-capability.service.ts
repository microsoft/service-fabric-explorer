import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { ResponseMessageHandlers } from '../Common/ResponseMessageHandlers';
import { FABRIC_PROCESS_RESOURCE_USAGE_EVENT_KIND } from '../Models/eventstore/FabricProcessResourceUsage';
import { DataService } from './data.service';

interface ICapabilityProbeResult {
  isSupported: boolean;
  isDefinitive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FabricProcessResourceUsageCapabilityService {
  private static readonly probeWindowMs = 60 * 1000;

  private readonly data = inject(DataService);
  private probe?: Observable<boolean>;

  isSupported = false;

  ensureSupported(): Observable<boolean> {
    if (this.probe) {
      return this.probe;
    }

    this.probe = this.data.getClusterManifest().pipe(
      take(1),
      switchMap(manifest => {
        if (!manifest.isEventStoreEnabled) {
          return of<ICapabilityProbeResult>({ isSupported: false, isDefinitive: true });
        }

        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - FabricProcessResourceUsageCapabilityService.probeWindowMs);

        return this.data.restClient.getNodeEvents(
          startTime,
          endTime,
          undefined,
          [FABRIC_PROCESS_RESOURCE_USAGE_EVENT_KIND],
          ResponseMessageHandlers.silentResponseMessageHandler
        ).pipe(
          map(() => ({ isSupported: true, isDefinitive: true })),
          catchError(error => of({
            isSupported: false,
            isDefinitive: this.isUnsupportedEventError(error)
          }))
        );
      }),
      catchError(() => of<ICapabilityProbeResult>({ isSupported: false, isDefinitive: false })),
      tap(result => {
        this.isSupported = result.isSupported;
        if (!result.isDefinitive) {
          this.probe = undefined;
        }
      }),
      map(result => result.isSupported),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    return this.probe;
  }

  private isUnsupportedEventError(error: unknown): boolean {
    return error instanceof HttpErrorResponse
      && error.status === 400
      && error.error?.Error?.Code === 'E_INVALIDARG';
  }
}

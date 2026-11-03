import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { defer, Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { ResponseMessageHandlers } from '../Common/ResponseMessageHandlers';
import { FABRIC_PROCESS_RESOURCE_USAGE_EVENT_KIND } from '../Models/eventstore/FabricProcessResourceUsage';
import { DataService } from './data.service';

@Injectable({
  providedIn: 'root'
})
export class FabricProcessResourceUsageCapabilityService {
  private static readonly probeWindowMs = 60 * 1000;
  private static readonly transientRetryCooldownMs = 60 * 1000;

  private readonly data = inject(DataService);
  private probe?: Observable<boolean>;
  private definitiveResult?: boolean;
  private transientFailureAt?: number;

  isSupported = false;

  get canRetry(): boolean {
    return this.definitiveResult === undefined
      && this.probe === undefined
      && (this.transientFailureAt === undefined
        || Date.now() - this.transientFailureAt >= FabricProcessResourceUsageCapabilityService.transientRetryCooldownMs);
  }

  ensureSupported(): Observable<boolean> {
    if (this.definitiveResult !== undefined) {
      return of(this.definitiveResult);
    }

    if (this.probe) {
      return this.probe;
    }

    this.probe = this.probeOnce().pipe(
      tap({
        next: isSupported => {
          this.transientFailureAt = undefined;
          this.definitiveResult = isSupported;
          this.isSupported = isSupported;
        },
        error: () => {
          this.transientFailureAt = Date.now();
        }
      }),
      finalize(() => {
        this.probe = undefined;
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    return this.probe;
  }

  private probeOnce(): Observable<boolean> {
    return defer(() => this.data.getClusterManifest().pipe(
      take(1),
      switchMap(manifest => {
        if (!manifest.isEventStoreEnabled) {
          return of(false);
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
          map(() => true),
          catchError(error => this.isUnsupportedEventError(error)
            ? of(false)
            : throwError(() => error))
        );
      })
    ));
  }

  private isUnsupportedEventError(error: unknown): boolean {
    return error instanceof HttpErrorResponse
      && error.status === 400
      && error.error?.Error?.Code === 'E_INVALIDARG';
  }
}

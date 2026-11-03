import { ChangeDetectionStrategy, Component, LOCALE_ID, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import {
  CapacityReleaseLevel,
  IRawCapacityReleaseEstimate
} from 'src/app/Models/RawDataTypes';
import { RestClientService } from 'src/app/services/rest-client.service';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';

export interface CapacityReleaseEstimationRow {
  metric: string;
  totalCapacity: bigint;
  none: bigint | null;
  minor: bigint | null;
  major: bigint | null;
}

function parseCapacity(value: string, metricName: string, field: string): bigint {
  const message = `Invalid ${field} for capacity release metric "${metricName}": expected an int64 string.`;
  if (typeof value !== 'string' || !/^-?\d+$/.test(value)) {
    throw new Error(message);
  }

  const capacity = BigInt(value);
  if (BigInt.asIntN(64, capacity) !== capacity) {
    throw new Error(message);
  }

  return capacity;
}

export function createCapacityReleaseRows(estimates: IRawCapacityReleaseEstimate[]): CapacityReleaseEstimationRow[] {
  const rows = new Map<string, CapacityReleaseEstimationRow>();

  for (const estimate of estimates) {
    const totalCapacity = parseCapacity(estimate.TotalCapacity, estimate.MetricName, 'TotalCapacity');
    const usedCapacity = parseCapacity(estimate.UsedCapacity, estimate.MetricName, 'UsedCapacity');
    let row = rows.get(estimate.MetricName);
    if (!row) {
      row = {
        metric: estimate.MetricName,
        totalCapacity,
        none: null,
        minor: null,
        major: null
      };
      rows.set(estimate.MetricName, row);
    }

    switch (estimate.Level) {
      case CapacityReleaseLevel.None:
        row.none = usedCapacity;
        break;
      case CapacityReleaseLevel.Minor:
        row.minor = usedCapacity;
        break;
      case CapacityReleaseLevel.Major:
        row.major = usedCapacity;
        break;
    }
  }

  return Array.from(rows.values()).sort((left, right) => left.metric.localeCompare(right.metric));
}

export function getCapacityClass(totalCapacity: bigint, usedCapacity: bigint | null): string {
  if (usedCapacity === null) {
    return '';
  }

  return usedCapacity <= totalCapacity ? 'within-capacity' : 'over-capacity';
}

@Component({
  selector: 'app-capacity-release',
  templateUrl: './capacity-release.component.html',
  styleUrls: ['./capacity-release.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class CapacityReleaseComponent extends BaseControllerDirective {
  private restClient = inject(RestClientService);
  private locale = inject(LOCALE_ID);

  currentLevel: CapacityReleaseLevel | null = null;
  rows: CapacityReleaseEstimationRow[] = [];
  loading = false;
  levelError = '';
  estimationError = '';

  refresh(messageHandler?: IResponseMessageHandler): Observable<void> {
    this.loading = true;
    this.levelError = '';
    this.estimationError = '';

    return forkJoin({
      level: this.restClient.getCapacityReleaseLevel(messageHandler).pipe(catchError(() => {
        this.levelError = 'The current capacity release level is unavailable.';
        return of(null);
      })),
      estimates: this.restClient.getCapacityReleaseEstimate(messageHandler).pipe(
        map(createCapacityReleaseRows),
        catchError((error: unknown) => {
          this.estimationError = 'Capacity release estimation is currently unavailable.';
          if (error instanceof Error) {
            this.estimationError += ` ${error.message}`;
          }
          return of(null);
        }))
    }).pipe(
      map(({ level, estimates }) => {
        this.currentLevel = level?.Level ?? null;
        this.rows = estimates ?? [];
      }),
      finalize(() => this.loading = false));
  }

  formatCapacity(value: bigint | null): string {
    return value === null ? '' : value.toLocaleString(this.locale);
  }

  capacityClass(totalCapacity: bigint, usedCapacity: bigint | null): string {
    return getCapacityClass(totalCapacity, usedCapacity);
  }

}

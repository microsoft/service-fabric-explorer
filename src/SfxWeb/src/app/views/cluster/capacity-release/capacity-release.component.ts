import { ChangeDetectionStrategy, Component, LOCALE_ID, OnInit, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import {
  CapacityReleaseLevel,
  IRawCapacityReleaseEstimate
} from 'src/app/Models/RawDataTypes';
import { RestClientService } from 'src/app/services/rest-client.service';

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

export function getCapacityReleaseWarning(level: CapacityReleaseLevel): string {
  switch (level) {
    case CapacityReleaseLevel.Minor:
      return 'Setting capacity release to Minor may introduce an unavailability risk for DropToZero services.';
    case CapacityReleaseLevel.Major:
      return 'Setting capacity release to Major always causes data loss for DropToMin services and creates a high risk of unavailability for DropToMin services.';
    default:
      return '';
  }
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
export class CapacityReleaseComponent implements OnInit {
  private dialogRef = inject<MatDialogRef<CapacityReleaseComponent>>(MatDialogRef);
  private restClient = inject(RestClientService);
  private locale = inject(LOCALE_ID);

  readonly levels = [
    CapacityReleaseLevel.None,
    CapacityReleaseLevel.Minor,
    CapacityReleaseLevel.Major
  ];

  currentLevel: CapacityReleaseLevel | null = null;
  pendingLevel: CapacityReleaseLevel | null = null;
  rows: CapacityReleaseEstimationRow[] = [];
  loading = false;
  updating = false;
  levelError = '';
  estimationError = '';
  updateError = '';
  successMessage = '';

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading = true;
    this.levelError = '';
    this.estimationError = '';

    forkJoin({
      level: this.restClient.getCapacityReleaseLevel().pipe(catchError(() => {
        this.levelError = 'The current capacity release level is unavailable.';
        return of(null);
      })),
      estimates: this.restClient.getCapacityReleaseEstimate().pipe(
        map(createCapacityReleaseRows),
        catchError((error: unknown) => {
          this.estimationError = 'Capacity release estimation is currently unavailable.';
          if (error instanceof Error) {
            this.estimationError += ` ${error.message}`;
          }
          return of(null);
        }))
    }).pipe(finalize(() => this.loading = false)).subscribe(({ level, estimates }) => {
      this.currentLevel = level?.Level ?? null;
      this.rows = estimates ?? [];
    });
  }

  requestLevel(level: CapacityReleaseLevel): void {
    this.pendingLevel = level;
    this.updateError = '';
    this.successMessage = '';
  }

  cancelLevelChange(): void {
    this.pendingLevel = null;
    this.updateError = '';
  }

  confirmLevelChange(): void {
    if (this.pendingLevel === null || this.updating) {
      return;
    }

    const requestedLevel = this.pendingLevel;
    this.updating = true;
    this.updateError = '';
    this.restClient.setCapacityReleaseLevel(requestedLevel)
      .pipe(finalize(() => this.updating = false))
      .subscribe({
        next: () => {
          this.successMessage = `Capacity release level set to ${requestedLevel}.`;
          this.pendingLevel = null;
          this.refresh();
        },
        error: () => {
          this.updateError = `Failed to set capacity release level to ${requestedLevel}.`;
        }
      });
  }

  warning(level: CapacityReleaseLevel): string {
    return getCapacityReleaseWarning(level);
  }

  formatCapacity(value: bigint | null): string {
    return value === null ? '' : value.toLocaleString(this.locale);
  }

  capacityClass(totalCapacity: bigint, usedCapacity: bigint | null): string {
    return getCapacityClass(totalCapacity, usedCapacity);
  }

  close(): void {
    this.dialogRef.close();
  }
}

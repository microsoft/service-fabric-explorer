import { CommonModule } from '@angular/common';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import {
  CapacityReleaseLevel,
  IRawCapacityReleaseEstimate
} from 'src/app/Models/RawDataTypes';
import { RestClientService } from 'src/app/services/rest-client.service';
import {
  CapacityReleaseComponent,
  createCapacityReleaseRows,
  getCapacityClass,
  getCapacityReleaseWarning
} from './capacity-release.component';

describe('CapacityReleaseComponent helpers', () => {
  it('groups and pivots estimates by metric and level', () => {
    const estimates: IRawCapacityReleaseEstimate[] = [
      { Level: CapacityReleaseLevel.Major, MetricName: 'Memory', UsedCapacity: '120', TotalCapacity: '100' },
      { Level: CapacityReleaseLevel.None, MetricName: 'CPU', UsedCapacity: '90', TotalCapacity: '100' },
      { Level: CapacityReleaseLevel.Minor, MetricName: 'CPU', UsedCapacity: '75', TotalCapacity: '100' },
      { Level: CapacityReleaseLevel.Major, MetricName: 'CPU', UsedCapacity: '60', TotalCapacity: '100' },
      { Level: CapacityReleaseLevel.None, MetricName: 'Memory', UsedCapacity: '80', TotalCapacity: '100' }
    ];

    const rows = createCapacityReleaseRows(estimates);

    expect(rows).toEqual([
      { metric: 'CPU', totalCapacity: 100n, none: 90n, minor: 75n, major: 60n },
      { metric: 'Memory', totalCapacity: 100n, none: 80n, minor: null, major: 120n }
    ]);
    expect(getCapacityClass(rows[0].totalCapacity, rows[0].none)).toBe('within-capacity');
  });

  it('classifies estimates relative to total capacity', () => {
    expect(getCapacityClass(100n, 99n)).toBe('within-capacity');
    expect(getCapacityClass(100n, 100n)).toBe('within-capacity');
    expect(getCapacityClass(100n, 101n)).toBe('over-capacity');
    expect(getCapacityClass(100n, null)).toBe('');
  });

  const invalidCapacities: { field: 'UsedCapacity' | 'TotalCapacity'; value: string }[] = [
    { field: 'UsedCapacity', value: '' },
    { field: 'UsedCapacity', value: '1.5' },
    { field: 'TotalCapacity', value: 'invalid' },
    { field: 'TotalCapacity', value: '9223372036854775808' }
  ];

  it.each(invalidCapacities)('rejects invalid $field value "$value"', ({ field, value }) => {
    const estimate: IRawCapacityReleaseEstimate = {
      Level: CapacityReleaseLevel.None,
      MetricName: 'CPU',
      UsedCapacity: '90',
      TotalCapacity: '100',
      [field]: value
    };

    expect(() => createCapacityReleaseRows([estimate])).toThrow(`Invalid ${field}`);
  });

  it('returns the SFE confirmation warnings', () => {
    expect(getCapacityReleaseWarning(CapacityReleaseLevel.None)).toBe('');
    expect(getCapacityReleaseWarning(CapacityReleaseLevel.Minor))
      .toBe('Setting capacity release to Minor may introduce an unavailability risk for DropToZero services.');
    expect(getCapacityReleaseWarning(CapacityReleaseLevel.Major))
      .toBe('Setting capacity release to Major always causes data loss for DropToMin services and creates a high risk of unavailability for DropToMin services.');
  });
});

describe('CapacityReleaseComponent', () => {
  let fixture: ComponentFixture<CapacityReleaseComponent>;
  let component: CapacityReleaseComponent;
  let restClient: {
    getCapacityReleaseLevel: ReturnType<typeof vi.fn>;
    getCapacityReleaseEstimate: ReturnType<typeof vi.fn>;
    setCapacityReleaseLevel: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    restClient = {
      getCapacityReleaseLevel: vi.fn(() => of({ Level: CapacityReleaseLevel.Minor })),
      getCapacityReleaseEstimate: vi.fn(() => of([
        { Level: CapacityReleaseLevel.Minor, MetricName: 'CPU', UsedCapacity: '75', TotalCapacity: '100' }
      ])),
      setCapacityReleaseLevel: vi.fn(() => of({}))
    };

    await TestBed.configureTestingModule({
      declarations: [CapacityReleaseComponent],
      imports: [CommonModule],
      providers: [
        { provide: LOCALE_ID, useValue: 'en-US' },
        { provide: RestClientService, useValue: restClient },
        { provide: MatDialogRef, useValue: { close: vi.fn() } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CapacityReleaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the current level and estimation matrix', () => {
    expect(component.currentLevel).toBe(CapacityReleaseLevel.Minor);
    expect(component.rows).toEqual([
      { metric: 'CPU', totalCapacity: 100n, none: null, minor: 75n, major: null }
    ]);
  });

  it('renders large int64 capacities without rounding', () => {
    restClient.getCapacityReleaseEstimate.mockReturnValue(of([
      {
        Level: CapacityReleaseLevel.Major,
        MetricName: 'CPU',
        UsedCapacity: '9223372036854775807',
        TotalCapacity: '9223372036854775806'
      }
    ]));
    component.refresh();
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();

    expect(component.rows[0].totalCapacity).toBe(9223372036854775806n);
    expect(component.rows[0].major).toBe(9223372036854775807n);
    const element: HTMLElement = fixture.nativeElement;
    const cells = element.querySelectorAll('tbody td');
    expect(cells[1].textContent?.trim()).toBe('9,223,372,036,854,775,806');
    expect(cells[4].textContent?.trim()).toBe('9,223,372,036,854,775,807');
    expect(cells[4].classList.contains('over-capacity')).toBe(true);
  });

  it('shows an estimation error for malformed capacity strings', () => {
    restClient.getCapacityReleaseEstimate.mockReturnValue(of([
      { Level: CapacityReleaseLevel.Minor, MetricName: 'CPU', UsedCapacity: 'invalid', TotalCapacity: '100' }
    ]));
    component.refresh();
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();

    expect(component.rows).toEqual([]);
    expect(component.estimationError).toContain('Invalid UsedCapacity');
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('.error-message')?.textContent).toContain('Invalid UsedCapacity');
  });

  it('sets the selected level and refreshes the data', () => {
    component.requestLevel(CapacityReleaseLevel.Major);
    component.confirmLevelChange();

    expect(restClient.setCapacityReleaseLevel).toHaveBeenCalledWith(CapacityReleaseLevel.Major);
    expect(restClient.getCapacityReleaseLevel).toHaveBeenCalledTimes(2);
    expect(component.successMessage).toBe('Capacity release level set to Major.');
    expect(component.pendingLevel).toBeNull();
  });
});

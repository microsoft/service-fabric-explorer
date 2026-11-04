import { CommonModule } from '@angular/common';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import {
  CapacityReleaseLevel,
  IRawCapacityReleaseEstimate
} from 'src/app/Models/RawDataTypes';
import { RestClientService } from 'src/app/services/rest-client.service';
import { MessageService } from 'src/app/services/message.service';
import { RefreshService } from 'src/app/services/refresh.service';
import {
  CapacityReleaseComponent,
  createCapacityReleaseRows,
  getCapacityClass
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

});

describe('CapacityReleaseComponent', () => {
  let fixture: ComponentFixture<CapacityReleaseComponent>;
  let component: CapacityReleaseComponent;
  let refreshSubject: Subject<number>;
  let restClient: {
    getCapacityReleaseLevel: ReturnType<typeof vi.fn>;
    getCapacityReleaseEstimate: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    restClient = {
      getCapacityReleaseLevel: vi.fn(() => of({ Level: CapacityReleaseLevel.Minor })),
      getCapacityReleaseEstimate: vi.fn(() => of([
        { Level: CapacityReleaseLevel.Minor, MetricName: 'CPU', UsedCapacity: '75', TotalCapacity: '100' }
      ]))
    };
    refreshSubject = new Subject<number>();

    await TestBed.configureTestingModule({
      declarations: [CapacityReleaseComponent],
      imports: [CommonModule],
      providers: [
        { provide: LOCALE_ID, useValue: 'en-US' },
        { provide: RestClientService, useValue: restClient },
        { provide: ActivatedRoute, useValue: { params: of({}), snapshot: {} } },
        { provide: Router, useValue: {} },
        { provide: RefreshService, useValue: { refreshSubject } },
        { provide: MessageService, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CapacityReleaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads and refreshes the current level and matrix while the view is open', () => {
    expect(component.currentLevel).toBe(CapacityReleaseLevel.Minor);
    expect(component.rows).toEqual([
      { metric: 'CPU', totalCapacity: 100n, none: null, minor: 75n, major: null }
    ]);

    restClient.getCapacityReleaseLevel.mockReturnValue(of({ Level: CapacityReleaseLevel.Major }));
    restClient.getCapacityReleaseEstimate.mockReturnValue(of([
      { Level: CapacityReleaseLevel.Major, MetricName: 'CPU', UsedCapacity: '60', TotalCapacity: '100' }
    ]));
    refreshSubject.next(0);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();

    expect(component.currentLevel).toBe(CapacityReleaseLevel.Major);
    expect(component.rows).toEqual([
      { metric: 'CPU', totalCapacity: 100n, none: null, minor: null, major: 60n }
    ]);
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('b')?.textContent).toBe('Major');
    expect(element.querySelector('tbody td:last-child')?.textContent?.trim()).toBe('60');
    expect(restClient.getCapacityReleaseLevel).toHaveBeenCalledTimes(2);
    expect(restClient.getCapacityReleaseEstimate).toHaveBeenCalledTimes(2);

    fixture.destroy();
    refreshSubject.next(1);
    expect(restClient.getCapacityReleaseLevel).toHaveBeenCalledTimes(2);
    expect(restClient.getCapacityReleaseEstimate).toHaveBeenCalledTimes(2);
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
    refreshSubject.next(0);
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
    refreshSubject.next(0);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();

    expect(component.rows).toEqual([]);
    expect(component.currentLevel).toBe(CapacityReleaseLevel.Minor);
    expect(component.estimationError).toContain('Invalid UsedCapacity');
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('.error-message')?.textContent).toContain('Invalid UsedCapacity');
  });

  it('renders inline without dialog framing or action buttons', () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('button, .action-modal, .modal-header, .modal-footer')).toBeNull();
    expect(element.textContent).toContain('Current capacity release level:');
    expect(element.textContent).toContain('Capacity Release Estimation');
    expect(restClient.getCapacityReleaseLevel).toHaveBeenCalledOnce();
    expect(restClient.getCapacityReleaseEstimate).toHaveBeenCalledOnce();
  });
});

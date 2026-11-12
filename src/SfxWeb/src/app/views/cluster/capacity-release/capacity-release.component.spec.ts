import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import {
  CapacityReleaseLevel,
  IRawCapacityReleaseEstimate
} from 'src/app/Models/RawDataTypes';
import { RestClientService } from 'src/app/services/rest-client.service';
import { MessageService, MessageSeverity } from 'src/app/services/message.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { CollapseContainerComponent } from 'src/app/shared/component/collapse-container/collapse-container.component';
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
  let messageService: { showMessage: ReturnType<typeof vi.fn> };
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
    messageService = { showMessage: vi.fn() };

    await TestBed.configureTestingModule({
      declarations: [CapacityReleaseComponent, CollapseContainerComponent],
      imports: [CommonModule],
      providers: [
        { provide: LOCALE_ID, useValue: 'en-US' },
        { provide: RestClientService, useValue: restClient },
        { provide: ActivatedRoute, useValue: { params: of({}), snapshot: {} } },
        { provide: Router, useValue: {} },
        { provide: RefreshService, useValue: { refreshSubject } },
        { provide: MessageService, useValue: messageService }
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
    expect(element.querySelector('tbody td:last-child .capacity-value')?.textContent).toBe('60');
    expect(element.querySelector('tbody td:last-child .capacity-status')?.textContent).toBe('Within capacity');
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
    expect(cells[4].querySelector('.capacity-value')?.textContent).toBe('9,223,372,036,854,775,807');
    expect(cells[4].querySelector('.capacity-status')?.textContent).toBe('Over capacity');
    expect(cells[2].querySelector('.capacity-status')).toBeNull();
    expect(cells[4].classList.contains('over-capacity')).toBe(true);
  });

  it('reports malformed capacity strings through the message service and preserves the valid level', () => {
    restClient.getCapacityReleaseEstimate.mockReturnValue(of([
      { Level: CapacityReleaseLevel.Minor, MetricName: 'CPU', UsedCapacity: 'invalid', TotalCapacity: '100' }
    ]));
    refreshSubject.next(0);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();

    expect(component.rows).toEqual([]);
    expect(component.currentLevel).toBe(CapacityReleaseLevel.Minor);
    expect(messageService.showMessage).toHaveBeenCalledWith(
      expect.stringContaining('Invalid UsedCapacity'),
      MessageSeverity.Err,
      'Capacity release estimation');
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('b')?.textContent).toBe('Minor');
    expect(element.querySelector('table, .error-message')).toBeNull();
  });

  it.each(['level', 'estimates'])('preserves available data when the $0 query fails', query => {
    const request = query === 'level' ? restClient.getCapacityReleaseLevel : restClient.getCapacityReleaseEstimate;
    request.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    refreshSubject.next(0);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('[data-cy=capacityReleaseDetails]')).not.toBeNull();
    if (query === 'level') {
      expect(element.querySelector('b')).toBeNull();
      expect(element.querySelector('table')).not.toBeNull();
    } else {
      expect(element.querySelector('b')?.textContent).toBe('Minor');
      expect(element.querySelector('table, h3')).toBeNull();
    }
    expect(messageService.showMessage).not.toHaveBeenCalled();
  });

  it('hides the panel when both queries fail and recovers on a later refresh', () => {
    restClient.getCapacityReleaseLevel.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    restClient.getCapacityReleaseEstimate.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    refreshSubject.next(0);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('[data-cy=capacityReleaseDetails]')).toBeNull();

    restClient.getCapacityReleaseLevel.mockReturnValue(of({ Level: CapacityReleaseLevel.Major }));
    refreshSubject.next(1);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();

    expect(element.querySelector('b')?.textContent).toBe('Major');
    expect(element.querySelector('table')).toBeNull();
  });

  it('distinguishes a valid empty estimation response from an unavailable query', () => {
    restClient.getCapacityReleaseEstimate.mockReturnValue(of([]));
    refreshSubject.next(0);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('No capacity release estimates were returned.');
    expect(element.querySelector('table')).toBeNull();
  });

  it('renders inline without dialog framing or action buttons', () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('button:not([aria-expanded]), input, select, .action-modal, .modal-header, .modal-footer')).toBeNull();
    expect(element.querySelector('table')?.classList.contains('detail-table')).toBe(true);
    expect(element.querySelector('table')?.getAttribute('aria-labelledby')).toBe('capacityReleaseEstimationTitle');
    expect(element.textContent).toContain('Current capacity release level:');
    expect(element.textContent).toContain('Capacity Release Estimation');
    expect(restClient.getCapacityReleaseLevel).toHaveBeenCalledOnce();
    expect(restClient.getCapacityReleaseEstimate).toHaveBeenCalledOnce();
  });
});

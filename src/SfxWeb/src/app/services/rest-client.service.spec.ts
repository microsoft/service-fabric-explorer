import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CapacityReleaseLevel } from '../Models/RawDataTypes';
import { MessageService } from './message.service';
import { RestClientService } from './rest-client.service';

describe('RestClientService capacity release', () => {
  let service: RestClientService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MessageService, useValue: { showMessage: vi.fn() } }
      ]
    });

    service = TestBed.inject(RestClientService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('gets the current capacity release level', () => {
    service.getCapacityReleaseLevel().subscribe(result => {
      expect(result.Level).toBe(CapacityReleaseLevel.Minor);
    });

    const request = http.expectOne(candidate =>
      candidate.url.includes('/$/GetCapacityReleaseLevel?api-version=12.0'));
    expect(request.request.method).toBe('GET');
    request.flush({ Level: CapacityReleaseLevel.Minor });
  });

  it('sets the requested capacity release level', () => {
    service.setCapacityReleaseLevel(CapacityReleaseLevel.Major).subscribe();

    const request = http.expectOne(candidate =>
      candidate.url.includes('/$/SetCapacityReleaseLevel?Level=Major&api-version=12.0'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeNull();
    request.flush({});
  });

  it('loads every capacity release estimation page', () => {
    let resultCount = 0;
    service.getCapacityReleaseEstimate().subscribe(result => {
      resultCount = result.length;
      expect(result[0].UsedCapacity).toBe('90');
      expect(result[1].UsedCapacity).toBe('75');
    });

    const firstRequest = http.expectOne(candidate =>
      candidate.url.includes('/$/GetCapacityReleaseEstimate?api-version=12.0') &&
      !candidate.url.includes('ContinuationToken='));
    firstRequest.flush({
      Items: [
        { Level: CapacityReleaseLevel.None, MetricName: 'CPU', UsedCapacity: '90', TotalCapacity: '100' }
      ],
      ContinuationToken: 'page-2'
    });

    const secondRequest = http.expectOne(candidate =>
      candidate.url.includes('/$/GetCapacityReleaseEstimate?api-version=12.0') &&
      candidate.url.includes('ContinuationToken=page-2'));
    secondRequest.flush({
      Items: [
        { Level: CapacityReleaseLevel.Minor, MetricName: 'CPU', UsedCapacity: '75', TotalCapacity: '100' }
      ],
      ContinuationToken: ''
    });

    expect(resultCount).toBe(2);
  });
});

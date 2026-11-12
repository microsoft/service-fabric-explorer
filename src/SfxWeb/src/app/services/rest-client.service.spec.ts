import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { CapacityReleaseLevel } from '../Models/RawDataTypes';
import { MessageService, MessageSeverity } from './message.service';
import { RestClientService } from './rest-client.service';
import { StorageService } from './storage.service';

describe('RestClientService capacity release', () => {
  let service: RestClientService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MessageService, useValue: { showMessage: vi.fn() } },
        { provide: StorageService, useValue: {
          getValueBoolean: (_key: string, defaultValue: boolean) => defaultValue,
          setValue: vi.fn()
        } }
      ]
    });

    service = TestBed.inject(RestClientService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.expectNone(request => request.method !== 'GET');
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

  it('loads every capacity release estimation page', () => {
    let resultCount = 0;
    service.getCapacityReleaseEstimate().subscribe(result => {
      resultCount = result.length;
      expect(result[0].UsedCapacity).toBe('90');
      expect(result[1].UsedCapacity).toBe('75');
      expect(result[2].Level).toBe(CapacityReleaseLevel.Major);
      expect(result[2].UsedCapacity).toBe('60');
    });

    const firstRequest = http.expectOne(candidate =>
      candidate.url.includes('/$/GetCapacityReleaseEstimate?api-version=12.0') &&
      !candidate.url.includes('ContinuationToken='));
    expect(firstRequest.request.method).toBe('GET');
    firstRequest.flush({
      Items: [
        { Level: CapacityReleaseLevel.None, MetricName: 'CPU', UsedCapacity: '90', TotalCapacity: '100' }
      ],
      ContinuationToken: 'page-2'
    });

    const secondRequest = http.expectOne(candidate =>
      candidate.url.includes('/$/GetCapacityReleaseEstimate?api-version=12.0') &&
      candidate.url.includes('ContinuationToken=page-2'));
    expect(secondRequest.request.method).toBe('GET');
    secondRequest.flush({
      Items: [
        { Level: CapacityReleaseLevel.Minor, MetricName: 'CPU', UsedCapacity: '75', TotalCapacity: '100' },
        { Level: CapacityReleaseLevel.Major, MetricName: 'CPU', UsedCapacity: '60', TotalCapacity: '100' }
      ]
    });

    expect(resultCount).toBe(3);
  });

  it.each([
    { status: 400, code: 'E_INVALIDARG' },
    { status: 404, code: 'NotFound' },
    { status: 501, code: 'NotImplemented' },
    { status: 500, code: 'FABRIC_E_OPERATION_NOT_SUPPORTED' }
  ])('records $status compatibility failures for both optional queries without popups', ({ status, code }) => {
    const errorHandler = vi.fn();
    const queries: Observable<unknown>[] = [
      service.getCapacityReleaseLevel(),
      service.getCapacityReleaseEstimate()
    ];
    for (const query of queries) {
      query.subscribe({ error: errorHandler });
      const request = http.expectOne(candidate => candidate.url.includes('/$/GetCapacityRelease'));
      request.flush({
        Error: { Code: code, Message: 'Capacity release is unavailable.' }
      }, { status, statusText: 'Unavailable' });
    }

    expect(errorHandler).toHaveBeenCalledTimes(2);
    expect(TestBed.inject(MessageService).showMessage).not.toHaveBeenCalled();
    expect(service.networkDebugger.overall.requests).toHaveLength(2);
    expect(service.networkDebugger.overall.requests.every(request =>
      request.statusCode === status && request.errorMessage.length > 0)).toBe(true);
  });

  it.each([400, 404, 501])('handles bodyless HTTP %s responses with the real refresh message handler', status => {
    const messageHandler = TestBed.runInInjectionContext(() => new MessageService());
    const errorHandler = vi.fn();
    const queries: Observable<unknown>[] = [
      service.getCapacityReleaseLevel(messageHandler),
      service.getCapacityReleaseEstimate(messageHandler)
    ];
    for (const query of queries) {
      query.subscribe({ error: errorHandler });
      http.expectOne(candidate => candidate.url.includes('/$/GetCapacityRelease'))
        .flush(null, { status, statusText: 'Unavailable' });
    }

    expect(errorHandler).toHaveBeenCalledTimes(2);
    for (const [error] of errorHandler.mock.calls) {
      expect(error).toEqual(expect.objectContaining({ status, error: null }));
    }
    expect(TestBed.inject(MessageService).showMessage).not.toHaveBeenCalled();
    expect(service.networkDebugger.overall.failureCount).toBe(2);
    expect(service.networkDebugger.overall.requests.every(request =>
      request.statusCode === status && request.errorMessage.length > 0)).toBe(true);
  });

  it('records empty HTTP 200 bodies as unavailable for both optional APIs without popups', () => {
    const errorHandler = vi.fn();
    const queries: Observable<unknown>[] = [
      service.getCapacityReleaseLevel(),
      service.getCapacityReleaseEstimate()
    ];
    for (const query of queries) {
      query.subscribe({ error: errorHandler });
      http.expectOne(candidate => candidate.url.includes('/$/GetCapacityRelease'))
        .flush(null, { status: 200, statusText: 'OK' });
    }

    expect(errorHandler).toHaveBeenCalledTimes(2);
    expect(TestBed.inject(MessageService).showMessage).not.toHaveBeenCalled();
    expect(service.networkDebugger.overall.failureCount).toBe(2);
    expect(service.networkDebugger.overall.requests.every(request =>
      request.statusCode === 200 && request.errorMessage.includes('InvalidCapacityReleaseResponse'))).toBe(true);
  });

  it('rejects unusable successful response envelopes without dereferencing missing fields', () => {
    const errorHandler = vi.fn();
    service.getCapacityReleaseLevel().subscribe({ error: errorHandler });
    http.expectOne(candidate => candidate.url.includes('/$/GetCapacityReleaseLevel?'))
      .flush({ Level: 'Unknown' });
    service.getCapacityReleaseEstimate().subscribe({ error: errorHandler });
    http.expectOne(candidate => candidate.url.includes('/$/GetCapacityReleaseEstimate?'))
      .flush({});

    expect(errorHandler).toHaveBeenCalledTimes(2);
    expect(TestBed.inject(MessageService).showMessage).not.toHaveBeenCalled();
    expect(service.networkDebugger.overall.failureCount).toBe(2);
  });

  it.each([
    {
      status: 500,
      body: { Error: { Code: 'FABRIC_E_OPERATION_NOT_SUPPORTED', Message: 'Capacity release is unavailable.' } }
    },
    { status: 200, body: null },
    { status: 400, body: null },
    { status: 501, body: null }
  ])('handles an unavailable later page (HTTP $status) without popups or a partial result', ({ status, body }) => {
    const errorHandler = vi.fn();
    const next = vi.fn();
    const messageHandler = TestBed.runInInjectionContext(() => new MessageService());
    service.getCapacityReleaseEstimate(messageHandler).subscribe({ next, error: errorHandler });
    http.expectOne(candidate => candidate.url.includes('/$/GetCapacityReleaseEstimate?api-version=12.0'))
      .flush({
        Items: [
          { Level: CapacityReleaseLevel.None, MetricName: 'CPU', UsedCapacity: '90', TotalCapacity: '100' }
        ],
        ContinuationToken: 'page-2'
      });
    http.expectOne(candidate => candidate.url.includes('ContinuationToken=page-2'))
      .flush(body, { status, statusText: 'Unavailable' });

    expect(errorHandler).toHaveBeenCalledOnce();
    expect(next).not.toHaveBeenCalled();
    expect(TestBed.inject(MessageService).showMessage).not.toHaveBeenCalled();
    expect(service.networkDebugger.overall.failureCount).toBe(1);
  });

  it.each([
    { status: 403, code: 'FABRIC_E_ACCESS_DENIED' },
    { status: 500, code: 'FABRIC_E_TIMEOUT' }
  ])('preserves normal notifications for unexpected $status failures', ({ status, code }) => {
    const errorHandler = vi.fn();
    const messageHandler = TestBed.runInInjectionContext(() => new MessageService());
    service.getCapacityReleaseLevel(messageHandler).subscribe({ error: errorHandler });
    const request = http.expectOne(candidate =>
      candidate.url.includes('/$/GetCapacityReleaseLevel?api-version=12.0'));
    request.flush({
      Error: { Code: code, Message: 'The query failed.' }
    }, { status, statusText: 'Query Failed' });

    expect(errorHandler).toHaveBeenCalledOnce();
    expect(TestBed.inject(MessageService).showMessage).toHaveBeenCalledWith(
      expect.stringContaining(code),
      MessageSeverity.Err,
      `${status} : Get capacity release level`);
  });

  it('preserves network-error notifications for optional queries', () => {
    const errorHandler = vi.fn();
    service.getCapacityReleaseLevel().subscribe({ error: errorHandler });
    http.expectOne(candidate => candidate.url.includes('/$/GetCapacityReleaseLevel?api-version=12.0'))
      .error(new ProgressEvent('error'));

    expect(errorHandler).toHaveBeenCalledOnce();
    expect(TestBed.inject(MessageService).showMessage).toHaveBeenCalledWith(
      expect.any(String),
      MessageSeverity.Err,
      '0 : Get capacity release level');
  });

  it('preserves a supplied handler and notification for bodyless non-capacity failures', () => {
    const messageHandler = {
      getSuccessMessage: vi.fn(() => ''),
      getErrorMessage: vi.fn(() => 'Existing non-capacity error message')
    };
    const errorHandler = vi.fn();
    service.getClusterLoadInformation(messageHandler).subscribe({ error: errorHandler });
    http.expectOne(candidate => candidate.url.includes('/$/GetLoadInformation?'))
      .flush(null, { status: 501, statusText: 'Not Implemented' });

    expect(errorHandler).toHaveBeenCalledOnce();
    expect(messageHandler.getErrorMessage).toHaveBeenCalledOnce();
    expect(TestBed.inject(MessageService).showMessage).toHaveBeenCalledWith(
      'Existing non-capacity error message',
      MessageSeverity.Err,
      '501 : Get cluster load information');
  });

  it.each([400, 404])('does not suppress HTTP %s notifications for other SFX requests', status => {
    const errorHandler = vi.fn();
    service.getClusterLoadInformation().subscribe({ error: errorHandler });
    http.expectOne(candidate => candidate.url.includes('/$/GetLoadInformation?'))
      .flush({}, { status, statusText: 'Request Failed' });

    expect(errorHandler).toHaveBeenCalledOnce();
    expect(TestBed.inject(MessageService).showMessage).toHaveBeenCalledWith(
      expect.any(String),
      MessageSeverity.Err,
      `${status} : Get cluster load information`);
  });
});

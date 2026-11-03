import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { DataService } from './data.service';
import { FabricProcessResourceUsageCapabilityService } from './fabric-process-resource-usage-capability.service';
import { MessageService } from './message.service';
import { RestClientService } from './rest-client.service';

describe('FabricProcessResourceUsageCapabilityService', () => {
  function createService(
    isEventStoreEnabled: boolean,
    getNodeEvents: ReturnType<typeof vi.fn>
  ): FabricProcessResourceUsageCapabilityService {
    TestBed.configureTestingModule({
      providers: [
        FabricProcessResourceUsageCapabilityService,
        {
          provide: DataService,
          useValue: {
            getClusterManifest: () => of({ isEventStoreEnabled }),
            restClient: { getNodeEvents }
          }
        }
      ]
    });

    return TestBed.inject(FabricProcessResourceUsageCapabilityService);
  }

  it('does not probe when EventStore is disabled', async () => {
    const getNodeEvents = vi.fn();
    const service = createService(false, getNodeEvents);

    await expect(firstValueFrom(service.ensureSupported())).resolves.toBe(false);
    expect(getNodeEvents).not.toHaveBeenCalled();
  });

  it('marks the event supported when the filtered query succeeds without samples', async () => {
    const getNodeEvents = vi.fn(() => of([]));
    const service = createService(true, getNodeEvents);

    await expect(firstValueFrom(service.ensureSupported())).resolves.toBe(true);
    expect(service.isSupported).toBe(true);
  });

  it('marks an unrecognized event filter unsupported', async () => {
    const getNodeEvents = vi.fn(() => throwError(() => new HttpErrorResponse({
      status: 400,
      error: {
        Error: {
          Code: 'E_INVALIDARG',
          Message: 'EventType FabricProcessResourceUsage Not Supported for Entity Node'
        }
      }
    })));
    const service = createService(true, getNodeEvents);

    await expect(firstValueFrom(service.ensureSupported())).resolves.toBe(false);
    await expect(firstValueFrom(service.ensureSupported())).resolves.toBe(false);
    expect(getNodeEvents).toHaveBeenCalledTimes(1);
  });

  it('retries a transient EventStore failure on the next request', async () => {
    let now = Date.now();
    const nowSpy = vi.spyOn(Date, 'now').mockImplementation(() => now);
    const getNodeEvents = vi.fn()
      .mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 503 })))
      .mockReturnValueOnce(of([]));
    const service = createService(true, getNodeEvents);

    try {
      await expect(firstValueFrom(service.ensureSupported())).rejects.toMatchObject({ status: 503 });
      expect(service.canRetry).toBe(false);

      now += 60 * 1000;
      expect(service.canRetry).toBe(true);
      await expect(firstValueFrom(service.ensureSupported())).resolves.toBe(true);
      expect(service.canRetry).toBe(false);
      expect(getNodeEvents).toHaveBeenCalledTimes(2);
    } finally {
      nowSpy.mockRestore();
    }
  });

  it('retries a transient manifest failure on the next request', async () => {
    let now = Date.now();
    const nowSpy = vi.spyOn(Date, 'now').mockImplementation(() => now);
    const getClusterManifest = vi.fn()
      .mockReturnValueOnce(throwError(() => new Error('manifest unavailable')))
      .mockReturnValueOnce(of({ isEventStoreEnabled: true }));
    const getNodeEvents = vi.fn(() => of([]));
    TestBed.configureTestingModule({
      providers: [
        FabricProcessResourceUsageCapabilityService,
        {
          provide: DataService,
          useValue: {
            getClusterManifest,
            restClient: { getNodeEvents }
          }
        }
      ]
    });
    const service = TestBed.inject(FabricProcessResourceUsageCapabilityService);

    try {
      await expect(firstValueFrom(service.ensureSupported())).rejects.toThrow('manifest unavailable');
      expect(service.canRetry).toBe(false);

      now += 60 * 1000;
      expect(service.canRetry).toBe(true);
      await expect(firstValueFrom(service.ensureSupported())).resolves.toBe(true);
      expect(getClusterManifest).toHaveBeenCalledTimes(2);
      expect(getNodeEvents).toHaveBeenCalledOnce();
    } finally {
      nowSpy.mockRestore();
    }
  });

  it('reuses the cached probe result', async () => {
    const getNodeEvents = vi.fn(() => of([]));
    const service = createService(true, getNodeEvents);

    await firstValueFrom(service.ensureSupported());
    await firstValueFrom(service.ensureSupported());

    expect(getNodeEvents).toHaveBeenCalledTimes(1);
  });

  it('suppresses the unsupported-event notification through RestClient while recording the failure', async () => {
    const showMessage = vi.fn();
    const dataService = {
      getClusterManifest: () => of({ isEventStoreEnabled: true }),
      restClient: undefined as unknown as RestClientService
    };
    TestBed.configureTestingModule({
      providers: [
        FabricProcessResourceUsageCapabilityService,
        RestClientService,
        { provide: DataService, useValue: dataService },
        { provide: MessageService, useValue: { showMessage } },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    const restClient = TestBed.inject(RestClientService);
    dataService.restClient = restClient;
    const http = TestBed.inject(HttpTestingController);
    const service = TestBed.inject(FabricProcessResourceUsageCapabilityService);

    const result = firstValueFrom(service.ensureSupported());
    const request = http.expectOne(({ urlWithParams }) =>
      urlWithParams.includes('EventsStore/Nodes/Events')
      && urlWithParams.includes('eventsTypesFilter=FabricProcessResourceUsage'));
    request.flush({
      Error: {
        Code: 'E_INVALIDARG',
        Message: 'EventType FabricProcessResourceUsage Not Supported for Entity Node'
      }
    }, { status: 400, statusText: 'Bad Request' });

    await expect(result).resolves.toBe(false);
    expect(showMessage).not.toHaveBeenCalled();
    expect(restClient.networkDebugger.overall.requests[0]).toMatchObject({
      statusCode: 400
    });
    expect(restClient.networkDebugger.overall.requests[0].errorMessage).not.toBe('');
    http.verify();
  });
});

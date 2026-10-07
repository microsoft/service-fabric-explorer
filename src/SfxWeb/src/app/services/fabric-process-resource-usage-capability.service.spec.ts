import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { DataService } from './data.service';
import { FabricProcessResourceUsageCapabilityService } from './fabric-process-resource-usage-capability.service';

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

  it('automatically retries after a transient EventStore failure', async () => {
    vi.useFakeTimers();
    const getNodeEvents = vi.fn()
      .mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 503 })))
      .mockReturnValueOnce(of([]));
    const service = createService(true, getNodeEvents);

    try {
      const result = firstValueFrom(service.ensureSupported());
      await vi.advanceTimersByTimeAsync(30 * 1000);

      await expect(result).resolves.toBe(true);
      expect(getNodeEvents).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('automatically retries after a transient manifest failure', async () => {
    vi.useFakeTimers();
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
      const result = firstValueFrom(service.ensureSupported());
      await vi.advanceTimersByTimeAsync(30 * 1000);

      await expect(result).resolves.toBe(true);
      expect(getClusterManifest).toHaveBeenCalledTimes(2);
      expect(getNodeEvents).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });

  it('stops transient retries when the last subscriber unsubscribes', async () => {
    vi.useFakeTimers();
    const getNodeEvents = vi.fn()
      .mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 503 })))
      .mockReturnValueOnce(of([]));
    const service = createService(true, getNodeEvents);

    try {
      const subscription = service.ensureSupported().subscribe();
      subscription.unsubscribe();
      await vi.advanceTimersByTimeAsync(30 * 1000);

      expect(getNodeEvents).toHaveBeenCalledOnce();
      await expect(firstValueFrom(service.ensureSupported())).resolves.toBe(true);
      expect(getNodeEvents).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('reuses the cached probe result', async () => {
    const getNodeEvents = vi.fn(() => of([]));
    const service = createService(true, getNodeEvents);

    await firstValueFrom(service.ensureSupported());
    await firstValueFrom(service.ensureSupported());

    expect(getNodeEvents).toHaveBeenCalledTimes(1);
  });
});

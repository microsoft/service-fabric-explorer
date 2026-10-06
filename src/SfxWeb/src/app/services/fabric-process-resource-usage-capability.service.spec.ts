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

  it('retries after a transient EventStore failure', async () => {
    const getNodeEvents = vi.fn()
      .mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 503 })))
      .mockReturnValueOnce(of([]));
    const service = createService(true, getNodeEvents);

    await expect(firstValueFrom(service.ensureSupported())).resolves.toBe(false);
    await expect(firstValueFrom(service.ensureSupported())).resolves.toBe(true);
    expect(getNodeEvents).toHaveBeenCalledTimes(2);
  });

  it('marks manifest failures unavailable', async () => {
    TestBed.configureTestingModule({
      providers: [
        FabricProcessResourceUsageCapabilityService,
        {
          provide: DataService,
          useValue: {
            getClusterManifest: () => throwError(() => new Error('manifest unavailable')),
            restClient: { getNodeEvents: vi.fn() }
          }
        }
      ]
    });
    const service = TestBed.inject(FabricProcessResourceUsageCapabilityService);

    await expect(firstValueFrom(service.ensureSupported())).resolves.toBe(false);
  });

  it('reuses the cached probe result', async () => {
    const getNodeEvents = vi.fn(() => of([]));
    const service = createService(true, getNodeEvents);

    await firstValueFrom(service.ensureSupported());
    await firstValueFrom(service.ensureSupported());

    expect(getNodeEvents).toHaveBeenCalledTimes(1);
  });
});

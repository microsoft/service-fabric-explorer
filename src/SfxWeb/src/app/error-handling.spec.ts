import { TestBed } from '@angular/core/testing';
import { AppInsightsErrorHandler } from './error-handling';
import { TelemetryService } from './services/telemetry.service';

describe('AppInsightsErrorHandler', () => {
  const trackException = vi.fn();
  let handler: AppInsightsErrorHandler;

  beforeEach(() => {
    trackException.mockClear();
    TestBed.configureTestingModule({
      providers: [
        AppInsightsErrorHandler,
        {
          provide: TelemetryService,
          useValue: { appInsights: { trackException } }
        }
      ]
    });
    handler = TestBed.inject(AppInsightsErrorHandler);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends errors using the v2 telemetry envelope required by Application Insights v3', () => {
    const error = new Error('test error');

    handler.handleError(error);

    expect(trackException).toHaveBeenCalledWith({ exception: error });
  });
});
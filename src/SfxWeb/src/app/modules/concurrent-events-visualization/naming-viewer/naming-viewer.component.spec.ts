import { TestBed } from '@angular/core/testing';
import { NamingViewerComponent } from './naming-viewer.component';
import { SettingsService } from 'src/app/services/settings.service';

describe('Naming metric source mapping', () => {
  const source = (name: string, reports: number) => ({
    displayName: name,
    eventsList: { lastRefreshWasSuccessful: true, collection: Array.from({ length: reports }, (_, index) => ({ raw: {
      kind: 'NamingMetricsReported', time: new Date(2026, 0, 1, 0, index),
      eventProperties: { OperationName: 'PropertyBatch', RequestCount: 4 }
    } })) }
  });

  it('binds chart series to the source with reports, not its filtered array index', () => {
    TestBed.configureTestingModule({ providers: [{ provide: SettingsService, useValue: { getNewOrExistingListSettings: () => ({}) } }] });
    const component = TestBed.runInInjectionContext(() => new NamingViewerComponent());
    const empty = source('Replica events 1000', 0);
    const populated = source('Replica events 1002', 3);
    const data = { startDate: new Date(2026, 0, 1), endDate: new Date(2026, 0, 2), listEventStoreData: [empty, populated] };
    component.update(data);
    expect(component.overviewPanels.length).toBe(1);
    expect(component.overviewPanels[0].sourceName).toBe(populated.displayName);
    expect(component.overviewPanels[0].requestCount).toBe(12);
    expect(component.dataset.dataSets[0].values).toEqual(populated.eventsList.collection);
    component.overviewPanels[0].toggled = false;
    component.update({ ...data, listEventStoreData: [populated, empty] });
    expect(component.dataset.dataSets).toEqual([]);
    component.showAllMetrics();
    expect(component.selectedReportCount).toBe(3);
  });
});

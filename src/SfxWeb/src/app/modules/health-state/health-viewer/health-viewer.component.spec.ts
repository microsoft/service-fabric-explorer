import { TestBed } from '@angular/core/testing';
import { SettingsService } from 'src/app/services/settings.service';
import { HealthViewerComponent } from './health-viewer.component';
import { HealthDescriptionComponent } from './health-description.component';

describe('HealthViewerComponent table settings', () => {
  it('uses an inline description only in the New table without changing Classic settings', () => {
    TestBed.configureTestingModule({ providers: [SettingsService] });
    const component = TestBed.runInInjectionContext(() => new HealthViewerComponent());
    component.ngOnInit();
    const classic = component.healthEventsListSettings;
    const modern = component.modernHealthEventsListSettings;
    expect(classic.columnSettings.length).toBe(8);
    expect(classic.secondRowColumnSettings.length).toBe(2);
    expect(modern.columnSettings.length).toBe(9);
    expect(modern.columnSettings[3].template).toBe(HealthDescriptionComponent);
    expect(modern.secondRowColumnSettings.length).toBe(0);
    expect(TestBed.inject(SettingsService).getNewOrExistingHealthEventsListSettings()).toBe(classic);
  });
});

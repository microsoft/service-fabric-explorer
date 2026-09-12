import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { EventQueryBarComponent } from './event-query-bar.component';

describe('EventQueryBarComponent', () => {
  let fixture: ComponentFixture<EventQueryBarComponent>;
  let component: EventQueryBarComponent;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventQueryBarComponent],
      providers: [{ provide: DataService, useValue: {} }, { provide: SettingsService, useValue: {} }]
    }).compileComponents();
    fixture = TestBed.createComponent(EventQueryBarComponent);
    component = fixture.componentInstance;
    component.minimum = new Date('2020-01-01T00:00:00Z');
    component.start = new Date('2026-01-01T00:00:00Z');
    component.end = new Date('2026-01-02T00:00:00Z');
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('uses current time for presets instead of the historical end date', () => {
    const emit = spyOn(component.rangeChange, 'emit');
    const before = Date.now();
    component.applyPreset(1);
    const range = emit.calls.mostRecent().args[0]!;
    expect(+range.endDate).toBeGreaterThanOrEqual(before);
    expect(+range.endDate - +range.startDate).toBe(3600000);
  });

  it('keeps custom edits local until Apply and discards Cancel', () => {
    const emit = spyOn(component.rangeChange, 'emit');
    component.toggle('range');
    component.openCustom();
    component.draftStart = '2026-02-01T01:00:00';
    component.close();
    expect(emit).not.toHaveBeenCalled();
    component.toggle('range');
    component.openCustom();
    expect(component.draftStart).toBe('2026-01-01T00:00:00');
  });

  it('parses UTC custom input and emits exact boundaries', () => {
    const emit = spyOn(component.rangeChange, 'emit');
    component.draftStart = '2026-01-01T13:30:15';
    component.draftEnd = '2026-01-01T14:30:15';
    component.applyCustom();
    expect(emit).toHaveBeenCalledWith({ startDate: new Date('2026-01-01T13:30:15Z'), endDate: new Date('2026-01-01T14:30:15Z') });
  });

  it('rejects reversed, unavailable and future ranges', () => {
    const emit = spyOn(component.rangeChange, 'emit');
    component.draftStart = '2026-01-02T00:00:00';
    component.draftEnd = '2026-01-01T00:00:00';
    component.applyCustom();
    expect(component.error).toBe('End must be after start.');
    component.draftStart = '2019-01-01T00:00:00';
    component.applyCustom();
    expect(component.error).toContain('Available history');
    component.draftStart = '2026-01-01T00:00:00';
    component.draftEnd = '2099-01-01T00:00:00';
    component.applyCustom();
    expect(component.error).toBe('End cannot be in the future.');
    expect(emit).not.toHaveBeenCalled();
  });

  it('changes display timezone without changing query dates', () => {
    const emit = spyOn(component.rangeChange, 'emit');
    component.changeZone(false);
    expect(emit).not.toHaveBeenCalled();
    expect(component.start!.toISOString()).toBe('2026-01-01T00:00:00.000Z');
  });
});

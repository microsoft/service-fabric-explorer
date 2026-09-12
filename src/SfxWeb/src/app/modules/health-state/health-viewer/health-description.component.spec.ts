import { TestBed } from '@angular/core/testing';
import { HealthDescriptionComponent } from './health-description.component';

describe('HealthDescriptionComponent', () => {
  it('renders only the message without inline help or copy controls', async () => {
    await TestBed.configureTestingModule({ imports: [HealthDescriptionComponent] }).compileComponents();
    const fixture = TestBed.createComponent(HealthDescriptionComponent);
    const original = 'Replica has been created onSF_2.\nFor more information see: http://aka.ms/sfhealth';
    fixture.componentInstance.item = { raw: { Description: original } };
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.message').textContent).toBe('Replica has been created on SF_2.');
    expect(fixture.nativeElement.querySelector('a, app-clip-board')).toBeNull();
    expect(fixture.componentInstance.rawText).toBe(original);
    fixture.componentInstance.item.raw.Description = '<img src=x onerror=alert(1)>\nFor more information see: http://aka.ms/sfhealth.evil';
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.querySelector('a')).toBeNull();
    expect(fixture.nativeElement.querySelector('.message').textContent).toContain('<img src=x onerror=alert(1)>');
    fixture.destroy();
  });

  it('preserves correctly spaced sentences and unrelated report text', () => {
    const component = new HealthDescriptionComponent();
    for (const text of ['Replica has been created on SF_2.', 'ConnectionSF_2 is unavailable.']) {
      component.item = { raw: { Description: text } };
      expect(component.message).toBe(text);
      expect(component.rawText).toBe(text);
    }
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SharedModule } from '../../shared.module';

import { DisplayDurationComponent } from './display-duration.component';

describe('DisplayDurationComponent', () => {
  let component: DisplayDurationComponent;
  let fixture: ComponentFixture<DisplayDurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DisplayDurationComponent ],
      imports: [SharedModule]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayDurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  fit('should create', () => {
    expect(component).toBeTruthy();
  });

  fit('correct colors', () => {
    fixture.componentRef.setInput('topText', 'topTextTest');
    fixture.componentRef.setInput('bottomText', 'bottomText');
    fixture.componentRef.setInput('topInMilliseconds', 1000);
    fixture.componentRef.setInput('bottomInMilliseconds', 5000);

    fixture.detectChanges();
    let barElement = fixture.debugElement.queryAll(By.css('[data-cy="bar-progress"]'));

    expect(barElement[0].styles['background-color']).toBe('var(--accent-darkblue)');
    expect(barElement[0].styles.flex).toBe('0.2 1 0%');

    fixture.componentRef.setInput('topInMilliseconds', 3000);
    fixture.componentRef.setInput('bottomInMilliseconds', 5000);
    fixture.detectChanges();
    barElement = fixture.debugElement.queryAll(By.css('[data-cy="bar-progress"]'));
    expect(barElement[0].styles['background-color']).toBe('yellow');
    expect(barElement[0].styles.flex).toBe('0.6 1 0%');

    fixture.componentRef.setInput('topInMilliseconds', 4500);
    fixture.componentRef.setInput('bottomInMilliseconds', 5000);
    fixture.detectChanges();
    barElement = fixture.debugElement.queryAll(By.css('[data-cy="bar-progress"]'));
    expect(barElement[0].styles['background-color']).toBe('red');
    expect(barElement[0].styles.flex).toBe('0.9 1 0%');

  });

});

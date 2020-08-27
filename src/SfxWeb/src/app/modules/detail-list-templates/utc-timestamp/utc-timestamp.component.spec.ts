import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UtcTimestampComponent } from './utc-timestamp.component';

describe('UtcTimestampComponent', () => {
  let component: UtcTimestampComponent;
  let fixture: ComponentFixture<UtcTimestampComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UtcTimestampComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UtcTimestampComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

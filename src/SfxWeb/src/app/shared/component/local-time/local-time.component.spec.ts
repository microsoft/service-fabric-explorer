import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LocalTimeComponent } from './local-time.component';

describe('LocalTimeComponent', () => {
  let component: LocalTimeComponent;
  let fixture: ComponentFixture<LocalTimeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LocalTimeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LocalTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

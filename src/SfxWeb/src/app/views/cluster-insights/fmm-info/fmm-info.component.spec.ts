import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FailoverManagerManagerInformationComponent } from './fmm-info.component';

describe('FailoverManagerManagerInformationComponent', () => {
  let component: FailoverManagerManagerInformationComponent;
  let fixture: ComponentFixture<FailoverManagerManagerInformationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FailoverManagerManagerInformationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FailoverManagerManagerInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UpgradingComponent } from './upgrading.component';

describe('UpgradingComponent', () => {
  let component: UpgradingComponent;
  let fixture: ComponentFixture<UpgradingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ UpgradingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UpgradingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UpgradeProgressComponent } from './upgrade-progress.component';

describe('UpgradeProgressComponent', () => {
  let component: UpgradeProgressComponent;
  let fixture: ComponentFixture<UpgradeProgressComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ UpgradeProgressComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UpgradeProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

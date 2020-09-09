import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UpgradeProgressComponent } from './upgrade-progress.component';

describe('UpgradeProgressComponent', () => {
  let component: UpgradeProgressComponent;
  let fixture: ComponentFixture<UpgradeProgressComponent>;

  beforeEach(async(() => {
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
